'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { anchorRegistry } from '@/lib/layout';
import { useSiteStore } from '@/store/useSiteStore';
import { uiDuration } from '@/lib/motion';

/**
 * Contorno (arestas) do apto sob o cursor e do apto selecionado.
 * Uma única geometria de arestas 1×1×1, reposicionada e escalada pela âncora.
 */
export function UnitOutlines() {
  const invalidate = useThree((s) => s.invalidate);
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), []);
  const hoverMat = useMemo(
    () => new THREE.LineBasicMaterial({ color: new THREE.Color('#fff4e2').multiplyScalar(1.6), transparent: true, opacity: 0, toneMapped: false }),
    [],
  );
  const selMat = useMemo(
    () => new THREE.LineBasicMaterial({ color: new THREE.Color('#ffe7c4').multiplyScalar(2.4), transparent: true, opacity: 0, toneMapped: false }),
    [],
  );
  const hoverRef = useRef<THREE.LineSegments>(null);
  const selRef = useRef<THREE.LineSegments>(null);

  useEffect(() => () => {
    edges.dispose();
    hoverMat.dispose();
    selMat.dispose();
  }, [edges, hoverMat, selMat]);

  useEffect(() => {
    const place = (obj: THREE.Object3D, id: string) => {
      const a = anchorRegistry.get(id);
      if (!a) return false;
      obj.position.copy(a.center);
      obj.scale.copy(a.size).addScalar(0.12);
      return true;
    };
    const show = (obj: THREE.Object3D | null, mat: THREE.LineBasicMaterial, id: string | null, to: number) => {
      if (!obj) return;
      if (id && place(obj, id)) {
        obj.visible = true;
        gsap.to(mat, { opacity: to, duration: uiDuration(0.25), overwrite: 'auto', onUpdate: invalidate });
      } else {
        gsap.to(mat, {
          opacity: 0,
          duration: uiDuration(0.2),
          overwrite: 'auto',
          onUpdate: invalidate,
          onComplete: () => void (obj.visible = false),
        });
      }
    };
    return useSiteStore.subscribe((s, p) => {
      if (s.hoveredId !== p.hoveredId || s.selectedId !== p.selectedId) {
        const h = s.hoveredId && s.hoveredId !== s.selectedId ? s.hoveredId : null;
        show(hoverRef.current, hoverMat, h, 0.9);
      }
      if (s.selectedId !== p.selectedId) show(selRef.current, selMat, s.selectedId, 1);
    });
  }, [hoverMat, selMat, invalidate]);

  return (
    <>
      <lineSegments ref={hoverRef} geometry={edges} material={hoverMat} visible={false} raycast={() => null} />
      <lineSegments ref={selRef} geometry={edges} material={selMat} visible={false} raycast={() => null} />
    </>
  );
}

/** Luz quente na frente do apto selecionado — sempre montada (intensidade 0) para não recompilar shaders. */
export function SelectionLight() {
  const light = useRef<THREE.PointLight>(null);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    return useSiteStore.subscribe((s, p) => {
      if (s.selectedId === p.selectedId) return;
      const l = light.current;
      if (!l) return;
      const a = s.selectedId ? anchorRegistry.get(s.selectedId) : null;
      if (a) {
        l.position.copy(a.center).addScaledVector(a.outward, 15);
        l.position.y += 6;
        gsap.to(l, { intensity: 320, duration: uiDuration(0.9), delay: 0.25, overwrite: 'auto', onUpdate: invalidate });
      } else {
        gsap.to(l, { intensity: 0, duration: uiDuration(0.4), overwrite: 'auto', onUpdate: invalidate });
      }
    });
  }, [invalidate]);

  return <pointLight ref={light} color="#ffd6a6" intensity={0} distance={50} decay={2} />;
}
