document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Touch Interaction (Tap to Reveal -> Tap to Go)
    const iconWrappers = document.querySelectorAll('.icon-wrapper');

    iconWrappers.forEach(wrapper => {
        wrapper.addEventListener('click', (e) => {
            // Check if we are on mobile/touch device (width <= 768px)
            if (window.innerWidth <= 768) {
                // If not already active, prevent link and activate
                if (!wrapper.classList.contains('active')) {
                    e.preventDefault();

                    // Deactivate others to keep only one active at a time
                    iconWrappers.forEach(w => w.classList.remove('active'));

                    // Activate this one
                    wrapper.classList.add('active');
                }
                // If already active, the default action (navigation) happens automatically
            }
        });
    });

    // Close active state when clicking outside (on background)
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && !e.target.closest('.icon-wrapper')) {
            iconWrappers.forEach(w => w.classList.remove('active'));
        }
    });

    // 2. Parallax Effect (Kept but simplified/optimized if needed, or disabled if preferred)
    // Uncomment the following block if you want the parallax effect back
    /*
    document.addEventListener('mousemove', (e) => {
        if (window.innerWidth > 768) { // Only on desktop
            const moveX = (e.clientX / window.innerWidth - 0.5) * 20;
            const moveY = (e.clientY / window.innerHeight - 0.5) * 20;
            document.body.style.backgroundPosition = `calc(50% + ${moveX}px) calc(50% + ${moveY}px)`;
        }
    });
    */

    console.log('Aureate Realm loaded successfully');
});
