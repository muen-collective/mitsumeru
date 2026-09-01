---
id: animate-entrance
name: Animate entrance
description: Apply entrance animations to any page, prototype, or static clone - per-component staggered fade + move on load, hover grow, and scroll-triggered reveal. (Formerly "Framer treatment": the motion language shared by most Framer templates, recreated in vanilla CSS + JS.) Triggers whenever the user says "give it the framer treatment", "framer-style animations", "make it feel like Framer", "add Framer appear effects", "staggered entrance animations", "animate the entrance", or asks why a clone/page has no animations.
---

# Animate entrance (the animation recipe)

The motion language shared by most Framer templates, recreated in vanilla
CSS + a few lines of JS so it works on static HTML, cloned sites, and
React/Vite builds alike. No Framer runtime, no libraries.

## The three animation families

1. **Entrance (appear effect)** - every component is treated as an individual:
   on load it fades in AND moves (rise 20-30px with a slight scale, ~0.96),
   staggered so components appear one after another, not all at once.
   Section headings reveal the same way when they scroll into view.
2. **Hover** - when a component is hovered, EITHER the component grows
   (scale 1.02-1.05 on the whole card) OR the content inside grows
   (scale 1.05-1.1 on the image/media inside the card).
3. **Scroll** - scrolling triggers its own motion: below-fold sections grow
   or rise into view on first scroll-in, and long sections can be *pinned
   and folded* (the term is "pinned / sticky sections"): the section sticks
   to the viewport while the next section folds over it or its content
   transforms as it passes.

## Defaults

| Property | Value |
| --- | --- |
| Easing | `cubic-bezier(0.22, 1, 0.36, 1)` (calm ease-out, no bounce/elastic) |
| Entrance duration | 0.7s |
| Hover duration | 0.3-0.4s |
| Entrance travel | `translateY(26px) scale(0.96)` |
| Stagger | 0.15s per row (or per sibling index, cap ~0.6s) |
| Reveal trigger | `IntersectionObserver`, `threshold 0.1`, `rootMargin 0 0 -40px` |
| Reduced motion | disable everything via `prefers-reduced-motion: reduce` |

## Implementation (vanilla, dependency-free)

### 1. Entrance + scroll reveal

`IntersectionObserver` adds the settled state on first scroll into view.
**Verified implementation** (shipped in the Hand Me Up velora prototype,
`product/epics/velora-prototype/index.html`):

```js
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;

  function pick() {
    var out = Array.prototype.slice.call(document.querySelectorAll('[data-framer-appear-id]'));
    // template work/project cards (Velora a.framer-prk6z7, Artemis a.framer-1x8qwn6)
    document.querySelectorAll('a.framer-prk6z7, a.framer-1x8qwn6, article, .work-card').forEach(function (el) {
      if (el.closest('[data-framer-appear-id]')) return;
      if (!out.includes(el)) out.push(el);
    });
    // section heading blocks (the framed section headers Framer animates)
    document.querySelectorAll('section [data-framer-component-type="RichTextContainer"] > h2, section h2, .section-head').forEach(function (el) {
      if (el.closest('[data-framer-appear-id]') || el.closest('a.framer-prk6z7') || el.closest('a.framer-1x8qwn6')) return;
      if (!out.includes(el)) out.push(el);
    });
    return out;
  }

  var els = pick();
  if (!els.length) return;
  els.forEach(function (el) {
    if (el.__hmuOrig !== undefined) return;
    el.__hmuOrig = el.style.transform || '';
    el.style.opacity = '0';
    el.style.transform = 'translateY(26px) scale(0.96)';
    el.style.transition = 'opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1)';
    el.style.willChange = 'opacity, transform';
    // Per-row stagger for card grids (2-col grid example)
    if (el.closest('.framer-16xmg5m')) {
      var idx = Array.prototype.indexOf.call(el.closest('.framer-16xmg5m').children, el);
      var row = Math.floor(idx / 2);
      el.style.transitionDelay = (row * 0.15) + 's';
    }
  });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        var el = e.target;
        el.style.opacity = '1';
        el.style.transform = el.__hmuOrig || 'none';
        // Clear inline styles after transition so CSS hover works
        var delay = parseFloat(el.style.transitionDelay) || 0;
        setTimeout(function () {
          el.style.opacity = '';
          el.style.transform = '';
          el.style.transition = '';
          el.style.transitionDelay = '';
          el.style.willChange = '';
        }, (0.7 + delay) * 1000 + 100);
        io.unobserve(el);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  els.forEach(function (el) { io.observe(el); });
})();
```

Key invariants:
- **Preserve original inline transforms** (e.g. scattered hero tile angles):
  stash `el.style.transform` before hiding, restore it on reveal. Never
  overwrite the settled layout.
- **Clear the inline transition styles after the animation** or CSS `:hover`
  transforms will be overridden by the inline `transition`/`transform`.
- In React/Vite this is the same pattern with a `.visible` class:
  `IntersectionObserver` adds the class, CSS handles the transition.

### 2. Hover grow

CSS only, on the component or its inner media:

```css
/* whole component grows */
.card { transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1); }
.card:hover { transform: scale(1.03); }

/* content inside grows (image zoom, card stays put) */
.card img { transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1); }
.card:hover img { transform: scale(1.08); }
```

For galleries and portfolio cards, the inner-image zoom is the more
"Framer" feel. Either variant, never both on the same card unless the
design calls for it.

### 3. Pinned / folded sections (scroll-driven)

The section sticks while the following content folds over it, or its own
content transforms with scroll progress:

```css
.pinned { position: sticky; top: 0; height: 100vh; overflow: hidden; }
```

```js
// scale/parallax the pinned content with scroll progress (rAF-throttled)
var el = document.querySelector('.pinned-content');
var ticking = false;
function update() {
  var p = Math.min(window.scrollY / 500, 1);
  el.style.transform = 'scale(' + (1 + p * 0.12) + ')';
  ticking = false;
}
window.addEventListener('scroll', function () {
  if (!ticking) { ticking = true; requestAnimationFrame(update); }
}, { passive: true });
update();
```

## Why clones lose animations (context)

Framer's appear effects are driven by Framer's JS runtime. Cloning a Framer
site strips the scripts, so the captured DOM keeps only the settled end
state (opacity 1, transform none) and the now-dead `data-framer-appear-id`
markers. **Never ship a static clone without re-adding motion via this
recipe** - the reveal script above reuses the template's own
`data-framer-appear-id` elements plus card/section selectors, so it works
on clones unchanged.

## Rules

- Animate components (cards, headings, rows), not text nodes or every div.
- One clear motion per element: entrance on load/scroll-in, hover on
  hover. Don't stack three effects on the same element.
- Stagger feels alive; uniform simultaneous animation feels dead. Cap
  stagger at ~0.6s so the last items are not rude about it.
- Always honor `prefers-reduced-motion: reduce` - no opacity flicker, no
  layout shift for those users.
- Calm ease-out only (`cubic-bezier(0.22, 1, 0.36, 1)`). No bounce,
  elastic, or overshoot easing - it reads as template-slop.
- Mobile: shrink travel (12-16px) and stagger (0.1s), and skip pinning on
  short viewports if it breaks layout.
