/**
 * Tabela de apartamentos — edite livremente.
 *
 * - `id` é o número do apto (andar + final). Também é o nome que o modelo .glb
 *   deve usar para o mesh correspondente: `apt_<id>` (ex.: `apt_1203`).
 * - `unit` é a posição no andar: 1 = frente/oeste, 2 = frente/leste,
 *   3 = fundos/leste, 4 = fundos/oeste.
 * - `typologyId` aponta para uma planta em `data/project.ts` (typologies).
 * - `status`: 'disponivel' | 'reservado' | 'vendido'.
 * - `priceBRL` em reais, sem centavos.
 */

export type ApartmentStatus = 'disponivel' | 'reservado' | 'vendido';

export interface Apartment {
  id: string;
  floor: number;
  unit: 1 | 2 | 3 | 4;
  typologyId: 'A' | 'B' | 'C';
  areaM2: number;
  bedrooms: number;
  suites: number;
  parking: number;
  priceBRL: number;
  status: ApartmentStatus;
}

export const STATUS_LABEL: Record<ApartmentStatus, string> = {
  disponivel: 'Disponível',
  reservado: 'Reservado',
  vendido: 'Vendido',
};

/** Cores de status — usadas no 3D e na legenda. */
export const STATUS_COLOR: Record<ApartmentStatus, string> = {
  disponivel: '#8CC7A5',
  reservado: '#E3B867',
  vendido: '#B97884',
};

export const FLOORS = 12;
export const UNITS_PER_FLOOR = 4;

