/**
 * Dados do empreendimento — textos, plantas, lazer, localização e contato.
 * Tudo aqui é mockado e pode ser editado sem mexer nos componentes.
 */

export const project = {
  name: 'Jacarandá Pinheiros',
  shortName: 'Jacarandá',
  developer: 'Casa Viva Incorporadora',
  tagline: 'Doze andares abertos para o poente de Pinheiros.',
  intro:
    'Quarenta e oito apartamentos de 104 a 176 m², quatro por andar, todos com varanda gourmet e luz natural em duas fachadas.',
  delivery: 'Entrega prevista para dezembro de 2028',
  legal:
    'Incorporação registrada sob R.3 da matrícula nº 000.000 do 10º Oficial de Registro de Imóveis de São Paulo. Imagens e plantas ilustrativas, sujeitas a alteração. Valores de referência, válidos para novembro de 2026.',

  /** WhatsApp no formato internacional, só dígitos (55 + DDD + número). */
  whatsapp: '5511999999999',
  phone: '(11) 3000-0000',
  email: 'vendas@jacarandapinheiros.com.br',
  salesStand: 'Stand de vendas na própria obra, todos os dias das 10h às 19h.',

  location: {
    address: 'Rua Fradique Coutinho, 1200',
    district: 'Pinheiros, São Paulo — SP',
    lat: -23.5617,
    lng: -46.688,
    nearby: [
      { place: 'Estação Fradique Coutinho (Linha 4)', time: '6 min a pé' },
      { place: 'Praça Benedito Calixto', time: '9 min a pé' },
      { place: 'Largo da Batata', time: '12 min a pé' },
      { place: 'Parque Villa-Lobos', time: '10 min de carro' },
      { place: 'Avenida Faria Lima', time: '8 min de carro' },
    ],
  },
};

export const highlights = [
  {
    title: 'Quatro por andar',
    text: 'Cada apartamento ocupa uma esquina da torre. Nenhuma parede compartilhada com o vizinho de porta.',
  },
  {
    title: 'Fachada ventilada',
    text: 'Brises verticais em alumínio e vidro de controle solar reduzem o calor da tarde sem bloquear a vista.',
  },
  {
    title: 'Varanda gourmet',
    text: 'Churrasqueira a carvão, ponto de água e piso nivelado com a sala. De 14 a 38 m² dependendo da planta.',
  },
  {
    title: 'Térreo aberto',
    text: 'Um jardim de 1.400 m² com jacarandás adultos transplantados, aberto para a calçada até as 22h.',
  },
];

export const stats = [
  { value: '12', label: 'andares' },
  { value: '48', label: 'apartamentos' },
  { value: '104–176', label: 'm² privativos' },
  { value: '2028', label: 'entrega' },
];

/** Retângulo de cômodo em metros: [x, y, largura, altura] com origem no canto superior esquerdo. */
export interface Room {
  name: string;
  rect: [number, number, number, number];
  outdoor?: boolean;
}

export interface Typology {
  id: 'A' | 'B' | 'C';
  name: string;
  areaM2: number;
  bedrooms: number;
  suites: number;
  parking: number;
  description: string;
  units: string;
  width: number;
  depth: number;
  rooms: Room[];
}

