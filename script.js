document.addEventListener('DOMContentLoaded', function() {

    // --- MOBİL MENÜ DEVRİMİ ---
    const navToggle = document.querySelector('.nav-toggle');
    const navbar = document.querySelector('.navbar');
    const navLinks = document.querySelectorAll('.navbar a');

    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('is-active');
        navbar.classList.toggle('is-active');
    });

    // Menü linkine tıklandığında menüyü kapat
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navbar.classList.contains('is-active')) {
                navToggle.classList.remove('is-active');
                navbar.classList.remove('is-active');
            }
        });
    });


    // --- KAYDIRMA ANİMASYONU DEVRİMİ (INTERSECTION OBSERVER) ---
    const animatedElements = document.querySelectorAll('.animate-on-scroll');

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = parseInt(entry.target.dataset.delay) || 0;
                
                setTimeout(() => {
                    entry.target.classList.add('is-visible');
                }, delay);

                observer.unobserve(entry.target); // Animasyon bir kez çalışsın
            }
        });
    }, {
        rootMargin: '0px',
        threshold: 0.1 // Elementin %10'u göründüğünde tetikle
    });

    animatedElements.forEach(el => {
        observer.observe(el);
    });

});
