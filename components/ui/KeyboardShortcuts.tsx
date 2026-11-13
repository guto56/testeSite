'use client';

import { useEffect } from 'react';
import { useSiteStore } from '@/store/useSiteStore';

/** Esc volta à visão geral (exceto quando o foco está num campo de formulário ou com a planta aberta). */
export function KeyboardShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const t = e.target as HTMLElement | null;
      if (t && (t.closest('input, textarea, select, [contenteditable="true"]') || t.closest('dialog'))) return;
      const s = useSiteStore.getState();
      if (s.planTypology) return; // o <dialog> cuida do próprio Esc
      if (s.selectedId || s.activeFloor) s.backToOverview();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return null;
}
