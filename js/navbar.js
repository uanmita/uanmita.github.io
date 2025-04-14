document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const userNavLink = document.getElementById('userNavLink');
    const userDropdown = document.getElementById('userDropdown');

    // Toggle menú principal
    menuToggle?.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        menuToggle.setAttribute('aria-expanded', 
            navLinks.classList.contains('active'));
    });

    // Toggle dropdown de usuario
    userNavLink?.addEventListener('click', (e) => {
        if (auth.currentUser) {
            e.preventDefault();
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        }
    });

    // Cerrar al hacer click fuera
    document.addEventListener('click', (e) => {
        if (!userNavLink?.contains(e.target) && !userDropdown?.contains(e.target)) {
            userDropdown?.classList.remove('show');
        }
    });

    // Prevenir que los clicks dentro del dropdown cierren el menú principal en móvil
    userDropdown?.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Cerrar menús al redimensionar
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            navLinks.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
        }
    });
});