/* Shared image lightbox factory used by cartoons and photo gallery. */
function createLightbox() {
    let modal = null;

    function ensureModal() {
        if (modal) return modal;
        modal = document.createElement('div');
        modal.id = 'image-lightbox';
        modal.className = 'image-lightbox hidden';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', 'Image viewer');
        modal.innerHTML = `
            <div class="image-lightbox-content">
                <button class="image-lightbox-close" aria-label="Close">×</button>
                <img src="" alt="">
                <div class="image-lightbox-caption">
                    <h4 class="image-lightbox-title"></h4>
                    <p class="image-lightbox-meta"></p>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const close = () => {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        };

        modal.addEventListener('click', (event) => {
            if (event.target === modal || event.target.classList.contains('image-lightbox-close')) {
                close();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
                close();
            }
        });

        return modal;
    }

    function open({ src, alt, title, caption }) {
        const m = ensureModal();
        const img = m.querySelector('img');
        const titleEl = m.querySelector('.image-lightbox-title');
        const metaEl = m.querySelector('.image-lightbox-meta');

        img.src = src;
        img.alt = alt || '';
        titleEl.textContent = title || '';
        titleEl.style.display = title ? '' : 'none';
        metaEl.textContent = caption || '';
        metaEl.style.display = caption ? '' : 'none';

        m.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    return { open };
}

window.__lightbox = createLightbox();

async function renderCartoons() {
    const grid = document.getElementById('cartoons-grid');
    const emptyState = document.getElementById('cartoons-empty');
    if (!grid) return;

    try {
        const fileExists = async (path) => {
            try {
                const response = await fetch(path, { method: 'HEAD' });
                return response.ok;
            } catch (error) {
                return false;
            }
        };

        const findCartoon = async (baseName) => {
            if (!baseName) return null;
            const candidates = Array.from(new Set([baseName, baseName.toLowerCase()]));
            for (const candidate of candidates) {
                const path = `cartoons/${candidate}.jpg`;
                if (await fileExists(path)) {
                    return { path, idBase: candidate };
                }
            }
            return null;
        };

        const parseBibtex = async () => {
            const response = await fetch('data/research.bib');
            const text = await response.text();
            const parser = new BibtexParser();
            parser.setInput(text);
            parser.bibtex();
            return Object.values(parser.getEntries());
        };

        const deriveBaseName = (entry) => {
            if (entry.BIBTEXKEY) return entry.BIBTEXKEY;
            if (entry.URL) {
                const fileName = entry.URL.split('/').pop();
                if (fileName) return fileName.replace(/\.[^/.]+$/, '');
            }
            return null;
        };

        const entries = await parseBibtex();

        entries.push({
            TITLE: "Modélisation des cascades électromagnétiques dans le milieu intergalactique",
            AUTHOR: "Sarria, D.",
            YEAR: '2012',
            URL: "pdf/Masters_thesis_SARRIA_DAVID_irap.pdf"
        });

        entries.sort((a, b) => (b.YEAR || 0) - (a.YEAR || 0));

        const seen = new Set();
        const cartoons = [];

        for (const entry of entries) {
            const baseName = deriveBaseName(entry);
            const dedupeKey = (baseName || '').toLowerCase();
            if (!baseName || seen.has(dedupeKey)) continue;
            seen.add(dedupeKey);

            const cartoon = await findCartoon(baseName);
            if (!cartoon) continue;

            cartoons.push({
                path: cartoon.path,
                id: cartoon.idBase,
                title: entry.TITLE || baseName,
                year: entry.YEAR || '',
                authors: entry.AUTHOR ? entry.AUTHOR.split(' and ').join(', ') : ''
            });
        }

        if (cartoons.length === 0) {
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        grid.innerHTML = '';

        cartoons.forEach((item) => {
            const card = document.createElement('div');
            card.className = 'cartoon-card reveal';
            card.id = `cartoon-${item.id}`;
            card.tabIndex = 0;
            card.setAttribute('role', 'button');
            card.setAttribute('aria-label', `View cartoon for ${item.title}`);
            card.innerHTML = `
                <div class="cartoon-frame">
                    <img src="${item.path}" alt="Cartoon for ${item.title}" loading="lazy">
                </div>
                <div class="cartoon-meta">
                    <h4 class="cartoon-title">${item.title}</h4>
                    <p class="cartoon-year">${item.year || 'n/a'}</p>
                    ${item.authors ? `<p class="cartoon-authors">${item.authors}</p>` : ''}
                </div>
            `;
            const openCartoon = () => window.__lightbox.open({
                src: item.path,
                alt: `Cartoon for ${item.title}`,
                title: item.title,
                caption: [item.year, item.authors].filter(Boolean).join(' · ')
            });
            card.addEventListener('click', openCartoon);
            card.addEventListener('keypress', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openCartoon();
                }
            });
            grid.appendChild(card);
        });

        document.dispatchEvent(new CustomEvent('cartoons:rendered'));
    } catch (error) {
        console.error('Error rendering cartoons:', error);
        if (emptyState) {
            emptyState.textContent = 'Unable to load cartoons right now.';
            emptyState.classList.remove('hidden');
        }
    }
}

window.renderCartoons = renderCartoons;

document.addEventListener('DOMContentLoaded', renderCartoons);
