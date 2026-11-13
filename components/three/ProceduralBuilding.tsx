'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { apartments, STATUS_COLOR, type Apartment } from '@/data/apartments';
import { LAYOUT, UNIT_SIGNS, anchorRegistry, floorBaseY, proceduralAnchor } from '@/lib/layout';
import { getFacadeTextures } from '@/lib/facadeTextures';
import { structureMaterials, unitVisuals } from '@/lib/visualRegistry';
import { useUnitEvents } from './useUnitEvents';
import { SelectionFrame } from './SelectionFrame';

const GLASS_BASE = new THREE.Color('#2a3142');

/** Cria um material de estrutura já registrado para o modo raio-X. */
function useStructureMaterial(factory: () => THREE.Material) {
  const mat = useMemo(() => {
    const m = factory();
    m.transparent = true; // sempre transparente: alternar a flag recompila o shader
    if (m.userData.baseOpacity === undefined) m.userData.baseOpacity = m.opacity;
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useLayoutEffect(() => {
    structureMaterials.add(mat);
    return () => {
      structureMaterials.delete(mat);
      mat.dispose();
    };
  }, [mat]);
  return mat;
}

/** Preenche um InstancedMesh a partir de uma lista de matrizes. */
function useInstanceMatrices(ref: React.RefObject<THREE.InstancedMesh | null>, matrices: THREE.Matrix4[]) {
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [ref, matrices]);
}

const tmpQ = new THREE.Quaternion();
const mat4 = (x: number, y: number, z: number, sx = 1, sy = 1, sz = 1) =>
  new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), tmpQ, new THREE.Vector3(sx, sy, sz));

export function ProceduralBuilding() {
  const unitGeometry = useMemo(() => {
    const h = LAYOUT.floorHeight - LAYOUT.slab;
    return new THREE.BoxGeometry(LAYOUT.unitSize - 0.15, h, LAYOUT.unitSize - 0.15);
  }, []);
  const unitBox = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  useLayoutEffect(() => {
    apartments.forEach((a) => anchorRegistry.set(a.id, proceduralAnchor(a)));
    return () => anchorRegistry.clear();
  }, []);

  useLayoutEffect(() => () => {
    unitGeometry.dispose();
    unitBox.dispose();
  }, [unitGeometry, unitBox]);

  return (
    <group>
      {apartments.map((a) => (
        <ApartmentUnit key={a.id} apt={a} geometry={unitGeometry} />
      ))}
      <Structure box={unitBox} />
      <SelectionFrame />
    </group>
  );
}

function ApartmentUnit({ apt, geometry }: { apt: Apartment; geometry: THREE.BufferGeometry }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const anchor = useMemo(() => proceduralAnchor(apt), [apt]);
  const maxAniso = useThree((s) => s.gl.capabilities.getMaxAnisotropy());
  const events = useUnitEvents(apt.id);

  const material = useMemo(() => {
    const tex = getFacadeTextures(Math.min(8, maxAniso));
    const status = new THREE.Color(STATUS_COLOR[apt.status]);
    const m = new THREE.MeshStandardMaterial({
      color: GLASS_BASE.clone().lerp(status, 0.62),
      map: tex.map,
      emissive: status.clone(),
      emissiveMap: tex.emissive[(apt.floor * 3 + apt.unit) % tex.emissive.length],
      emissiveIntensity: 0.9,
      roughness: 0.22,
      metalness: 0.55,
      envMapIntensity: 1.1,
      transparent: true,
    });
    return m;
  }, [apt, maxAniso]);

  useLayoutEffect(() => {
    const mesh = meshRef.current!;
    mesh.userData.unitId = apt.id;
    unitVisuals.set(apt.id, { mesh, material, baseEmissive: material.emissiveIntensity });
    return () => {
      unitVisuals.delete(apt.id);
      material.dispose(); // texturas são compartilhadas e ficam em cache
    };
  }, [apt.id, material]);

  return (
    <mesh
      ref={meshRef}
      name={`apt_${apt.id}`}
      geometry={geometry}
      material={material}
      position={anchor.center}
      castShadow
      receiveShadow
      {...events}
    />
  );
}

