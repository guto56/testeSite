'use client';

export const EASE_FLIGHT = 'power3.inOut';

export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Duração do voo da câmera. Com reduced motion fica curta, mas nunca é um corte seco. */
export function flightDuration() {
  return prefersReducedMotion() ? 0.45 : 1.4;
}

/** Duração de transições de UI/materiais. */
export function uiDuration(base = 0.6) {
  return prefersReducedMotion() ? Math.min(0.2, base) : base;
}

export const MOBILE_QUERY = '(max-width: 767px)';

/** Coreografia da UI em relação ao voo da câmera (em segundos). */
export function choreography() {
  const flight = flightDuration();
  const reduced = prefersReducedMotion();
  return {
    flight,
    panelInDelay: reduced ? 0.05 : flight * 0.42,
    panelIn: reduced ? 0.2 : 0.85,
    panelOut: reduced ? 0.15 : 0.45,
    contentOut: reduced ? 0.1 : 0.18,
    contentInDelay: reduced ? 0 : flight * 0.38,
    contentIn: reduced ? 0.15 : 0.55,
  };
}
