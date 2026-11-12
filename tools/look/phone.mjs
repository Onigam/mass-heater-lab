#!/usr/bin/env node
// phone.mjs: what a material pass costs a visitor on a phone. The served lab in a 390 x 844 viewport at a pixel ratio of 3, the CPU
// slowed four times (Chrome's own throttle): the time from the page's start to the first world drawn, then per world the time of a
// frame (60 frames, the kit's own loop) and what the renderer holds (textures, geometries, programs, draw calls, triangles).
// A Mac's GPU is not a phone's: the frame times compare a before with an after, they are not a phone's frame rate.
//   ~/Dev/onigam-video/tools/with-chrome-lock.sh node tools/look/phone.mjs --url http://localhost:5932/ [--throttle 4] [--json out.json]
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(`${process.env.HOME}/.cache/lab-review/`);
const puppeteer = require('puppeteer-core');
const argv = process.argv.slice(2);
const opt = (n, d = null) => (argv.includes(`--${n}`) ? argv[argv.indexOf(`--${n}`) + 1] : d);
const CHROME =
  process.env.CHROME ??
  `${process.env.HOME}/.cache/puppeteer/chrome/mac_arm-154.0.8037.57/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: [
    '--use-gl=angle',
    '--use-angle=metal',
    '--enable-gpu',
    '--ignore-gpu-blocklist',
    '--hide-scrollbars',
    '--mute-audio',
  ],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const cdp = await page.createCDPSession();
await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(opt('throttle', 4)) });
const errors = [];
page.on('console', (m) =>
  m.type() === 'error' && !m.text().includes('403') ? errors.push(m.text().slice(0, 400)) : 0,
);
// a first load warms Vite's transforms, so that the second measures the page and not the dev server
await page.goto(opt('url', 'http://localhost:5932/'), { waitUntil: 'networkidle2' });
await page.waitForFunction(() => window.__lab?.stage, { timeout: 120000 });
const t0 = Date.now();
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__lab?.stage?.renderer?.info?.render?.frame > 2, {
  timeout: 120000,
  polling: 16,
});
const firstFrame = Date.now() - t0;
const out = await page.evaluate(async () => {
  const L = window.__lab;
  const st = L.stage;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const raf = () => new Promise((r) => requestAnimationFrame(r));
  const worlds = {};
  const ids = L.narration?.ctx?.def?.scenes?.map((s) => s.id) ?? [
    'homestead',
    'living-room',
    'fire-core',
    'bench-section',
  ];
  for (const id of ids) {
    const t = performance.now();
    L.store.set({ scene: id });
    await raf();
    await raf();
    await raf();
    const first3 = performance.now() - t;
    await wait(2500);
    const f0 = st.renderer.info.render.frame;
    const a = performance.now();
    for (let i = 0; i < 60; i++) await raf();
    const ms = (performance.now() - a) / 60;
    const info = st.renderer.info;
    worlds[id] = {
      enterMs: Math.round(first3),
      frameMs: +ms.toFixed(1),
      framesDrawn: info.render.frame - f0,
      calls: info.render.calls,
      triangles: info.render.triangles,
      textures: info.memory.textures,
      geometries: info.memory.geometries,
      programs: info.programs?.length ?? null,
      pixelRatio: st.renderer.getPixelRatio(),
    };
  }
  return worlds;
});
const res = {
  url: opt('url', 'http://localhost:5932/'),
  throttle: Number(opt('throttle', 4)),
  firstFrameMs: firstFrame,
  worlds: out,
  errors,
};
console.log(JSON.stringify(res, null, 1));
if (opt('json')) fs.writeFileSync(opt('json'), JSON.stringify(res, null, 1));
await browser.close();
