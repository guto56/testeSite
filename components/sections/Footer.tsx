import { project } from '@/data/project';

export function Footer() {
  return (
    <footer className="bg-ink px-5 pt-16 pb-24 text-white/60 md:px-10 lg:px-14">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-display text-4xl text-white">{project.name}</p>
          <p className="mt-2 text-sm">Uma realização {project.developer}</p>
        </div>
        <nav aria-label="Rodapé" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <a href="#empreendimento" className="hover:text-white">O empreendimento</a>
          <a href="#plantas" className="hover:text-white">Plantas</a>
          <a href="#lazer" className="hover:text-white">Lazer</a>
          <a href="#localizacao" className="hover:text-white">Localização</a>
          <a href="#contato" className="hover:text-white">Contato</a>
        </nav>
      </div>
      <p className="mx-auto mt-12 max-w-6xl border-t border-white/10 pt-6 text-xs leading-relaxed text-white/45">{project.legal}</p>
    </footer>
  );
}
