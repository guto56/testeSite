"""
Validação end-to-end do hero 3D (Playwright, Python).

Uso (com a skill webapp-testing):
  npm run build
  python .claude/skills/webapp-testing/scripts/with_server.py \
      --server "npm run start -- -p 3100" --port 3100 -- python tests/e2e_building.py

Variáveis: BASE_URL (padrão http://localhost:3100), SHOTS (pasta das capturas), CHROMIUM (binário opcional).
"""
import os, sys, time
from playwright.sync_api import sync_playwright

BASE = os.environ.get('BASE_URL', 'http://localhost:3100')
SHOTS = os.environ.get('SHOTS', 'test-results')
CHROMIUM = os.environ.get('CHROMIUM')
ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
os.makedirs(SHOTS, exist_ok=True)

results = []
def check(name, ok, info=''):
    results.append((name, bool(ok), info))
    print(('PASS ' if ok else 'FAIL ') + name + (f'  [{info}]' if info else ''), flush=True)

def ds(pg, k): return pg.eval_on_selector('#stage', f'e => e.dataset.{k}')
def cam(pg): return pg.eval_on_selector('#stage canvas', 'e => e.dataset.camera')
def wait_ready(pg):
    pg.wait_for_function("document.querySelector('#stage')?.dataset.ready === 'true'", timeout=120000)
def wait_idle(pg, timeout=90000):
    pg.wait_for_function("document.querySelector('#stage').dataset.flying !== 'true'", timeout=timeout)
    pg.wait_for_timeout(400)
def in_viewport(pg, selector):
    return pg.evaluate(f"""(() => {{ const e=document.querySelector('{selector}'); if(!e) return false;
      const r=e.getBoundingClientRect(); const s=getComputedStyle(e);
      return s.visibility!=='hidden' && +s.opacity>0.9 && r.top < innerHeight-40 && r.bottom > 40 && r.left < innerWidth-40 && r.right > 40; }})()""")
def find_unit(pg, box, step=36):
    x0, x1, y0, y1 = box
    for y in range(y0, y1, step):
        for x in range(x0, x1, step):
            pg.mouse.move(x, y); pg.wait_for_timeout(90)
            if ds(pg, 'hovered'): return x, y
    return None

def launch(p):
    kw = {'headless': True, 'args': ARGS}
    if CHROMIUM: kw['executable_path'] = CHROMIUM
    return p.chromium.launch(**kw)

