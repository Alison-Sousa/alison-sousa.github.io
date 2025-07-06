// Add any JavaScript functionality here
console.log("Welcome to Alison Sousa's website!");
// Back to Top Button
const backToTopButton = document.getElementById('back-to-top');

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
        backToTopButton.classList.add('visible');
    } else {
        backToTopButton.classList.remove('visible');
    }
});

backToTopButton.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// Section hover effects
const sections = document.querySelectorAll('.section-container');
sections.forEach(section => {
    section.addEventListener('mouseenter', () => {
        section.style.transform = 'translateY(-5px)';
        section.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.08)';
    });
    
    section.addEventListener('mouseleave', () => {
        section.style.transform = 'translateY(0)';
        section.style.boxShadow = '0 2px 15px rgba(0, 0, 0, 0.03)';
    });
});
