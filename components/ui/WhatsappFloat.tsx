'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { selectViewMode, useSiteStore } from '@/store/useSiteStore';
import { project } from '@/data/project';
import { whatsappLink } from '@/lib/whatsapp';
import { WhatsappIcon } from './Icons';

/** Botão flutuante de WhatsApp. Sai de cena enquanto o painel do apto (que já tem o botão) está aberto. */
export function WhatsappFloat() {
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const el = ref.current;
    const update = (hide: boolean) => gsap.to(el, { autoAlpha: hide ? 0 : 1, scale: hide ? 0.8 : 1, duration: 0.3, overwrite: 'auto' });
    let hidden = false;
    let inHero = true;
    const sync = () => {
      const mode = selectViewMode(useSiteStore.getState());
      const hide = inHero && mode !== 'overview';
      if (hide !== hidden) {
        hidden = hide;
        update(hide);
      }
    };
    const unsub = useSiteStore.subscribe(sync);
    const hero = document.getElementById('inicio');
    const io = hero
      ? new IntersectionObserver(([entry]) => {
          inHero = entry.intersectionRatio > 0.4;
          sync();
        }, { threshold: [0, 0.4, 1] })
      : null;
    if (hero) io?.observe(hero);
    return () => {
      unsub();
      io?.disconnect();
    };
  }, []);

  return (
    <a
      ref={ref}
      href={whatsappLink(`Olá! Quero saber mais sobre o ${project.name}.`)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com um consultor no WhatsApp"
      className="fixed right-4 bottom-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25d366] text-white shadow-[0_12px_30px_-8px_rgba(9,60,30,0.6)] transition-transform hover:scale-105 md:right-6 md:bottom-6"
    >
      <WhatsappIcon className="h-7 w-7" />
    </a>
  );
}
