'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';

const subscribeNoop = () => () => {};
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { project } from '@/data/project';
import { apartmentsById, STATUS_LABEL } from '@/data/apartments';
import { selectViewMode, useSiteStore } from '@/store/useSiteStore';
import { choreography, prefersReducedMotion } from '@/lib/motion';
import { StatusLegend } from './StatusLegend';
import { StatusDot } from './StatusDot';
import { BackIcon } from './Icons';

/** Título e instruções do hero: somem quando a navegação começa e voltam com a visão geral. */
export function HeroCopy() {
  const mode = useSiteStore(selectViewMode);
  const ready = useSiteStore((s) => s.sceneReady);
  const ref = useRef<HTMLDivElement>(null);
  const touch = useSyncExternalStore(subscribeNoop, () => window.matchMedia('(pointer: coarse)').matches, () => false);

  useGSAP(
    () => {
      if (!ready) return;
      const c = choreography();
      if (mode === 'overview') {
        gsap.to(ref.current, { autoAlpha: 1, y: 0, duration: c.panelIn, delay: c.flight * 0.5, ease: 'power3.out', overwrite: 'auto' });
      } else {
        gsap.to(ref.current, { autoAlpha: 0, y: 16, duration: c.panelOut, ease: 'power2.in', overwrite: 'auto' });
      }
    },
    { dependencies: [mode, ready], scope: ref },
  );

  return (
    <div
      ref={ref}
      className="gsap-hidden pointer-events-none absolute top-24 left-4 right-4 z-10 md:top-auto md:right-auto md:bottom-28 md:left-10 md:max-w-[34rem] lg:left-14"
    >
      <h1 className="font-display text-[2.3rem] leading-[1.04] text-white md:text-[4.6rem] lg:text-[5.25rem]">
        {project.tagline}
      </h1>
      <p className="mt-6 hidden max-w-[30rem] text-lg leading-relaxed text-white/75 md:block">{project.intro}</p>
      <p className="mt-5 hidden max-w-[28rem] text-sm text-white/55 md:block">
        {touch
          ? 'Toque em um apartamento para ver os detalhes. Arraste para os lados para girar o prédio.'
          : 'Passe o cursor sobre a fachada para ver o status de cada apartamento e clique para abrir os detalhes. Arraste para girar.'}
      </p>
    </div>
  );
}

export function HeroBottomBar() {
  const mode = useSiteStore(selectViewMode);
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const c = choreography();
      // no mobile a legenda fica escondida atrás do bottom sheet
      gsap.to(ref.current, { autoAlpha: mode === 'unit' ? 0.0 : 1, duration: c.panelOut, overwrite: 'auto' });
    },
    { dependencies: [mode], scope: ref },
  );
  return (
    <div ref={ref} className="absolute bottom-4 left-4 right-[4.75rem] z-20 md:right-auto md:bottom-8 md:left-10 lg:left-14">
      <StatusLegend />
    </div>
  );
}

/** Botão "Voltar" — visível fora da visão geral. Esc faz o mesmo. */
export function BackButton() {
  const mode = useSiteStore(selectViewMode);
  const back = useSiteStore((s) => s.backToOverview);
  const ref = useRef<HTMLButtonElement>(null);
  useGSAP(
    () => {
      const show = mode !== 'overview';
      gsap.to(ref.current, {
        autoAlpha: show ? 1 : 0,
        x: show ? 0 : -10,
        duration: prefersReducedMotion() ? 0.1 : 0.4,
        delay: show ? choreography().panelInDelay * 0.6 : 0,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    },
    { dependencies: [mode], scope: ref },
  );
  return (
    <button
      ref={ref}
      type="button"
      onClick={back}
      className="glass gsap-hidden absolute top-20 left-4 z-30 flex h-10 items-center gap-2 rounded-full pr-4 pl-3 text-sm text-white md:top-24 md:left-10 lg:left-14"
    >
      <BackIcon />
      Voltar à visão geral
      <kbd className="ml-1 hidden rounded border border-white/25 px-1.5 text-[0.7rem] text-white/60 md:inline">Esc</kbd>
    </button>
  );
}

/** Tooltip que segue o cursor ao passar sobre um apartamento. */
export function HoverTooltip() {
  const hoveredId = useSiteStore((s) => s.hoveredId);
  const ref = useRef<HTMLDivElement>(null);
  const apt = hoveredId ? apartmentsById[hoveredId] : null;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const move = (e: PointerEvent) => {
      el.style.transform = `translate3d(${e.clientX + 16}px, ${e.clientY + 18}px, 0)`;
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, []);

  useGSAP(() => {
    gsap.to(ref.current, { autoAlpha: apt ? 1 : 0, duration: 0.15, overwrite: 'auto' });
  }, { dependencies: [hoveredId] });

  return (
    <div
      ref={ref}
      role="tooltip"
      className="glass gsap-hidden pointer-events-none fixed top-0 left-0 z-50 rounded-xl px-3 py-2 text-white"
    >
      {apt && (
        <>
          <p className="text-[0.95rem] leading-tight">
            Apto <span className="tabular">{apt.id}</span>
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/75">
            <StatusDot status={apt.status} size={7} />
            {STATUS_LABEL[apt.status]}, {apt.areaM2} m²
          </p>
        </>
      )}
    </div>
  );
}

/** Loader elegante enquanto os shaders compilam; sai junto com o voo de abertura. */
export function SceneLoader() {
  const ready = useSiteStore((s) => s.sceneReady);
  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const crawl = useRef<gsap.core.Tween | null>(null);

  useGSAP(() => {
    crawl.current = gsap.fromTo(bar.current, { scaleX: 0 }, { scaleX: 0.86, duration: 3.2, ease: 'power2.out' });
  });

  useGSAP(
    () => {
      if (!ready) return;
      crawl.current?.kill();
      const tl = gsap.timeline();
      gsap.set(root.current, { pointerEvents: 'none' });
      tl.to(bar.current, { scaleX: 1, duration: 0.35, ease: 'power1.out' })
        .to(root.current, { autoAlpha: 0, duration: prefersReducedMotion() ? 0.2 : 0.9, ease: 'power2.inOut' }, '+=0.05');
    },
    { dependencies: [ready] },
  );

  return (
    <div
      ref={root}
      role="status"
      aria-live="polite"
      className="absolute inset-0 z-40 grid place-items-center bg-[radial-gradient(120%_80%_at_30%_100%,#5a4d7e_0%,#2a3050_45%,#161c2a_100%)]"
    >
      <div className="w-56 text-center">
        <p className="font-display text-4xl text-white">{project.shortName}</p>
        <div className="mt-5 h-px w-full overflow-hidden bg-white/15">
          <div ref={bar} className="h-full origin-left bg-glow" />
        </div>
        <p className="mt-3 text-xs text-white/55">{ready ? 'Pronto' : 'Montando o edifício'}</p>
      </div>
    </div>
  );
}
