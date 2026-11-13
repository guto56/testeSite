import { NextResponse } from 'next/server';

/**
 * Recebe o formulário de contato.
 * Hoje só valida e responde OK — conecte aqui seu CRM, e-mail transacional ou planilha
 * (ex.: fetch para um webhook guardado em process.env.CONTACT_WEBHOOK_URL).
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Envie os dados em JSON.' }, { status: 400 });
  }

  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim();
  const phone = String(body.phone ?? '').trim();

  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = 'Informe seu nome.';
  if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Informe um e-mail válido.';
  if (phone.replace(/\D/g, '').length < 10) errors.phone = 'Informe um telefone com DDD.';
  if (Object.keys(errors).length) return NextResponse.json({ ok: false, errors }, { status: 422 });

  const webhook = process.env.CONTACT_WEBHOOK_URL;
  if (webhook) {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, interest: body.interest, message: body.message, at: new Date().toISOString() }),
    });
    if (!res.ok) return NextResponse.json({ ok: false, error: 'Não foi possível registrar agora.' }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
