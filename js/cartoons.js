async function renderCartoons() {
    const grid = document.getElementById('cartoons-grid');
    const emptyState = document.getElementById('cartoons-empty');
    if (!grid) return;

    try {
        const ensureModal = () => {
            let modal = document.getElementById('cartoon-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'cartoon-modal';
                modal.className = 'cartoon-modal hidden';
                modal.innerHTML = `
                    <div class="cartoon-modal-content">
                        <button class="cartoon-modal-close" aria-label="Close">×</button>
                        <img src="" alt="Cartoon enlarged">
                        <div class="cartoon-modal-caption">
                            <h4 class="cartoon-modal-title"></h4>
                            <p class="cartoon-modal-meta"></p>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
            }

            if (!modal.dataset.bound) {
                const closeModal = () => {
                    modal.classList.add('hidden');
                    document.body.style.overflow = '';
                };

                modal.addEventListener('click', (event) => {
                    if (event.target.id === 'cartoon-modal' || event.target.classList.contains('cartoon-modal-close')) {
                        closeModal();
                    }
                });

                document.addEventListener('keydown', (event) => {
                    if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
                        closeModal();
                    }
                });

                modal.dataset.bound = 'true';
                modal.dataset.closeHandler = 'true';
            }

            return modal;
        };

        const modal = ensureModal();

        const openModal = (item) => {
            const img = modal.querySelector('img');
            const titleEl = modal.querySelector('.cartoon-modal-title');
            const metaEl = modal.querySelector('.cartoon-modal-meta');

            img.src = item.path;
            img.alt = `Cartoon for ${item.title}`;
            titleEl.textContent = item.title;

            const parts = [];
            if (item.year) parts.push(item.year);
            if (item.authors) parts.push(item.authors);
            metaEl.textContent = parts.join(' · ');

            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        };

        const fileExists = async (path) => {
            try {
                const response = await fetch(path, { method: 'HEAD' });
                return response.ok;
            } catch (error) {
                console.error('Error checking file:', path, error);
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
                if (fileName) {
                    return fileName.replace(/\.[^/.]+$/, '');
                }
            }
            return null;
        };

        const entries = await parseBibtex();

        // Include the master's thesis so its cartoon can be shown if present
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
            card.className = 'cartoon-card';
            card.id = `cartoon-${item.id}`;
            card.tabIndex = 0;
            card.innerHTML = `
                <div class="cartoon-frame">
                    <img src="${item.path}" alt="Cartoon for ${item.title}">
                </div>
                <div class="cartoon-meta">
                    <h4 class="cartoon-title">${item.title}</h4>
                    <p class="cartoon-year">Year: ${item.year || '—'}</p>
                    ${item.authors ? `<p class="cartoon-authors">${item.authors}</p>` : ''}
                </div>
            `;
            card.addEventListener('click', () => openModal(item));
            card.addEventListener('keypress', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openModal(item);
                }
            });
            grid.appendChild(card);
        });
    } catch (error) {
        console.error('Error rendering cartoons:', error);
        if (emptyState) {
            emptyState.textContent = 'Unable to load cartoons right now.';
            emptyState.classList.remove('hidden');
        }
    }
}

window.renderCartoons = renderCartoons;

document.addEventListener('DOMContentLoaded', () => {
    renderCartoons();
});
