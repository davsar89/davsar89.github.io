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

                console.log('Title:', title);
                console.log('Authors:', authors);
                console.log('Journal:', journal);
                console.log('Year:', year);

                const bibtexRaw = entry.BIBTEXRAW || '';

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

                

                if (entry.URL) {
                    const urlLink = document.createElement('a');
                    urlLink.href = entry.URL;
                    urlLink.textContent = 'Read the full article';
                    urlLink.className = 'text-blue-500 hover:underline mt-2 inline-block';
                    urlLink.target = '_blank';
                    article.appendChild(urlLink);
                }

                articlesContainer.appendChild(article);

                articleNumber--;
            }
        })
        .catch(error => console.error('Error loading research articles:', error));
});
