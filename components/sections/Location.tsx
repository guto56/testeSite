import { project } from '@/data/project';

export function Location() {
  const { lat, lng } = project.location;
  const d = 0.009;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d * 1.6}%2C${lat - d}%2C${lng + d * 1.6}%2C${lat + d}&layer=mapnik&marker=${lat}%2C${lng}`;
  const link = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <section id="localizacao" className="on-light bg-paper px-5 py-24 md:px-10 md:py-36 lg:px-14">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[1fr_1.35fr] md:gap-16">
        <div>
          <h2 className="font-display text-[2.9rem] leading-[1.02] md:text-[4.4rem]">Pinheiros, a pé.</h2>
          <address className="mt-6 not-italic text-[1.08rem] leading-relaxed text-ink/80">
            {project.location.address}
            <br />
            {project.location.district}
          </address>
          <ul className="mt-10 divide-y divide-line border-y border-line">
            {project.location.nearby.map((n) => (
              <li key={n.place} className="flex items-baseline justify-between gap-6 py-3.5">
                <span>{n.place}</span>
                <span className="tabular shrink-0 text-sm text-ink/60">{n.time}</span>
              </li>
            ))}
          </ul>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-block text-jacaranda-deep underline decoration-1 underline-offset-4 hover:decoration-2"
          >
            Abrir rota no Google Maps
          </a>
        </div>
        <div className="overflow-hidden rounded-[22px] bg-haze">
          <iframe
            title={`Mapa da localização do ${project.name}`}
            src={src}
            loading="lazy"
            className="block h-[380px] w-full border-0 grayscale-[0.85] contrast-[1.05] md:h-full md:min-h-[520px]"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}
