'use client';

import { useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { apartmentsById, STATUS_COLOR } from '@/data/apartments';
import { anchorRegistry } from '@/lib/layout';
import { structureMaterials, unitVisuals } from '@/lib/visualRegistry';
import { unitHandlers } from './useUnitEvents';

const UNIT_NAME = /^apt_(\d+)$/;

/** Sobe na hierarquia até achar o mesh de apartamento (útil quando o apto é um grupo com filhos). */
function unitIdOf(obj: THREE.Object3D | null): string | null {
  while (obj) {
    if (obj.userData.unitId) return obj.userData.unitId as string;
    obj = obj.parent;
  }
  return null;
}

/**
 * Prédio a partir de um .glb. Convenções do arquivo:
 * - cada apartamento é um Mesh chamado `apt_<id>` (o id de data/apartments.ts);
 * - o prédio está centrado na origem, com o chão em y = 0, em metros;
 * - todo o resto (lajes, fachada, cobertura…) vira "estrutura" e entra no raio-X.
 * Opcional: `extras.facing` no mesh (vetor [x, z]) para dizer de onde a câmera deve olhar.
 */
export function GlbBuilding({ url }: { url: string }) {
  const gltf = useGLTF(url);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  useLayoutEffect(() => {
    const box = new THREE.Box3();
    const ownedMaterials: THREE.Material[] = [];
    scene.updateMatrixWorld(true);

    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const match = mesh.name.match(UNIT_NAME);
      const apt = match ? apartmentsById[match[1]] : undefined;

      if (apt) {
        const src = mesh.material as THREE.MeshStandardMaterial;
        const material = (src.isMeshStandardMaterial ? src.clone() : new THREE.MeshStandardMaterial()) as THREE.MeshStandardMaterial;
        material.transparent = true;
        material.emissive = new THREE.Color(STATUS_COLOR[apt.status]);
        material.emissiveIntensity = 0.35;
        material.color.lerp(new THREE.Color(STATUS_COLOR[apt.status]), 0.4);
        mesh.material = material;
        ownedMaterials.push(material);
        mesh.userData.unitId = apt.id;

        box.setFromObject(mesh);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const facing = mesh.userData.facing as [number, number] | undefined;
        const outward = facing
          ? new THREE.Vector3(facing[0], 0, facing[1]).normalize()
          : new THREE.Vector3(center.x, 0, center.z).normalize();
        anchorRegistry.set(apt.id, { id: apt.id, center, size, outward, facing: Math.sign(outward.z) || 1 });
        unitVisuals.set(apt.id, { mesh, material, baseEmissive: material.emissiveIntensity });
      } else {
        const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        const cloned = list.map((m) => {
          const c = m.clone();
          c.userData.baseOpacity = c.transparent ? c.opacity : 1;
          c.transparent = true;
          structureMaterials.add(c);
          ownedMaterials.push(c);
          return c;
        });
        mesh.material = Array.isArray(mesh.material) ? cloned : cloned[0];
      }
    });

    return () => {
      anchorRegistry.clear();
      unitVisuals.clear();
      ownedMaterials.forEach((m) => {
        structureMaterials.delete(m);
        m.dispose();
      });
    };
  }, [scene]);

  const withId = (e: ThreeEvent<PointerEvent | MouseEvent>, fn: (id: string) => void) => {
    const id = unitIdOf(e.object);
    if (id) fn(id);
  };

  return (
    <primitive
      object={scene}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => withId(e, (id) => unitHandlers.over(id, e))}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => withId(e, (id) => unitHandlers.out(id))}
      onClick={(e: ThreeEvent<MouseEvent>) => withId(e, (id) => unitHandlers.click(id, e))}
    />
  );
}
