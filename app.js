const MOBILE_BREAKPOINT = 768;

document.addEventListener('DOMContentLoaded', () => {
    const iconWrappers = document.querySelectorAll('.icon-wrapper');

    /**
     * Handle Mobile Touch Interaction
     * Tap to Reveal -> Tap to Go
     */
    const handleMobileClick = (e, wrapper) => {
        if (window.innerWidth <= MOBILE_BREAKPOINT) {
            // If not already active, prevent link and activate
            if (!wrapper.classList.contains('active')) {
                e.preventDefault();

                // Deactivate others to keep only one active at a time
                iconWrappers.forEach(w => {
                    if (w !== wrapper) w.classList.remove('active');
                });

                // Toggle this one
                wrapper.classList.add('active');
            }
        }
    };

    iconWrappers.forEach(wrapper => {
        wrapper.addEventListener('click', (e) => handleMobileClick(e, wrapper));
    });

    /**
     * Close active state when clicking outside (on background)
     */
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= MOBILE_BREAKPOINT && !e.target.closest('.icon-wrapper')) {
            iconWrappers.forEach(w => w.classList.remove('active'));
        }
    });

    /**
     * Parallax Effect (Desktop only)
     * Optional: Optimization using transform instead of background-position is recommended
     * if re-enabled in the future for smoother performance.
     */
    /*
    document.addEventListener('mousemove', (e) => {
        if (window.innerWidth > MOBILE_BREAKPOINT) {
            const moveX = (e.clientX / window.innerWidth - 0.5) * 20;
            const moveY = (e.clientY / window.innerHeight - 0.5) * 20;
            document.body.style.transform = `translate(${moveX}px, ${moveY}px)`;
        }
    });
    */
});

