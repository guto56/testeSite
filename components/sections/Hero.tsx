'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';
import { project } from '@/data/project';
import { selectViewMode, useSiteStore } from '@/store/useSiteStore';
import { SidePanel } from '@/components/ui/SidePanel';
import { FloorRail } from '@/components/ui/FloorRail';
import { BackButton, HeroBottomBar, HeroCopy, HoverTooltip, SceneLoader } from '@/components/ui/HeroOverlay';

const BuildingCanvas = dynamic(() => import('@/components/three/BuildingCanvas'), { ssr: false });

const NAV = [
  ['O empreendimento', '#empreendimento'],
  ['Plantas', '#plantas'],
  ['Lazer', '#lazer'],
  ['Localização', '#localizacao'],
] as const;

export function Hero() {
  const stage = useRef<HTMLDivElement>(null);

  // cursor de "mãozinha" sobre apartamentos + estado exposto em data-attributes (útil para testes e analytics)
  useEffect(
    () =>
      useSiteStore.subscribe((s, p) => {
        const el = stage.current;
        if (!el) return;
        if (s.hoveredId !== p.hoveredId) el.style.cursor = s.hoveredId ? 'pointer' : '';
        el.dataset.mode = selectViewMode(s);
        el.dataset.selected = s.selectedId ?? '';
        el.dataset.hovered = s.hoveredId ?? '';
        el.dataset.floor = s.activeFloor ? String(s.activeFloor) : '';
        el.dataset.flying = String(s.flying);
        el.dataset.ready = String(s.sceneReady);
      }),
    [],
  );

  return (
    <section id="inicio" aria-label={`${project.name} em 3D`} className="relative h-[100svh] min-h-[560px] overflow-hidden bg-ink text-white">
      <div ref={stage} id="stage" data-mode="overview" data-flying="false" data-ready="false" className="absolute inset-0">
        <BuildingCanvas />
      </div>

      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4 pt-4 md:px-10 md:pt-7 lg:px-14">
        <a href="#inicio" className="font-display pointer-events-auto text-[1.9rem] leading-none text-white md:text-[2.2rem]">
          {project.shortName}
          <span className="sr-only"> Pinheiros, página inicial</span>
        </a>
        <nav aria-label="Seções" className="pointer-events-auto hidden items-center gap-7 text-[0.95rem] text-white/80 lg:flex">
          {NAV.map(([label, href]) => (
            <a key={href} href={href} className="transition-colors hover:text-white">
              {label}
            </a>
          ))}
        </nav>
        <a
          href="#contato"
          className="pointer-events-auto rounded-full border border-white/30 px-4 py-2 text-sm text-white transition-colors hover:border-white/70 hover:bg-white/5 md:px-5"
        >
          Agendar visita
        </a>
      </header>

      <HeroCopy />
      <BackButton />
      <FloorRail />
      <HeroBottomBar />
      <SidePanel />
      <HoverTooltip />
      <SceneLoader />
    </section>
  );
}
