#!/usr/bin/env node
/**
 * clone-site - self-hosted static clone with numeric fidelity gates.
 *
 * Method (from the pixel-perfect kit, minus the external reviewer):
 *   settle before capture, build by capture, measure the painted mark,
 *   gates exit 0 with receipts.
 *
 * Usage:
 *   node scripts/clone-site.mjs doctor
 *   node scripts/clone-site.mjs new <name> <url> [width]
 *   node scripts/clone-site.mjs capture <name>
 *   node scripts/clone-site.mjs build <name>
 *   node scripts/clone-site.mjs measure <name>
 *   node scripts/clone-site.mjs visual <name>
 *   node scripts/clone-site.mjs strict <name>
 *   node scripts/clone-site.mjs report <name>
 *   node scripts/clone-site.mjs status <name>
 *   node scripts/clone-site.mjs done <name>
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// ─── Dependency resolution (workspace / claire-ai node_modules) ──────
const DEP_CANDIDATES = [
  path.resolve(__dirname, '..', 'node_modules'),
  path.resolve(__dirname, '..', '..', 'claire-ai', 'node_modules'),
  path.resolve('/Users/thuypham/.kun/claire-ai', 'node_modules'),
];

function resolveDep(name) {
  for (const base of DEP_CANDIDATES) {
    try {
      const p = path.join(base, name);
      if (fs.existsSync(p)) return require(p);
    } catch (e) { /* try next */ }
  }
  return null;
}

let playwright = null, jsdom = null, blazediff = null;
function loadDeps() {
  playwright = resolveDep('playwright');
  jsdom = resolveDep('jsdom');
  blazediff = resolveDep('@blazediff/core');
}

// ─── State ───────────────────────────────────────────────────────────
const PHASES = ['target', 'capture', 'build', 'measure', 'visual', 'strict', 'report', 'done'];

function targetDir(name) {
  return path.resolve(process.cwd(), 'targets', name);
}
function workflowPath(name) {
  return path.join(targetDir(name), 'workflow.json');
}
function loadWorkflow(name) {
  try { return JSON.parse(fs.readFileSync(workflowPath(name), 'utf8')); }
  catch { return null; }
}
function saveWorkflow(wf) {
  fs.writeFileSync(workflowPath(wf.name), JSON.stringify(wf, null, 2));
}
function phaseDone(wf, phase) {
  return !!(wf.phases && wf.phases[phase] && wf.phases[phase].status === 'done');
}
function markDone(wf, phase, evidence) {
  wf.phases = wf.phases || {};
  wf.phases[phase] = { status: 'done', ts: new Date().toISOString(), evidence: evidence || null };
  saveWorkflow(wf);
}

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

// ─── Doctor ──────────────────────────────────────────────────────────
function cmdDoctor() {
  loadDeps();
  const checks = [
    ['node', process.versions.node, true],
    ['playwright', playwright ? playwright.version || 'present' : null, !!playwright],
    ['jsdom', jsdom ? 'present' : null, !!jsdom],
    ['@blazediff/core', blazediff ? 'present' : null, !!blazediff],
  ];
  let ok = true;
  for (const [name, ver, pass] of checks) {
    console.log(`${pass ? '✓' : '❌'} ${name} — ${pass ? ver : 'MISSING'}`);
    if (!pass) ok = false;
  }
  if (!ok) {
    console.error('\nfix: install deps once, e.g. from the workspace that has them:');
    console.error('  npm i -D playwright jsdom @blazediff/core');
    console.error('  (or point DEP_CANDIDATES at a node_modules that has them)');
    process.exit(1);
  }
  console.log('\n✓ doctor OK — pipeline ready');
}

// ─── new ─────────────────────────────────────────────────────────────
function cmdNew(args) {
  if (args.length < 2) { console.error('usage: clone-site new <name> <url> [width]'); process.exit(1); }
  const name = args[0];
  const url = args[1];
  const width = parseInt(args[2]) || 1728;
  const dir = targetDir(name);
  if (fs.existsSync(dir)) { console.error(`targets/${name} already exists — pick another name or remove it`); process.exit(1); }
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(path.join(dir, 'clone'), { recursive: true });
  const wf = {
    name, url, width,
    createdAt: new Date().toISOString(),
    phases: { target: { status: 'done', ts: new Date().toISOString(), evidence: { url, width } } },
  };
  saveWorkflow(wf);
  fs.writeFileSync(path.join(dir, 'target.json'), JSON.stringify({ url, width, name }, null, 2));
  console.log(`✓ target ${name} pinned: ${url} @ ${width}px`);
  console.log('next: capture');
}

