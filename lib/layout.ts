import * as THREE from 'three';
import type { Apartment } from '@/data/apartments';

/**
 * Dimensões do prédio procedural, em metros (1 unidade = 1 m).
 * Planta quadrada com 4 apartamentos por andar, um em cada esquina.
 *
 *        fundos (-z)
 *     ┌──────┬──────┐
 *     │  04  │  03  │
 *  -x ├──────┼──────┤ +x
 *     │  01  │  02  │
 *     └──────┴──────┘
 *        frente (+z)
 */
export const LAYOUT = {
  floors: 12,
  groundHeight: 4.6,
  floorHeight: 3.3,
  slab: 0.3,
  unitSize: 11.7,
  gap: 0.6,
  balconyDepth: 1.8,
  balconyWidth: 8,
  railingHeight: 1.1,
  get half() {
    return this.gap / 2 + this.unitSize;
  },
  get roofY() {
    return this.groundHeight + this.floors * this.floorHeight;
  },
};

/** Raio horizontal mínimo (a partir do eixo do prédio) que a câmera pode ocupar. */
export const SAFE_RADIUS = Math.hypot(LAYOUT.half, LAYOUT.half + LAYOUT.balconyDepth) + 3;

export const UNIT_SIGNS: Record<Apartment['unit'], [number, number]> = {
  1: [-1, 1],
  2: [1, 1],
  3: [1, -1],
  4: [-1, -1],
};

export const floorBaseY = (floor: number) => LAYOUT.groundHeight + (floor - 1) * LAYOUT.floorHeight;
export const floorCenterY = (floor: number) => floorBaseY(floor) + LAYOUT.slab + (LAYOUT.floorHeight - LAYOUT.slab) / 2;

/**
 * Âncora de uma unidade: tudo que a câmera e os efeitos precisam saber.
 * O prédio procedural calcula as âncoras a partir do LAYOUT; o modelo .glb
 * calcula a partir do bounding box de cada mesh `apt_<id>`.
 */
export interface UnitAnchor {
  id: string;
  center: THREE.Vector3;
  size: THREE.Vector3;
  /** Direção horizontal (normalizada) "para fora" do apartamento — de onde a câmera olha. */
  outward: THREE.Vector3;
  /** Lado da varanda (+1 frente, -1 fundos). */
  facing: number;
}

export function proceduralAnchor(apt: Apartment): UnitAnchor {
  const [sx, sz] = UNIT_SIGNS[apt.unit];
  const off = LAYOUT.gap / 2 + LAYOUT.unitSize / 2;
  const h = LAYOUT.floorHeight - LAYOUT.slab;
  return {
    id: apt.id,
    center: new THREE.Vector3(sx * off, floorCenterY(apt.floor), sz * off),
    size: new THREE.Vector3(LAYOUT.unitSize, h, LAYOUT.unitSize),
    outward: new THREE.Vector3(sx * 0.55, 0, sz).normalize(),
    facing: sz,
  };
}

/** Registro global (não reativo) das âncoras da construção montada. */
export const anchorRegistry = new Map<string, UnitAnchor>();
