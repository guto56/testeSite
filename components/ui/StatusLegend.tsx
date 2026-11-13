'use client';

import { apartments, STATUS_LABEL, type ApartmentStatus } from '@/data/apartments';
import { useSiteStore } from '@/store/useSiteStore';
import { StatusDot } from './StatusDot';

const ORDER: ApartmentStatus[] = ['disponivel', 'reservado', 'vendido'];
const counts = ORDER.reduce(
  (acc, s) => ({ ...acc, [s]: apartments.filter((a) => a.status === s).length }),
  {} as Record<ApartmentStatus, number>,
);

/** Legenda de status que também filtra: desligar um status apaga esses aptos no 3D. */
export function StatusLegend({ className = '' }: { className?: string }) {
  const filter = useSiteStore((s) => s.statusFilter);
  const toggle = useSiteStore((s) => s.toggleStatus);
  return (
    <div role="group" aria-label="Legenda e filtro por status" className={`flex gap-1 md:gap-1.5 ${className}`}>
      {ORDER.map((s) => (
        <button
          key={s}
          type="button"
          aria-pressed={filter[s]}
          onClick={() => toggle(s)}
          title={filter[s] ? `Ocultar ${STATUS_LABEL[s].toLowerCase()}s` : `Mostrar ${STATUS_LABEL[s].toLowerCase()}s`}
          className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[0.8rem] md:gap-2 md:px-3.5 md:text-sm transition-[opacity,border-color] duration-200 ${
            filter[s] ? 'border-white/25 bg-[#1e2539]/50 text-white' : 'border-white/10 bg-transparent text-white/45'
          } backdrop-blur-sm hover:border-white/50`}
        >
          <StatusDot status={s} />
          {STATUS_LABEL[s]}
          <span className="tabular hidden text-white/55 sm:inline">{counts[s]}</span>
        </button>
      ))}
    </div>
  );
}
