'use client';

import { create } from 'zustand';
import { apartmentsById, type ApartmentStatus } from '@/data/apartments';

export type ViewMode = 'overview' | 'floor' | 'unit';

interface SiteState {
  selectedId: string | null;
  hoveredId: string | null;
  activeFloor: number | null;
  statusFilter: Record<ApartmentStatus, boolean>;
  sceneReady: boolean;
  /** true enquanto a câmera está voando — usado pela UI para sincronizar. */
  flying: boolean;
  planTypology: 'A' | 'B' | 'C' | null;

  selectUnit: (id: string) => void;
  selectFloor: (floor: number) => void;
  backToOverview: () => void;
  setHovered: (id: string | null) => void;
  toggleStatus: (s: ApartmentStatus) => void;
  setSceneReady: () => void;
  setFlying: (v: boolean) => void;
  openPlan: (t: 'A' | 'B' | 'C') => void;
  closePlan: () => void;
}

export const useSiteStore = create<SiteState>((set, get) => ({
  selectedId: null,
  hoveredId: null,
  activeFloor: null,
  statusFilter: { disponivel: true, reservado: true, vendido: true },
  sceneReady: false,
  flying: false,
  planTypology: null,

  selectUnit: (id) => {
    const apt = apartmentsById[id];
    if (!apt || get().selectedId === id) return;
    set({ selectedId: id, activeFloor: apt.floor, hoveredId: null });
  },
  selectFloor: (floor) => {
    const { activeFloor, selectedId } = get();
    if (activeFloor === floor && !selectedId) return;
    set({ activeFloor: floor, selectedId: null, hoveredId: null });
  },
  backToOverview: () => set({ selectedId: null, activeFloor: null, hoveredId: null }),
  setHovered: (id) => {
    if (get().hoveredId !== id) set({ hoveredId: id });
  },
  toggleStatus: (s) => {
    const next = { ...get().statusFilter, [s]: !get().statusFilter[s] };
    // nunca deixa os três desligados
    if (!next.disponivel && !next.reservado && !next.vendido) return;
    set({ statusFilter: next });
  },
  setSceneReady: () => set({ sceneReady: true }),
  setFlying: (v) => set({ flying: v }),
  openPlan: (t) => set({ planTypology: t }),
  closePlan: () => set({ planTypology: null }),
}));

export const selectViewMode = (s: SiteState): ViewMode =>
  s.selectedId ? 'unit' : s.activeFloor ? 'floor' : 'overview';
