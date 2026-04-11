document.addEventListener('DOMContentLoaded', function () {
    var body = document.body;
    var docElement = document.documentElement;
    var currentPath = (window.location.pathname || '').toLowerCase();
    var rootPrefix = currentPath.includes('/sections/') ? '../' : '';
    var currentTranslations = {};
    var currentSearchDatabase = [];
    var htmlDecoder = document.createElement('textarea');

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

    function normalizeSearchText(value) {
        return (value || '')
            .toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    function stripHtmlTags(value) {
        return (value || '').replace(/<[^>]*>/g, ' ');
    }

    function decodeHtmlEntities(value) {
        htmlDecoder.innerHTML = value || '';
        return htmlDecoder.value;
    }

    function tokenizeSearchTerms(value) {
        return normalizeSearchText(decodeHtmlEntities(stripHtmlTags(value)))
            .split(/[^a-z0-9@.+-]+/)
            .filter(function (token) {
                return token.length >= 2 && !/^\d+$/.test(token);
            });
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
                    hash: parts[2],
                    normalizedTerm: normalizeSearchText(parts[0])
                };
            })
            .filter(function (item) {
                return item && item.term && item.page && item.normalizedTerm;
            });
    }

    function inferSearchLocation(key) {
        var lowerKey = (key || '').toLowerCase();
        var paperHashMap = {
            paper1: '#paper-gen-ai',
            paper2: '#paper-new-wp',
            paper3: '#paper-dengue',
            paper4: '#paper-marketplace',
            paper5: '#paper-oli',
            paper6: '#paper-slr'
        };

        if (lowerKey.startsWith('research_') || lowerKey.startsWith('btn_')) {
            var matchedPaper = Object.keys(paperHashMap).find(function (paperKey) {
                return lowerKey.includes(paperKey);
            });
            return {
                page: 'Research',
                hash: matchedPaper ? paperHashMap[matchedPaper] : '#research'
            };
        }

        if (lowerKey.startsWith('teaching_') || lowerKey.startsWith('vitae_')) {
            return { page: 'Teaching', hash: '#teaching' };
        }

        if (lowerKey.startsWith('profile_') || lowerKey.startsWith('hero_')) {
            return {
                page: 'Home',
                hash: lowerKey.includes('contact') ? '#contact' : '#about'
            };
        }

        if (lowerKey === 'nav_research') {
            return { page: 'Research', hash: '#research' };
        }

        if (lowerKey === 'nav_vitae') {
            return { page: 'Teaching', hash: '#teaching' };
        }

        if (lowerKey.includes('contact') || lowerKey.includes('email')) {
            return { page: 'Home', hash: '#contact' };
        }

        return null;
    }

    function buildSearchDatabase(translations) {
        var database = [];
        var uniqueEntries = new Set();
        var manualEntries = Array.isArray(translations.search_database)
            ? translations.search_database
            : [];

        function addEntry(term, page, hash) {
            var safeTerm = (term || '').trim();
            var safePage = (page || '').trim();
            var safeHash = (hash || '').trim();
            var normalizedTerm = normalizeSearchText(safeTerm);

            if (!safeTerm || !safePage || !normalizedTerm) return;

            var dedupeKey = normalizedTerm + '|' + safePage.toLowerCase() + '|' + safeHash.toLowerCase();
            if (uniqueEntries.has(dedupeKey)) return;

            uniqueEntries.add(dedupeKey);
            database.push({
                term: safeTerm,
                page: safePage,
                hash: safeHash,
                normalizedTerm: normalizedTerm
            });
        }

        manualEntries.forEach(function (item) {
            addEntry(item.term, item.page, item.hash);
        });

        Object.keys(translations).forEach(function (key) {
            if (key === 'search_database' || key === 'html_lang') return;

            var value = translations[key];
            if (typeof value !== 'string' || !value.trim()) return;

            var location = inferSearchLocation(key) || { page: 'Home', hash: '#about' };

            tokenizeSearchTerms(value).forEach(function (term) {
                addEntry(term, location.page, location.hash);
            });
        });

        return database;
    }

    function resolveAssetPath(pathValue) {
        if (!pathValue) return pathValue;
        if (/^(https?:|mailto:|tel:|#|\/)/i.test(pathValue)) return pathValue;
        return rootPrefix + pathValue;
    }

    function applyTranslations(jsonData) {
        currentTranslations = jsonData;
        currentSearchDatabase = buildSearchDatabase(jsonData);

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

    function dedupeSearchResults(results) {
        var seen = new Set();
        return results.filter(function (item) {
            var key = item.normalizedTerm + '|' + (item.page || '').toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    if (searchInput && searchResults) {
        searchInput.addEventListener('input', function (e) {
            var query = normalizeSearchText(e.target.value);
            if (query.length < 2) {
                searchResults.style.display = 'none';
                return;
            }

            var results = currentSearchDatabase.filter(function (item) {
                return item.normalizedTerm.includes(query);
            });

            results.sort(function (a, b) {
                var aStartsWith = a.normalizedTerm.startsWith(query) ? 0 : 1;
                var bStartsWith = b.normalizedTerm.startsWith(query) ? 0 : 1;
                if (aStartsWith !== bStartsWith) return aStartsWith - bStartsWith;
                return a.term.localeCompare(b.term);
            });

            results = dedupeSearchResults(results);

            searchResults.innerHTML = '';

            if (results.length > 0) {
                results.slice(0, 18).forEach(function (item) {
                    var li = document.createElement('a');
                    var targetPage = getPageForHash(item.hash);
                    var strong = document.createElement('strong');

                    li.className = 'search-result-item';
                    li.href = targetPage + (item.hash || '');

                    strong.textContent = item.term;
                    li.appendChild(strong);
                    li.appendChild(document.createTextNode(' (' + item.page + ')'));

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
