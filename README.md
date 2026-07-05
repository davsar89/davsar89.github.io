# David Sarria's Personal Website

This repository contains the source code for David Sarria's personal website, showcasing his professional profile, research work, photography, and research cartoons.

## Structure

- `index.html`: The single page; About, CV, research list, photography, cartoons, and contact sections are all inlined
- `data/research.bib`: BibTeX source for publications
- `pdf/`: PDF files for publications (named `<bibtexkey>.pdf`)
- `cartoons/`: JPG cartoons for publications (named `<bibtexkey>.jpg`; case-insensitive lookup)
- `js/research.js`: Renders research entries from the BibTeX file with DOI/URL, PDF, slides, and cartoon links
- `js/cartoons.js`: Builds the cartoons gallery and modal viewer
- `js/bibtex_js.js`: Lightweight BibTeX parser
- `css/styles.css`: Custom styles (supplements the utility classes in `css/tailwind-lite.css`)

## Features

- Responsive design using Tailwind CSS
- Research articles loaded dynamically from `data/research.bib`, with DOI fallback for article links
- PDF download links and optional slides for theses
- Cartoons: per-article links plus a gallery with modal zoom; detected by matching JPG filenames to BibTeX keys
- Photography portfolio with categorized images

## Setup

1. Clone the repository.
2. Open `index.html` in a web browser to view the site locally (no build step required).

## Updating Content

- Edit `data/research.bib` to update publications. PDFs should be placed in `pdf/` and named `<bibtexkey>.pdf`. Cartoons go in `cartoons/` named `<bibtexkey>.jpg`.
- Edit the corresponding sections of `index.html` to adjust static content (About, CV, Photography, Contact).
- Adjust styles in `css/styles.css` as needed.

## Dependencies

- `css/tailwind-lite.css` (Tailwind v2 preflight + only the utility classes the site uses; no build step)
- `js/bibtex_js.js` (included locally for BibTeX parsing)

## License

This project is open-source and available under the MIT License.
