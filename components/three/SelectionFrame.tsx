'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { apartmentsById } from '@/data/apartments';
import { LAYOUT, UNIT_SIGNS, floorBaseY } from '@/lib/layout';
import { useSiteStore } from '@/store/useSiteStore';
import { uiDuration } from '@/lib/motion';

/**
 * Peças sólidas (lajes de piso/teto, varanda e guarda-corpo) do apartamento selecionado.
 * A estrutura instanciada fica em raio-X; este conjunto aparece só em volta do apto ativo,
 * para que ele continue lendo como um apartamento "inteiro".
 */
export function SelectionFrame() {
  const group = useRef<THREE.Group>(null);
  const invalidate = useThree((s) => s.invalidate);
  const { half, slab, unitSize, gap, balconyDepth, balconyWidth, railingHeight, floorHeight } = LAYOUT;

  const mats = useMemo(
    () => ({
      concrete: new THREE.MeshStandardMaterial({ color: '#efe9e1', roughness: 0.8, transparent: true, opacity: 0 }),
      glass: new THREE.MeshPhysicalMaterial({
        color: '#cfdbe8',
        roughness: 0.05,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    }),
    [],
  );
  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  useEffect(
    () => () => {
      mats.concrete.dispose();
      mats.glass.dispose();
      box.dispose();
    },
    [mats, box],
  );

  const parts = useRef<{ floor: THREE.Mesh; ceil: THREE.Mesh; balcony: THREE.Mesh; rail: THREE.Mesh } | null>(null);

  useEffect(() => {
    const g = group.current!;
    const make = (m: THREE.Material) => {
      const mesh = new THREE.Mesh(box, m);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      g.add(mesh);
      return mesh;
    };
    parts.current = {
      floor: make(mats.concrete),
      ceil: make(mats.concrete),
      balcony: make(mats.concrete),
      rail: make(mats.glass),
    };
    g.visible = false;
    return () => {
      g.clear();
      parts.current = null;
    };
  }, [box, mats]);

  useEffect(() => {
    const place = (id: string) => {
      const apt = apartmentsById[id];
      const p = parts.current;
      if (!apt || !p) return;
      const [sx, sz] = UNIT_SIGNS[apt.unit];
      const off = gap / 2 + unitSize / 2;
      const y = floorBaseY(apt.floor);
      const w = unitSize + 0.2;
      p.floor.position.set(sx * off, y + slab / 2, sz * off);
      p.floor.scale.set(w, slab, w);
      p.ceil.position.set(sx * off, y + floorHeight + slab / 2, sz * off);
      p.ceil.scale.set(w, slab, w);
      const bx = sx * (half - balconyWidth / 2 - 0.6);
      p.balcony.position.set(bx, y + slab / 2, sz * (half + balconyDepth / 2));
      p.balcony.scale.set(balconyWidth, slab, balconyDepth);
      p.rail.position.set(bx, y + slab + railingHeight / 2, sz * (half + balconyDepth - 0.04));
      p.rail.scale.set(balconyWidth, railingHeight, 0.06);
    };

    return useSiteStore.subscribe((s, prev) => {
      if (s.selectedId === prev.selectedId) return;
      const g = group.current!;
      gsap.killTweensOf([mats.concrete, mats.glass]);
      const d = uiDuration(0.5);
      if (s.selectedId) {
        place(s.selectedId);
        g.visible = true;
        gsap.fromTo(mats.concrete, { opacity: 0 }, { opacity: 1, duration: d, onUpdate: invalidate });
        gsap.fromTo(mats.glass, { opacity: 0 }, { opacity: 0.35, duration: d, onUpdate: invalidate });
      } else {
        gsap.to([mats.concrete, mats.glass], {
          opacity: 0,
          duration: d * 0.6,
          onUpdate: invalidate,
          onComplete: () => {
            g.visible = false;
          },
        });
      }
    });
  }, [mats, invalidate, gap, unitSize, slab, half, balconyWidth, balconyDepth, railingHeight, floorHeight]);

  return <group ref={group} />;
}