with sync_playwright() as p:
    browser = launch(p)

    # ---------------- desktop ----------------
    pg = browser.new_page(viewport={'width': 1440, 'height': 900})
    errors = []
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' and 'openstreetmap' not in m.text else None)
    pg.goto(BASE, wait_until='networkidle'); wait_ready(pg); wait_idle(pg)
    overview = cam(pg)
    check('cena carrega e loader sai', ds(pg, 'ready') == 'true' and overview, overview)
    pg.screenshot(path=f'{SHOTS}/d1-overview.png')

    pos = find_unit(pg, (850, 1180, 220, 700))
    check('hover destaca apto', pos is not None, ds(pg, 'hovered'))
    tip_ok = pg.locator('[role=tooltip]').inner_text().startswith('Apto')
    cursor = pg.eval_on_selector('#stage', 'e => e.style.cursor')
    check('tooltip com nº e status + cursor pointer', tip_ok and cursor == 'pointer', f'cursor={cursor}')
    pg.screenshot(path=f'{SHOTS}/d2-hover.png')

    hovered = ds(pg, 'hovered')
    pg.mouse.click(*pos); pg.wait_for_timeout(250)
    check('clique inicia voo da câmera', ds(pg, 'flying') == 'true' and ds(pg, 'selected') == hovered)
    t0 = time.time(); wait_idle(pg)
    unit_cam = cam(pg)
    check('câmera chega ao apto', unit_cam and unit_cam != overview, unit_cam)
    check('painel lateral aberto', in_viewport(pg, 'aside'))
    for label in ['Ver planta', 'Falar no WhatsApp']:
        check(f'painel tem "{label}"', pg.locator('aside').get_by_text(label).count() > 0)
    wa = pg.locator('aside a[href*="wa.me"]').get_attribute('href')
    check('link do WhatsApp com nº do apto', hovered in (wa or ''), wa[:60] if wa else '')
    pg.screenshot(path=f'{SHOTS}/d3-unit.png')

    # troca direta
    before = ds(pg, 'selected')
    pg.locator('aside ul button').nth(1).click(); pg.wait_for_timeout(200)
    other = ds(pg, 'selected')
    check('troca direta sem passar pela visão geral', other != before and ds(pg, 'mode') == 'unit')
    wait_idle(pg)
    check('chega no novo apto', cam(pg) not in (unit_cam, overview), cam(pg))
    pg.screenshot(path=f'{SHOTS}/d4-switch.png')

    # Esc no meio do voo
    pg.locator('aside ul button').first.click(); pg.wait_for_timeout(300)
    mid = ds(pg, 'flying') == 'true'
    pg.keyboard.press('Escape'); wait_idle(pg)
    check('Esc no meio do voo volta à visão geral', mid and ds(pg, 'mode') == 'overview' and cam(pg) == overview, cam(pg))
    pg.wait_for_timeout(800)
    check('painel fechado', not in_viewport(pg, 'aside'))

    # seletor de andar
    pg.get_by_role('button', name='7º andar', exact=True).click(); wait_idle(pg)
    check('seletor de andar enquadra o andar', ds(pg, 'mode') == 'floor' and ds(pg, 'floor') == '7')
    pg.screenshot(path=f'{SHOTS}/d5-floor.png')
    pg.locator('aside li button').nth(2).click(); wait_idle(pg)
    check('apto pela lista do andar', ds(pg, 'selected') == '703')

    # rajada de interrupções: andar -> apto -> resize -> Esc
    pg.get_by_role('button', name='2º andar', exact=True).click(); pg.wait_for_timeout(200)
    pg.locator('aside li button').first.click() if pg.locator('aside li button').count() else None
    pg.wait_for_timeout(200)
    pg.set_viewport_size({'width': 1280, 'height': 800}); pg.wait_for_timeout(250)
    pg.keyboard.press('Escape'); wait_idle(pg)
    check('interrupções em série não travam a câmera', ds(pg, 'mode') == 'overview' and ds(pg, 'flying') == 'false')
    # controles voltam a funcionar
    c1 = pg.eval_on_selector('#stage canvas', 'e => 1')
    pg.mouse.move(640, 400); pg.mouse.down(); pg.mouse.move(420, 420, steps=8); pg.mouse.up(); pg.wait_for_timeout(600)
    pos2 = find_unit(pg, (420, 1100, 150, 700))
    check('após voltar, hover/clique continuam funcionando', pos2 is not None)
    # rolagem da página com a roda sobre o canvas
    pg.mouse.move(700, 400); pg.mouse.wheel(0, 600); pg.wait_for_timeout(700)
    check('roda do mouse rola a página sobre o 3D', pg.evaluate('scrollY') > 300)
    check('sem erros no console (desktop)', not errors, '; '.join(errors[:3]))
    pg.close()

    # ---------------- reduced motion ----------------
    ctx = browser.new_context(viewport={'width': 1280, 'height': 800}, reduced_motion='reduce')
    rm = ctx.new_page(); rm.goto(BASE, wait_until='networkidle'); wait_ready(rm); wait_idle(rm)
    rm.get_by_role('button', name='5º andar', exact=True).click()
    t = time.time(); rm.wait_for_timeout(100); wait_idle(rm); dt = time.time() - t
    check('reduced motion: voo curto', ds(rm, 'mode') == 'floor', f'{dt:.2f}s (inclui 0,4s de espera)')
    ctx.close()

    # ---------------- mobile ----------------
    dev = {**p.devices['iPhone 13'], 'device_scale_factor': 1}
    mctx = browser.new_context(**dev)
    m = mctx.new_page(); merr = []
    m.on('pageerror', lambda e: merr.append(str(e)))
    m.goto(BASE, wait_until='networkidle'); wait_ready(m); wait_idle(m); m.wait_for_timeout(1500)
    sw = m.evaluate('[document.documentElement.scrollWidth, innerWidth]')
    check('mobile sem rolagem horizontal', sw[0] <= sw[1], str(sw))
    m.screenshot(path=f'{SHOTS}/m1-overview.png')
    hit = None
    for y in range(330, 600, 28):
        for x in range(110, 300, 28):
            m.touchscreen.tap(x, y); m.wait_for_timeout(200)
            if ds(m, 'selected'): hit = (x, y); break
        if hit: break
    check('toque seleciona apto', hit is not None, ds(m, 'selected'))
    wait_idle(m); m.wait_for_timeout(900)
    check('painel vira bottom sheet visível', in_viewport(m, 'aside'))
    box = m.locator('aside').bounding_box()
    check('bottom sheet ancorado embaixo', box and abs(box['y'] + box['height'] - m.viewport_size['height']) < 4, str(box))
    m.screenshot(path=f'{SHOTS}/m2-unit.png')
    m.get_by_role('button', name='Ver planta').click(); m.wait_for_timeout(700)
    check('modal da planta abre', m.locator('dialog[open]').count() == 1)
    m.screenshot(path=f'{SHOTS}/m3-plan.png')
    m.get_by_role('button', name='Fechar planta').click(); m.wait_for_timeout(500)
    m.get_by_role('button', name='Voltar à visão geral', exact=True).click(); wait_idle(m)
    check('voltar no mobile', ds(m, 'mode') == 'overview')
    cdp = mctx.new_cdp_session(m)
    cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': 200, 'y': 450}]})
    for i in range(1, 16):
        cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': 200, 'y': 450 - i * 25}]})
    cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
    m.wait_for_timeout(800)
    check('arrastar na vertical sobre o 3D rola a página', m.evaluate('scrollY') > 200, str(m.evaluate('scrollY')))
    check('sem erros no console (mobile)', not merr, '; '.join(merr[:3]))
    mctx.close()
    browser.close()

failed = [r for r in results if not r[1]]
print(f'\n{len(results) - len(failed)}/{len(results)} verificações passaram')
sys.exit(1 if failed else 0)
