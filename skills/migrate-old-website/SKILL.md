---
id: migrate-old-website
name: Migrate old website
description: Migrate a legacy website (Wix, Shopify, Squarespace, Framer, an old static site, or any platform) into your own React/Vite front-end, CONTENT-FIRST — scrape the old site, build its sitemap + asset inventory, populate the content and assets into the new React UI unchanged (copy, structure, facts intact), then run the AI copy-rewrite pass as a separate step afterward. This is the website-renovation / replatforming job: move a client off a closed platform and give them a custom React app they own. Triggers whenever the user wants to 'migrate old website', 'renovate this site', 'move off wix/shopify', 'replatform this site as react', 'port this website to a custom react app', 'bring this site into the new UI'.
---

# Migrate old website → custom React app

## The ordering (migrate-preserve first, rewrite second)

This is a **content-preserving migration**. Do it in this order, never reverse it:

1. **Scrape + sitemap** — capture the old site: every page, its content, and its assets. The
   site's nav/index/sitemap is the inventory of what exists.
2. **Populate into the new React UI** — port the old copy, structure, and assets into the new
   React/Vite app **unchanged** (content model + assets). Facts, voice, and structure intact.
3. **Verify it ships** — build + lint green, every asset referenced, deployed.
4. **AI rewrites the content** — only after the migration is landed does an AI copy pass
   rewrite/reframe the text on top of the preserved content.

If the rewrite runs *before* the port, the source truth is lost. **Populate first, rewrite
second.** That guarantee is what makes a replatform safe: the client never loses content, and the
look/feel upgrades are layered on a preserved foundation.

## Which platform / how to capture

Choose the capture path by what the old site is:

| Old platform | Capture approach |
|---|---|
| Framer-generated or static site | Use the **clone-site** skill (settle → capture → build → measure → receipts) → static HTML reference + extracted assets. |
| Wix / Squarespace | Crawl the rendered pages (Playwright/`wget` mirror) — a clean export isn't always available; scrape the live HTML + assets. Build the sitemap from nav / `sitemap.xml`. |
| Shopify | Export products/pages (admin → Export CSV/JSON) or crawl the storefront for content + images. Use the catalog as the content-model seed. |
| WordPress / old CMS | Export XML (WXR) or crawl; extract posts/pages + media. |
| Old static HTML | Clone + extract per page (see the worked reference below). |

Keep the original HTML/export as the **reference** (never shipped); the React app is the product.

## 1. Scrape + sitemap

- Clone/mirror the old site into a working dir.
- Build the **sitemap** = the full page inventory (nav, index, breadcrumbs, or `sitemap.xml`).
- For each page, extract **text + image/asset inventory**. Watch encoding quirks (some old HTML
  is UTF-16/UTF-8 mixed — use a small extractor, never raw grep on content):

```python
import re, html
def extract(f):
    src = open(f, encoding='utf-8', errors='replace').read()
    body = re.sub(r'<script.*?</script>', ' ', src, flags=re.S)
    body = re.sub(r'<style.*?</style>', ' ', body, flags=re.S)
    text = re.sub(r'<[^>]+>', '\n', body)
    return [l.strip() for l in html.unescape(text).split('\n') if l.strip()]

def assets(f):
    src = open(f, encoding='utf-8', errors='replace').read()
    return sorted(set(re.findall(r'(?:img|src|href)=["\']?([^"\'\s>]+)", src)))
```

## 2. Populate into the new React UI (content model)

- **Content lives in JSON, never in component code.** Put the migrated copy/images in a
  `content/*.json` (or `data/*.ts`) model; components read it. This is the seam the client/draft
  editing later writes to.
- Model each page/section as a record (slug, title, body, images, metadata). Preserve the old
  taxonomy but re-map it to the new site's vocabulary where the categories differ.
- Port narrative fields exactly from the old page sections. **Keep the old voice; tighten
  grammar; preserve facts.** Rewriting happens later.
- For any page/card the UI needs a per-record key for (backgrounds, short descriptions, etc.),
  add them for every new slug or the UI falls back to a default.

## 3. Assets

- Copy old images/fonts/videos into the app's public dir with their original filenames.
- **Self-host everything** (fonts, images, video) — no external CDN (the point of de-platforming
  is removing the closed platform's runtime + CDN dependency).
- Optimize each asset (resize >1600px, jpeg q≈80).
- For brand logos the old site lacks, generate wordmark SVGs (brand-color square + centered
  text) rather than shipping a placeholder.

## 4. Verify + ship

```bash
npm run build     # must pass (TS + bundle)
npm run lint      # 0 errors
# verify every referenced asset exists in the public dir
git add -A && git commit -m "Migrate <site> content + assets into React app"
git push origin main    # auto-deploy (Vercel/Netlify)
```

Confirm the new deploy serves the same content; the old site stays live until the client accepts
the new one.

## 5. Rewrite pass (only after the migration is landed)

After the content is ported + shipping, run a separate copy pass with the **design-system** and
**frontend-read-audit** craft: tighten copy, reframe headlines, restructure — on top of the
preserved content, never replacing the source truth before it is safe.

## Worked reference: the personal portfolio migration

Same method, concrete instance. Old = `github.com/thuyqpham/thuyxpham` (legacy static portfolio,
UTF-16/UTF-8-mixed HTML); new = `/Users/thuypham/.kun/portfolio` (React/Vite, Vercel).

- **Sitemap:** the old `index.html` lists all 12 projects with `-0.jpg` card thumbnails
  (`cigna`, `inovelli`, `the-attico`, `rachel-zoe`, `cmyk-shiseido`, `bonbouton`, `lynx`,
  `fairfares`, `supreme`, `brownsshoes`, `pandora`, `10bagger`).
- **Data model:** `code-src/data/projects.ts` (interface `Project`: slug, title, client,
  category, featured, thumbnail, heroImage, logo, role, timeline, team, summary, problem,
  process[], solution[], outcomes[], tags, prototypeUrl?, gallery[], prevSlug?, nextSlug?).
  `featured:true` = main grid; `featured:false` = Archive on `/work`. `code-src/` is the live
  source (symlinked sibling); don't edit the stale `write-src/` duplicate.
- **Card maps:** Home/Work each keep `brandBg: Record<slug,hex>` and a `shortDesc` map — add
  entries for every slug or cards fall back to gray.
- **Images:** copy old images into `public/images/projects/` with original filenames, optimize
  (`sips` resize >1600 → 1600, q80). Logos in `public/images/logos/` as 400x400 brand-color
  squares with a white wordmark (`carrier.png` bg = its `brandBg`), or generate `<slug>.svg`.
  Keep paths consistent (`/images/projects/...`, `/images/logos/...`).
- **Verify/ship:** `npm run build` + `npm run lint` green; grep the content model for every
  `images/projects/*` path and confirm it exists in `public/`; commit + push (Vercel auto-deploy);
  confirm at `portfolio-thuy-pham-ux.vercel.app`.
- **Notes:** the old repo also has `video/` promo videos (not yet migrated); categories were
  re-mapped to the new taxonomy (e.g. "UX & UI / E-commerce" → "E-commerce Design").
