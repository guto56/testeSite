'use client';

import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  apartmentsById,
  apartmentsOnFloor,
  formatBRL,
  STATUS_LABEL,
  type Apartment,
} from '@/data/apartments';
import { typologiesById } from '@/data/project';
import { useSiteStore } from '@/store/useSiteStore';
import { choreography, MOBILE_QUERY } from '@/lib/motion';
import { aptWhatsappMessage, whatsappLink } from '@/lib/whatsapp';
import { StatusDot } from './StatusDot';
import { CloseIcon, WhatsappIcon } from './Icons';

gsap.registerPlugin(useGSAP);

type Content = { kind: 'unit'; id: string } | { kind: 'floor'; floor: number };

function currentContent(): Content | null {
  const s = useSiteStore.getState();
  if (s.selectedId) return { kind: 'unit', id: s.selectedId };
  if (s.activeFloor) return { kind: 'floor', floor: s.activeFloor };
  return null;
}

const hiddenVars = (mobile: boolean) => (mobile ? { xPercent: 0, yPercent: 104 } : { xPercent: 112, yPercent: 0 });

/**
 * Painel lateral (desktop) / bottom sheet (mobile).
 * Entra sincronizado com o voo da câmera; ao trocar de apto, só o conteúdo faz crossfade.
 */
