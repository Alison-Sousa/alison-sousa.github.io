document.addEventListener('DOMContentLoaded', function () {
    var body = document.body;
    var docElement = document.documentElement;
    var currentTranslations = {};
    var currentSearchDatabase = [];

    var themeToggle = document.getElementById('theme-toggle');

    function applyTheme(theme) {
        if (theme === 'dark') {
            docElement.classList.add('dark-mode');
        } else {
            docElement.classList.remove('dark-mode');
        }
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', function (e) {
            var isDark = docElement.classList.contains('dark-mode');
            var newTheme = isDark ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            if (!document.startViewTransition) {
                applyTheme(newTheme);
                return;
            }
            docElement.style.setProperty('--clip-x', e.clientX + 'px');
            docElement.style.setProperty('--clip-y', e.clientY + 'px');
            document.startViewTransition(function () {
                applyTheme(newTheme);
            });
        });
    }

    var menuToggle = document.getElementById('menu-toggle');
    var menuClose = document.getElementById('menu-close');
    var menuOverlay = document.getElementById('menu-overlay');

    function openMenu() {
        menuOverlay.classList.add('active');
        body.classList.add('menu-open');
        body.style.overflow = 'hidden';
    }

    function closeMenu() {
        menuOverlay.classList.remove('active');
        body.classList.remove('menu-open');
        body.style.overflow = '';
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', function () {
            if (menuOverlay.classList.contains('active')) {
                closeMenu();
            } else {
                openMenu();
            }
        });
    }

    if (menuClose) {
        menuClose.addEventListener('click', closeMenu);
    }

    if (menuOverlay) {
        menuOverlay.addEventListener('click', function (e) {
            if (e.target === menuOverlay) closeMenu();
        });
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && menuOverlay && menuOverlay.classList.contains('active')) {
            closeMenu();
        }
    });

    document.querySelectorAll('.menu-nav a').forEach(function (link) {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            var targetId = link.getAttribute('href');
            closeMenu();
            setTimeout(function () {
                var target = document.querySelector(targetId);
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 350);
        });
    });

    var langToggleBtn = document.getElementById('lang-toggle');
    var langFlagImg = document.getElementById('lang-flag');

    function applyTranslations(jsonData) {
        currentTranslations = jsonData;
        currentSearchDatabase = jsonData.search_database || [];

        document.querySelectorAll('[data-t]').forEach(function (el) {
            var key = el.getAttribute('data-t');
            if (jsonData[key]) el.innerHTML = jsonData[key];
        });

        document.querySelectorAll('[data-t-placeholder]').forEach(function (el) {
            var key = el.getAttribute('data-t-placeholder');
            if (jsonData[key]) el.placeholder = jsonData[key];
        });

        document.querySelectorAll('[data-t-title]').forEach(function (el) {
            var key = el.getAttribute('data-t-title');
            if (jsonData[key]) el.title = jsonData[key];
        });

        document.querySelectorAll('[data-t-aria]').forEach(function (el) {
            var key = el.getAttribute('data-t-aria');
            if (jsonData[key]) el.setAttribute('aria-label', jsonData[key]);
        });

        document.querySelectorAll('[data-t-href]').forEach(function (el) {
            var key = el.getAttribute('data-t-href');
            if (jsonData[key]) el.href = jsonData[key];
        });

        document.querySelectorAll('[data-t-src]').forEach(function (el) {
            var key = el.getAttribute('data-t-src');
            if (jsonData[key]) el.src = jsonData[key];
        });

        document.title = jsonData.doc_title || 'Alison Sousa';
        document.documentElement.lang = jsonData.html_lang || 'en';

        body.classList.add('js-loaded');
    }

    function updateLangToggle(lang) {
        if (!langToggleBtn || !langFlagImg) return;
        if (lang === 'pt-br') {
            langToggleBtn.setAttribute('data-lang', 'pt-br');
            langToggleBtn.title = 'Português';
            langFlagImg.src = 'images/pt-br.svg';
            langFlagImg.alt = 'Português';
        } else {
            langToggleBtn.setAttribute('data-lang', 'en');
            langToggleBtn.title = 'English';
            langFlagImg.src = 'images/en.svg';
            langFlagImg.alt = 'English';
        }
    }

    async function translatePage(lang) {
        try {
            var response = await fetch('lang/' + lang + '.json');
            if (!response.ok) throw new Error('Failed');
            var jsonData = await response.json();
            applyTranslations(jsonData);
            localStorage.setItem('lang', lang);
            updateLangToggle(lang);
        } catch (e) {
            if (lang !== 'en') translatePage('en');
        }
    }

    if (langToggleBtn) {
        langToggleBtn.addEventListener('click', function () {
            var currentLang = document.documentElement.lang || 'en';
            var nextLang = currentLang === 'en' ? 'pt-br' : 'en';
            translatePage(nextLang);
        });
    }

    var searchInput = document.getElementById('search-input');
    var searchResults = document.getElementById('search-results');

    function scrollToElement(selector) {
        var element = document.querySelector(selector);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            element.style.transition = 'background-color 0.5s ease-in-out';
            element.style.backgroundColor = '#ffc10733';
            setTimeout(function () {
                element.style.backgroundColor = 'transparent';
            }, 2000);
        }
    }

    if (searchInput && searchResults) {
        searchInput.addEventListener('input', function (e) {
            var query = e.target.value.toLowerCase();
            if (query.length < 2) {
                searchResults.style.display = 'none';
                return;
            }

            var results = currentSearchDatabase.filter(function (item) {
                return item.term.toLowerCase().includes(query);
            });

            searchResults.innerHTML = '';

            if (results.length > 0) {
                results.forEach(function (item) {
                    var li = document.createElement('a');
                    li.className = 'search-result-item';
                    li.href = item.hash || '#home';
                    li.innerHTML = '<strong>' + item.term + '</strong> (' + item.page + ')';
                    li.addEventListener('mousedown', function (ev) {
                        ev.preventDefault();
                        if (item.hash) scrollToElement(item.hash);
                        searchInput.value = '';
                        searchResults.style.display = 'none';
                    });
                    searchResults.appendChild(li);
                });
                searchResults.style.display = 'block';
            } else {
                searchResults.innerHTML = '<span class="search-no-result">' + (currentTranslations.search_no_results || 'No results found.') + '</span>';
                searchResults.style.display = 'block';
            }
        });

        searchInput.addEventListener('blur', function () {
            setTimeout(function () {
                searchResults.style.display = 'none';
            }, 150);
        });
    }

    var backToTopButton = document.getElementById('back-to-top');
    if (backToTopButton) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 300) {
                backToTopButton.classList.add('show');
            } else {
                backToTopButton.classList.remove('show');
            }
        });
        backToTopButton.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    function initAbstractToggles() {
        document.querySelectorAll('.btn-abstract').forEach(function (button) {
            button.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var targetId = button.getAttribute('data-target');
                var abstractDiv = document.getElementById(targetId);
                if (abstractDiv) {
                    abstractDiv.classList.toggle('expanded');
                    button.classList.toggle('expanded');
                }
            });
        });
    }

    function enforceSocialLinksBlank() {
        document.querySelectorAll('.menu-panel-social a, .social-links a').forEach(function (link) {
            var href = link.getAttribute('href') || '';
            if (href.startsWith('http://') || href.startsWith('https://')) {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            }
        });
    }

    async function loadSections() {
        var sections = [
            { id: 'home', file: 'sections/home.html' },
            { id: 'news', file: 'sections/news.html' },
            { id: 'research', file: 'sections/research.html' },
            { id: 'vitae', file: 'sections/vitae.html' }
        ];

        await Promise.all(sections.map(async function (section) {
            try {
                var response = await fetch(section.file);
                if (response.ok) {
                    var html = await response.text();
                    document.getElementById(section.id).innerHTML = html;
                }
            } catch (e) {}
        }));

        initAbstractToggles();
        enforceSocialLinksBlank();

        var initialLang = localStorage.getItem('lang') || 'en';
        await translatePage(initialLang);

        if (window.location.hash) {
            setTimeout(function () {
                scrollToElement(window.location.hash);
            }, 300);
        }
    }

    loadSections();
});
