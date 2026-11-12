#!/usr/bin/env node
// peek.mjs: one world of the served lab from a given camera, as a PNG; with --pick x,y,z it names the meshes whose box holds that point of the world. For the modeller's own checks of a material pass; take the Mac's Chrome lock first (one GPU job at a time):
//   ~/Dev/onigam-video/tools/with-chrome-lock.sh node tools/look/peek.mjs --url http://localhost:5932/ --world living-room \
//     --pos 1,1.6,2 --target -2,1.2,-2.5 --out /tmp/a.png [--hour 20.5] [--size 1920x1080] [--pick x,y,z (a point of the world)] [--set key=value,…]
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(`${process.env.HOME}/.cache/lab-review/`);
const puppeteer = require('puppeteer-core');
const argv = process.argv.slice(2);
const opt = (n, d = null) => (argv.includes(`--${n}`) ? argv[argv.indexOf(`--${n}`) + 1] : d);
const CHROME =
  process.env.CHROME ??
  `${process.env.HOME}/.cache/puppeteer/chrome/mac_arm-154.0.8037.57/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
const [W, H] = opt('size', '1920x1080').split('x').map(Number);
const vec = (s) => s.split(',').map(Number);
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
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (m) =>
  m.type() === 'error' && !m.text().includes('403') ? errors.push(m.text().slice(0, 600)) : 0,
);
page.on('pageerror', (e) => errors.push(String(e).slice(0, 600)));
await page.goto(opt('url', 'http://localhost:5932/'), { waitUntil: 'networkidle2' });
await page.waitForFunction(() => window.__lab?.stage, { timeout: 60000 });
await page.addStyleTag({
  content:
    'body > *:not(canvas), #app > *:not(canvas) { } .lk-ui, header, aside, nav, footer { display: none !important }',
});
const out = await page.evaluate(
  async (world, pos, target, hour, sets, pick, W, H) => {
    const L = window.__lab;
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    L.store.set?.({ scene: world }) ?? L.narration?.ctx?.gotoScene(world);
    await wait(1500);
    const patch = {};
    if (hour != null) patch.hour = hour;
    for (const kv of sets) {
      const [k, v] = kv.split('=');
      patch[k] = v === 'true' ? true : v === 'false' ? false : Number.isNaN(Number(v)) ? v : Number(v);
    }
    if (Object.keys(patch).length) L.engine.set?.(patch) ?? L.sim?.set?.(patch);
    await wait(1200);
    const st = L.stage;
    const cam = st.camera;
    if (pos) {
      cam.position.set(...pos);
      st.controls.target.set(...target);
      st.controls.update();
    }
    await wait(800);
    const info = { camera: cam.position.toArray(), target: st.controls.target.toArray() };
    if (pick) {
      // every visible mesh whose box holds this point of the world (within 3 cm): its name, its material, its patches
      const mod = st.get(world);
      const hold = [];
      mod.scene.traverse((o) => {
        if (!o.isMesh) return;
        let vis = true;
        for (let p = o; p; p = p.parent) if (!p.visible) vis = false;
        if (!vis) return;
        o.geometry.computeBoundingBox();
        const b = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);
        const e = 0.03;
        if (
          pick[0] < b.min.x - e ||
          pick[0] > b.max.x + e ||
          pick[1] < b.min.y - e ||
          pick[1] > b.max.y + e ||
          pick[2] < b.min.z - e ||
          pick[2] > b.max.z + e
        )
          return;
        const m = Array.isArray(o.material) ? o.material[0] : o.material;
        hold.push({
          name: o.name,
          parent: o.parent?.name,
          mat: m.type,
          color: m.color?.getHexString(),
          map: m.map?.name,
          key: m.customProgramCacheKey?.().slice(0, 200),
          box: [b.min.toArray().map((v) => +v.toFixed(2)), b.max.toArray().map((v) => +v.toFixed(2))],
        });
      });
      info.hold = hold;
    }
    return info;
  },
  opt('world', 'living-room'),
  opt('pos') ? vec(opt('pos')) : null,
  opt('target') ? vec(opt('target')) : null,
  opt('hour') ? Number(opt('hour')) : null,
  opt('set') ? opt('set').split(',') : [],
  opt('pick') ? vec(opt('pick')) : null,
  W,
  H,
);
const canvas = await page.$('canvas');
await (canvas ?? page).screenshot({ path: opt('out', 'peek.png') });
console.log(JSON.stringify(out));
if (errors.length) console.log('page errors:\n' + errors.join('\n'));
await browser.close();
