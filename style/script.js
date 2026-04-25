document.addEventListener('DOMContentLoaded', function () {
    var body = document.body;
    var currentPath = (window.location.pathname || '').toLowerCase();
    var rootPrefix = currentPath.includes('/sections/') ? '../' : '';
    var transitionDurationMs = 320;

    var menuToggle = document.getElementById('menu-toggle');
    var topNav = document.querySelector('.top-nav');
    var backToTopButton = document.getElementById('back-to-top');

    function prefersReducedMotion() {
        return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function closeMobileMenu() {
        body.classList.remove('nav-open');
        if (menuToggle) {
            menuToggle.setAttribute('aria-expanded', 'false');
        }
    }

    function goToPageWithTransition(url) {
        if (!url) {
            return;
        }

        if (prefersReducedMotion()) {
            window.location.href = url;
            return;
        }

        if (body.classList.contains('page-leaving')) {
            return;
        }

        closeMobileMenu();
        body.classList.add('page-leaving');

        setTimeout(function () {
            window.location.href = url;
        }, transitionDurationMs);
    }

    function isNavigableInternalLink(link) {
        if (!link) {
            return false;
        }

        var rawHref = link.getAttribute('href');
        if (!rawHref) {
            return false;
        }

        if (
            rawHref.startsWith('#') ||
            rawHref.startsWith('mailto:') ||
            rawHref.startsWith('tel:') ||
            rawHref.startsWith('javascript:')
        ) {
            return false;
        }

        if (link.hasAttribute('download')) {
            return false;
        }

        var target = (link.getAttribute('target') || '').toLowerCase();
        if (target && target !== '_self') {
            return false;
        }

        var url;
        try {
            url = new URL(link.href, window.location.href);
        } catch (e) {
            return false;
        }

        if (url.origin !== window.location.origin) {
            return false;
        }

        var currentUrl = new URL(window.location.href);
        var samePath = currentUrl.pathname === url.pathname && currentUrl.search === url.search;

        if (samePath && url.hash) {
            return false;
        }

        return true;
    }

    function initPageTransitions() {
        document.querySelectorAll('a[href]').forEach(function (link) {
            link.addEventListener('click', function (event) {
                if (event.defaultPrevented || event.button !== 0) {
                    return;
                }

                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
                    return;
                }

                if (!isNavigableInternalLink(link)) {
                    return;
                }

                event.preventDefault();
                goToPageWithTransition(link.href);
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

    function resolveAssetPath(pathValue) {
        if (!pathValue) {
            return pathValue;
        }

        if (/^(https?:|mailto:|tel:|#|\/)/i.test(pathValue)) {
            return pathValue;
        }

        return rootPrefix + pathValue;
    }

    function applyTranslations(jsonData) {
        document.querySelectorAll('[data-t]').forEach(function (el) {
            var key = el.getAttribute('data-t');
            if (jsonData[key]) {
                el.innerHTML = jsonData[key];
            }
        });

        document.querySelectorAll('[data-t-placeholder]').forEach(function (el) {
            var key = el.getAttribute('data-t-placeholder');
            if (jsonData[key]) {
                el.placeholder = jsonData[key];
            }
        });

        document.querySelectorAll('[data-t-title]').forEach(function (el) {
            var key = el.getAttribute('data-t-title');
            if (jsonData[key]) {
                el.title = jsonData[key];
            }
        });

        document.querySelectorAll('[data-t-aria]').forEach(function (el) {
            var key = el.getAttribute('data-t-aria');
            if (jsonData[key]) {
                el.setAttribute('aria-label', jsonData[key]);
            }
        });

        document.querySelectorAll('[data-t-alt]').forEach(function (el) {
            var key = el.getAttribute('data-t-alt');
            if (jsonData[key]) {
                el.alt = jsonData[key];
            }
        });

        document.querySelectorAll('[data-t-href]').forEach(function (el) {
            var key = el.getAttribute('data-t-href');
            if (jsonData[key]) {
                el.href = resolveAssetPath(jsonData[key]);
            }
        });

        document.querySelectorAll('[data-t-src]').forEach(function (el) {
            var key = el.getAttribute('data-t-src');
            if (jsonData[key]) {
                el.src = resolveAssetPath(jsonData[key]);
            }
        });

        var page = (body.dataset.page || '').toLowerCase();
        var pageTitles = {
            home: jsonData.doc_title || 'Alison Sousa',
            research: 'Research | Alison Sousa',
            teaching: 'Teaching | Alison Sousa',
            cv: 'Curriculum Vitae | Alison Sousa',
            contact: 'Contact | Alison Sousa'
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
                rootPrefix + 'text/cv.md',
                rootPrefix + 'text/contact.md'
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

            applyTranslations(contentData);
        } catch (e) {
            body.classList.add('js-loaded');
            console.error('Could not load markdown text files', e);
        }
    }

    function initMobileMenu() {
        if (!menuToggle || !topNav) {
            return;
        }

        menuToggle.addEventListener('click', function () {
            var isOpen = body.classList.toggle('nav-open');
            menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        document.addEventListener('click', function (event) {
            if (window.innerWidth > 760) {
                return;
            }

            if (!body.classList.contains('nav-open')) {
                return;
            }

            var target = event.target;
            if (menuToggle.contains(target) || topNav.contains(target)) {
                return;
            }

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
            if (window.innerWidth > 760) {
                closeMobileMenu();
            }
        });
    }

    function scrollToElement(selector) {
        var element = document.querySelector(selector);
        if (!element) {
            return;
        }

        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        element.style.transition = 'background-color 0.5s ease-in-out';
        element.style.backgroundColor = '#efe2c6';

        setTimeout(function () {
            element.style.backgroundColor = 'transparent';
        }, 1800);
    }

    function initBackToTop() {
        if (!backToTopButton) {
            return;
        }

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

    async function initPage() {
        await loadTextContent();
        initMobileMenu();
        initBackToTop();
        initPageTransitions();

        window.addEventListener('pageshow', function () {
            body.classList.remove('page-leaving');
            body.classList.add('page-ready');
        });

        requestAnimationFrame(function () {
            body.classList.add('page-ready');
        });

        if (window.location.hash) {
            setTimeout(function () {
                scrollToElement(window.location.hash);
            }, 280);
        }
    }

    initPage();
});
