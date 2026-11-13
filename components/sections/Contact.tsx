'use client';

import { useState } from 'react';
import { project, typologies } from '@/data/project';
import { whatsappLink } from '@/lib/whatsapp';
import { WhatsappIcon } from '@/components/ui/Icons';

type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent' } | { kind: 'error'; message: string };

const field =
  'mt-1.5 block w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 outline-none transition-colors focus:border-glow';

export function Contact() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    setStatus({ kind: 'sending' });
    setErrors({});
    try {
      const res = await fetch('/api/contato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.ok) {
        setStatus({ kind: 'sent' });
        (e.target as HTMLFormElement).reset();
      } else {
        if (json.errors) setErrors(json.errors);
        setStatus({ kind: 'error', message: json.error ?? 'Confira os campos destacados.' });
      }
    } catch {
      setStatus({ kind: 'error', message: 'Sem conexão. Tente de novo ou fale pelo WhatsApp.' });
    }
  }

  return (
    <section id="contato" className="bg-dusk px-5 py-24 text-white md:px-10 md:py-36 lg:px-14">
      <div className="mx-auto grid max-w-6xl gap-14 md:grid-cols-[1fr_1.2fr] md:gap-20">
        <div>
          <h2 className="font-display text-[2.9rem] leading-[1.02] md:text-[4.4rem]">Agende uma visita ao decorado.</h2>
          <p className="mt-6 max-w-[28rem] text-[1.08rem] leading-[1.75] text-white/70">{project.salesStand}</p>
          <a
            href={whatsappLink(`Olá! Quero agendar uma visita ao decorado do ${project.name}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-[#25d366] px-6 text-[0.98rem] font-medium text-[#062b16] transition-[filter] hover:brightness-105"
          >
            <WhatsappIcon className="h-5 w-5" />
            Agendar pelo WhatsApp
          </a>
          <dl className="mt-10 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[0.98rem]">
            <dt className="text-white/55">Telefone</dt>
            <dd>
              <a href={`tel:${project.phone.replace(/\D/g, '')}`} className="hover:text-glow">
                {project.phone}
              </a>
            </dd>
            <dt className="text-white/55">E-mail</dt>
            <dd>
              <a href={`mailto:${project.email}`} className="break-all hover:text-glow">
                {project.email}
              </a>
            </dd>
          </dl>
        </div>

        <form onSubmit={onSubmit} noValidate className="grid gap-5 sm:grid-cols-2" aria-describedby="form-status">
          <label className="sm:col-span-2">
            <span className="text-sm text-white/75">Nome</span>
            <input name="name" autoComplete="name" required className={field} aria-invalid={!!errors.name} />
            {errors.name && <span className="mt-1 block text-sm text-[#f3a6a6]">{errors.name}</span>}
          </label>
          <label>
            <span className="text-sm text-white/75">E-mail</span>
            <input name="email" type="email" autoComplete="email" required className={field} aria-invalid={!!errors.email} />
            {errors.email && <span className="mt-1 block text-sm text-[#f3a6a6]">{errors.email}</span>}
          </label>
          <label>
            <span className="text-sm text-white/75">Telefone com DDD</span>
            <input name="phone" type="tel" autoComplete="tel" inputMode="tel" required className={field} aria-invalid={!!errors.phone} />
            {errors.phone && <span className="mt-1 block text-sm text-[#f3a6a6]">{errors.phone}</span>}
          </label>
          <label className="sm:col-span-2">
            <span className="text-sm text-white/75">Planta de interesse</span>
            <select name="interest" defaultValue="" className={`${field} appearance-none`}>
              <option value="" className="text-ink">Ainda não sei</option>
              {typologies.map((t) => (
                <option key={t.id} value={t.name} className="text-ink">
                  {t.name}, {t.areaM2} m²
                </option>
              ))}
            </select>
          </label>
          <label className="sm:col-span-2">
            <span className="text-sm text-white/75">Mensagem (opcional)</span>
            <textarea name="message" rows={4} className={`${field} resize-y`} />
          </label>
          <div className="flex flex-wrap items-center gap-5 sm:col-span-2">
            <button
              type="submit"
              disabled={status.kind === 'sending'}
              className="h-12 rounded-full bg-glow px-7 font-medium text-ink transition-[filter] hover:brightness-105 disabled:opacity-60"
            >
              {status.kind === 'sending' ? 'Enviando…' : 'Enviar contato'}
            </button>
            <p id="form-status" role="status" className="text-sm text-white/75">
              {status.kind === 'sent' && 'Contato enviado. Um consultor responde em até um dia útil.'}
              {status.kind === 'error' && status.message}
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
