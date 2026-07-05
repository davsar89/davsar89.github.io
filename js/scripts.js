/* =========================================================================
   David Sarria - Site interactions
   - Scroll reveal (IntersectionObserver, no library)
   - Publication search/filter
   - Photo lightbox (uses window.__lightbox from cartoons.js)
   - Nav scroll shadow + active link
   - Age computation for [data-age-from="YYYY-MM-DD"] elements
   ========================================================================= */

(function () {
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ----- Age computation -----
    function computeAge(birthdateStr) {
        const [y, m, d] = birthdateStr.split('-').map(Number);
        const now = new Date();
        let age = now.getFullYear() - y;
        const mDiff = (now.getMonth() + 1) - m;
        if (mDiff < 0 || (mDiff === 0 && now.getDate() < d)) {
            age--;
        }
        return age;
    }

    function updateAges(root) {
        (root || document).querySelectorAll('[data-age-from]').forEach(el => {
            const birthdate = el.getAttribute('data-age-from');
            if (!birthdate) return;
            const age = computeAge(birthdate);
            if (Number.isFinite(age) && age >= 0) {
                el.textContent = age;
            }
        });
    }

    // ----- Scroll reveal -----
    let revealObserver = null;
    function observeReveals(root = document) {
        const els = root.querySelectorAll('.reveal:not(.is-visible)');
        if (reduceMotion) {
            els.forEach(el => el.classList.add('is-visible'));
            return;
        }
        if (!revealObserver) {
            revealObserver = new IntersectionObserver((entries) => {
                entries.forEach(e => {
                    if (e.isIntersecting) {
                        e.target.classList.add('is-visible');
                        revealObserver.unobserve(e.target);
                    }
                });
            }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });
        }
        els.forEach(el => revealObserver.observe(el));
    }

    // ----- Publication search / filter -----
    function initPublicationFilter() {
        const search = document.getElementById('pub-search');
        const yearSel = document.getElementById('pub-year');
        const count = document.getElementById('pub-count');
        const container = document.getElementById('articles');
        if (!search || !yearSel || !container) return;

        const articles = Array.from(container.querySelectorAll('.article-entry'));
        const separators = Array.from(container.querySelectorAll('.year-separator'));
        const total = articles.length;

        const apply = () => {
            const q = search.value.trim().toLowerCase();
            const y = yearSel.value;
            let visible = 0;

            articles.forEach(a => {
                const matchesQuery = !q || a.dataset.search.includes(q);
                const matchesYear = !y || a.dataset.year === y;
                const show = matchesQuery && matchesYear;
                a.classList.toggle('is-hidden', !show);
                if (show) visible++;
            });

            // Hide year separators with no visible articles below them
            separators.forEach(sep => {
                let next = sep.nextElementSibling;
                let hasVisible = false;
                while (next && !next.classList.contains('year-separator')) {
                    if (next.classList.contains('article-entry') && !next.classList.contains('is-hidden')) {
                        hasVisible = true;
                        break;
                    }
                    next = next.nextElementSibling;
                }
                sep.classList.toggle('is-hidden', !hasVisible);
            });

            // Update count
            if (count) {
                count.textContent = (q || y)
                    ? `${visible} of ${total}`
                    : `${total} publications`;
            }

            // No-results placeholder
            let noResults = container.querySelector('.no-results');
            if (visible === 0) {
                if (!noResults) {
                    noResults = document.createElement('p');
                    noResults.className = 'no-results';
                    noResults.textContent = 'No publications match your filters.';
                    container.appendChild(noResults);
                }
            } else if (noResults) {
                noResults.remove();
            }
        };

        search.addEventListener('input', apply);
        yearSel.addEventListener('change', apply);
    }

    // ----- Photo lightbox -----
    function initPhotoLightbox() {
        const containers = document.querySelectorAll('#photography .photo-container');
        if (!containers.length || !window.__lightbox) return;

        containers.forEach(container => {
            if (container.dataset.lightboxBound) return;
            container.dataset.lightboxBound = 'true';

            const img = container.querySelector('img');
            const caption = container.querySelector('.overlay-text')?.textContent || img?.alt || '';
            if (!img) return;

            container.tabIndex = 0;
            container.setAttribute('role', 'button');
            container.setAttribute('aria-label', caption || 'View photo');

            const open = () => window.__lightbox.open({
                src: img.src,
                alt: img.alt,
                caption
            });

            container.addEventListener('click', open);
            container.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    open();
                }
            });
        });
    }

    // ----- Nav: scroll shadow + active section -----
    function initNav() {
        const nav = document.querySelector('.fixed-nav');
        const links = document.querySelectorAll('#nav-menu a[href^="#"]');
        if (!nav) return;

        const backToTop = document.getElementById('back-to-top');
        const onScroll = () => {
            nav.classList.toggle('is-scrolled', window.scrollY > 60);
            if (backToTop) {
                backToTop.classList.toggle('is-visible', window.scrollY > 600);
            }
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });

        if (backToTop) {
            backToTop.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
            });
        }

        // Brand ("David Sarria, PhD") scrolls back to the top of the page
        const brand = nav.querySelector('a.brand');
        if (brand) {
            brand.addEventListener('click', (e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
            });
        }

        if (!links.length) return;
        const sections = Array.from(links)
            .map(a => document.querySelector(a.getAttribute('href')))
            .filter(Boolean);

        if (!sections.length) return;

        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    const id = e.target.id;
                    links.forEach(a => {
                        a.classList.toggle('nav-active', a.getAttribute('href') === `#${id}`);
                    });
                }
            });
        }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

        sections.forEach(s => sectionObserver.observe(s));
    }

    // ----- Contact email (assembled at runtime to stay scrape-resistant) -----
    function initContactEmail() {
        const holder = document.getElementById('contact-email');
        if (!holder) return;
        const address = ['david', '.', 'sarria'].join('') + '@' + ['uib', 'no'].join('.');
        const link = document.createElement('a');
        link.href = 'mailto:' + address;
        link.textContent = address;
        holder.prepend(link);
    }

    // ----- Footer year -----
    function updateFooterYear() {
        const el = document.getElementById('footer-year');
        if (el) el.textContent = new Date().getFullYear();
    }

    // ----- Init -----
    // About/CV/Photography are now inline in index.html (no fragment fetch),
    // so age, reveals, and the photo lightbox are wired up directly here.
    document.addEventListener('DOMContentLoaded', () => {
        observeReveals();
        initNav();
        updateAges();
        initPhotoLightbox();
        initContactEmail();
        updateFooterYear();
    });

    document.addEventListener('publications:rendered', () => {
        observeReveals();
        initPublicationFilter();
    });

    document.addEventListener('cartoons:rendered', () => {
        observeReveals();
    });
})();
