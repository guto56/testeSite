'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap';
import { useSiteStore } from '@/store/useSiteStore';
import {
  floorPose,
  introPose,
  overviewPose,
  shortestAngle,
  unitPose,
  type CameraPose,
  type Viewport,
} from '@/lib/cameraPoses';
import { EASE_FLIGHT, flightDuration, prefersReducedMotion } from '@/lib/motion';
import { SAFE_RADIUS } from '@/lib/layout';

type Dest = { kind: 'overview' } | { kind: 'floor'; floor: number } | { kind: 'unit'; id: string };

/** Acesso aos deltas internos do OrbitControls para zerar a inércia entre donos da câmera. */
type ControlsInternals = OrbitControls & {
  _sphericalDelta: THREE.Spherical;
  _panOffset: THREE.Vector3;
  _scale: number;
};

/**
 * Único dono da câmera.
 *
 * - Durante um voo: a timeline GSAP anima um objeto `pose` (posição cilíndrica + alvo + fov
 *   + deslocamento de enquadramento) e o useFrame escreve na câmera. OrbitControls fica desligado.
 * - Parado: OrbitControls assume, com limites conforme o modo.
 * - Um novo pedido (clique, Esc, resize) mata a timeline e parte da pose ATUAL — nunca trava,
 *   nunca enfileira tweens concorrentes.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);

  const controls = useMemo(() => new OrbitControls(camera, gl.domElement) as unknown as ControlsInternals, [camera, gl]);
  // pose inicial: voo de abertura parte de um ponto mais afastado (ou já da visão geral, com reduced motion)
  const [initialPose] = useState<CameraPose>(() => {
    const v = { width: size.width, height: size.height, mobile: size.width < 768 };
    return { ...(prefersReducedMotion() ? overviewPose(v) : introPose(v)) };
  });
  const pose = useRef<CameraPose>(initialPose);
  const flight = useRef<gsap.core.Timeline | null>(null);
  const dest = useRef<Dest>({ kind: 'overview' });
  const applied = useRef({ fov: 0, ox: NaN, oy: NaN, w: 0, h: 0 });
  const coarse = useRef(false);

  const viewport = useCallback(
    (): Viewport => ({ width: size.width, height: size.height, mobile: size.width < 768 }),
    [size.width, size.height],
  );

  // ---------- escrita na câmera (a única) ----------
  const writeCamera = useCallback(() => {
    const p = pose.current;
    camera.position.set(Math.sin(p.theta) * p.r, p.y, Math.cos(p.theta) * p.r);
    controls.target.set(p.tx, p.ty, p.tz);
    camera.lookAt(controls.target);
  }, [camera, controls]);

  const writeFraming = useCallback(() => {
    const p = pose.current;
    const a = applied.current;
    const w = size.width;
    const h = size.height;
    if (a.fov === p.fov && a.ox === p.ox && a.oy === p.oy && a.w === w && a.h === h) return;
    camera.fov = p.fov;
    camera.aspect = w / h;
    camera.setViewOffset(w, h, -p.ox * w, p.oy * h, w, h);
    camera.updateProjectionMatrix();
    Object.assign(a, { fov: p.fov, ox: p.ox, oy: p.oy, w, h });
  }, [camera, size.width, size.height]);

  const resolve = useCallback(
    (d: Dest): CameraPose => {
      const v = viewport();
      if (d.kind === 'unit') return unitPose(d.id, v) ?? overviewPose(v);
      if (d.kind === 'floor') return floorPose(d.floor, pose.current?.theta ?? 0, v);
      return overviewPose(v);
    },
    [viewport],
  );

  /** Zera a inércia do OrbitControls para que ele não "puxe" a câmera depois de um voo. */
  const clearInertia = useCallback(() => {
    controls._sphericalDelta.set(0, 0, 0);
    controls._panOffset.set(0, 0, 0);
    controls._scale = 1;
  }, [controls]);

  const applyLimits = useCallback(
    (d: Dest) => {
      const offset = camera.position.clone().sub(controls.target);
      const sph = new THREE.Spherical().setFromVector3(offset);
      controls.minPolarAngle = coarse.current ? sph.phi : 0.95;
      controls.maxPolarAngle = coarse.current ? sph.phi : 1.48;
      if (d.kind === 'unit') {
        controls.minAzimuthAngle = sph.theta - 0.8;
        controls.maxAzimuthAngle = sph.theta + 0.8;
      } else {
        controls.minAzimuthAngle = -Infinity;
        controls.maxAzimuthAngle = Infinity;
      }
      controls.minDistance = controls.maxDistance = sph.radius;
    },
    [camera, controls],
  );

  const land = useCallback(() => {
    flight.current = null;
    writeCamera();
    applyLimits(dest.current);
    clearInertia();
    controls.update();
    controls.enabled = true;
    useSiteStore.getState().setFlying(false);
    const c = camera.position;
    gl.domElement.dataset.camera = [c.x, c.y, c.z].map((n) => n.toFixed(2)).join(',');
    invalidate();
  }, [camera, gl, writeCamera, applyLimits, clearInertia, controls, invalidate]);

  /** Lê a pose atual da câmera (o que estiver na tela agora, inclusive no meio de um voo). */
  const syncFromCamera = useCallback(() => {
    const p = pose.current;
    p.theta = Math.atan2(camera.position.x, camera.position.z);
    p.r = Math.max(SAFE_RADIUS, Math.hypot(camera.position.x, camera.position.z));
    p.y = camera.position.y;
    p.tx = controls.target.x;
    p.ty = controls.target.y;
    p.tz = controls.target.z;
  }, [camera, controls]);

  const flyTo = useCallback(
    (d: Dest, duration = flightDuration(), ease = EASE_FLIGHT) => {
      flight.current?.kill();
      dest.current = d;
      controls.enabled = false;
      clearInertia();
      syncFromCamera();

      const to = resolve(d);
      const p = pose.current;
      const theta = p.theta + shortestAngle(p.theta, to.theta);

      useSiteStore.getState().setFlying(true);
      const tl = gsap.timeline({ onUpdate: invalidate, onComplete: land });
      // posição e alvo andam juntos, com a mesma curva
      tl.to(p, { theta, r: to.r, y: to.y, duration, ease }, 0);
      tl.to(p, { tx: to.tx, ty: to.ty, tz: to.tz, duration, ease }, 0);
      tl.to(p, { fov: to.fov, ox: to.ox, oy: to.oy, duration, ease }, 0);
      flight.current = tl;
      invalidate();
    },
    [controls, clearInertia, syncFromCamera, resolve, invalidate, land],
  );

  // ---------- montagem dos controles ----------
  useEffect(() => {
    coarse.current = window.matchMedia('(pointer: coarse)').matches;
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.rotateSpeed = 0.5;
    controls.enableZoom = false; // a roda do mouse continua rolando a página
    controls.enablePan = false;
    controls.enabled = false;
    // no toque, arrastar na vertical rola a página; na horizontal gira o prédio
    if (coarse.current) gl.domElement.style.touchAction = 'pan-y';
    const onChange = () => invalidate();
    controls.addEventListener('change', onChange);
    return () => {
      controls.removeEventListener('change', onChange);
      controls.dispose();
    };
  }, [controls, gl, invalidate]);

  // ---------- pose inicial + voo de abertura ----------
  const sceneReady = useSiteStore((s) => s.sceneReady);
  const introDone = useRef(false);
  useEffect(() => {
    writeCamera();
    writeFraming();
    invalidate();
  }, [writeCamera, writeFraming, invalidate]);
  useEffect(() => {
    if (!sceneReady || introDone.current) return;
    introDone.current = true;
    const s = useSiteStore.getState();
    if (s.selectedId || s.activeFloor) return; // a navegação já começou
    flyTo({ kind: 'overview' }, prefersReducedMotion() ? 0.01 : 2.6, 'power2.out');
  }, [sceneReady, flyTo]);

  // ---------- reação ao estado (selecionar, andar, voltar) ----------
  useEffect(() => {
    return useSiteStore.subscribe((s, prev) => {
      if (s.selectedId === prev.selectedId && s.activeFloor === prev.activeFloor) return;
      if (s.selectedId) flyTo({ kind: 'unit', id: s.selectedId });
      else if (s.activeFloor) flyTo({ kind: 'floor', floor: s.activeFloor });
      else flyTo({ kind: 'overview' });
    });
  }, [flyTo]);

  // ---------- resize: refaz o destino a partir da pose atual ----------
  const isMobile = size.width < 768;
  const lastMobile = useRef(isMobile);
  useEffect(() => {
    if (!introDone.current) return;
    const breakpointChanged = lastMobile.current !== isMobile;
    lastMobile.current = isMobile;
    const tl = flight.current;
    if (tl) {
      // no meio do voo: recalcula o destino com o tempo que faltava
      const remaining = Math.max(0.35, tl.duration() - tl.time());
      flyTo(dest.current, remaining);
    } else if (breakpointChanged) {
      flyTo(dest.current, 0.6);
    } else {
      // parado: só ajusta enquadramento (fov/deslocamento) sem mover a câmera
      const to = resolve(dest.current);
      Object.assign(pose.current, { fov: to.fov, ox: to.ox, oy: to.oy });
      invalidate();
    }
  }, [size.width, size.height, isMobile, flyTo, resolve, invalidate]);

  // ---------- loop: um único write por frame ----------
  useFrame(() => {
    if (flight.current) writeCamera();
    else if (controls.enabled) controls.update();
    writeFraming();
  }, -1);

  useEffect(() => () => void flight.current?.kill(), []);

  return null;
}
