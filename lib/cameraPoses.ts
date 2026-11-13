import * as THREE from 'three';
import { anchorRegistry, floorCenterY, LAYOUT, SAFE_RADIUS } from './layout';

/**
 * Pose da câmera em coordenadas cilíndricas em volta do eixo do prédio.
 * Interpolar (theta, r, y) em vez de x/y/z garante que a câmera contorne a torre
 * — o raio nunca fica menor que o menor raio das duas pontas (sempre ≥ SAFE_RADIUS).
 * `ox/oy` deslocam o enquadramento na tela (fração da largura/altura) para
 * abrir espaço para o painel lateral ou o bottom sheet.
 */
export interface CameraPose {
  theta: number;
  r: number;
  y: number;
  tx: number;
  ty: number;
  tz: number;
  fov: number;
  ox: number;
  oy: number;
}

export interface Viewport {
  width: number;
  height: number;
  mobile: boolean;
}

/** Largura do painel lateral (desktop) e altura do bottom sheet (mobile), em px / fração. */
export const PANEL_WIDTH = 400;
export const SHEET_FRACTION = 0.54;

const OVERVIEW_THETA = 0.62;

function fromCartesian(pos: THREE.Vector3, target: THREE.Vector3, fov: number, ox: number, oy: number): CameraPose {
  return {
    theta: Math.atan2(pos.x, pos.z),
    r: Math.max(SAFE_RADIUS, Math.hypot(pos.x, pos.z)),
    y: pos.y,
    tx: target.x,
    ty: target.y,
    tz: target.z,
    fov,
    ox,
    oy,
  };
}

export function overviewPose(v: Viewport): CameraPose {
  const ty = LAYOUT.roofY * 0.47;
  if (v.mobile) {
    return { theta: OVERVIEW_THETA, r: 130, y: ty + 20, tx: 0, ty, tz: 0, fov: 44, ox: 0, oy: -0.15 };
  }
  return { theta: OVERVIEW_THETA, r: 132, y: ty + 20, tx: 0, ty, tz: 0, fov: 32, ox: 0.17, oy: 0.01 };
}

export function floorPose(floor: number, currentTheta: number, v: Viewport): CameraPose {
  const ty = floorCenterY(floor);
  if (v.mobile) {
    return { theta: currentTheta, r: 92, y: ty + 16, tx: 0, ty, tz: 0, fov: 44, ox: 0, oy: 0.2 };
  }
  return {
    theta: currentTheta,
    r: 76,
    y: ty + 16,
    tx: 0,
    ty,
    tz: 0,
    fov: 32,
    ox: -(PANEL_WIDTH / 2 + 16) / v.width,
    oy: 0,
  };
}

const tmpPos = new THREE.Vector3();

export function unitPose(id: string, v: Viewport): CameraPose | null {
  const a = anchorRegistry.get(id);
  if (!a) return null;
  const dist = v.mobile ? 52 : 38;
  const up = v.mobile ? 8 : 6.5;
  tmpPos.copy(a.center).addScaledVector(a.outward, dist);
  tmpPos.y += up;
  return fromCartesian(
    tmpPos,
    a.center,
    v.mobile ? 46 : 34,
    v.mobile ? 0 : -(PANEL_WIDTH / 2 + 16) / v.width,
    v.mobile ? SHEET_FRACTION / 2 + 0.02 : 0,
  );
}

/** Pose inicial do "voo de abertura", mais baixa e afastada. */
export function introPose(v: Viewport): CameraPose {
  const o = overviewPose(v);
  return { ...o, theta: o.theta - 0.55, r: o.r * 1.35, y: o.y - 10 };
}

/** Menor diferença angular (para a câmera sempre dar a volta pelo lado mais curto). */
export function shortestAngle(from: number, to: number) {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}
