# Mitsumeru

The Mitsumeru Desktop download page — a single-page static site.

- `index.html` — the one-pager (EVA dark design, zero dependencies)
- `icon-512.png` — app icon used in the hero and as favicon

Download links point at the release assets of
[`muen-collective/mitsumeru-desktop`](https://github.com/muen-collective/mitsumeru-desktop/releases).

## Deploy

The repo ships a GitHub Pages workflow. Enable it once in **Settings → Pages →
Source: GitHub Actions**; every push to `main` then publishes the site.

To update a download link or the version badge, edit `index.html` — it is
deliberately a single self-contained file.
