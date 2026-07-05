---
name: verify
description: Build/launch/drive recipe to verify changes to this static GitHub Pages site end-to-end.
---

# Verifying this site

Static site, no build step. Serve the repo root and drive it in headless Chrome.

## Launch

```bash
python -m http.server 8000   # from repo root, run in background
```

## Drive

- Quick rendered-DOM check (JS executed, publications/cartoons rendered):
  `chrome --headless=new --disable-gpu --virtual-time-budget=8000 --dump-dom http://localhost:8000/index.html`
  Then assert: `article-entry` count matches bib entries + 1 (masters thesis), `pub-count` text, `cartoon-card` count matches `cartoons/*.jpg` files whose basenames match bib keys, `id="contact-email"` contains a mailto link.
- Screenshots: `chrome --headless=new --hide-scrollbars --window-size=1280,3000 --screenshot=out.png <url>`.
  Note: the hero is ~100vh, so very tall windows push content down; `#fragment` URLs don't scroll before capture (smooth scroll races it), and `--full-page` is unsupported. For lower sections, drive Chrome over CDP: start with `--remote-debugging-port=NNNN --remote-allow-origins=*`, then `Runtime.evaluate` a `scrollIntoView()` + `Page.captureScreenshot` (python `websocket-client` is installed).
- Interactive probes worth running: pub search (`input` event) incl. garbage query → "No publications match your filters."; year `select` filter; cartoon lightbox open via Enter keypress (focus should land on close button, Escape should close and restore focus); mobile nav toggle at 390px (`nav-menu` display none → block, aria-expanded syncs).

## Gotchas

- In CDP `Runtime.evaluate`, wrap probes in IIFEs — top-level `const` persists across evaluate calls and re-declaration throws silently.
- `css/tailwind-lite.css` contains ONLY the utility classes the site uses; if a change adds a new Tailwind class, its definition must be added there too (check computed styles, not just class attributes).
- Asset link checks: every bib key in `data/research.bib` needs `pdf/<key>.pdf`; cartoons are optional (`cartoons/<key>.jpg`, case-insensitive).
