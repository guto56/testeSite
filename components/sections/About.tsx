import { Fragment } from 'react';
import { highlights, project, stats } from '@/data/project';

export function About() {
  return (
    <section id="empreendimento" className="on-light bg-paper px-5 py-24 md:px-10 md:py-36 lg:px-14">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[1.1fr_1fr] md:gap-20">
        <h2 className="font-display text-[2.9rem] leading-[1.02] md:text-[4.4rem]">Uma torre que vai de esquina em esquina.</h2>
        <div className="max-w-[34rem] text-[1.08rem] leading-[1.75] text-ink/80">
          <p>
            O {project.name} ocupa um terreno de esquina a três quadras do metrô. A torre tem só quatro apartamentos por
            andar, cada um num canto da planta, o que garante janelas em duas fachadas e nenhuma parede dividida com o
            vizinho de porta.
          </p>
          <p className="mt-5">
            No térreo, um jardim aberto preserva os jacarandás que já existiam no lote e dá nome ao prédio.{' '}
            {project.delivery}.
          </p>
        </div>
      </div>

      <p className="font-display tabular mx-auto mt-20 max-w-6xl text-[1.9rem] leading-snug text-jacaranda-deep md:mt-28 md:text-[2.6rem]">
        {stats.map((s, i) => (
          <Fragment key={s.label}>
            <span className="whitespace-nowrap">
              {s.value} {s.label}
              {i < stats.length - 1 ? ',' : '.'}
            </span>{' '}
          </Fragment>
        ))}
      </p>

      <div className="mx-auto mt-16 grid max-w-6xl gap-x-16 gap-y-12 border-t border-line pt-14 md:grid-cols-2">
        {highlights.map((h) => (
          <div key={h.title} className="max-w-[30rem]">
            <h3 className="text-[1.2rem] font-medium">{h.title}</h3>
            <p className="mt-2 leading-relaxed text-ink/70">{h.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
