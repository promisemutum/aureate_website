const MOBILE_BREAKPOINT = 768;

document.addEventListener('DOMContentLoaded', () => {
    const carousel = document.querySelector('.carousel');
    const iconWrappers = document.querySelectorAll('.icon-wrapper');

    // Variables for 3D Carousel
    let startX = 0;
    let currentX = 0;
    let currentRotation = 0;
    let isDragging = false;
    let targetRotation = 0;

    // Normalize rotation angle to positive equivalent for easy modulo
    const normalizeAngle = (angle) => {
        let a = angle % 360;
        if (a < 0) a += 360;
        return a;
    };

    const updateActiveState = (rotation) => {
        // Front is at 0 degrees (or 360, 720...)
        // Items are at 0, 120, 240
        // Because we rotate the PARENT, if we rotate parent -120deg, item at 120deg comes to front (0deg relative to screen)

        let normalizedRot = normalizeAngle(-rotation); // use negative because we want the item that counteracts the rotation

        // Find closest segment (0, 120, 240)
        let activeIndex = 0; // Default to first item (0deg)

        // 0 +/- 60 is item 1
        // 120 +/- 60 is item 2
        // 240 +/- 60 is item 3

        if (normalizedRot > 60 && normalizedRot <= 180) {
            activeIndex = 1; // 2nd item (index 1) which is at 120deg
        } else if (normalizedRot > 180 && normalizedRot <= 300) {
            activeIndex = 2; // 3rd item (index 2) which is at 240deg
        } else {
            activeIndex = 0; // 1st item (index 0) which is at 0deg
        }

        iconWrappers.forEach((wrapper, index) => {
            if (index === activeIndex) {
                wrapper.classList.add('active');
                // Optional: Enable pointer events only for active item to prevent accidental clicks on side items?
                wrapper.style.pointerEvents = "auto";
            } else {
                wrapper.classList.remove('active');
                wrapper.style.pointerEvents = "none";
            }
        });
    };

    // Initialize active state
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
        updateActiveState(0);
    }

    /**
     * Mobile Touch/Drag Interaction
     */
    const handleDragStart = (e) => {
        if (window.innerWidth > MOBILE_BREAKPOINT) return;
        isDragging = true;
        startX = (e.type === 'touchstart') ? e.touches[0].clientX : e.clientX;

        // Remove transition for instant response
        if (carousel) carousel.style.transition = 'none';

        // Disable links while dragging to prevent accidental navigation
        iconWrappers.forEach(w => w.style.pointerEvents = 'none');
    };

    const handleDragMove = (e) => {
        if (!isDragging || window.innerWidth > MOBILE_BREAKPOINT) return;

        const x = (e.type === 'touchmove') ? e.touches[0].clientX : e.clientX;
        const delta = x - startX;

        // Sensitivity factor: how many pixels per degree?
        // 1px = 0.5deg
        currentX = currentRotation + (delta * 0.5);
        if (carousel) carousel.style.transform = `rotateY(${currentX}deg)`;
    };

    const handleDragEnd = () => {
        if (!isDragging || window.innerWidth > MOBILE_BREAKPOINT) return;
        isDragging = false;

        // Snap logic
        // We want to snap to 0, -120, -240, -360 etc.
        // Step size is 120.
        const step = 120;

        // Calculate target rotation
        targetRotation = Math.round(currentX / step) * step;

        // Restore transition for smooth snap
        if (carousel) {
            carousel.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)';
            carousel.style.transform = `rotateY(${targetRotation}deg)`;
        }

        currentRotation = targetRotation;

        // Determine active item after snap completes (approximate)
        setTimeout(() => {
            updateActiveState(currentRotation);
        }, 100);
    };

    // Event Listeners for Carousel Container (scene)
    const scene = document.querySelector('.icons-row');
    if (scene) {
        scene.addEventListener('mousedown', handleDragStart);
        scene.addEventListener('touchstart', handleDragStart, { passive: true });

        window.addEventListener('mousemove', handleDragMove);
        window.addEventListener('touchmove', handleDragMove, { passive: true });

        window.addEventListener('mouseup', handleDragEnd);
        window.addEventListener('touchend', handleDragEnd);
    }

    /**
     * Handle Resize
     */
    window.addEventListener('resize', () => {
        if (window.innerWidth > MOBILE_BREAKPOINT) {
            if (carousel) carousel.style.transform = 'none';
            // Reset styles for desktop
            iconWrappers.forEach(w => w.style.pointerEvents = "");
        } else {
            if (carousel) carousel.style.transform = `rotateY(${currentRotation}deg)`;
            updateActiveState(currentRotation);
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

