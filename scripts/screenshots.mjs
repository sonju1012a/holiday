// 콘솔 스크린샷 자동 생성 — 사용법: npm run dev:toss (포트 5198) 를 띄운 뒤 npm run screenshots
// 세로 636x1048 5장(v1~v5) + 가로 1504x741 1장(h1) 을 console-assets/screenshots/ 에 저장합니다.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../console-assets/screenshots/', import.meta.url));
fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://localhost:5198/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

async function makePage(w, h) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: w < 700, hasTouch: w < 700 });
  const page = await ctx.newPage();
  // main.js 를 가로채 게임 객체를 window 에 노출 (스크린샷 자동 진행용, 배포 코드 변경 없음)
  await page.route('**/src/main.js', async (route) => {
    const res = await route.fetch();
    let body = await res.text();
    body = body.replace("const game = new Game(world, ui, shop, sfx);",
      "const game = new Game(world, ui, shop, sfx);\nwindow.__charye = { game, world, ui, shop };");
    if (!body.includes('window.__charye')) throw new Error('inject failed');
    await route.fulfill({ response: res, body, headers: { ...res.headers(), 'content-type': 'application/javascript' } });
  });
  page.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await sleep(1200);
  return { ctx, page };
}

// 월드 좌표를 NDC 로 투영해 클릭 처리
const clickWorld = async (page, x, y, z) => page.evaluate(([x, y, z]) => {
  const { game, world } = window.__charye;
  const v = world.camera.position.clone().set(x, y, z).project(world.camera);
  game.pointerNdc.set(v.x, v.y);
  game._onClick();
}, [x, y, z]);

const clickCard = async (page, id) => page.evaluate((id) => { const c = window.__charye.ui.cards[id]; if (!c) throw new Error('no card ' + id); c.click(); }, id);

async function playSetup(page) {
  const steps = await page.evaluate(() => window.__charye.game.setupSteps.map((s) => ({ id: s.id, pos: s.pos })));
  for (const s of steps) {
    await clickCard(page, s.id); await sleep(350);
    await clickWorld(page, ...s.pos); await sleep(1100);
  }
}

async function playRows(page, { stopAtRow = Infinity } = {}) {
  const plan = await page.evaluate(() => {
    const { game } = window.__charye;
    const slotOf = Object.fromEntries(game.trayItems.map((t) => [t.id, t.slot]));
    return game.rows.map((r) => ({
      row: r.row, z: r.z, free: game.mode.free,
      slots: r.slots.map((s) => ({ id: s.id, x: s.x })),
      items: r.items.map((id) => ({ id, slot: slotOf[id] })),
      tableY: 0.82, cz: -0.9,
    }));
  });
  for (const r of plan) {
    if (r.row > stopAtRow) return;
    const used = new Set();
    for (const slot of r.slots) {
      const it = r.free ? r.items.find((i) => !used.has(i.id)) : r.items.find((i) => i.slot === slot.id && !used.has(i.id));
      if (!it) continue;
      used.add(it.id);
      await clickCard(page, it.id); await sleep(250);
      await clickWorld(page, slot.x, r.tableY, r.cz + r.z); await sleep(450);
    }
    await sleep(1600); // 열 클리어 연출 + 카메라 이동
  }
}

// ---------- 세로 636x1048 ----------
{
  const { ctx, page } = await makePage(636, 1048);
  await page.screenshot({ path: `${OUT}/v1-intro.png` });

  await page.click('.mode-btn[data-mode="trad"]'); await sleep(1800);
  await page.screenshot({ path: `${OUT}/v2-setup.png` });

  await playSetup(page); await sleep(1500);
  await playRows(page, { stopAtRow: 2 }); await sleep(800);
  // 3열 진설 중 — 첫 카드 선택해서 고스트 보이게
  await page.evaluate(() => { const c = Object.values(window.__charye.ui.cards)[0]; c && c.click(); }); await sleep(600);
  await page.screenshot({ path: `${OUT}/v3-food.png` });

  await page.evaluate(() => { window.__charye.game.selectedId = null; window.__charye.game._clearGhost(); window.__charye.ui.markSelected(null); });
  await playRows(page); await sleep(3200);
  await page.screenshot({ path: `${OUT}/v4-complete.png` });

  // 규칙 도감
  await page.evaluate(() => document.getElementById('modal-complete').classList.add('hidden'));
  await page.click('#btn-rules'); await sleep(500);
  await page.screenshot({ path: `${OUT}/v5-rules.png` });
  await ctx.close();
}

// ---------- 가로 1504x741 : 완성된 상 전체 ----------
{
  const { ctx, page } = await makePage(1504, 741);
  await page.click('.mode-btn[data-mode="trad"]'); await sleep(1500);
  await playSetup(page); await sleep(1200);
  await playRows(page); await sleep(3000);
  await page.evaluate(() => document.getElementById('modal-complete').classList.add('hidden'));
  await sleep(800);
  await page.screenshot({ path: `${OUT}/h1-table.png` });
  await ctx.close();
}
await browser.close();
console.log('done');
