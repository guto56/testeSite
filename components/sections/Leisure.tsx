'use client';

import { useState } from 'react';
import { amenities, project } from '@/data/project';

const TREES: [number, number, number][] = [
  [8, 8, 3.2], [16, 12, 2.4], [26, 7, 2.8], [62, 8, 2.6], [88, 9, 3.4], [93, 24, 2.4], [90, 34, 2.8],
  [6, 58, 3], [40, 60, 2.6], [48, 52, 2.2], [72, 34, 2.4], [30, 30, 2.8], [20, 22, 2.2], [86, 54, 2.2],
];

/** Implantação esquemática: os números dos marcadores são as chaves da lista ao lado. */
function SitePlan({ active, onHover }: { active: number | null; onHover: (i: number | null) => void }) {
  return (
    <svg viewBox="0 0 100 74" className="w-full" role="img" aria-label="Implantação do térreo com a localização das áreas comuns">
      <rect x="1" y="1" width="98" height="66" rx="1.5" fill="#262e46" stroke="rgba(255,255,255,0.25)" strokeWidth="0.3" />
      {TREES.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={i % 3 === 0 ? '#3f5547' : '#6e5ca4'} opacity="0.75" />
      ))}
      {/* piscina */}
      <rect x="11" y="47" width="23" height="6" rx="0.6" fill="#2f8796" />
      {/* torre */}
      <rect x="38" y="22" width="17" height="17" fill="#e7e2da" opacity="0.92" />
      <text x="46.5" y="31" textAnchor="middle" dominantBaseline="middle" fontSize="2.2" fill="#161c2a">Torre</text>
      {/* calçada / rua */}
      <rect x="1" y="67" width="98" height="6" fill="#1b2134" />
      <text x="50" y="70.4" textAnchor="middle" dominantBaseline="middle" fontSize="2.1" fill="rgba(255,255,255,0.55)">
        {project.location.address.replace(/,.*/, '')}
      </text>
      {amenities.map((a, i) => {
        const on = active === i;
        return (
          <g
            key={a.name}
            transform={`translate(${a.pos[0]} ${a.pos[1]})`}
            onMouseEnter={() => onHover(i)}
            onMouseLeave={() => onHover(null)}
            style={{ cursor: 'default' }}
          >
            <circle r={on ? 3.4 : 2.6} fill={on ? '#f0c48a' : '#f4f5f8'} style={{ transition: 'r 200ms, fill 200ms' }} />
            <text textAnchor="middle" dominantBaseline="central" fontSize="2.4" fill="#161c2a" className="tabular">
              {i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function Leisure() {
  const [active, setActive] = useState<number | null>(null);
  return (
    <section id="lazer" className="bg-ink px-5 py-24 text-white md:px-10 md:py-36 lg:px-14">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 md:grid-cols-[1.1fr_1fr] md:gap-20">
          <h2 className="font-display text-[2.9rem] leading-[1.02] md:text-[4.4rem]">O térreo é um jardim com piscina.</h2>
          <p className="max-w-[32rem] self-end text-[1.08rem] leading-[1.75] text-white/70">
            São 1.400 m² de áreas comuns, quase todas no nível da rua e voltadas para o jardim. A academia e o coworking
            ficam no anexo, com pé-direito duplo.
          </p>
        </div>

        <div className="mt-16 grid items-start gap-12 md:grid-cols-[1.25fr_1fr] md:gap-16">
          <SitePlan active={active} onHover={setActive} />
          <ol className="grid gap-1">
            {amenities.map((a, i) => (
              <li
                key={a.name}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                className={`grid grid-cols-[2rem_1fr] gap-x-3 rounded-xl px-3 py-3 transition-colors ${active === i ? 'bg-white/8' : ''}`}
              >
                <span
                  className={`tabular grid h-7 w-7 place-items-center rounded-full text-sm transition-colors ${
                    active === i ? 'bg-glow text-ink' : 'bg-white/90 text-ink'
                  }`}
                >
                  {i + 1}
                </span>
                <span>
                  <span className="block text-[1.05rem] leading-snug">{a.name}</span>
                  <span className="block text-sm text-white/60">{a.detail}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
