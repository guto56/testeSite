'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { FLOORS } from '@/data/apartments';
import { selectViewMode, useSiteStore } from '@/store/useSiteStore';
import { choreography, MOBILE_QUERY } from '@/lib/motion';
import { PANEL_WIDTH } from '@/lib/cameraPoses';

const floors = Array.from({ length: FLOORS }, (_, i) => FLOORS - i);

/** Seletor de andares: vertical à direita (desktop), faixa horizontal (mobile). */
export function FloorRail() {
  const activeFloor = useSiteStore((s) => s.activeFloor);
  const mode = useSiteStore(selectViewMode);
  const selectFloor = useSiteStore((s) => s.selectFloor);
  const back = useSiteStore((s) => s.backToOverview);
  const ref = useRef<HTMLDivElement>(null);
  const panelOpen = mode !== 'overview';

  // abre espaço para o painel, no mesmo tempo em que ele entra
  useGSAP(
    () => {
      if (window.matchMedia(MOBILE_QUERY).matches) {
        gsap.set(ref.current, { x: 0 });
        return;
      }
      const c = choreography();
      gsap.to(ref.current, {
        x: panelOpen ? -(PANEL_WIDTH + 16) : 0,
        duration: panelOpen ? c.panelIn : c.panelOut + 0.2,
        delay: panelOpen ? c.panelInDelay : 0,
        ease: panelOpen ? 'power3.out' : 'power2.inOut',
        overwrite: 'auto',
      });
    },
    { dependencies: [panelOpen], scope: ref },
  );

  return (
    <nav
      aria-label="Seletor de andares"
      data-keep-focus
      className="pointer-events-auto absolute inset-x-0 bottom-[3.9rem] z-20 px-4 md:inset-x-auto md:top-1/2 md:right-6 md:bottom-auto md:-translate-y-1/2 md:px-0"
    >
      <div ref={ref}>
      <p className="mb-2 hidden text-center text-xs text-white/60 md:block">Andar</p>
      <ul className="thin-scroll flex gap-1.5 overflow-x-auto pb-1 md:flex-col md:gap-1 md:overflow-visible md:pb-0">
        {floors.map((f) => {
          const active = activeFloor === f;
          return (
            <li key={f} className="shrink-0">
              <button
                type="button"
                onClick={() => (active && mode === 'floor' ? back() : selectFloor(f))}
                aria-pressed={active}
                aria-label={`${f}º andar`}
                className={`tabular grid h-9 w-9 place-items-center rounded-full text-sm transition-colors duration-200 md:h-8 md:w-8 ${
                  active
                    ? 'bg-glow text-ink'
                    : 'bg-[#1e2539]/55 text-white/80 backdrop-blur-sm hover:bg-white/15 hover:text-white md:bg-transparent md:backdrop-blur-none'
                }`}
              >
                {f}
              </button>
            </li>
          );
        })}
      </ul>
      </div>
    </nav>
  );
}
