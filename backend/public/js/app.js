// NaanNow — Client-Side JavaScript

document.addEventListener('DOMContentLoaded', () => {

    // --- Auto-dismiss flash messages after 5 seconds ---
    const flashMessages = document.querySelectorAll('.flash-message');
    flashMessages.forEach(msg => {
        setTimeout(() => {
            msg.style.animation = 'flashSlideOut 0.3s ease forwards';
            setTimeout(() => msg.remove(), 300);
        }, 5000);
    });

    // --- Flash close buttons ---
    document.querySelectorAll('.flash-close').forEach(btn => {
        btn.addEventListener('click', () => {
            const msg = btn.closest('.flash-message');
            msg.style.animation = 'flashSlideOut 0.3s ease forwards';
            setTimeout(() => msg.remove(), 300);
        });
    });

    // --- Mobile nav toggle ---
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.navbar-links');
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
        });
    }

    // --- Confirm dangerous actions ---
    document.querySelectorAll('[data-confirm]').forEach(el => {
        el.addEventListener('click', (e) => {
            const message = el.getAttribute('data-confirm') || 'Are you sure?';
            if (!confirm(message)) {
                e.preventDefault();
            }
        });
    });

    // --- Add animation keyframe for flash dismiss ---
    const style = document.createElement('style');
    style.textContent = `
        @keyframes flashSlideOut {
            from { opacity: 1; transform: translateX(0); }
            to { opacity: 0; transform: translateX(30px); }
        }
    `;
    document.head.appendChild(style);
});
