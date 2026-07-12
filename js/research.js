/* Shared publication data: one fetch/parse of research.bib and one set of
   cartoon HEAD probes (cached, parallel) reused by research.js and cartoons.js. */
window.__pubData = window.__pubData || (() => {
    const entriesPromise = fetch('data/research.bib')
        .then(response => response.text())
        .then(data => {
            const bibtex = new BibtexParser();
            bibtex.setInput(data);
            bibtex.bibtex();
            return Object.values(bibtex.getEntries());
        });

    const fileExists = (path) => fetch(path, { method: 'HEAD' })
        .then(response => response.ok)
        .catch(() => false);

    const cartoonCache = new Map();
    const findCartoon = (baseName) => {
        if (!baseName) return Promise.resolve(null);
        if (!cartoonCache.has(baseName)) {
            cartoonCache.set(baseName, (async () => {
                const candidates = Array.from(new Set([baseName, baseName.toLowerCase()]));
                const hits = await Promise.all(
                    candidates.map(candidate => fileExists(`cartoons/${candidate}.jpg`))
                );
                const index = hits.indexOf(true);
                if (index === -1) return null;
                return { path: `cartoons/${candidates[index]}.jpg`, idBase: candidates[index] };
            })());
        }
        return cartoonCache.get(baseName);
    };

    return {
        entries: () => entriesPromise.then(list => list.slice()),
        findCartoon
    };
})();