export const typologies: Typology[] = [
  {
    id: 'A',
    name: 'Planta A',
    areaM2: 138,
    bedrooms: 3,
    suites: 3,
    parking: 3,
    units: 'Finais 01 e 04, do 1º ao 11º andar',
    description: 'Três suítes e sala integrada à varanda gourmet, voltada para o poente.',
    width: 12,
    depth: 11.5,
    rooms: [
      { name: 'Suíte master', rect: [0, 0, 4.6, 4.8] },
      { name: 'Suíte', rect: [4.6, 0, 3.7, 3.3] },
      { name: 'Suíte', rect: [8.3, 0, 3.7, 3.3] },
      { name: 'Banho', rect: [4.6, 3.3, 1.8, 1.5] },
      { name: 'Banho', rect: [6.4, 3.3, 1.9, 1.5] },
      { name: 'Circulação', rect: [8.3, 3.3, 3.7, 1.5] },
      { name: 'Estar e jantar', rect: [0, 4.8, 7.6, 5.1] },
      { name: 'Cozinha', rect: [7.6, 4.8, 4.4, 3.0] },
      { name: 'Serviço', rect: [7.6, 7.8, 2.4, 2.1] },
      { name: 'Lavabo', rect: [10, 7.8, 2, 2.1] },
      { name: 'Varanda gourmet', rect: [0, 9.9, 9, 1.6], outdoor: true },
    ],
  },
  {
    id: 'B',
    name: 'Planta B',
    areaM2: 104,
    bedrooms: 3,
    suites: 1,
    parking: 2,
    units: 'Finais 02 e 03, do 1º ao 11º andar',
    description: 'Três dormitórios com uma suíte, cozinha americana e luz da manhã.',
    width: 10.4,
    depth: 10.6,
    rooms: [
      { name: 'Suíte', rect: [0, 0, 4, 4.6] },
      { name: 'Quarto', rect: [4, 0, 3.2, 3.2] },
      { name: 'Quarto', rect: [7.2, 0, 3.2, 3.2] },
      { name: 'Banho', rect: [4, 3.2, 1.8, 1.4] },
      { name: 'Banho', rect: [5.8, 3.2, 1.6, 1.4] },
      { name: 'Circulação', rect: [7.4, 3.2, 3, 1.4] },
      { name: 'Estar e jantar', rect: [0, 4.6, 6.4, 4.4] },
      { name: 'Cozinha', rect: [6.4, 4.6, 4, 2.6] },
      { name: 'Serviço', rect: [6.4, 7.2, 4, 1.8] },
      { name: 'Varanda gourmet', rect: [0, 9, 7, 1.6], outdoor: true },
    ],
  },
  {
    id: 'C',
    name: 'Cobertura',
    areaM2: 176,
    bedrooms: 4,
    suites: 4,
    parking: 4,
    units: 'Os quatro apartamentos do 12º andar',
    description: 'Quatro suítes, pé-direito de 3,4 m e terraço com piscina privativa.',
    width: 13,
    depth: 13.5,
    rooms: [
      { name: 'Suíte master', rect: [0, 0, 5.4, 5] },
      { name: 'Suíte', rect: [5.4, 0, 3.8, 3.6] },
      { name: 'Suíte', rect: [9.2, 0, 3.8, 3.6] },
      { name: 'Banho', rect: [5.4, 3.6, 1.9, 1.4] },
      { name: 'Banho', rect: [7.3, 3.6, 1.9, 1.4] },
      { name: 'Suíte', rect: [9.2, 3.6, 3.8, 3.6] },
      { name: 'Estar e jantar', rect: [0, 5, 9.2, 5.6] },
      { name: 'Cozinha', rect: [9.2, 7.2, 3.8, 3.4] },
      { name: 'Terraço com piscina', rect: [0, 10.6, 13, 2.9], outdoor: true },
    ],
  },
];

export const typologiesById = Object.fromEntries(typologies.map((t) => [t.id, t])) as Record<
  Typology['id'],
  Typology
>;

/**
 * Áreas comuns. `pos` é a posição do marcador na implantação (0–100 em x, 0–70 em y).
 * O número exibido no mapa é a ordem nesta lista.
 */
export const amenities = [
  { name: 'Piscina com raia de 25 m', detail: 'Aquecida, com deck de madeira e solário', pos: [22, 50] },
  { name: 'Spa e sauna', detail: 'Sauna seca, ofurô e sala de massagem', pos: [12, 34] },
  { name: 'Academia', detail: '180 m² com pé-direito duplo voltado ao jardim', pos: [74, 18] },
  { name: 'Salão de festas', detail: 'Cozinha de apoio e terraço coberto', pos: [80, 46] },
  { name: 'Espaço gourmet', detail: 'Forno de pizza e churrasqueira para 20 pessoas', pos: [64, 58] },
  { name: 'Brinquedoteca', detail: 'Com acesso direto ao playground', pos: [36, 16] },
  { name: 'Coworking', detail: 'Quatro salas de reunião e cabines de chamada', pos: [56, 32] },
  { name: 'Pet place', detail: 'Área cercada com bebedouro e ducha', pos: [90, 62] },
] as const;
