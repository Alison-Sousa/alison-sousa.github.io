document.addEventListener('DOMContentLoaded', () => {
    
    const body = document.body;
    const docElement = document.documentElement;
    let currentTranslations = {};
    let currentSearchDatabase = [];

    const themeToggle = document.getElementById('theme-toggle');
    
    function applyTheme(theme) {
        if (theme === 'dark') {
            docElement.classList.add('dark-mode');
        } else {
            docElement.classList.remove('dark-mode');
        }
    }
    
    if(themeToggle) {
        themeToggle.addEventListener('click', (e) => {
            const isDark = docElement.classList.contains('dark-mode');
            const newTheme = isDark ? 'light' : 'dark';
            
            const x = e.clientX;
            const y = e.clientY;

            localStorage.setItem('theme', newTheme);
            
            if (!document.startViewTransition) {
                applyTheme(newTheme);
                return;
            }

            docElement.style.setProperty('--clip-x', x + 'px');
            docElement.style.setProperty('--clip-y', y + 'px');

            const transition = document.startViewTransition(() => {
                applyTheme(newTheme);
            });
        });
    }

    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const navMenu = document.querySelector('.main-nav');
    if(mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            body.classList.toggle('nav-menu-open');
        });
    }

    const langPtBtn = document.getElementById('lang-pt');
    const langEnBtn = document.getElementById('lang-en');
    
    function applyTranslations(jsonData) {
        currentTranslations = jsonData;
        currentSearchDatabase = jsonData.search_database || [];
        
        document.querySelectorAll('[data-t]').forEach(el => {
            const key = el.getAttribute('data-t');
            if (jsonData[key]) {
                el.innerHTML = jsonData[key];
            }
        });
        
        document.querySelectorAll('[data-t-placeholder]').forEach(el => {
            const key = el.getAttribute('data-t-placeholder');
            if (jsonData[key]) {
                el.placeholder = jsonData[key];
            }
        });

        document.querySelectorAll('[data-t-title]').forEach(el => {
            const key = el.getAttribute('data-t-title');
            if (jsonData[key]) {
                el.title = jsonData[key];
            }
        });

        document.querySelectorAll('[data-t-aria]').forEach(el => {
            const key = el.getAttribute('data-t-aria');
            if (jsonData[key]) {
                el.setAttribute('aria-label', jsonData[key]);
            }
        });
        
        document.querySelectorAll('[data-t-img-desc]').forEach(el => {
            const key = el.getAttribute('data-t-img-desc');
            if (jsonData[key]) {
                el.setAttribute('data-description', jsonData[key]);
            }
        });

        document.querySelectorAll('[data-t-href]').forEach(el => {
            const key = el.getAttribute('data-t-href');
            if (jsonData[key]) {
                el.href = jsonData[key];
            }
        });

        document.querySelectorAll('[data-t-src]').forEach(el => {
            const key = el.getAttribute('data-t-src');
            if (jsonData[key]) {
                el.src = jsonData[key];
            }
        });

        document.title = jsonData.doc_title || "Seu Nome - Portfólio";
        document.documentElement.lang = jsonData.html_lang || 'en';
        
        body.classList.add('js-loaded');
    }

    async function translatePage(lang) {
        try {
            const response = await fetch(`lang/${lang}.json`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const jsonData = await response.json();
            
            applyTranslations(jsonData);
            
            localStorage.setItem('lang', lang);
            
            if (lang === 'pt-br') {
                langPtBtn?.classList.add('active');
                langEnBtn?.classList.remove('active');
            } else {
                langEnBtn?.classList.add('active');
                langPtBtn?.classList.remove('active');
            }
        } catch (error) {
            console.error('Failed to load translation:', error);
            if (lang !== 'en') { 
                translatePage('en');
            }
        }
    }

    if (langEnBtn) {
        langEnBtn.addEventListener('click', () => {
            if (document.documentElement.lang !== 'en') {
                translatePage('en');
            }
        });
    }
    
    if (langPtBtn) {
        langPtBtn.addEventListener('click', () => {
            if (document.documentElement.lang !== 'pt-br') {
                translatePage('pt-br');
            }
        });
    }

    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    
    function scrollToElement(hash) {
        if (!hash) return;
        const element = document.querySelector(hash);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            element.style.transition = 'background-color 0.5s ease-in-out';
            element.style.backgroundColor = 'var(--accent-color-translucent, #ffc10733)';
            setTimeout(() => {
                element.style.backgroundColor = 'transparent';
            }, 2000);
        }
    }

    if (searchInput && searchResults) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            if (query.length < 2) {
                searchResults.style.display = 'none';
                return;
            }

            const results = currentSearchDatabase.filter(item => 
                item.term.toLowerCase().includes(query)
            );

            searchResults.innerHTML = '';

            if (results.length > 0) {
                results.forEach(item => {
                    const li = document.createElement('a');
                    li.className = 'search-result-item';
                    
                    let targetUrl = item.url;
                    li.href = targetUrl + (item.hash || '');
                    
                    li.innerHTML = `<strong>${item.term}</strong> (em ${item.page})`;
                    
                    li.addEventListener('mousedown', (e) => { 
                        e.preventDefault(); 
                        
                        let currentPageFile = window.location.pathname.split('/').pop();
                        if (currentPageFile === '') currentPageFile = 'index.html';
                        
                        if (currentPageFile === item.url) {
                            if (item.hash) {
                                scrollToElement(item.hash);
                            }
                            searchInput.value = '';
                            searchResults.style.display = 'none';
                        } else {
                            window.location.href = li.href;
                        }
                    });
                    searchResults.appendChild(li);
                });
                searchResults.style.display = 'block';
            } else {
                searchResults.innerHTML = `<span class="search-no-result">${currentTranslations.search_no_results || 'No results found.'}</span>`;
                searchResults.style.display = 'block';
            }
        });

        searchInput.addEventListener('blur', () => {
            setTimeout(() => {
                searchResults.style.display = 'none';
            }, 150);
        });
    }
    
    if (window.location.hash) {
        setTimeout(() => {
            scrollToElement(window.location.hash);
        }, 500);
    }

    const backToTopButton = document.getElementById('back-to-top');

    if (backToTopButton) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTopButton.classList.add('show');
            } else {
                backToTopButton.classList.remove('show');
            }
        });

        backToTopButton.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightboxModal = document.getElementById('lightbox-modal');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxClose = document.querySelector('.lightbox-close');
    
    const prevBtn = document.querySelector('.lightbox-prev');
    const nextBtn = document.querySelector('.lightbox-next');
    let currentGalleryIndex = 0;

    function showImage(index) {
        if (index < 0 || index >= galleryItems.length) {
            return;
        }
        
        currentGalleryIndex = index;
        
        const item = galleryItems[index];
        const img = item.querySelector('img');
        const description = img.getAttribute('data-description');
        
        lightboxImg.src = img.src;
        lightboxCaption.textContent = description;

        prevBtn.classList.toggle('hidden', index === 0);
        nextBtn.classList.toggle('hidden', index === galleryItems.length - 1);
    }

    function openLightbox(index) {
        lightboxModal.style.display = 'block';
        body.style.overflow = 'hidden';
        showImage(index);
    }
    
    function closeModal() {
        lightboxModal.style.display = 'none';
        body.style.overflow = 'auto';
    }

    if (galleryItems.length > 0 && lightboxModal) {
        galleryItems.forEach((item, index) => {
            item.addEventListener('click', () => {
                openLightbox(index);
            });
        });

        if (lightboxClose) {
            lightboxClose.addEventListener('click', closeModal);
        }
        lightboxModal.addEventListener('click', (e) => {
            if (e.target === lightboxModal) {
                closeModal();
            }
        });
        
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showImage(currentGalleryIndex - 1);
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showImage(currentGalleryIndex + 1);
            });
        }
    }
    
    const initialLang = localStorage.getItem('lang') || 'en'; 
    translatePage(initialLang);
});


window.addEventListener('load', () => {
    document.body.classList.add('gallery-loaded');
});