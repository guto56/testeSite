import type { Typology } from '@/data/project';

const fmt = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

/** Planta esquemática desenhada a partir de `typology.rooms` (metros). */
export function FloorPlan({ typology, className = '' }: { typology: Typology; className?: string }) {
  const pad = 0.6;
  const vbW = typology.width + pad * 2;
  const vbH = typology.depth + pad * 2;
  const id = `hatch-${typology.id}`;
  const indoorDepth = Math.max(...typology.rooms.filter((r) => !r.outdoor).map((r) => r.rect[1] + r.rect[3]));
  return (
    <svg
      viewBox={`${-pad} ${-pad} ${vbW} ${vbH}`}
      className={className}
      role="img"
      aria-label={`Planta ${typology.name}, ${typology.areaM2} m², ${typology.bedrooms} quartos sendo ${typology.suites} suítes`}
    >
      <defs>
        <pattern id={id} width="0.35" height="0.35" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="0.35" stroke="currentColor" strokeWidth="0.03" opacity="0.35" />
        </pattern>
      </defs>
      {typology.rooms.map((room, i) => {
        const [x, y, w, h] = room.rect;
        const small = w < 2.6 || h < 2;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill={room.outdoor ? `url(#${id})` : 'transparent'}
              stroke="currentColor"
              strokeWidth={0.09}
            />
            <text
              x={x + w / 2}
              y={y + h / 2 - (small ? 0 : 0.18)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={small ? 0.32 : 0.42}
              fill="currentColor"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              {room.name}
            </text>
            {!small && (
              <text
                x={x + w / 2}
                y={y + h / 2 + 0.38}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={0.3}
                fill="currentColor"
                opacity={0.6}
                className="tabular"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                {fmt(w)} × {fmt(h)} m
              </text>
            )}
          </g>
        );
      })}
      {/* paredes externas (só da área fechada; a varanda/terraço fica para fora) */}
      <rect x={0} y={0} width={typology.width} height={indoorDepth} fill="none" stroke="currentColor" strokeWidth={0.22} />
    </svg>
  );
}
