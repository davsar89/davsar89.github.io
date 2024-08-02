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
            let articleNumber = totalArticles;
            let currentYear = null;

            // Sort entries by year in descending order
            const sortedEntries = Object.values(entries).sort((a, b) => b.YEAR - a.YEAR);

            for (const entry of sortedEntries) {
                console.log('Current entry:', entry);

                const authors = entry.AUTHOR ? entry.AUTHOR.split(' and ').join(', ') : 'Unknown Author';
                const title = entry.TITLE || 'No Title';
                const journal = entry.JOURNAL || 'No Journal';
                const year = entry.YEAR || 'No Year';
                const bibtexKey = entry.BIBTEXKEY || 'UnknownKey';
                const bibtexRaw = entry.BIBTEXRAW || '';

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
                article.classList.add('bg-gray-100', 'p-4', 'mb-4', 'rounded', 'shadow');

                article.innerHTML = `
                    <div class="flex items-baseline">
                        <span class="article-number">[${articleNumber}]</span>
                        <h3 class="article-title">${title}</h3>
                    </div>
                    <p class="article-authors"><strong>Authors:</strong> ${authors}</p>
                    <p class="article-journal"><strong>Journal:</strong> ${journal}</p>
                    <p class="article-year"><strong>Year:</strong> ${year}</p>
                    <details class="mt-2">
                        <summary class="cursor-pointer text-blue-600">BibTeX Entry</summary>
                        <pre class="bibtex-entry">${bibtexRaw}</pre>
                    </details>
                `;

                // Add URL link if present
                if (entry.URL) {
                    const urlLink = document.createElement('a');
                    urlLink.href = entry.URL;
                    urlLink.textContent = 'Read the full article';
                    urlLink.className = 'text-blue-500 hover:underline mt-2 inline-block';
                    urlLink.target = '_blank';
                    article.appendChild(urlLink);
                }

                // Add PDF download link
                const pdfLink = document.createElement('a');
                pdfLink.href = `pdf/${bibtexKey}.pdf`;
                pdfLink.textContent = 'Download PDF';
                pdfLink.className = 'text-blue-500 hover:underline mt-2 block';
                pdfLink.download = `${bibtexKey}.pdf`;
                article.appendChild(pdfLink);

                articlesContainer.appendChild(article);

                articleNumber--;
            }
        })
        .catch(error => console.error('Error loading research articles:', error));
});
