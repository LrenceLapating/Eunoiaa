document.addEventListener('DOMContentLoaded', function() {
    // Header scroll effect
    const header = document.getElementById('header');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        checkVisibility();
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
    
    // Animation visibility check
    function checkVisibility() {
        const fadeElements = document.querySelectorAll('.fade-in');
        const scaleElements = document.querySelectorAll('.scale-in');
        const slideLeftElements = document.querySelectorAll('.slide-in-left');
        const slideRightElements = document.querySelectorAll('.slide-in-right');
        const stepElements = document.querySelectorAll('.step');
        
        const isInViewport = (element) => {
            const rect = element.getBoundingClientRect();
            return (
                rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.85 &&
                rect.bottom >= 0
            );
        };
        
        fadeElements.forEach(element => {
            if (isInViewport(element)) {
                element.classList.add('visible');
            }
        });
        
        scaleElements.forEach(element => {
            if (isInViewport(element)) {
                element.classList.add('visible');
            }
        });
        
        slideLeftElements.forEach(element => {
            if (isInViewport(element)) {
                element.classList.add('visible');
            }
        });
        
        slideRightElements.forEach(element => {
            if (isInViewport(element)) {
                element.classList.add('visible');
            }
        });
        
        stepElements.forEach(element => {
            if (isInViewport(element)) {
                element.classList.add('visible');
            }
        });
    }
    
    // Initial visibility check
    setTimeout(checkVisibility, 100);
    
    // Add scrolled class to header if page is already scrolled on load
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    }
    
    // Animate stat bars
    const statFills = document.querySelectorAll('.stat-fill');
    
    function animateStatBars() {
        statFills.forEach(fill => {
            const targetWidth = fill.style.getPropertyValue('--target-width') || fill.getAttribute('data-width') || fill.style.width;
            fill.style.width = '0';
            
            setTimeout(() => {
                fill.style.width = targetWidth;
            }, 500);
        });
    }
    
    // Store original widths
    statFills.forEach(fill => {
        const width = getComputedStyle(fill).width;
        fill.setAttribute('data-width', width);
        fill.style.width = '0';
    });
    
    // Trigger stat bar animation when in viewport
    const heroGraphic = document.querySelector('.hero-graphic');
    if (heroGraphic) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateStatBars();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        observer.observe(heroGraphic);
    }
    
    // Hover effects for dimensions
    const dimensions = document.querySelectorAll('.dimension');
    dimensions.forEach(dimension => {
        dimension.addEventListener('mouseenter', function() {
            const index = this.classList[1].split('-')[1];
            const statFill = document.querySelector(`.stat-fill-${index}`);
            if (statFill) {
                statFill.style.opacity = '0.8';
                statFill.style.transform = 'scaleX(1.05)';
            }
        });
        
        dimension.addEventListener('mouseleave', function() {
            const index = this.classList[1].split('-')[1];
            const statFill = document.querySelector(`.stat-fill-${index}`);
            if (statFill) {
                statFill.style.opacity = '1';
                statFill.style.transform = 'scaleX(1)';
            }
        });
    });
}); 