'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { typologiesById } from '@/data/project';
import { useSiteStore } from '@/store/useSiteStore';
import { prefersReducedMotion } from '@/lib/motion';
import { FloorPlan } from './FloorPlan';
import { CloseIcon } from './Icons';

/** Modal com a planta da tipologia — <dialog> nativo para foco preso e Esc. */
export function PlanModal() {
  const typId = useSiteStore((s) => s.planTypology);
  const close = useSiteStore((s) => s.closePlan);
  const ref = useRef<HTMLDialogElement>(null);
  const typ = typId ? typologiesById[typId] : null;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (typ && !d.open) {
      d.showModal();
      gsap.fromTo(
        d,
        { autoAlpha: 0, y: 14, scale: 0.985 },
        { autoAlpha: 1, y: 0, scale: 1, duration: prefersReducedMotion() ? 0.15 : 0.45, ease: 'power3.out' },
      );
    } else if (!typ && d.open) {
      gsap.to(d, { autoAlpha: 0, duration: 0.2, onComplete: () => d.close() });
    }
  }, [typ]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
      aria-labelledby="plan-title"
      className="on-light m-auto w-[min(56rem,calc(100vw-2rem))] max-h-[calc(100svh-2rem)] overflow-auto rounded-[22px] bg-paper p-0 text-ink backdrop:bg-[#0e1220]/70 backdrop:backdrop-blur-sm"
    >
      {typ && (
        <div className="grid gap-6 p-6 md:grid-cols-[1fr_15rem] md:p-9">
          <FloorPlan typology={typ} className="w-full text-ink" />
          <div className="flex flex-col">
            <div className="flex items-start justify-between">
              <h2 id="plan-title" className="font-display text-5xl leading-none">
                {typ.name}
              </h2>
              <button
                type="button"
                onClick={close}
                className="-mt-1 -mr-2 grid h-10 w-10 place-items-center rounded-full hover:bg-ink/5"
                aria-label="Fechar planta"
                autoFocus
              >
                <CloseIcon />
              </button>
            </div>
            <p className="mt-4 text-[0.98rem] leading-relaxed text-ink/75">{typ.description}</p>
            <dl className="tabular mt-6 grid grid-cols-2 gap-y-3 text-sm">
              <dt className="text-ink/60">Área privativa</dt>
              <dd>{typ.areaM2} m²</dd>
              <dt className="text-ink/60">Quartos</dt>
              <dd>{typ.bedrooms}</dd>
              <dt className="text-ink/60">Suítes</dt>
              <dd>{typ.suites}</dd>
              <dt className="text-ink/60">Vagas</dt>
              <dd>{typ.parking}</dd>
            </dl>
            <p className="mt-6 text-sm text-ink/60">{typ.units}</p>
            <p className="mt-auto pt-6 text-xs leading-relaxed text-ink/50">
              Planta ilustrativa. Medidas internas aproximadas, de face a face das paredes.
            </p>
          </div>
        </div>
      )}
    </dialog>
  );
}