document.addEventListener('DOMContentLoaded', function() {
    window.__pubData.entries()
        .then(entries => {
            const findCartoon = window.__pubData.findCartoon;

            const articlesContainer = document.getElementById('articles');
            if (!articlesContainer) return;

            const totalArticles = entries.length + 1; // +1 for masters thesis
            let articleNumber = totalArticles;
            let currentYear = null;

            const sortedEntries = entries.sort((a, b) => b.YEAR - a.YEAR);

            // Add master's thesis
            const mastersThesis = {
                YEAR: '2012',
                TITLE: "Modélisation des cascades électromagnétiques dans le milieu intergalactique",
                AUTHOR: "Sarria, D.",
                JOURNAL: "No Journal",
                URL: "pdf/Masters_thesis_SARRIA_DAVID_irap.pdf",
                IS_MASTERS_THESIS: true,
                LANGUAGE: "French"
            };
            sortedEntries.push(mastersThesis);
            sortedEntries.sort((a, b) => b.YEAR - a.YEAR);

            for (const entry of sortedEntries) {
                const authors = entry.AUTHOR ? entry.AUTHOR.split(' and ').join(', ') : 'Unknown Author';
                const title = entry.TITLE || 'No Title';
                const journal = entry.JOURNAL || 'No Journal';
                const year = entry.YEAR || 'No Year';
                const bibtexKey = entry.BIBTEXKEY || 'UnknownKey';
                const bibtexRaw = entry.BIBTEXRAW || '';
                const articleUrl = entry.URL || (entry.DOI ? `https://doi.org/${entry.DOI}` : null);
                const pdfFileName = entry.IS_MASTERS_THESIS ? entry.URL : `pdf/${bibtexKey}.pdf`;
                const pdfBaseName = pdfFileName ? pdfFileName.split('/').pop().replace(/\.pdf$/i, '') : null;
                const baseNameFromUrl = entry.URL ? entry.URL.split('/').pop().replace(/\.[^/.]+$/, '') : null;
                const cartoonBase = entry.BIBTEXKEY || pdfBaseName || baseNameFromUrl;

                const isPhDThesis = title.toLowerCase().includes('modele monte carlo');

                // Insert a year separator if the year has changed
                if (year !== currentYear) {
                    const yearSeparator = document.createElement('div');
                    yearSeparator.classList.add('year-separator');
                    yearSeparator.dataset.year = year;
                    yearSeparator.innerHTML = `<span class="year-separator-inner">${year}</span>`;
                    articlesContainer.appendChild(yearSeparator);
                    currentYear = year;
                }

                const article = document.createElement('div');
                article.classList.add('article-entry', 'reveal');
                article.dataset.year = year;
                article.dataset.search = `${title} ${authors} ${journal}`.toLowerCase();

                // Compact citation line: authors (own name bolded), venue in italics, year.
                const authorsHtml = authors.replace(/Sarria, D\./g, '<strong>Sarria, D.</strong>');
                let venue = journal;
                if (entry.IS_MASTERS_THESIS) venue = "Master's thesis";
                else if (isPhDThesis) venue = 'PhD thesis';
                const citeParts = [authorsHtml];
                if (venue && venue !== 'No Journal') citeParts.push(`<em>${venue}</em>`);
                citeParts.push(year);

                let articleContent = `
                    <div class="flex items-baseline">
                        <span class="article-number">[${articleNumber}]</span>
                        <h3 class="article-title">${title}</h3>
                    </div>
                    <p class="article-cite">${citeParts.join(' · ')}</p>
                `;

                if (entry.IS_MASTERS_THESIS || isPhDThesis) {
                    const language = entry.LANGUAGE || "French";
                    articleContent += `<p class="article-language"><strong>Language:</strong> ${language}</p>`;
                }

                article.innerHTML = articleContent;

                if (articleUrl && !entry.IS_MASTERS_THESIS) {
                    const urlLink = document.createElement('a');
                    urlLink.href = articleUrl;
                    urlLink.textContent = 'Read the full article';
                    urlLink.className = 'article-link';
                    urlLink.target = '_blank';
                    urlLink.rel = 'noopener';
                    article.appendChild(urlLink);
                }

                const pdfLink = document.createElement('a');
                pdfLink.href = entry.IS_MASTERS_THESIS ? entry.URL : `pdf/${bibtexKey}.pdf`;
                pdfLink.textContent = 'Download PDF';
                pdfLink.className = 'article-link';
                pdfLink.download = entry.IS_MASTERS_THESIS ? 'Masters_thesis_SARRIA_DAVID_irap.pdf' : `${bibtexKey}.pdf`;
                article.appendChild(pdfLink);

                if (cartoonBase) {
                    findCartoon(cartoonBase).then((cartoon) => {
                        if (!cartoon) return;
                        const cartoonHash = `cartoon-${cartoon.idBase}`;
                        const cartoonLink = document.createElement('a');
                        cartoonLink.href = `#${cartoonHash}`;
                        cartoonLink.textContent = 'View cartoon';
                        cartoonLink.className = 'article-link';
                        cartoonLink.addEventListener('click', (event) => {
                            const targetEl = document.getElementById(cartoonHash);
                            if (targetEl) {
                                event.preventDefault();
                                targetEl.scrollIntoView({ behavior: 'smooth' });
                            }
                        });
                        article.appendChild(cartoonLink);
                    });
                }

                if (entry.IS_MASTERS_THESIS) {
                    const slidesLink = document.createElement('a');
                    slidesLink.href = "pdf/masters_slides_SARRIA_DAVID.pdf";
                    slidesLink.textContent = 'Download Slides';
                    slidesLink.className = 'article-link';
                    slidesLink.download = 'masters_slides_SARRIA_DAVID.pdf';
                    article.appendChild(slidesLink);

                    const egmfLink = document.createElement('a');
                    egmfLink.href = "pdf/Calculs_EGMF_propagation3D.pdf";
                    egmfLink.textContent = 'extension with EGMF 3D calculations';
                    egmfLink.className = 'article-link';
                    egmfLink.download = 'Calculs_EGMF_propagation3D.pdf';
                    article.appendChild(egmfLink);

                    const codeLink = document.createElement('a');
                    codeLink.href = "https://github.com/davsar89/cascades";
                    codeLink.textContent = 'Download associated code';
                    codeLink.className = 'article-link';
                    codeLink.target = '_blank';
                    codeLink.rel = 'noopener';
                    article.appendChild(codeLink);
                }

                if (isPhDThesis) {
                    const slidesLink = document.createElement('a');
                    slidesLink.href = "pdf/slides_soutenance_these.pdf";
                    slidesLink.textContent = 'Download Slides';
                    slidesLink.className = 'article-link';
                    slidesLink.download = 'slides_soutenance_these.pdf';
                    article.appendChild(slidesLink);
                }

                if (bibtexRaw) {
                    const bibtexDetails = document.createElement('details');
                    bibtexDetails.innerHTML = `
                        <summary>BibTeX</summary>
                        <pre class="bibtex-entry">${bibtexRaw}</pre>
                    `;
                    article.appendChild(bibtexDetails);
                }

                articlesContainer.appendChild(article);
                articleNumber--;
            }

            // Populate year filter
            const years = [...new Set(sortedEntries.map(e => e.YEAR).filter(Boolean))].sort((a, b) => b - a);
            const yearSelect = document.getElementById('pub-year');
            if (yearSelect) {
                years.forEach(y => yearSelect.add(new Option(y, y)));
            }

            // Initial count
            const countEl = document.getElementById('pub-count');
            if (countEl) {
                countEl.textContent = `${sortedEntries.length} publications`;
            }

            document.dispatchEvent(new CustomEvent('publications:rendered', {
                detail: { count: sortedEntries.length }
            }));
        })
        .catch(error => console.error('Error loading research articles:', error));
});
