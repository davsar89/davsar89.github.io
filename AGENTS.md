# Repository Guidelines

## Project Structure & Module Organization
- `index.html`: Entry point that loads About, CV, Research, Photography, Cartoons, and Contact sections.
- `about.html`, `cv.html`, `photography.html`: Section fragments injected into `index.html`.
- `data/research.bib`: BibTeX source for publications; keys drive PDF/cartoon lookup.
- `pdf/`: Publication PDFs named `<bibtexkey>.pdf`.
- `cartoons/`: JPG cartoons named `<bibtexkey>.jpg` (case-insensitive lookup).
- `js/research.js`: Renders publications, links (DOI/URL), PDFs, slides, and “View cartoon” anchors.
- `js/cartoons.js`: Builds the cartoons grid and modal viewer.
- `css/styles.css`: Custom styles complementing `css/tailwind.min.css`.

## Build, Test, and Development Commands
- Local view: `python -m http.server 8000` (serve the repo root) and open `http://localhost:8000/index.html`.
- No build step or test suite; static assets load directly in the browser.

## Coding Style & Naming Conventions
- HTML/JS/CSS: 4-space indentation preferred; keep lines concise.
- Filenames: PDFs and cartoons must match BibTeX keys (e.g., `data/research.bib` entry `foo2024bar` → `pdf/foo2024bar.pdf`, `cartoons/foo2024bar.jpg`).
- Keep new assets in `pdf/` and `cartoons/`; avoid spaces in filenames.
- Use Tailwind utility classes where possible; add bespoke styles in `css/styles.css` sparingly.

## Testing Guidelines
- Manual verification: reload the site in a browser and confirm Research, Cartoons modal, and Photography sections render.
- Link checks: ensure “Read the full article,” “Download PDF,” and “View cartoon” anchors resolve.
- No automated tests configured.

## Commit & Pull Request Guidelines
- Commit messages: short imperative summaries (e.g., “Add cartoon gallery and links,” “Update README for cartoons and structure”).
- Before committing, ensure new assets follow naming rules and related links work in the browser.
- Pull requests (if used): include a brief description, mention affected sections (Research, Cartoons, etc.), and add screenshots/GIFs for UI changes when possible.

## Agent-Specific Tips
- When adding publications, update `data/research.bib` and place corresponding PDFs/JPGs with matching basenames.
- If author identity must omit email, set `GIT_AUTHOR_EMAIL` and `GIT_COMMITTER_EMAIL` to empty when committing.***
