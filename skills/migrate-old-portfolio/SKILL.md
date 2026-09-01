---
id: migrate-old-portfolio
name: Migrate old portfolio
description: Scrape a legacy portfolio and migrate its sitemap + case-study content and images into a new React/Vite portfolio UI CONTENT-FIRST — populate the old copy, structure, and assets into the new UI exactly, THEN let the AI rewrite the content afterward as a separate pass (never rewrite before the content is safely ported). Triggers whenever the user wants to 'migrate old portfolio', 'bring old projects into the new site', 'add archived projects', 'port my old portfolio into the new UI', 'get content from the old portfolio'.
---

# Migrate old portfolio content

## The ordering (migrate-preserve first, rewrite second)

This migration is **content-preserving**. Do it in this order and never reverse it:

1. **Scrape + sitemap** — clone the old site, build the complete asset/page inventory (its
   index is the sitemap of every project + its images).
2. **Populate into the new UI** — port the old copy, structure, and images into the new
   React/Vite UI **unchanged** (data model + assets). Facts, voice, and structure stay intact.
3. **Verify it ships** — build + lint green, every asset referenced, deployed.
4. **AI rewrites the content** — only after the migration is landed does the AI editing pass
   rewrite the copy (tighten, reframe, restructure) on top of the preserved content.

If the AI rewrites *before* the port, the source truth is lost. Populate first, rewrite second.

## Reference target (Thuy's legacy → new portfolio)

- **Old:** `github.com/thuyqpham/thuyxpham` → the legacy site.
- **New:** `/Users/thuypham/.kun/portfolio` (React/Vite, deployed to Vercel). `code-src/` is the
  live source (symlinked sibling); do not touch `write-src/` (stale duplicate).

## 1. Clone and inventory (scrape + sitemap)

```bash
git clone --depth 1 https://github.com/thuyqpham/thuyxpham.git /tmp/thuyxpham-old
```

- Project pages are `*.html` at repo root (one per project: cigna, inovelli,
  the-attico, rachel-zoe, cmyk-shiseido, bonbouton, lynx, fairfares, supreme,
  brownsshoes, pandora, 10bagger).
- **The HTML is UTF-16/UTF-8 mixed** — `sed`/`grep` garbles. Use the Python extractor
  below, never raw grep on content.
- The old site uses Thuy's own logo on cards (`img/logo*`); project brand logos usually do
  NOT exist in the repo (except `aticco-logo-3d.gif` / attico). Generate wordmark SVGs
  instead (step 3).
- The old `index.html` is the **sitemap**: it lists all 12 projects with `-0.jpg` card
  thumbnails (`cigna.jpg`, `inovelli-0.jpg`, `bos-0.jpg`, `shiseido-0.jpg`,
  `bonbouton-0.jpg`, `attico-0.jpg`) — these are the card thumbnails.

Extract text + image inventory per page:

```python
import re, html
def extract(f):
    src = open(f, encoding='utf-8', errors='replace').read()
    body = re.sub(r'<script.*?</script>', ' ', src, flags=re.S)
    body = re.sub(r'<style.*?</style>', ' ', body, flags=re.S)
    text = re.sub(r'<[^>]+>', '\n', body)
    return [l.strip() for l in html.unescape(text).split('\n') if l.strip()]

def images(f):
    src = open(f, encoding='utf-8', errors='replace').read()
    return sorted(set(re.findall(r'img/[^"\')>\s]+', src)))
```

## 2. Data model (populate the new UI)

New site projects live in `code-src/data/projects.ts` (interface `Project`):

```ts
{ slug, title, client, category, featured, thumbnail, heroImage, logo,
  role, timeline, team, summary, problem, process: string[], solution: string[],
  outcomes: string[], tags, prototypeUrl?, gallery: string[], prevSlug?, nextSlug? }
```

- `featured: true` = main grid + "Featured" badge; `featured: false` = Archive section on
  `/work` (Work.tsx splits `featuredProjects` / `archiveProjects`).
- Card pages (Home.tsx, Work.tsx) each keep a `brandBg: Record<slug, hex>` map for the logo
  card background and a `shortDesc` map in Work.tsx — add entries for every new slug or cards
  fall back to gray.
- Fill `problem` / `process` / `solution` / `outcomes` from the old page's narrative sections
  ("project brief", "challenges & design solution", "redesign", etc.). **Keep the old voice;
  tighten grammar; preserve facts.** (The rewrite pass is separate — later.)

## 3. Images

Copy old images into `public/images/projects/` with their original filenames
(`lynx-001.jpg`, `FF-1.jpg`, `supreme-0.jpg`...). Optimize every copied file:

```bash
for f in *.jpg; do
  w=$(sips -g pixelWidth "$f" 2>/dev/null | awk '/pixelWidth/{print $2}')
  if [ "$w" -gt 1600 ] 2>/dev/null; then
    sips --resampleWidth 1600 -s format jpeg -s formatOptions 80 "$f" --out "$f.tmp" && mv "$f.tmp" "$f"
  else
    sips -s format jpeg -s formatOptions 80 "$f" --out "$f.tmp" && mv "$f.tmp" "$f"
  fi
done
```

Conventions:

- `thumbnail` = the `-0.jpg`/index card image; `heroImage` = the macbook mockup or first
  gallery image; `gallery` = the remaining numbered screenshots.
- Logos live in `public/images/logos/` as 400x400 brand-color squares with a white wordmark
  (e.g. `carrier.png` bg = its brandBg hex). For projects without a real logo, generate
  `public/images/logos/<slug>.svg` (rect fill = brandBg color + centered `<text>`).
  `attico.png` already exists in the repo.
- Keep paths consistent (`/images/projects/...`, `/images/logos/...`) — WorkDetail's
  hero/gallery fallback reads the same paths.

## 4. Verify + ship

```bash
npm run build   # tsc -b + vite build (must pass, no TS errors)
npm run lint    # oxlint, 0 errors
grep -o "images/projects/[a-zA-Z0-9-]*\.\(jpg\|png\)" code-src/data/projects.ts \
  | sort -u | while read p; do [ -f "public/$p" ] || echo "MISSING: $p"; done
git add -A && git commit -m "Migrate old portfolio case-study content + images"
git push origin main   # Vercel auto-deploys from GitHub
npx vercel ls portfolio --limit 2   # confirm new Production deployment
```

Deployment URL: `portfolio-thuy-pham-ux.vercel.app` (SSO-protected raw domain; confirm the
deploy by checking the built JS bundle for a unique content string).

## 5. Rewrite pass (only after the migration is landed)

Once the content is ported and shipping, run a separate copy-editing/rewrite pass with the
design-system + frontend-read-audit craft: tighten, reframe, restructure — on top of the
preserved content, never replacing the source truth before it is safe.

## Notes

- Old repo also contains `video/` (promo videos) — not yet migrated; Bonbouton's page links a
  promo video.
- Categories were re-mapped from the old taxonomy (e.g. old "UX & UI / E-commerce" →
  "E-commerce Design"; "Product Design. Web App." → "Product Design / Web App"). Keep the
  new-site category vocabulary.
- WorkDetail.tsx renders `process`/`solution` as paragraphs and gallery as a 2-col grid;
  `prototypeUrl` projects (Claire, 10Bagger) show InteractiveDemo instead of heroImage.
