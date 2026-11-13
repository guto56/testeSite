'use client';

import { useMemo } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { apartmentsById } from '@/data/apartments';
import { useSiteStore } from '@/store/useSiteStore';

/** Distância (px) entre pointerdown e click acima da qual o gesto é considerado arraste. */
const CLICK_TOLERANCE = 8;

function isFilteredOut(id: string) {
  const apt = apartmentsById[id];
  return !apt || !useSiteStore.getState().statusFilter[apt.status];
}

export const unitHandlers = {
  over(id: string, e: ThreeEvent<PointerEvent>) {
    e.stopPropagation();
    if (e.pointerType === 'touch' || isFilteredOut(id)) return;
    useSiteStore.getState().setHovered(id);
  },
  out(id: string) {
    if (useSiteStore.getState().hoveredId === id) useSiteStore.getState().setHovered(null);
  },
  click(id: string, e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    if (e.delta > CLICK_TOLERANCE || isFilteredOut(id)) return;
    useSiteStore.getState().selectUnit(id);
  },
};

/** Handlers R3F para um mesh de apartamento. */
export function useUnitEvents(id: string) {
  return useMemo(
    () => ({
      onPointerOver: (e: ThreeEvent<PointerEvent>) => unitHandlers.over(id, e),
      onPointerOut: () => unitHandlers.out(id),
      onClick: (e: ThreeEvent<MouseEvent>) => unitHandlers.click(id, e),
    }),
    [id],
  );
}