export const apartments: Apartment[] = [
  { id: '101', floor: 1, unit: 1, typologyId: 'A', areaM2: 138, bedrooms: 3, suites: 3, parking: 3, priceBRL: 2898000, status: 'vendido' },
  { id: '102', floor: 1, unit: 2, typologyId: 'B', areaM2: 104, bedrooms: 3, suites: 1, parking: 2, priceBRL: 2059000, status: 'disponivel' },
  { id: '103', floor: 1, unit: 3, typologyId: 'B', areaM2: 104, bedrooms: 3, suites: 1, parking: 2, priceBRL: 2059000, status: 'vendido' },
  { id: '104', floor: 1, unit: 4, typologyId: 'A', areaM2: 138, bedrooms: 3, suites: 3, parking: 3, priceBRL: 2898000, status: 'vendido' },
  { id: '201', floor: 2, unit: 1, typologyId: 'A', areaM2: 138, bedrooms: 3, suites: 3, parking: 3, priceBRL: 2933000, status: 'disponivel' },
  { id: '202', floor: 2, unit: 2, typologyId: 'B', areaM2: 104, bedrooms: 3, suites: 1, parking: 2, priceBRL: 2084000, status: 'reservado' },
  { id: '203', floor: 2, unit: 3, typologyId: 'B', areaM2: 104, bedrooms: 3, suites: 1, parking: 2, priceBRL: 2084000, status: 'vendido' },
  { id: '204', floor: 2, unit: 4, typologyId: 'A', areaM2: 138, bedrooms: 3, suites: 3, parking: 3, priceBRL: 2933000, status: 'disponivel' },
  { id: '301', floor: 3, unit: 1, typologyId: 'A', areaM2: 138, bedrooms: 3, suites: 3, parking: 3, priceBRL: 2968000, status: 'disponivel' },
  { id: '302', floor: 3, unit: 2, typologyId: 'B', areaM2: 104, bedrooms: 3, suites: 1, parking: 2, priceBRL: 2109000, status: 'reservado' },
  { id: '303', floor: 3, unit: 3, typologyId: 'B', areaM2: 104, bedrooms: 3, suites: 1, parking: 2, priceBRL: 2109000, status: 'disponivel' },
  { id: '304', floor: 3, unit: 4, typologyId: 'A', areaM2: 138, bedrooms: 3, suites: 3, parking: 3, priceBRL: 2968000, status: 'disponivel' },
  { id: '401', floor: 4, unit: 1, typologyId: 'A', areaM2: 138, bedrooms: 3, suites: 3, parking: 3, priceBRL: 3002000, status: 'disponivel' },
  { id: '402', floor: 4, unit: 2, typologyId: 'B', areaM2: 104, bedrooms: 3, suites: 1, parking: 2, priceBRL: 2133000, status: 'vendido' },
  { id: '403', floor: 4, unit: 3, typologyId: 'B', areaM2: 104, bedrooms: 3, suites: 1, parking: 2, priceBRL: 2133000, status: 'vendido' },
  { id: '404', floor: 4, unit: 4, typologyId: 'A', areaM2: 138, bedrooms: 3, suites: 3, parking: 3, priceBRL: 3002000, status: 'disponivel' },
  { id: '501', floor: 5, unit: 1, typologyId: 'A', areaM2: 138, bedrooms: 3, suites: 3, parking: 3, priceBRL: 3037000, status: 'disponivel' },
  { id: '502', floor: 5, unit: 2, typologyId: 'B', areaM2: 104, bedrooms: 3, suites: 1, parking: 2, priceBRL: 2158000, status: 'vendido' },
  { id: '503', floor: 5, unit: 3, typologyId: 'B', areaM2: 104, bedrooms: 3, suites: 1, parking: 2, priceBRL: 2158000, status: 'disponivel' },
  { id: '504', floor: 5, unit: 4, typologyId: 'A', areaM2: 138, bedrooms: 3, suites: 3, parking: 3, priceBRL: 3037000, status: 'disponivel' },
  { id: '601', floor: 6, unit: 1, typologyId: 'A', areaM2: 138, bedrooms: 3, suites: 3, parking: 3, priceBRL: 3072000, status: 'disponivel' },
  { id: '602', floor: 6, unit: 2, typologyId: 'B', areaM2: 104, bedrooms: 3, suites: 1, parking: 2, priceBRL: 2183000, status: 'disponivel' },
  { id: '603', floor: 6, unit: 3, typologyId: 'B', areaM2: 104, bedrooms: 3, suites: 1, parking: 2, priceBRL: 2183000, status: 'vendido' },
  { id: '604', floor: 6, unit: 4, typologyId: 'A', areaM2: 138, bedrooms: 3, suites: 3, parking: 3, priceBRL: 3072000, status: 'disponivel' },
  { id: '701', floor: 7, unit: 1, typologyId: 'A', areaM2: 138, bedrooms: 3, suites: 3, parking: 3, priceBRL: 3107000, status: 'disponivel' },
  { id: '702', floor: 7, unit: 2, typologyId: 'B', areaM2: 104, bedrooms: 3, suites: 1, parking: 2, priceBRL: 2207000, status: 'disponivel' },
  { id: '703', floor: 7, unit: 3, typologyId: 'B', areaM2: 104, bedrooms: 3, suites: 1, parking: 2, priceBRL: 2207000, status: 'disponivel' },
  { id: '704', floor: 7, unit: 4, typologyId: 'A', areaM2: 138, bedrooms: 3, suites: 3, parking: 3, priceBRL: 3107000, status: 'disponivel' },
  { id: '801', floor: 8, unit: 1, typologyId: 'A', areaM2: 138, bedrooms: 3, suites: 3, parking: 3, priceBRL: 3141000, status: 'disponivel' },
  { id: '802', floor: 8, unit: 2, typologyId: 'B', areaM2: 104, bedrooms: 3, suites: 1, parking: 2, priceBRL: 2232000, status: 'disponivel' },
  { id: '803', floor: 8, unit: 3, typologyId: 'B', areaM2: 104, bedrooms: 3, suites: 1, parking: 2, priceBRL: 2232000, status: 'reservado' },
  { id: '804', floor: 8, unit: 4, typologyId: 'A', areaM2: 138, bedrooms: 3, suites: 3, parking: 3, priceBRL: 3141000, status: 'reservado' },
  { id: '901', floor: 9, unit: 1, typologyId: 'A', areaM2: 138, bedrooms: 3, suites: 3, parking: 3, priceBRL: 3176000, status: 'disponivel' },
  { id: '902', floor: 9, unit: 2, typologyId: 'B', areaM2: 104, bedrooms: 3, suites: 1, parking: 2, priceBRL: 2257000, status: 'reservado' },
  { id: '903', floor: 9, unit: 3, typologyId: 'B', areaM2: 104, bedrooms: 3, suites: 1, parking: 2, priceBRL: 2257000, status: 'vendido' },
  { id: '904', floor: 9, unit: 4, typologyId: 'A', areaM2: 138, bedrooms: 3, suites: 3, parking: 3, priceBRL: 3176000, status: 'reservado' },
  { id: '1001', floor: 10, unit: 1, typologyId: 'A', areaM2: 138, bedrooms: 3, suites: 3, parking: 3, priceBRL: 3211000, status: 'disponivel' },
  { id: '1002', floor: 10, unit: 2, typologyId: 'B', areaM2: 104, bedrooms: 3, suites: 1, parking: 2, priceBRL: 2282000, status: 'reservado' },
  { id: '1003', floor: 10, unit: 3, typologyId: 'B', areaM2: 104, bedrooms: 3, suites: 1, parking: 2, priceBRL: 2282000, status: 'disponivel' },
  { id: '1004', floor: 10, unit: 4, typologyId: 'A', areaM2: 138, bedrooms: 3, suites: 3, parking: 3, priceBRL: 3211000, status: 'disponivel' },
  { id: '1101', floor: 11, unit: 1, typologyId: 'A', areaM2: 138, bedrooms: 3, suites: 3, parking: 3, priceBRL: 3246000, status: 'disponivel' },
  { id: '1102', floor: 11, unit: 2, typologyId: 'B', areaM2: 104, bedrooms: 3, suites: 1, parking: 2, priceBRL: 2306000, status: 'disponivel' },
  { id: '1103', floor: 11, unit: 3, typologyId: 'B', areaM2: 104, bedrooms: 3, suites: 1, parking: 2, priceBRL: 2306000, status: 'vendido' },
  { id: '1104', floor: 11, unit: 4, typologyId: 'A', areaM2: 138, bedrooms: 3, suites: 3, parking: 3, priceBRL: 3246000, status: 'reservado' },
  { id: '1201', floor: 12, unit: 1, typologyId: 'C', areaM2: 176, bedrooms: 4, suites: 4, parking: 4, priceBRL: 5080000, status: 'disponivel' },
  { id: '1202', floor: 12, unit: 2, typologyId: 'C', areaM2: 176, bedrooms: 4, suites: 4, parking: 4, priceBRL: 5080000, status: 'disponivel' },
  { id: '1203', floor: 12, unit: 3, typologyId: 'C', areaM2: 176, bedrooms: 4, suites: 4, parking: 4, priceBRL: 5080000, status: 'disponivel' },
  { id: '1204', floor: 12, unit: 4, typologyId: 'C', areaM2: 176, bedrooms: 4, suites: 4, parking: 4, priceBRL: 5080000, status: 'reservado' },
];

export const apartmentsById: Record<string, Apartment> = Object.fromEntries(
  apartments.map((a) => [a.id, a]),
);

export function apartmentsOnFloor(floor: number): Apartment[] {
  return apartments.filter((a) => a.floor === floor).sort((a, b) => a.unit - b.unit);
}

export const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
