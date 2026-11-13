// Gera o literal de data/apartments.ts (rode: node scripts/generate-apartments.mjs > /tmp/out.ts)
// Depois de gerado, edite data/apartments.ts diretamente — este script é só um ponto de partida.
const typ = {
  A: { area: 138, bedrooms: 3, suites: 3, parking: 3, m2: 21000 },
  B: { area: 104, bedrooms: 3, suites: 1, parking: 2, m2: 19800 },
  C: { area: 176, bedrooms: 4, suites: 4, parking: 4, m2: 25500 },
};
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const rows = [];
for (let floor = 1; floor <= 12; floor++) {
  for (let unit = 1; unit <= 4; unit++) {
    const t = floor === 12 ? 'C' : unit === 1 || unit === 4 ? 'A' : 'B';
    const T = typ[t];
    const price = Math.round((T.area * T.m2 * (1 + 0.012 * (floor - 1))) / 1000) * 1000;
    const soldBias = floor <= 4 ? 0.45 : floor >= 10 ? 0.15 : 0.28;
    const r = rnd();
    const status = r < soldBias ? 'vendido' : r < soldBias + 0.16 ? 'reservado' : 'disponivel';
    const id = `${floor}${String(unit).padStart(2, '0')}`;
    rows.push(`  { id: '${id}', floor: ${floor}, unit: ${unit}, typologyId: '${t}', areaM2: ${T.area}, bedrooms: ${T.bedrooms}, suites: ${T.suites}, parking: ${T.parking}, priceBRL: ${price}, status: '${status}' },`);
  }
}
console.log(rows.join('\n'));
