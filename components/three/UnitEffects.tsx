'use client';

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { apartmentsById } from '@/data/apartments';
import { structureMaterials, unitVisuals } from '@/lib/visualRegistry';
import { selectViewMode, useSiteStore } from '@/store/useSiteStore';
import { uiDuration } from '@/lib/motion';

/** Estado animável por apartamento (GSAP anima estes números; `apply` escreve no material). */
interface Fx {
  opacity: number;
  emissive: number;
  hover: number;
}
const fxById = new Map<string, Fx>();
const structureFx = { k: 1 };

const XRAY = 0.08;

function apply(id: string) {
  const v = unitVisuals.get(id);
  const fx = fxById.get(id);
  if (!v || !fx) return;
  v.material.opacity = fx.opacity;
  v.material.emissiveIntensity = fx.emissive * fx.hover;
  v.material.depthWrite = fx.opacity > 0.98;
  v.mesh.castShadow = fx.opacity > 0.5;
}

function applyStructure() {
  structureMaterials.forEach((m) => {
    const base = (m.userData.baseOpacity as number) ?? 1;
    m.opacity = base * structureFx.k;
    m.depthWrite = base >= 1 && structureFx.k > 0.98;
  });
}

/**
 * Orquestra os materiais: cores por status, filtro, hover, destaque de andar e raio-X.
 * Lê o store e anima com GSAP — nada de setState por frame.
 */
export function UnitEffects() {
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    unitVisuals.forEach((v, id) => {
      if (!fxById.has(id)) fxById.set(id, { opacity: 1, emissive: v.baseEmissive, hover: 1 });
    });

    const layout = () => {
      const s = useSiteStore.getState();
      const mode = selectViewMode(s);
      const d = uiDuration(0.7);

      unitVisuals.forEach((v, id) => {
        const apt = apartmentsById[id];
        const fx = fxById.get(id)!;
        const visible = s.statusFilter[apt.status];
        let opacity = visible ? 1 : 0.16;
        let emissive = v.baseEmissive * (visible ? 1 : 0.3);

        if (mode === 'unit') {
          const sel = id === s.selectedId;
          opacity = sel ? 1 : XRAY;
          emissive = sel ? v.baseEmissive * 2.2 : v.baseEmissive * 0.4;
        } else if (mode === 'floor') {
          const on = apt.floor === s.activeFloor;
          opacity = on ? (visible ? 1 : 0.4) : 0.1;
          emissive = on ? v.baseEmissive * (visible ? 1.9 : 0.5) : v.baseEmissive * 0.4;
        }

        if (opacity < 0.98) v.material.depthWrite = false; // some antes de começar a sumir
        gsap.to(fx, {
          opacity,
          emissive,
          duration: d,
          ease: 'power2.inOut',
          overwrite: 'auto',
          onUpdate: () => {
            apply(id);
            invalidate();
          },
        });
      });

      const k = mode === 'unit' ? XRAY : mode === 'floor' ? 0.14 : 1;
      if (k < 1) structureMaterials.forEach((m) => (m.depthWrite = false));
      gsap.to(structureFx, {
        k,
        duration: d,
        ease: 'power2.inOut',
        overwrite: 'auto',
        onUpdate: () => {
          applyStructure();
          invalidate();
        },
      });
    };

    const hover = (id: string | null, prev: string | null) => {
      const d = uiDuration(0.25);
      if (prev && fxById.has(prev)) {
        gsap.to(fxById.get(prev)!, { hover: 1, duration: d, overwrite: 'auto', onUpdate: () => (apply(prev), invalidate()) });
      }
      if (id && fxById.has(id)) {
        gsap.to(fxById.get(id)!, { hover: 2.1, duration: d, overwrite: 'auto', onUpdate: () => (apply(id), invalidate()) });
      }
    };

    layout();
    const unsub = useSiteStore.subscribe((s, p) => {
      if (s.selectedId !== p.selectedId || s.activeFloor !== p.activeFloor || s.statusFilter !== p.statusFilter) layout();
      if (s.hoveredId !== p.hoveredId) hover(s.hoveredId, p.hoveredId);
    });
    return () => {
      unsub();
      fxById.forEach((fx) => gsap.killTweensOf(fx));
      gsap.killTweensOf(structureFx);
    };
  }, [invalidate]);

  return null;
}