function Structure({ box }: { box: THREE.BufferGeometry }) {
  const { half, floors, slab, groundHeight, roofY, balconyDepth, balconyWidth, railingHeight, unitSize, gap } = LAYOUT;

  const concrete = useStructureMaterial(
    () => new THREE.MeshStandardMaterial({ color: '#e7e2da', roughness: 0.85, metalness: 0 }),
  );
  const core = useStructureMaterial(
    () => new THREE.MeshStandardMaterial({ color: '#232838', roughness: 0.6, metalness: 0.2 }),
  );
  const fin = useStructureMaterial(
    () => new THREE.MeshStandardMaterial({ color: '#9c8a74', roughness: 0.35, metalness: 0.8 }),
  );
  const railing = useStructureMaterial(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: '#b9c6d6',
      roughness: 0.05,
      metalness: 0.1,
      opacity: 0.32,
      depthWrite: false,
    });
    m.userData.baseOpacity = 0.32;
    return m;
  });
  const lobby = useStructureMaterial(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#3b3a40',
        emissive: '#ffcf96',
        emissiveIntensity: 1.6,
        roughness: 0.2,
        metalness: 0.4,
      }),
  );

  const slabRef = useRef<THREE.InstancedMesh>(null);
  const balconyRef = useRef<THREE.InstancedMesh>(null);
  const railRef = useRef<THREE.InstancedMesh>(null);
  const finRef = useRef<THREE.InstancedMesh>(null);
  const coreRef = useRef<THREE.InstancedMesh>(null);
  const roofRef = useRef<THREE.InstancedMesh>(null);
  const pilotiRef = useRef<THREE.InstancedMesh>(null);

  const slabs = useMemo(() => {
    const w = half * 2 + 0.5;
    const list: THREE.Matrix4[] = [];
    for (let f = 1; f <= floors; f++) list.push(mat4(0, floorBaseY(f) + slab / 2, 0, w, slab, w));
    list.push(mat4(0, roofY + slab / 2, 0, w + 0.4, slab * 1.6, w + 0.4)); // laje da cobertura
    return list;
  }, [half, floors, slab, roofY]);

  const balconies = useMemo(() => {
    const slabs: THREE.Matrix4[] = [];
    const rails: THREE.Matrix4[] = [];
    for (const a of apartments) {
      const [sx, sz] = UNIT_SIGNS[a.unit];
      const y = floorBaseY(a.floor);
      const x = sx * (half - balconyWidth / 2 - 0.6);
      const z = sz * (half + balconyDepth / 2);
      slabs.push(mat4(x, y + slab / 2, z, balconyWidth, slab, balconyDepth));
      rails.push(mat4(x, y + slab + railingHeight / 2, sz * (half + balconyDepth - 0.04), balconyWidth, railingHeight, 0.06));
    }
    return { slabs, rails };
  }, [half, balconyDepth, balconyWidth, slab, railingHeight]);

  const fins = useMemo(() => {
    const list: THREE.Matrix4[] = [];
    const h = roofY - groundHeight;
    const y = groundHeight + h / 2;
    const count = 5; // por apartamento, por fachada
    for (const side of [-1, 1]) {
      for (const unitSide of [-1, 1]) {
        for (let i = 0; i < count; i++) {
          const along = unitSide * (gap / 2 + ((i + 0.5) / count) * unitSize);
          // fachadas leste/oeste (x = ±half)
          list.push(mat4(side * (half + 0.22), y, along, 0.35, h, 0.12));
          // fachadas norte/sul só nos trechos sem varanda (perto do núcleo)
          if (i === 0) list.push(mat4(along, y, side * (half + 0.22), 0.12, h, 0.35));
        }
      }
    }
    return list;
  }, [roofY, groundHeight, gap, unitSize, half]);

  const coreParts = useMemo(() => {
    const h = roofY - groundHeight;
    const y = groundHeight + h / 2;
    return [mat4(0, y, 0, half * 2 - 0.4, h, gap + 0.02), mat4(0, y, 0, gap + 0.02, h, half * 2 - 0.4)];
  }, [roofY, groundHeight, half, gap]);

  const roofParts = useMemo(
    () => [
      mat4(0, roofY + 2.0, -3, 9, 3.4, 7), // casa de máquinas
      mat4(0, roofY + 0.8, half - 0.1, half * 2, 1.0, 0.2), // platibanda
      mat4(0, roofY + 0.8, -half + 0.1, half * 2, 1.0, 0.2),
      mat4(half - 0.1, roofY + 0.8, 0, 0.2, 1.0, half * 2),
      mat4(-half + 0.1, roofY + 0.8, 0, 0.2, 1.0, half * 2),
    ],
    [roofY, half],
  );

  const piloti = useMemo(() => {
    const list: THREE.Matrix4[] = [];
    const p = half - 0.8;
    for (const x of [-p, -p / 3, p / 3, p]) for (const z of [-p, p]) list.push(mat4(x, groundHeight / 2, z, 0.7, groundHeight, 0.7));
    return list;
  }, [half, groundHeight]);

  useInstanceMatrices(slabRef, slabs);
  useInstanceMatrices(balconyRef, balconies.slabs);
  useInstanceMatrices(railRef, balconies.rails);
  useInstanceMatrices(finRef, fins);
  useInstanceMatrices(coreRef, coreParts);
  useInstanceMatrices(roofRef, roofParts);
  useInstanceMatrices(pilotiRef, piloti);

  return (
    <group>
      <instancedMesh ref={slabRef} args={[box, concrete, slabs.length]} castShadow receiveShadow />
      <instancedMesh ref={balconyRef} args={[box, concrete, balconies.slabs.length]} castShadow receiveShadow />
      <instancedMesh ref={railRef} args={[box, railing, balconies.rails.length]} />
      <instancedMesh ref={finRef} args={[box, fin, fins.length]} castShadow receiveShadow />
      <instancedMesh ref={coreRef} args={[box, core, coreParts.length]} receiveShadow />
      <instancedMesh ref={roofRef} args={[box, concrete, roofParts.length]} castShadow receiveShadow />
      <instancedMesh ref={pilotiRef} args={[box, concrete, piloti.length]} castShadow />
      {/* térreo: lobby envidraçado e iluminado, recuado sob a projeção da torre */}
      <mesh position={[0, groundHeight / 2, 0]} scale={[half * 2 - 4, groundHeight - 0.2, half * 2 - 4]} geometry={box} material={lobby} />
    </group>
  );
}
