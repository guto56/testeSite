# Jacarandá Pinheiros: site de lançamento com prédio 3D

Site de lançamento imobiliário com um prédio 3D interativo no hero. São 12 andares e 4 apartamentos por andar, cada um clicável, com voo de câmera, modo raio-X, painel de detalhes, seletor de andares e cores por status.

**Stack:** Next.js 16 (App Router), TypeScript, Tailwind 4, React Three Fiber 9, drei, @react-three/postprocessing, GSAP 3 com `useGSAP` e Zustand. O projeto está pronto para deploy na Vercel.

---

## Como rodar

Requisito: Node 20 ou mais recente.

```bash
npm install
```

```bash
npm run dev
```

Depois abra http://localhost:3000.

Build de produção:

```bash
npm run build
```

```bash
npm run start
```

### Deploy na Vercel

Importe o repositório na Vercel. Não precisa de nenhuma configuração extra porque o framework é detectado automaticamente. A única variável de ambiente é opcional:

| Variável | Para quê |
| --- | --- |
| `CONTACT_WEBHOOK_URL` | Se estiver definida, `POST /api/contato` repassa o lead para essa URL (CRM, n8n, Zapier, planilha…). Sem ela, a rota só valida o formulário e responde OK. |

---

## Onde editar o conteúdo

| O quê | Arquivo |
| --- | --- |
| Apartamentos (nº, andar, área, quartos, suítes, vagas, preço, status) | `data/apartments.ts` |
| Cores e rótulos de status | `data/apartments.ts` (`STATUS_COLOR`, `STATUS_LABEL`) |
| Nome, textos, WhatsApp, telefone, e-mail, endereço e coordenadas do mapa | `data/project.ts` (`project`) |
| Destaques da seção "O empreendimento" | `data/project.ts` (`highlights`, `stats`) |
| Plantas: cômodos, medidas e descrição | `data/project.ts` (`typologies`) |
| Áreas de lazer e a posição de cada marcador na implantação | `data/project.ts` (`amenities`) |
| Paleta e fontes | `app/globals.css` (`@theme`) e `app/layout.tsx` |

### Apartamentos

Cada linha de `data/apartments.ts` é um apartamento:

```ts
{ id: '1203', floor: 12, unit: 3, typologyId: 'C', areaM2: 176, bedrooms: 4, suites: 4, parking: 4, priceBRL: 4785000, status: 'disponivel' },
```

- `status` aceita `'disponivel'`, `'reservado'` ou `'vendido'`. A cor no 3D, a legenda e as contagens se atualizam sozinhas.
- `unit` é a posição no andar: 1 = frente/oeste, 2 = frente/leste, 3 = fundos/leste, 4 = fundos/oeste.
- `typologyId` aponta para uma planta em `data/project.ts`.

A lista inicial foi gerada por `scripts/generate-apartments.mjs`. Daqui em diante, edite `data/apartments.ts` diretamente.

### Plantas

Os cômodos são retângulos em metros, no formato `[x, y, largura, altura]`, com origem no canto superior esquerdo. O SVG da planta (`components/ui/FloorPlan.tsx`) é desenhado a partir desses números, tanto no card da seção quanto no modal "Ver planta". Para usar a planta real em imagem, troque `<FloorPlan>` por um `<Image>` nesses dois lugares.

---

## Trocando o prédio procedural por um modelo .glb

O prédio procedural (`components/three/ProceduralBuilding.tsx`) e o adaptador de .glb (`components/three/GlbBuilding.tsx`) alimentam os mesmos registros:

- `anchorRegistry` (`lib/layout.ts`): centro, tamanho e direção "para fora" de cada apto. A câmera usa isso para calcular o voo.
- `unitVisuals` e `structureMaterials` (`lib/visualRegistry.ts`): os materiais que os efeitos de hover, raio-X e destaque de andar animam.

Por isso, a câmera, o painel, o hover e o raio-X funcionam igual com qualquer uma das duas fontes.

### Passo a passo

1. Exporte o modelo em **metros**, com o **chão em y = 0** e a **torre centrada na origem**.
2. Dê a cada apartamento um mesh chamado **`apt_<id>`**, usando o mesmo id de `data/apartments.ts` (por exemplo `apt_101` ou `apt_1203`). Se o apto for um grupo, o nome vai no mesh que deve ser clicável.
3. Todo o resto (lajes, fachada, cobertura, térreo) vira "estrutura" automaticamente e entra no modo raio-X.
4. Opcional: se a câmera deve olhar o apto de uma direção diferente de "para fora do eixo da torre", adicione em *Custom Properties* (extras do glTF) um `facing: [x, z]`, por exemplo `[0, 1]` para olhar pela frente.
5. Coloque o arquivo em `public/models/predio.glb`. Compressão Draco ou Meshopt é recomendada; `useGLTF` do drei decodifica as duas.
6. Em `lib/buildingConfig.ts`:

   ```ts
   export const BUILDING_MODEL_URL: string | null = '/models/predio.glb';
   ```

