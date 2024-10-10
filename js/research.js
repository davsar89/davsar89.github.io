document.addEventListener('DOMContentLoaded', function() {
    fetch('data/research.bib')
        .then(response => response.text())
        .then(data => {
            const bibtex = new BibtexParser();
            bibtex.setInput(data);
            bibtex.bibtex();
            const entries = bibtex.getEntries();

            console.log('Parsed entries:', entries);

            const articlesContainer = document.getElementById('articles');

            const totalArticles = Object.keys(entries).length;
            let articleNumber = totalArticles ; 
            let currentYear = null;

            // Sort entries by year in descending order
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

            // Re-sort the entries to ensure the master's thesis is in the correct position
            sortedEntries.sort((a, b) => b.YEAR - a.YEAR);

            for (const entry of sortedEntries) {
                console.log('Current entry:', entry);

                const authors = entry.AUTHOR ? entry.AUTHOR.split(' and ').join(', ') : 'Unknown Author';
                const title = entry.TITLE || 'No Title';
                const journal = entry.JOURNAL || 'No Journal';
                const year = entry.YEAR || 'No Year';
                const bibtexKey = entry.BIBTEXKEY || 'UnknownKey';
                const bibtexRaw = entry.BIBTEXRAW || '';

                // Identify if this is the PhD thesis
                const isPhDThesis = title.toLowerCase().includes('modele monte carlo');

                console.log('Title:', title);
                console.log('Authors:', authors);
                console.log('Journal:', journal);
                console.log('Year:', year);
                console.log('BibTeX Key:', bibtexKey);
                console.log('BibTeX Entry:', bibtexRaw);

                // Insert a year separator if the year has changed
                if (year !== currentYear) {
                    const yearSeparator = document.createElement('div');
                    yearSeparator.classList.add('year-separator');
                    yearSeparator.textContent = year;
                    articlesContainer.appendChild(yearSeparator);
                    currentYear = year;
                }

                const article = document.createElement('div');
                article.classList.add('bg-gray-100', 'p-4', 'mb-4', 'rounded', 'shadow', 'article-entry');

                let articleContent = `
                    <div class="flex items-baseline">
                        <span class="article-number">[${articleNumber}]</span>
                        <h3 class="article-title">${title}</h3>
                    </div>
                    <p class="article-authors"><strong>Authors:</strong> ${authors}</p>
                    <p class="article-journal"><strong>Journal:</strong> ${journal}</p>
                    <p class="article-year"><strong>Year:</strong> ${year}</p>
                `;

                // Add language specification for master's thesis and PhD thesis
                if (entry.IS_MASTERS_THESIS || isPhDThesis) {
                    const language = entry.LANGUAGE || "French";
                    articleContent += `<p class="article-language"><strong>Language:</strong> ${language}</p>`;
                }

                article.innerHTML = articleContent;

                // Add URL link if present and not the master's thesis
                if (entry.URL && !entry.IS_MASTERS_THESIS) {
                    const urlLink = document.createElement('a');
                    urlLink.href = entry.URL;
                    urlLink.textContent = 'Read the full article';
                    urlLink.className = 'text-blue-500 hover:underline mt-2 inline-block';
                    urlLink.target = '_blank';
                    article.appendChild(urlLink);
                }

                // Add PDF download link, excluding specific papers
                if (!['marisaldi2024Highly', 'ostgaard2024Flickering'].includes(bibtexKey)) {
                    const pdfLink = document.createElement('a');
                    pdfLink.href = entry.IS_MASTERS_THESIS ? entry.URL : `pdf/${bibtexKey}.pdf`;
                    pdfLink.textContent = 'Download PDF';
                    pdfLink.className = 'text-blue-500 hover:underline mt-2 block';
                    pdfLink.download = entry.IS_MASTERS_THESIS ? 'Masters_thesis_SARRIA_DAVID_irap.pdf' : `${bibtexKey}.pdf`;
                    article.appendChild(pdfLink);
                }

                // Add slides download link for master's thesis
                if (entry.IS_MASTERS_THESIS) {
                    const slidesLink = document.createElement('a');
                    slidesLink.href = "pdf/masters_slides_SARRIA_DAVID.pdf";
                    slidesLink.textContent = 'Download Slides';
                    slidesLink.className = 'text-blue-500 hover:underline mt-2 block';
                    slidesLink.download = 'masters_slides_SARRIA_DAVID.pdf';
                    article.appendChild(slidesLink);
                }

                // Add slides download link for PhD thesis
                if (isPhDThesis) {
                    const slidesLink = document.createElement('a');
                    slidesLink.href = "pdf/slides_soutenance_these.pdf";
                    slidesLink.textContent = 'Download Slides';
                    slidesLink.className = 'text-blue-500 hover:underline mt-2 block';
                    slidesLink.download = 'slides_soutenance_these.pdf';
                    article.appendChild(slidesLink);
                }

                // Add BibTeX entry for regular entries
                if (bibtexRaw) {
                    const bibtexDetails = document.createElement('details');
                    bibtexDetails.className = 'mt-2';
                    bibtexDetails.innerHTML = `
                        <summary class="cursor-pointer text-blue-600">BibTeX Entry</summary>
                        <pre class="bibtex-entry">${bibtexRaw}</pre>
                    `;
                    article.appendChild(bibtexDetails);
                }

                articlesContainer.appendChild(article);

                articleNumber--;
            }
        })
        .catch(error => console.error('Error loading research articles:', error));
});