// ─── capture (settle + DOM + screenshot) ─────────────────────────────
async function cmdCapture(name) {
  const wf = loadWorkflow(name);
  if (!wf) { console.error(`no target ${name} — run new first`); process.exit(1); }
  loadDeps();
  if (!playwright) { console.error('playwright missing — run doctor'); process.exit(1); }

  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: wf.width, height: 982 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.route('**/*', (route) => {
    const u = route.request().url();
    if (isTrackingUrl(u)) route.abort(); else route.continue();
  });

  console.log(`🌐 loading ${wf.url} @ ${wf.width}px...`);
  await page.goto(wf.url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Settle: slow scroll sweep so scroll-triggered appear effects fire and COMPLETE
  console.log('📜 settling (slow scroll sweep + reveal wait)...');
  await page.evaluate(async () => {
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    const step = 500;
    let total = 0;
    while (total < document.body.scrollHeight) {
      window.scrollBy(0, step);
      total += step;
      await delay(150);
    }
    // let reveal animations finish (Framer word-by-word appears can take 1-2s)
    await delay(2500);
    window.scrollTo(0, 0);
    await delay(800);
  });

  // Reveal check: no visible TEXT leaf may still hold a pre-reveal state
  // (opacity < 0.99 or a non-none transform) — a still-hidden word/block would be
  // baked into the captured DOM as invisible forever. Decorative layers that are
  // INTENTIONALLY hidden at rest (hover overlays, opacity:0 captions) are exempt.
  const revealCheck = await page.evaluate(() => {
    const stuck = [...document.querySelectorAll('body *')].filter((el) => {
      // only text leaves: element whose own text is meaningful and has no element children
      const ownText = (el.textContent || '').trim();
      if (!ownText || ownText.length < 2 || el.children.length > 0) return false;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return false;
      if (cs.visibility === 'hidden' || cs.display === 'none') return false;
      const opacity = parseFloat(cs.opacity);
      const transformed = cs.transform && cs.transform !== 'none';
      return opacity < 0.99 || transformed;
    }).slice(0, 12).map((el) => (el.className || el.tagName).toString().slice(0, 50) + ':' + (el.textContent || '').trim().slice(0, 20));
    return stuck;
  });

  const settle = { url: wf.url, width: wf.width, revealStuck: revealCheck.length, revealExamples: revealCheck };
  fs.writeFileSync(path.join(targetDir(name), 'settle.json'), JSON.stringify(settle, null, 2));

  if (revealCheck.length) {
    console.error(`✗ capture refused — ${revealCheck.length} elements still in pre-reveal state (e.g. ${revealCheck.slice(0, 4).join(', ')})`);
    console.error('  these would be baked into the clone as invisible forever; the page needs more settle time');
    await browser.close();
    process.exit(1);
  }

  // Stability: DOM height + img count stable across 1.2s window
  const stable = await page.evaluate(async () => {
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    const snap = () => ({ h: document.body.scrollHeight, imgs: document.images.length });
    const a = snap();
    await delay(1200);
    const b = snap();
    return { stable: a.h === b.h && a.imgs === b.imgs, before: a, after: b };
  });
  settle.stable = stable.stable;
  settle.height = stable.before.h;
  settle.images = stable.before.imgs;
  fs.writeFileSync(path.join(targetDir(name), 'settle.json'), JSON.stringify(settle, null, 2));

  if (!stable.stable) {
    console.error(`✗ page did NOT settle (DOM height ${stable.before.h} → ${stable.after.h}, imgs ${stable.before.imgs} → ${stable.after.imgs})`);
    console.error('  capture refused — a still-mounting DOM is a page that never existed.');
    console.error('  retry: capture again, or accept a partial capture by re-running');
    await browser.close();
    process.exit(1);
  }

  const domHtml = await page.content();
  fs.writeFileSync(path.join(targetDir(name), 'dom.html'), domHtml);
  console.log(`✓ dom.html (${(domHtml.length / 1024).toFixed(0)} KB)`);

  await page.screenshot({ path: path.join(targetDir(name), 'live.png'), fullPage: true });
  console.log('✓ live.png (full-page)');

  await browser.close();
  markDone(wf, 'capture', { domBytes: domHtml.length, settle });
  console.log('next: build');
}

// ─── build (capture → self-hosted clone) ─────────────────────────────
function isTrackingUrl(url) {
  const tracking = [
    't.co/', 'ads.twitter.com', 'analytics.twitter.com', 'doubleclick.net',
    'googlesyndication.com', 'facebook.com/tr', 'ads.linkedin.com',
    'bat.bing.com', 'pixel.', 'adservice.google.com', 'hotjar.com',
    'clarity.ms', 'googletagmanager.com', 'google-analytics.com',
  ];
  return tracking.some((t) => url.includes(t));
}

function slugify(str) {
  return str.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').toLowerCase();
}

async function cmdBuild(name) {
  const wf = loadWorkflow(name);
  if (!wf) { console.error(`no target ${name}`); process.exit(1); }
  loadDeps();
  if (!jsdom) { console.error('jsdom missing — run doctor'); process.exit(1); }

  const dir = targetDir(name);
  const domPath = path.join(dir, 'dom.html');
  if (!fs.existsSync(domPath)) { console.error('dom.html missing — run capture first'); process.exit(1); }

  const html = fs.readFileSync(domPath, 'utf8');
  const { JSDOM } = jsdom;
  const dom = new JSDOM(html, { url: wf.url });
  const doc = dom.window.document;
  const base = new URL(wf.url);
  const assetsDir = path.join(dir, 'clone', 'assets');
  fs.mkdirSync(path.join(assetsDir, 'css'), { recursive: true });
  fs.mkdirSync(path.join(assetsDir, 'fonts'), { recursive: true });
  fs.mkdirSync(path.join(assetsDir, 'media'), { recursive: true });

  const manifest = { css: [], fonts: [], media: [], skipped: [], failed: [] };
  const urlToFile = (u, ext) => {
    const hash = crypto.createHash('md5').update(u).digest('hex').slice(0, 10);
    let baseName = 'asset';
    try { baseName = path.basename(new URL(u).pathname, ext) || 'asset'; } catch {}
    return `${slugify(baseName)}-${hash}${ext}`;
  };
  const download = (u) => new Promise((resolve, reject) => {
    const mod = u.startsWith('https') ? import('https') : import('http');
    mod.then((m) => {
      m.get(u, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        if (res.statusCode >= 400) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      }).on('error', reject);
    });
  });

  // strip scripts / CSP / modulepreloads / editor-bar iframes
  doc.querySelectorAll('script').forEach((s) => s.remove());
  doc.querySelectorAll('iframe').forEach((f) => f.remove());
  doc.querySelectorAll('meta[http-equiv="Content-Security-Policy"], meta[http-equiv="content-security-policy"]').forEach((m) => m.remove());
  doc.querySelectorAll('link[rel="modulepreload"], link[rel="preload"][as="script"]').forEach((l) => l.remove());

  // self-host stylesheets
  for (const link of [...doc.querySelectorAll('link[rel="stylesheet"]')]) {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('data:')) continue;
    let abs;
    try { abs = new URL(href, base).href; } catch { continue; }
    if (isTrackingUrl(abs)) { link.remove(); manifest.skipped.push(abs); continue; }
    try {
      const css = await download(abs);
      // rewrite url(...) inside CSS to local media
      let rewritten = css.toString('utf8');
      const urlRefs = [...rewritten.matchAll(/url\((['"]?)(.*?)\1\)/g)];
      for (const m of urlRefs) {
        const ref = m[2];
        if (!ref || ref.startsWith('data:') || ref.startsWith('#')) continue;
        let refAbs;
        try { refAbs = new URL(ref, abs).href; } catch { continue; }
        if (isTrackingUrl(refAbs)) continue;
        const ext = path.extname(new URL(refAbs).pathname) || '.bin';
        const fn = urlToFile(refAbs, ext);
        try {
          const data = await download(refAbs);
          fs.writeFileSync(path.join(assetsDir, 'media', fn), data);
          rewritten = rewritten.replace(m[0], `url(assets/media/${fn})`);
          manifest.media.push(refAbs);
        } catch (e) { manifest.failed.push(refAbs); }
      }
      const fn = urlToFile(abs, '.css');
      fs.writeFileSync(path.join(assetsDir, 'css', fn), rewritten);
      link.setAttribute('href', `assets/css/${fn}`);
      manifest.css.push(abs);
    } catch (e) { manifest.failed.push(abs); link.remove(); }
  }

  // self-host images (img/src, source/src, srcset, style bg)
  const imgUrls = new Set();
  doc.querySelectorAll('img[src], source[src]').forEach((el) => {
    const src = el.getAttribute('src');
    if (!src || src.startsWith('data:') || src.startsWith('blob:')) return;
    try { const abs = new URL(src, base).href; if (abs.startsWith('http')) imgUrls.add(abs); } catch {}
  });
  doc.querySelectorAll('img[srcset], source[srcset]').forEach((el) => {
    const ss = el.getAttribute('srcset');
    if (!ss) return;
    ss.split(',').forEach((part) => {
      const m = part.trim().match(/^(\S+)/);
      if (!m) return;
      try { const abs = new URL(m[1], base).href; if (abs.startsWith('http')) imgUrls.add(abs); } catch {}
    });
  });
  doc.querySelectorAll('[style*="background"]').forEach((el) => {
    const style = el.getAttribute('style') || '';
    [...style.matchAll(/url\((['"]?)(.*?)\1\)/g)].forEach((m) => {
      try { const abs = new URL(m[2], base).href; if (abs.startsWith('http')) imgUrls.add(abs); } catch {}
    });
  });

  const mediaMap = new Map();
  for (const u of imgUrls) {
    if (isTrackingUrl(u)) { manifest.skipped.push(u); continue; }
    const ext = path.extname(new URL(u).pathname) || '.jpg';
    const fn = urlToFile(u, ext);
    try {
      const data = await download(u);
      fs.writeFileSync(path.join(assetsDir, 'media', fn), data);
      mediaMap.set(u, `assets/media/${fn}`);
      manifest.media.push(u);
    } catch (e) { manifest.failed.push(u); }
  }

  doc.querySelectorAll('img[src], source[src]').forEach((el) => {
    const src = el.getAttribute('src');
    if (!src || src.startsWith('data:') || src.startsWith('blob:')) return;
    try {
      const abs = new URL(src, base).href;
      const local = mediaMap.get(abs);
      if (local) el.setAttribute('src', local);
    } catch {}
  });
  doc.querySelectorAll('[style*="background"]').forEach((el) => {
    let style = el.getAttribute('style') || '';
    for (const m of [...style.matchAll(/url\((['"]?)(.*?)\1\)/g)]) {
      try {
        const abs = new URL(m[2], base).href;
        const local = mediaMap.get(abs);
        if (local) style = style.replace(m[0], `url(${local})`);
      } catch {}
    }
    el.setAttribute('style', style);
  });

  // font preloads → self-host (awaited so they land before index.html is written)
  for (const l of [...doc.querySelectorAll('link[rel="preload"][as="font"]')]) {
    const href = l.getAttribute('href');
    if (!href) continue;
    try {
      const abs = new URL(href, base).href;
      if (abs.startsWith('http')) {
        const ext = path.extname(new URL(abs).pathname) || '.woff2';
        const fn = urlToFile(abs, ext);
        try {
          const data = await download(abs);
          fs.writeFileSync(path.join(assetsDir, 'fonts', fn), data);
          l.setAttribute('href', `assets/fonts/${fn}`);
          manifest.fonts.push(abs);
        } catch { l.remove(); }
      }
    } catch {}
  }

  // remove now-broken or external-only links
  doc.querySelectorAll('a[href]').forEach((a) => {
    const h = a.getAttribute('href');
    if (h && h.startsWith('http') && !h.includes(base.hostname)) {
      // keep external links (they're navigations, not assets)
    }
  });

  // self-host url(...) refs inside INLINE <style> blocks (Framer puts @font-face here)
  for (const styleEl of [...doc.querySelectorAll('style')]) {
    let css = styleEl.textContent || '';
    if (!/url\(/i.test(css)) continue;
    for (const m of [...css.matchAll(/url\((['"]?)(.*?)\1\)/g)]) {
      const ref = m[2];
      if (!ref || ref.startsWith('data:') || ref.startsWith('#')) continue;
      let refAbs;
      try { refAbs = new URL(ref, base).href; } catch { continue; }
      if (isTrackingUrl(refAbs)) continue;
      const urlPath = new URL(refAbs).pathname;
      const isFont = /\.(woff2?|ttf|otf|eot)$/i.test(urlPath);
      const ext = path.extname(urlPath) || (isFont ? '.woff2' : '.bin');
      const fn = urlToFile(refAbs, ext);
      const target = isFont ? 'fonts' : 'media';
      const localRef = `assets/${target}/${fn}`;
      try {
        const data = await download(refAbs);
        if (!fs.existsSync(path.join(assetsDir, target, fn))) {
          fs.writeFileSync(path.join(assetsDir, target, fn), data);
        }
        css = css.replace(m[0], `url(${localRef})`);
        (isFont ? manifest.fonts : manifest.media).push(refAbs);
      } catch (e) { manifest.failed.push(refAbs); }
    }
    styleEl.textContent = css;
  }

  // set font smoothing + base stylesheet on clone root
  const styleEl = doc.createElement('style');
  styleEl.textContent = `html{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}img{max-width:100%;height:auto}`;
  doc.head.appendChild(styleEl);

  const outHtml = `<!doctype html>\n${doc.documentElement.outerHTML}`;
  fs.writeFileSync(path.join(dir, 'clone', 'index.html'), outHtml);
  fs.writeFileSync(path.join(dir, 'clone', 'manifest.json'), JSON.stringify(manifest, null, 2));
  fs.writeFileSync(path.join(dir, 'clone', 'index.html.sha256'), sha256(Buffer.from(outHtml)));

  // gate: no external http(s) references left in clone
  const external = [...outHtml.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)].map((m) => m[1]);
  const uniqueExternal = [...new Set(external)];
  if (uniqueExternal.length) {
    console.warn(`⚠ ${uniqueExternal.length} external refs remain in clone (kept intentionally, e.g. links)`);
    manifest.externalRemaining = uniqueExternal.slice(0, 20);
  }

  console.log(`✓ clone built: ${manifest.css.length} css, ${manifest.media.length} media, ${manifest.fonts.length} fonts, ${manifest.failed.length} failed`);
  markDone(wf, 'build', { outHtmlBytes: outHtml.length, manifest });
  console.log('next: measure');
}

// ─── measure (painted marks on live + clone) ─────────────────────────
const MEASURE_SCRIPT = `() => {
  const out = [];
  const scrollY0 = window.scrollY || 0;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
  let el;
  while ((el = walker.nextNode())) {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    const cs = getComputedStyle(el);
    const hasText = el.children.length === 0 && (el.textContent || '').trim().length > 0;
    const visible = cs.visibility !== 'hidden' && cs.display !== 'none' && parseFloat(cs.opacity) > 0;
    if (!visible) continue;
    // skip live-only preview chrome (Framer template toolbar / "made with Framer" badge):
    // any element inside a fixed-position container whose text mentions the Framer footer
    if (el.closest && el.closest('.__framer-badge, .framer-badge')) continue;
    if ((el.textContent || '').includes('Create a free website with Framer')) continue;
    const item = {
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      cls: (typeof el.className === 'string' ? el.className : '').slice(0, 80),
      // absolute page coords (rect + scroll), so scroll state at measure time can't create phantom deltas
      box: { x: r.x, y: r.y + scrollY0, w: r.width, h: r.height },
    };
    if (hasText) {
      const range = document.createRange();
      range.selectNodeContents(el);
      const gr = range.getBoundingClientRect();
      item.text = (el.textContent || '').trim().slice(0, 60);
      item.glyph = { x: gr.x, y: gr.y + scrollY0, w: gr.width, h: gr.height };
      item.font = {
        family: cs.fontFamily.split(',')[0].replace(/["']/g, ''),
        size: cs.fontSize, weight: cs.fontWeight, color: cs.color,
        lineHeight: cs.lineHeight, smoothing: cs.webkitFontSmoothing || 'auto',
      };
    }
    const bg = cs.backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') item.backdrop = bg;
    const bt = parseFloat(cs.borderTopWidth), bb = parseFloat(cs.borderBottomWidth);
    if (bt > 0 || bb > 0) item.border = { top: bt, bottom: bb, color: cs.borderTopColor };
    if (cs.textDecorationLine && cs.textDecorationLine !== 'none') {
      item.underline = { style: cs.textDecorationStyle, thickness: cs.textDecorationThickness, color: cs.textDecorationColor };
    }
    out.push(item);
  }
  return out;
}`;

async function runMeasurePage(browser, url, outPath, width) {
  const context = await browser.newContext({ viewport: { width, height: 982 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  // slow scroll sweep so scroll-triggered appear effects fire and settle (measuring
  // mid-animation reads opacity:0/translateY states that never existed at rest),
  // then wait for webfonts — measuring in the fallback font produces phantom glyph deltas
  await page.evaluate(async () => {
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    try { await document.fonts.ready; } catch {}
    const step = 500;
    let total = 0;
    while (total < document.body.scrollHeight) {
      window.scrollBy(0, step);
      total += step;
      await delay(120);
    }
    await delay(800);
    window.scrollTo(0, 0);
    await delay(1500);
    try { await document.fonts.ready; } catch {}
    await delay(300);
  });
  const data = await page.evaluate(new Function(`return (${MEASURE_SCRIPT})()`));
  // settle contract: the live page's reveal animations must finish before we trust
  // the numbers — re-sample until glyph positions are stable (max 6 tries)
  let stable = false;
  for (let attempt = 0; attempt < 6 && !stable; attempt++) {
    const sample = await page.evaluate(new Function(`return (${MEASURE_SCRIPT})()`));
    stable = data.length === sample.length &&
      data.every((d, i) => {
        const s = sample[i];
        if (!s || !d.glyph || !s.glyph) return !d.glyph && !s.glyph;
        return Math.abs(d.glyph.x - s.glyph.x) < 0.5 && Math.abs(d.glyph.y - s.glyph.y) < 0.5;
      });
    if (!stable) {
      await page.waitForTimeout(600);
      // keep the latest sample as the working measure
      data.length = 0;
      data.push(...sample);
    }
  }
  if (!stable) {
    console.warn('  ⚠ page never fully settled during measure (animations still running) — recorded latest sample');
  }
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
  await context.close();
  return data;
}

async function cmdMeasure(name) {
  const wf = loadWorkflow(name);
  if (!wf) { console.error(`no target ${name}`); process.exit(1); }
  loadDeps();
  if (!playwright) { console.error('playwright missing'); process.exit(1); }
  const dir = targetDir(name);
  const cloneUrl = 'file://' + path.join(dir, 'clone', 'index.html');
  if (!fs.existsSync(path.join(dir, 'clone', 'index.html'))) { console.error('clone missing — run build first'); process.exit(1); }

  const browser = await playwright.chromium.launch({ headless: true });
  console.log(`📏 measuring live ${wf.url}...`);
  const live = await runMeasurePage(browser, wf.url, path.join(dir, 'measure-live.json'), wf.width);
  console.log(`  ${live.length} painted leaves`);
  console.log(`📏 measuring clone (file://)...`);
  const clone = await runMeasurePage(browser, cloneUrl, path.join(dir, 'measure-clone.json'), wf.width);
  console.log(`  ${clone.length} painted leaves`);
  await browser.close();
  markDone(wf, 'measure', { liveLeaves: live.length, cloneLeaves: clone.length });
  console.log('next: visual');
}

// ─── visual (pixel diff) ─────────────────────────────────────────────
async function cmdVisual(name) {
  const wf = loadWorkflow(name);
  if (!wf) { console.error(`no target ${name}`); process.exit(1); }
  loadDeps();
  if (!playwright || !blazediff) { console.error('playwright/@blazediff missing'); process.exit(1); }
  const dir = targetDir(name);
  const cloneUrl = 'file://' + path.join(dir, 'clone', 'index.html');

  const browser = await playwright.chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: wf.width, height: 982 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(cloneUrl, { waitUntil: 'networkidle', timeout: 60000 });
  await page.screenshot({ path: path.join(dir, 'clone.png'), fullPage: true });
  await ctx.close();
  await browser.close();

  let pngjs = resolveDep('pngjs');
  if (!pngjs) {
    console.error('pngjs missing for pixel decode — visual gate cannot run');
    console.error('fix: npm i -D pngjs (or add it to a resolvable node_modules)');
    process.exit(1);
  }
  const PNG = pngjs.PNG;
  const livePng = PNG.sync.read(fs.readFileSync(path.join(dir, 'live.png')));
  const clonePng = PNG.sync.read(fs.readFileSync(path.join(dir, 'clone.png')));
  const w = Math.min(livePng.width, clonePng.width);
  const h = Math.min(livePng.height, clonePng.height);
  const diffBuf = Buffer.alloc(w * h * 4);

  const diffCount = blazediff.default
    ? blazediff.default(livePng.data, clonePng.data, diffBuf, w, h, { threshold: 0.1, includeAA: false })
    : blazediff(livePng.data, clonePng.data, diffBuf, w, h, { threshold: 0.1, includeAA: false });

  const total = w * h;
  const ratio = diffCount / total;
  const diffPng = new PNG({ width: w, height: h });
  diffPng.data = diffBuf;
  fs.writeFileSync(path.join(dir, 'diff.png'), PNG.sync.write(diffPng));
  fs.writeFileSync(path.join(dir, 'diff.json'), JSON.stringify({ diffPixels: diffCount, totalPixels: total, ratio }, null, 2));

  const tol = 0.02;
  console.log(`🎯 pixel diff: ${diffCount}/${total} (${(ratio * 100).toFixed(2)}%) vs tolerance ${tol * 100}%`);
  if (ratio <= tol) {
    console.log('✓ visual gate PASS');
    markDone(wf, 'visual', { ratio, diffPixels: diffCount });
  } else {
    console.error(`✗ visual gate FAIL (ratio ${ratio.toFixed(4)} > ${tol}) — inspect diff.png`);
    process.exit(1);
  }
  console.log('next: strict');
}

// ─── strict (numeric compare of measures) ────────────────────────────
function near(a, b, tol = 0.5) { return Math.abs(a - b) <= tol; }

function cmdStrict(name) {
  const wf = loadWorkflow(name);
  if (!wf) { console.error(`no target ${name}`); process.exit(1); }
  const dir = targetDir(name);
  const live = JSON.parse(fs.readFileSync(path.join(dir, 'measure-live.json'), 'utf8'));
  const clone = JSON.parse(fs.readFileSync(path.join(dir, 'measure-clone.json'), 'utf8'));

  // group both sides by key, keep each group sorted by y so duplicate entries
  // (e.g. nav + footer + mobile variants of the same label) pair by position
  const group = (arr) => {
    const m = new Map();
    for (const item of arr) {
      const key = `${item.tag}:${item.cls}:${item.text || ''}`;
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(item);
    }
    for (const list of m.values()) list.sort((a, b) => a.glyph ? a.glyph.y - b.glyph.y : a.box.y - b.box.y);
    return m;
  };
  const liveGroups = group(live);
  const cloneGroups = group(clone);

  const deltas = [];
  for (const [key, lList] of liveGroups) {
    const cList = cloneGroups.get(key) || [];
    for (let i = 0; i < lList.length; i++) {
      const l = lList[i];
      const c = cList[i];
      if (!c) { deltas.push({ leaf: key, issue: `missing in clone (entry ${i})` }); continue; }
      if (l.text && c.text && l.text !== c.text) { deltas.push({ leaf: key, issue: `text mismatch "${l.text}" vs "${c.text}"` }); continue; }
      if (l.glyph && c.glyph) {
        for (const prop of ['x', 'y', 'w', 'h']) {
          if (!near(l.glyph[prop], c.glyph[prop])) {
            deltas.push({ leaf: key, issue: `glyph.${prop} ${l.glyph[prop]} vs ${c.glyph[prop]}` });
            break;
          }
        }
      }
      if (l.font && c.font) {
        for (const prop of ['size', 'weight', 'color']) {
          if (l.font[prop] !== c.font[prop]) {
            deltas.push({ leaf: key, issue: `font.${prop} "${l.font[prop]}" vs "${c.font[prop]}"` });
            break;
          }
        }
      }
      if (l.backdrop && c.backdrop && l.backdrop !== c.backdrop) {
        deltas.push({ leaf: key, issue: `backdrop ${l.backdrop} vs ${c.backdrop}` });
      }
    }
  }

  const structural = [];
  if (live.length !== clone.length) {
    structural.push(`painted leaf count ${live.length} (live) vs ${clone.length} (clone)`);
  }

  // Behavior exemptions: JS-driven dynamics (carousels, marquees, tickers) that a
  // static clone legitimately cannot reproduce are excused WITH A DOCUMENTED REASON
  // when their leaf key matches an entry in behavior-exempt.json. This mirrors the
  // kit's rule: every dynamic is reproduced or excused in a reviewer-readable way.
  const exemptFile = path.join(dir, 'behavior-exempt.json');
  const behavior = [];
  let exempt = [];
  if (fs.existsSync(exemptFile)) {
    try { exempt = JSON.parse(fs.readFileSync(exemptFile, 'utf8')); } catch {}
    for (let i = deltas.length - 1; i >= 0; i--) {
      if (exempt.some((e) => (e.selector || e.key || '').length && deltas[i].leaf.includes(e.selector || e.key))) {
        behavior.push(deltas.splice(i, 1)[0]);
      }
    }
  }

  fs.writeFileSync(path.join(dir, 'strict.json'), JSON.stringify({ deltas, structural, behavior }, null, 2));
  const ok = deltas.length === 0;
  if (ok) {
    console.log(`✓ strict gate PASS — ${live.length} leaves compared, 0 deltas`);
    if (behavior.length) console.log(`  ⚠ ${behavior.length} behavior delta(s) excused via behavior-exempt.json (documented in strict.json)`);
  } else {
    console.error(`✗ strict gate FAIL — ${deltas.length} deltas (see strict.json)`);
    deltas.slice(0, 15).forEach((d) => console.error(`  - ${d.leaf}: ${d.issue}`));
    process.exit(1);
  }
  if (structural.length) {
    console.warn(`  ⚠ structural: ${structural.join('; ')}`);
  }
  markDone(wf, 'strict', { deltas: deltas.length, behavior: behavior.length, structural });
  console.log('next: report');
}

// ─── report ──────────────────────────────────────────────────────────
function cmdReport(name) {
  const wf = loadWorkflow(name);
  if (!wf) { console.error(`no target ${name}`); process.exit(1); }
  const dir = targetDir(name);
  const lines = [];
  lines.push(`# Clone report: ${wf.name}`);
  lines.push('');
  lines.push(`- URL: ${wf.url}`);
  lines.push(`- Width: ${wf.width}px`);
  lines.push(`- Created: ${wf.createdAt}`);
  lines.push('');
  lines.push('## Gates');
  lines.push('');
  lines.push('| Phase | Status | Evidence |');
  lines.push('| --- | --- | --- |');
  for (const phase of PHASES) {
    const p = wf.phases && wf.phases[phase];
    const status = p && p.status === 'done' ? '✅' : '⏳';
    const ev = p && p.evidence ? JSON.stringify(p.evidence).slice(0, 120) : '';
    lines.push(`| ${phase} | ${status} | ${ev} |`);
  }
  lines.push('');
  if (fs.existsSync(path.join(dir, 'diff.json'))) {
    const d = JSON.parse(fs.readFileSync(path.join(dir, 'diff.json'), 'utf8'));
    lines.push(`## Visual diff`);
    lines.push(`- ${d.diffPixels}/${d.totalPixels} pixels differ (${(d.ratio * 100).toFixed(2)}%)`);
    lines.push(`- See \`diff.png\` for the visualization.`);
    lines.push('');
  }
  if (fs.existsSync(path.join(dir, 'clone', 'manifest.json'))) {
    const m = JSON.parse(fs.readFileSync(path.join(dir, 'clone', 'manifest.json'), 'utf8'));
    lines.push(`## Assets`);
    lines.push(`- CSS: ${m.css.length}, media: ${m.media.length}, fonts: ${m.fonts.length}, failed: ${m.failed.length}`);
    if (m.failed.length) lines.push(`- Failed downloads: ${m.failed.join(', ')}`);
    lines.push('');
  }
  lines.push(`## Artifacts (sha256)`);
  for (const f of ['dom.html', 'live.png', 'clone/index.html', 'clone.png', 'diff.png', 'measure-live.json', 'measure-clone.json', 'strict.json']) {
    const p = path.join(dir, f);
    if (fs.existsSync(p)) {
      lines.push(`- \`${f}\`: \`${sha256(fs.readFileSync(p))}\``);
    }
  }
  lines.push('');
  lines.push('## Limits');
  lines.push('- Static capture: JS-driven dynamics (marquees, hover menus, infinite scroll) are not reproduced.');
  lines.push('- No external reviewer: gates are numeric; eyeball diff.png + clone/index.html for taste.');
  lines.push('');
  lines.push('## Re-verify');
  lines.push(`\`\`\`bash`);
  lines.push(`node scripts/clone-site.mjs visual ${wf.name} && node scripts/clone-site.mjs strict ${wf.name}`);
  lines.push(`\`\`\``);
  fs.writeFileSync(path.join(dir, 'receipts.md'), lines.join('\n'));
  console.log(`✓ receipts.md written (${lines.length} lines)`);
  markDone(wf, 'report', { receipts: 'receipts.md' });
}

// ─── status ──────────────────────────────────────────────────────────
function cmdStatus(name) {
  const wf = loadWorkflow(name);
  if (!wf) { console.error(`no target ${name} — run new first`); process.exit(1); }
  console.log(`\nworkflow — ${wf.name}  (${wf.url} @ ${wf.width}px)`);
  const order = ['target', 'capture', 'build', 'measure', 'visual', 'strict', 'report'];
  let nextPhase = null;
  for (const phase of order) {
    const p = wf.phases && wf.phases[phase];
    const done = p && p.status === 'done';
    const mark = done ? '✓' : '·';
    console.log(`  ${mark} ${phase.padEnd(8)} ${done ? '' : '(pending)'}`);
    if (!done && !nextPhase) nextPhase = phase;
  }
  if (nextPhase) console.log(`\n  next: ${nextPhase}`);
  else console.log('\n  all gates green — run: done');
}

// ─── done ────────────────────────────────────────────────────────────
function cmdDone(name) {
  const wf = loadWorkflow(name);
  if (!wf) { console.error(`no target ${name}`); process.exit(1); }
  const order = ['target', 'capture', 'build', 'measure', 'visual', 'strict', 'report'];
  const missing = order.filter((p) => !phaseDone(wf, p));
  if (missing.length) {
    console.error(`✗ not done — missing: ${missing.join(', ')}`);
    process.exit(1);
  }
  markDone(wf, 'done', { at: new Date().toISOString() });
  console.log(`✓ done — ${wf.name} cloned, gated, receipted (targets/${wf.name}/)`);
  if (fs.existsSync(path.join(targetDir(name), 'receipts.md'))) {
    console.log('  report: targets/' + name + '/receipts.md');
  }
}

// ─── dispatch ────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const cmd = args[0];
if (!cmd) {
  console.error('usage: clone-site <doctor|new|capture|build|measure|visual|strict|report|status|done> [args]');
  process.exit(1);
}

switch (cmd) {
  case 'doctor': cmdDoctor(); break;
  case 'new': cmdNew(args.slice(1)); break;
  case 'capture': cmdCapture(args[1]).catch((e) => { console.error('✗', e.message); process.exit(1); }); break;
  case 'build': cmdBuild(args[1]).catch((e) => { console.error('✗', e.message); process.exit(1); }); break;
  case 'measure': cmdMeasure(args[1]).catch((e) => { console.error('✗', e.message); process.exit(1); }); break;
  case 'visual': cmdVisual(args[1]).catch((e) => { console.error('✗', e.message); process.exit(1); }); break;
  case 'strict': cmdStrict(args[1]); break;
  case 'report': cmdReport(args[1]); break;
  case 'status': cmdStatus(args[1]); break;
  case 'done': cmdDone(args[1]); break;
  default:
    console.error(`unknown command: ${cmd}`);
    process.exit(1);
}
