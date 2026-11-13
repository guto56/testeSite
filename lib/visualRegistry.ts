import type * as THREE from 'three';

/**
 * Registro dos materiais que participam dos efeitos (hover, raio-X, destaque de andar).
 * O prédio (procedural ou .glb) registra aqui; `UnitEffects` anima os valores com GSAP.
 */
export interface UnitVisual {
  mesh: THREE.Mesh;
  material: THREE.MeshStandardMaterial;
  baseEmissive: number;
}

export const unitVisuals = new Map<string, UnitVisual>();

/** Materiais da estrutura (lajes, brises, núcleo, cobertura…). `userData.baseOpacity` define a opacidade "cheia". */
export const structureMaterials = new Set<THREE.Material>();
