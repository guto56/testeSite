import * as THREE from 'three';

/**
 * Texturas procedurais da fachada (uma "faixa" de andar com 6 painéis de vidro).
 * `map` desenha caixilhos, vidro e peitoril; `emissive` marca os painéis acesos.
 * São geradas uma única vez e compartilhadas por todos os apartamentos.
 */
let cache: { map: THREE.Texture; emissive: THREE.Texture[] } | null = null;

const W = 1024;
const H = 256;
const PANES = 6;

function makeCanvas() {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  return c;
}

function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export function getFacadeTextures(maxAnisotropy = 4) {
  if (cache) return cache;

  // --- map ---
  const c = makeCanvas();
  const g = c.getContext('2d')!;
  const sill = H * 0.16;
  g.fillStyle = '#3a3f4c';
  g.fillRect(0, 0, W, H);
  const pw = W / PANES;
  for (let i = 0; i < PANES; i++) {
    const x = i * pw;
    const grad = g.createLinearGradient(0, 0, 0, H - sill);
    grad.addColorStop(0, '#d9dde6');
    grad.addColorStop(0.55, '#9aa1b2');
    grad.addColorStop(1, '#c4c8d2');
    g.fillStyle = grad;
    g.fillRect(x + 7, 7, pw - 14, H - sill - 10);
    // travessa horizontal (bandeira)
    g.fillStyle = '#3a3f4c';
    g.fillRect(x + 7, H * 0.18, pw - 14, 5);
  }
  // peitoril
  g.fillStyle = '#e4e0d8';
  g.fillRect(0, H - sill, W, sill);
  g.fillStyle = 'rgba(0,0,0,0.18)';
  g.fillRect(0, H - sill, W, 4);

  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = maxAnisotropy;

  // --- emissive: 4 variações de janelas acesas ---
  const emissive: THREE.Texture[] = [];
  for (let v = 0; v < 4; v++) {
    const ec = makeCanvas();
    const eg = ec.getContext('2d')!;
    eg.fillStyle = '#000';
    eg.fillRect(0, 0, W, H);
    const r = rng(11 + v * 97);
    for (let i = 0; i < PANES; i++) {
      const on = r();
      if (on < 0.35) continue;
      const x = i * pw;
      const grad = eg.createLinearGradient(0, 0, 0, H - sill);
      const k = on > 0.75 ? 1 : 0.55;
      grad.addColorStop(0, `rgba(255,236,205,${0.55 * k})`);
      grad.addColorStop(1, `rgba(255,214,160,${1 * k})`);
      eg.fillStyle = grad;
      eg.fillRect(x + 7, 7, pw - 14, H - sill - 10);
    }
    const t = new THREE.CanvasTexture(ec);
    t.colorSpace = THREE.SRGBColorSpace;
    emissive.push(t);
  }

  cache = { map, emissive };
  return cache;
}
