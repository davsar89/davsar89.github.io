/* Shared image lightbox factory used by cartoons and photo gallery. */
function createLightbox() {
    let modal = null;
    let lastFocused = null;

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
            if (lastFocused && typeof lastFocused.focus === 'function') {
                lastFocused.focus();
            }
            lastFocused = null;
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
        lastFocused = document.activeElement;
        m.querySelector('.image-lightbox-close').focus();
    }

    return { open };
}

window.__lightbox = createLightbox();

async function renderCartoons() {
    const grid = document.getElementById('cartoons-grid');
    const emptyState = document.getElementById('cartoons-empty');
    if (!grid) return;

    try {
        // Shared with research.js: single bib fetch + cached parallel HEAD probes.
        const { entries: getEntries, findCartoon } = window.__pubData;

        const deriveBaseName = (entry) => {
            if (entry.BIBTEXKEY) return entry.BIBTEXKEY;
            if (entry.URL) {
                const fileName = entry.URL.split('/').pop();
                if (fileName) return fileName.replace(/\.[^/.]+$/, '');
            }
            return null;
        };

        const entries = await getEntries();

        entries.push({
            TITLE: "Modélisation des cascades électromagnétiques dans le milieu intergalactique",
            AUTHOR: "Sarria, D.",
            YEAR: '2012',
            URL: "pdf/Masters_thesis_SARRIA_DAVID_irap.pdf"
        });

        entries.sort((a, b) => (b.YEAR || 0) - (a.YEAR || 0));

        const seen = new Set();
        const uniqueEntries = entries.filter((entry) => {
            const baseName = deriveBaseName(entry);
            const dedupeKey = (baseName || '').toLowerCase();
            if (!baseName || seen.has(dedupeKey)) return false;
            seen.add(dedupeKey);
            return true;
        });

        // Probe all entries in parallel, keeping the sorted order.
        const cartoons = (await Promise.all(uniqueEntries.map(async (entry) => {
            const baseName = deriveBaseName(entry);
            const cartoon = await findCartoon(baseName);
            if (!cartoon) return null;
            const authorList = entry.AUTHOR ? entry.AUTHOR.split(' and ') : [];
            return {
                path: cartoon.path,
                id: cartoon.idBase,
                title: entry.TITLE || baseName,
                year: entry.YEAR || '',
                authors: authorList.length > 2 ? `${authorList[0]}, et al.` : authorList.join(', ')
            };
        }))).filter(Boolean);

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
