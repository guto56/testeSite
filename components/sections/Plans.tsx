'use client';

import { typologies } from '@/data/project';
import { apartments } from '@/data/apartments';
import { useSiteStore } from '@/store/useSiteStore';
import { FloorPlan } from '@/components/ui/FloorPlan';

function availableOf(typ: string) {
  return apartments.filter((a) => a.typologyId === typ && a.status === 'disponivel');
}

export function Plans() {
  const selectUnit = useSiteStore((s) => s.selectUnit);
  const openPlan = useSiteStore((s) => s.openPlan);

  const showInBuilding = (typ: string) => {
    const first = availableOf(typ)[0];
    if (!first) return;
    document.getElementById('inicio')?.scrollIntoView({ behavior: 'smooth' });
    // espera a rolagem começar para o voo da câmera ser visto
    window.setTimeout(() => selectUnit(first.id), 450);
  };

  return (
    <section id="plantas" className="on-light bg-haze px-5 py-24 md:px-10 md:py-36 lg:px-14">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 md:grid-cols-[1.1fr_1fr] md:gap-20">
          <h2 className="font-display text-[2.9rem] leading-[1.02] md:text-[4.4rem]">Três plantas, todas com varanda gourmet.</h2>
          <p className="max-w-[32rem] self-end text-[1.08rem] leading-[1.75] text-ink/75">
            As plantas A e B se repetem do 1º ao 11º andar. No 12º, as quatro coberturas ganham pé-direito mais alto e
            terraço com piscina.
          </p>
        </div>

        <ul className="mt-16 grid gap-14 md:grid-cols-3 md:gap-10">
          {typologies.map((t) => {
            const free = availableOf(t.id).length;
            return (
              <li key={t.id} className="flex flex-col">
                <button
                  type="button"
                  onClick={() => openPlan(t.id)}
                  className="group block rounded-2xl bg-paper p-5 text-ink/85 transition-colors hover:text-ink"
                  aria-label={`Ampliar ${t.name}`}
                >
                  <FloorPlan typology={t} className="aspect-square w-full" />
                </button>
                <h3 className="font-display mt-6 text-[2.4rem] leading-none">{t.name}</h3>
                <p className="tabular mt-3 text-[1.02rem]">
                  {t.areaM2} m², {t.bedrooms} quartos ({t.suites === t.bedrooms ? 'todos suítes' : `${t.suites} suíte`}), {t.parking}{' '}
                  vagas
                </p>
                <p className="mt-1 text-sm text-ink/60">{t.units}</p>
                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
                  <button
                    type="button"
                    disabled={free === 0}
                    onClick={() => showInBuilding(t.id)}
                    className="rounded-full bg-ink px-5 py-2.5 text-sm text-white transition-colors hover:bg-jacaranda-deep disabled:bg-ink/30"
                  >
                    Ver no prédio
                  </button>
                  <span className="text-sm text-ink/65">
                    {free === 0 ? 'Esgotada' : free === 1 ? '1 disponível' : `${free} disponíveis`}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
