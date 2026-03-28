document.addEventListener('DOMContentLoaded', function () {
    var body = document.body;
    var docElement = document.documentElement;
    var currentPath = (window.location.pathname || '').toLowerCase();
    var rootPrefix = currentPath.includes('/sections/') ? '../' : '';
    var currentTranslations = {};
    var currentSearchDatabase = [];

    var themeToggle = document.getElementById('theme-toggle');
    var menuToggle = document.getElementById('menu-toggle');
    var topNav = document.querySelector('.top-nav');

    function closeMobileMenu() {
        body.classList.remove('nav-open');
        if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    }

    if (menuToggle && topNav) {
        menuToggle.addEventListener('click', function () {
            var isOpen = body.classList.toggle('nav-open');
            menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        document.addEventListener('click', function (event) {
            if (window.innerWidth > 640) return;
            if (!body.classList.contains('nav-open')) return;
            var target = event.target;
            if (menuToggle.contains(target) || topNav.contains(target)) return;
            closeMobileMenu();
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                closeMobileMenu();
            }
        });

        topNav.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                closeMobileMenu();
            });
        });

        window.addEventListener('resize', function () {
            if (window.innerWidth > 640) {
                closeMobileMenu();
            }
        });
    }

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

    function parseMarkdownSections(markdown) {
        var content = (markdown || '').replace(/\r\n/g, '\n');
        var headingRegex = /^##\s+([a-z0-9_]+)\s*$/gim;
        var matches = [];
        var match;

        while ((match = headingRegex.exec(content)) !== null) {
            matches.push({
                key: match[1].toLowerCase(),
                headerIndex: match.index,
                bodyStart: headingRegex.lastIndex
            });
        }

        var data = {};
        for (var i = 0; i < matches.length; i++) {
            var section = matches[i];
            var nextHeaderIndex = i + 1 < matches.length ? matches[i + 1].headerIndex : content.length;
            data[section.key] = content.slice(section.bodyStart, nextHeaderIndex).trim();
        }

        return data;
    }

    function parseSearchDatabase(raw) {
        return (raw || '')
            .split('\n')
            .map(function (line) {
                return line.trim();
            })
            .filter(function (line) {
                return line.startsWith('- ');
            })
            .map(function (line) {
                return line.replace(/^-\s+/, '');
            })
            .map(function (entry) {
                var parts = entry.split('|').map(function (part) {
                    return part.trim();
                });
                if (parts.length < 3) return null;
                return {
                    term: parts[0],
                    page: parts[1],
                    hash: parts[2]
                };
            })
            .filter(function (item) {
                return item && item.term && item.page;
            });
    }

    function resolveAssetPath(pathValue) {
        if (!pathValue) return pathValue;
        if (/^(https?:|mailto:|tel:|#|\/)/i.test(pathValue)) return pathValue;
        return rootPrefix + pathValue;
    }

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

        document.querySelectorAll('[data-t-alt]').forEach(function (el) {
            var key = el.getAttribute('data-t-alt');
            if (jsonData[key]) el.alt = jsonData[key];
        });

        document.querySelectorAll('[data-t-href]').forEach(function (el) {
            var key = el.getAttribute('data-t-href');
            if (jsonData[key]) el.href = resolveAssetPath(jsonData[key]);
        });

        document.querySelectorAll('[data-t-src]').forEach(function (el) {
            var key = el.getAttribute('data-t-src');
            if (jsonData[key]) el.src = resolveAssetPath(jsonData[key]);
        });

        var page = (body.dataset.page || '').toLowerCase();
        var pageTitles = {
            research: 'Research | Alison Sousa',
            teaching: 'Teaching | Alison Sousa',
            home: jsonData.doc_title || 'Alison Sousa'
        };
        document.title = pageTitles[page] || (jsonData.doc_title || 'Alison Sousa');
        document.documentElement.lang = jsonData.html_lang || 'en';

        body.classList.add('js-loaded');
    }

    async function loadTextContent() {
        try {
            var textFiles = [
                rootPrefix + 'text/common.md',
                rootPrefix + 'text/home.md',
                rootPrefix + 'text/research.md',
                rootPrefix + 'text/teaching.md',
                rootPrefix + 'text/search.md'
            ];

            var responses = await Promise.all(textFiles.map(function (file) {
                return fetch(file);
            }));

            var markdownTexts = await Promise.all(responses.map(async function (response, index) {
                if (!response.ok) {
                    throw new Error('Failed to load ' + textFiles[index]);
                }
                return response.text();
            }));

            var contentData = {};
            markdownTexts.forEach(function (markdownData) {
                Object.assign(contentData, parseMarkdownSections(markdownData));
            });

            contentData.search_database = parseSearchDatabase(contentData.search_database);
            applyTranslations(contentData);
        } catch (e) {
            body.classList.add('js-loaded');
            console.error('Could not load markdown text files', e);
        }
    }

    var searchInput = document.getElementById('search-input');
    var searchResults = document.getElementById('search-results');

    function getCurrentPageFile() {
        var path = (window.location.pathname || '').toLowerCase();
        var file = path.substring(path.lastIndexOf('/') + 1);
        return file || 'index.html';
    }

    function getPageForHash(hash) {
        if (!hash) return 'index.html';

        var homeHashes = ['#home', '#about', '#contact'];
        var researchHashes = ['#research', '#paper-gen-ai', '#paper-new-wp', '#paper-marketplace', '#paper-oli', '#paper-slr', '#paper-dengue'];
        var teachingHashes = ['#teaching', '#vitae', '#cv-download'];

        if (homeHashes.includes(hash)) return 'index.html';
        if (researchHashes.includes(hash)) return 'research.html';
        if (teachingHashes.includes(hash)) return 'teaching.html';

        return 'index.html';
    }

    function navigateToHash(hash) {
        var targetPage = getPageForHash(hash);
        var currentPage = getCurrentPageFile();

        if (targetPage === currentPage && hash) {
            scrollToElement(hash);
            return;
        }

        window.location.href = targetPage + (hash || '');
    }

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
                    var targetPage = getPageForHash(item.hash);
                    li.className = 'search-result-item';
                    li.href = targetPage + (item.hash || '');
                    li.innerHTML = '<strong>' + item.term + '</strong> (' + item.page + ')';
                    li.addEventListener('mousedown', function (ev) {
                        ev.preventDefault();
                        navigateToHash(item.hash);
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
        document.querySelectorAll('.footer-social a').forEach(function (link) {
            var href = link.getAttribute('href') || '';
            if (href.startsWith('http://') || href.startsWith('https://')) {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            }
        });
    }

    async function initPage() {
        await loadTextContent();

        initAbstractToggles();
        enforceSocialLinksBlank();

        if (window.location.hash) {
            setTimeout(function () {
                scrollToElement(window.location.hash);
            }, 300);
        }
    }

    initPage();
});
