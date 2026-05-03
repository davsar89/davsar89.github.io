document.addEventListener('DOMContentLoaded', function() {
    fetch('data/research.bib')
        .then(response => response.text())
        .then(data => {
            const bibtex = new BibtexParser();
            bibtex.setInput(data);
            bibtex.bibtex();
            const entries = bibtex.getEntries();

            const cartoonExists = (path) => fetch(path, { method: 'HEAD' })
                .then(response => response.ok)
                .catch(() => false);

            const findCartoon = async (baseName) => {
                if (!baseName) return null;
                const candidates = Array.from(new Set([baseName, baseName.toLowerCase()]));
                for (const candidate of candidates) {
                    const path = `cartoons/${candidate}.jpg`;
                    if (await cartoonExists(path)) {
                        return { path, idBase: candidate };
                    }
                }
                return null;
            };

            const articlesContainer = document.getElementById('articles');
            if (!articlesContainer) return;

            const totalArticles = Object.keys(entries).length + 1; // +1 for masters thesis
            let articleNumber = totalArticles;
            let currentYear = null;

            const sortedEntries = Object.values(entries).sort((a, b) => b.YEAR - a.YEAR);

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

                let articleContent = `
                    <div class="flex items-baseline">
                        <span class="article-number">[${articleNumber}]</span>
                        <h3 class="article-title">${title}</h3>
                    </div>
                    <p class="article-authors"><strong>Authors:</strong> ${authors}</p>
                    <p class="article-journal"><strong>Journal:</strong> ${journal}</p>
                    <p class="article-year"><strong>Year:</strong> ${year}</p>
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

                if (!['marisaldi2024Highly', 'ostgaard2024Flickering'].includes(bibtexKey)) {
                    const pdfLink = document.createElement('a');
                    pdfLink.href = entry.IS_MASTERS_THESIS ? entry.URL : `pdf/${bibtexKey}.pdf`;
                    pdfLink.textContent = 'Download PDF';
                    pdfLink.className = 'article-link';
                    pdfLink.download = entry.IS_MASTERS_THESIS ? 'Masters_thesis_SARRIA_DAVID_irap.pdf' : `${bibtexKey}.pdf`;
                    article.appendChild(pdfLink);
                }

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