export function SidePanel() {
  const selectedId = useSiteStore((s) => s.selectedId);
  const activeFloor = useSiteStore((s) => s.activeFloor);
  const target: Content | null = selectedId
    ? { kind: 'unit', id: selectedId }
    : activeFloor
      ? { kind: 'floor', floor: activeFloor }
      : null;
  const key = target ? (target.kind === 'unit' ? `u${target.id}` : `f${target.floor}`) : null;

  const [shown, setShown] = useState<Content | null>(null);
  const shownKey = shown ? (shown.kind === 'unit' ? `u${shown.id}` : `f${shown.floor}`) : null;
  const root = useRef<HTMLElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const open = useRef(false);
  const swapping = useRef(false);

  // estado inicial escondido + ajuste quando muda o breakpoint
  useGSAP(
    () => {
      const mq = window.matchMedia(MOBILE_QUERY);
      gsap.set(root.current, { ...hiddenVars(mq.matches), autoAlpha: 0 });
      const onChange = () => {
        if (!open.current) gsap.set(root.current, { ...hiddenVars(mq.matches), autoAlpha: 0 });
        else gsap.set(root.current, { xPercent: 0, yPercent: 0 });
      };
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    { scope: root },
  );

  // abre / fecha / troca conteúdo
  useGSAP(
    () => {
      const c = choreography();
      const mobile = window.matchMedia(MOBILE_QUERY).matches;
      const el = root.current;
      const body = inner.current;
      if (!el || !body) return;

      if (target && !open.current) {
        open.current = true;
        swapping.current = false;
        gsap.killTweensOf([el, body]);
        setShown(target);
        gsap.set(body, { autoAlpha: 1, y: 0 });
        gsap.to(el, {
          xPercent: 0,
          yPercent: 0,
          autoAlpha: 1,
          duration: c.panelIn,
          delay: c.panelInDelay,
          ease: 'power3.out',
        });
      } else if (!target && open.current) {
        open.current = false;
        gsap.killTweensOf([el, body]);
        gsap.to(el, {
          ...hiddenVars(mobile),
          duration: c.panelOut,
          ease: 'power2.in',
          onComplete: () => {
            gsap.set(el, { autoAlpha: 0 });
            setShown(null);
          },
        });
      } else if (target) {
        // painel já aberto: garante que está no lugar e troca só o conteúdo
        gsap.to(el, { xPercent: 0, yPercent: 0, autoAlpha: 1, duration: 0.3, overwrite: 'auto' });
        swapping.current = true;
        gsap.killTweensOf(body);
        gsap.to(body, {
          autoAlpha: 0,
          y: -8,
          duration: c.contentOut,
          ease: 'power1.in',
          onComplete: () => setShown(currentContent()),
        });
      }
    },
    { dependencies: [key], scope: root },
  );

  // conteúdo novo entra junto com a chegada da câmera
  useGSAP(
    () => {
      if (!swapping.current || !shownKey || !inner.current) return;
      swapping.current = false;
      const c = choreography();
      gsap.fromTo(
        inner.current,
        { autoAlpha: 0, y: 10 },
        { autoAlpha: 1, y: 0, duration: c.contentIn, delay: c.contentInDelay, ease: 'power2.out' },
      );
      inner.current.scrollTop = 0;
    },
    { dependencies: [shownKey], scope: root },
  );

  return (
    <aside
      ref={root}
      aria-live="polite"
      aria-label={shown?.kind === 'unit' ? `Detalhes do apartamento ${shown.id}` : 'Apartamentos do andar'}
      className="glass gsap-hidden fixed inset-x-0 bottom-0 z-30 flex max-h-[56svh] flex-col rounded-t-[22px] text-white md:absolute md:inset-x-auto md:top-24 md:right-6 md:bottom-auto md:max-h-[calc(100%-7.5rem)] md:w-[400px] md:rounded-[22px]"
    >
      <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-white/25 md:hidden" aria-hidden />
      <div ref={inner} className="thin-scroll flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain [&>*]:shrink-0">
        {shown?.kind === 'unit' && apartmentsById[shown.id] && <UnitDetail apt={apartmentsById[shown.id]} />}
        {shown?.kind === 'floor' && <FloorSummary floor={shown.floor} />}
      </div>
    </aside>
  );
}

function PanelHeader({ children }: { children: React.ReactNode }) {
  const back = useSiteStore((s) => s.backToOverview);
  return (
    <div className="flex items-start justify-between gap-4 px-6 pt-5 md:px-7 md:pt-7">
      <div className="min-w-0">{children}</div>
      <button
        type="button"
        onClick={back}
        className="-mr-2 grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Fechar e voltar à visão geral (Esc)"
      >
        <CloseIcon />
      </button>
    </div>
  );
}

function UnitDetail({ apt }: { apt: Apartment }) {
  const typ = typologiesById[apt.typologyId];
  const openPlan = useSiteStore((s) => s.openPlan);
  const selectUnit = useSiteStore((s) => s.selectUnit);
  const neighbours = apartmentsOnFloor(apt.floor).filter((a) => a.id !== apt.id);
  const sold = apt.status === 'vendido';

  const facts: [string, string][] = [
    ['Área', `${apt.areaM2} m²`],
    ['Quartos', String(apt.bedrooms)],
    ['Suítes', String(apt.suites)],
    ['Vagas', String(apt.parking)],
  ];

  return (
    <>
      <PanelHeader>
        <p className="flex items-center gap-2 text-sm text-white/80">
          <StatusDot status={apt.status} />
          {STATUS_LABEL[apt.status]}
        </p>
        <h2 className="tabular mt-1 text-[2.6rem] leading-none font-light tracking-[-0.02em] md:mt-2 md:text-[4rem]">
          <span className="sr-only">Apartamento </span>
          {apt.id}
        </h2>
        <p className="mt-2 text-[0.95rem] text-white/70">
          {apt.floor}º andar, {typ.name}
        </p>
      </PanelHeader>

      <dl className="tabular mx-6 mt-4 grid md:mt-6 grid-cols-4 gap-px overflow-hidden rounded-xl bg-white/10 md:mx-7">
        {facts.map(([k, v]) => (
          <div key={k} className="bg-[#232a43]/80 px-3 py-3">
            <dt className="text-[0.72rem] leading-tight text-white/60">{k}</dt>
            <dd className="mt-1 text-lg text-white">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="px-6 pt-4 md:px-7 md:pt-6">
        <p className="text-[0.8rem] text-white/60">{sold ? 'Unidade vendida' : 'Valor de referência'}</p>
        <p className={`tabular mt-0.5 text-[1.7rem] leading-tight ${sold ? 'text-white/40 line-through decoration-1' : 'text-glow'}`}>
          {formatBRL(apt.priceBRL)}
        </p>
        <p className="mt-2 hidden text-sm leading-relaxed text-white/65 md:block">{typ.description}</p>
      </div>

      <div className="flex gap-2.5 px-6 pt-4 md:px-7 md:pt-6">
        <button
          type="button"
          onClick={() => openPlan(typ.id)}
          className="h-12 shrink-0 rounded-full border border-white/25 px-5 text-[0.95rem] text-white transition-colors hover:border-white/60 hover:bg-white/5"
        >
          Ver planta
        </button>
        <a
          href={whatsappLink(aptWhatsappMessage(apt.id, apt.floor))}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-glow px-5 whitespace-nowrap text-[0.95rem] font-medium text-ink transition-[filter] hover:brightness-105"
        >
          <WhatsappIcon className="h-[18px] w-[18px]" />
          {sold ? 'Ver parecidos' : 'Falar no WhatsApp'}
        </a>
      </div>

      <div className="px-6 pt-8 pb-6 md:px-7 md:pb-7">
        <p className="text-[0.8rem] text-white/55">Outros apartamentos no {apt.floor}º andar</p>
        <ul className="mt-2 grid grid-cols-3 gap-2">
          {neighbours.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => selectUnit(n.id)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/12 py-2 text-sm text-white/85 transition-colors hover:border-white/40 hover:text-white"
              >
                <StatusDot status={n.status} size={7} />
                <span className="tabular">{n.id}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function FloorSummary({ floor }: { floor: number }) {
  const selectUnit = useSiteStore((s) => s.selectUnit);
  const units = apartmentsOnFloor(floor);
  const available = units.filter((u) => u.status === 'disponivel').length;
  return (
    <>
      <PanelHeader>
        <h2 className="tabular text-[2.75rem] leading-none font-light tracking-[-0.02em] md:text-[3.25rem]">{floor}º andar</h2>
        <p className="mt-2 text-[0.95rem] text-white/70">
          {available === 0
            ? 'Nenhum apartamento disponível neste andar.'
            : available === 1
              ? 'Um apartamento disponível.'
              : `${available} apartamentos disponíveis.`}
        </p>
      </PanelHeader>
      <ul className="flex flex-col gap-2 px-4 pt-5 pb-5 md:px-5 md:pb-7">
        {units.map((u) => {
          const typ = typologiesById[u.typologyId];
          return (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => selectUnit(u.id)}
                className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-x-4 rounded-xl px-3 py-3 text-left transition-colors hover:bg-white/8"
              >
                <span className="tabular text-[1.75rem] leading-none font-light">{u.id}</span>
                <span className="text-sm leading-snug text-white/70">
                  {typ.name}, {u.areaM2} m²
                  <span className="mt-0.5 flex items-center gap-1.5 text-white/85">
                    <StatusDot status={u.status} size={7} />
                    {STATUS_LABEL[u.status]}
                  </span>
                </span>
                <span className="tabular text-right text-sm text-white/80 group-hover:text-white">
                  {u.status === 'vendido' ? '' : formatBRL(u.priceBRL)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