Com isso, o prédio procedural sai e o modelo entra. O chão, o céu, o entorno e a iluminação continuam vindo de `components/three/World.tsx`. Se o modelo já tiver entorno próprio, remova `<Surroundings />` de lá.

Se a torre do modelo tiver outra largura, ajuste `SAFE_RADIUS` em `lib/layout.ts`. Ele é o raio mínimo, a partir do eixo da torre, que a câmera pode ocupar durante os voos. Use a meia-diagonal da planta mais as varandas, com alguns metros de folga.

---

## Como a câmera funciona

`components/three/CameraRig.tsx` é o **único dono da câmera**:

- **Durante um voo**, uma timeline GSAP (`power3.inOut`, 1,4 s) anima juntos a posição da câmera, o alvo (*target*), o FOV e o deslocamento de enquadramento. O `useFrame` faz uma única escrita na câmera por quadro, e o OrbitControls fica desligado.
- **A posição é interpolada em coordenadas cilíndricas** (ângulo, raio e altura) em volta do eixo da torre, e não em linha reta. Assim o raio nunca fica menor que o das duas pontas do voo, e a câmera contorna o prédio em vez de atravessá-lo, inclusive ao ir de um apto da frente para um dos fundos.
- **Parada**, a câmera é controlada pelo OrbitControls, com limites por modo: no apto, ±45° em volta da fachada; zoom desligado para a roda do mouse continuar rolando a página. Ao pousar, a inércia do controle é zerada para que ele não "puxe" a câmera.
- **Interrupções** (clicar em outro apto, Esc, seletor de andar, resize) matam a timeline e partem da pose **atual**. Nada fica enfileirado e nada trava. No resize no meio do voo, o destino é recalculado com o tempo que faltava.
- **Enquadramento:** `camera.setViewOffset` desloca a imagem para abrir espaço para o painel lateral (desktop) ou o bottom sheet (mobile). O picking continua correto porque o raycaster usa a mesma projeção.
- **Reduced motion:** com `prefers-reduced-motion`, os voos duram 0,45 s, a abertura não tem voo e as transições de UI ficam curtas.

As poses (visão geral, andar e apto, em desktop e mobile) ficam em `lib/cameraPoses.ts`.

## Performance

- `frameloop="demand"`: a cena só renderiza quando algo muda (GSAP, OrbitControls ou hover chamam `invalidate()`).
- DPR limitado (`[1, 1.75]` no desktop e `[1, 1.5]` no mobile), sem MSAA no mobile e shadow map menor no mobile.
- Estrutura, brises, varandas, árvores, postes e entorno são `InstancedMesh`. Só os 48 apartamentos são meshes separados, porque precisam de picking e de material próprio.
- Materiais animáveis ficam sempre `transparent: true` e a luz de destaque fica sempre montada, para não recompilar shaders no meio da interação. Os shaders são pré-compilados (`gl.compileAsync`) antes de o loader sair.
- Texturas de fachada são geradas em canvas uma única vez e compartilhadas. Geometrias e materiais são descartados (`dispose`) ao desmontar.

---

## Testes

`tests/e2e_building.py` (Playwright, Python) valida:

- carregamento, hover, tooltip e cursor;
- clique, voo e painel;
- troca direta de apto e Esc no meio do voo;
- seletor de andar e uma rajada de interrupções seguidas de resize;
- rolagem da página sobre o 3D e reduced motion;
- mobile: toque, bottom sheet, modal da planta e rolagem por toque.

```bash
pip install playwright && python -m playwright install chromium
```

```bash
npm run build
```

```bash
python .claude/skills/webapp-testing/scripts/with_server.py --server "npm run start -- -p 3100" --port 3100 -- python tests/e2e_building.py
```

O `#stage` expõe o estado em `data-*` (`data-mode`, `data-selected`, `data-floor`, `data-flying`, `data-ready`), o que é útil para testes e analytics.

## Estrutura

```
app/                      layout, página, globals.css, /api/contato
components/three/         Canvas, câmera, prédio procedural, adaptador .glb, efeitos, entorno
components/ui/            painel/bottom sheet, seletor de andares, legenda, modal da planta…
components/sections/      hero e seções da página
data/                     apartments.ts e project.ts (conteúdo editável)
lib/                      layout do prédio, poses de câmera, motion, registros
store/useSiteStore.ts     estado global (apto selecionado, andar, filtros, hover)
```
