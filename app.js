const MOBILE_BREAKPOINT = 768;

document.addEventListener('DOMContentLoaded', () => {
    const carousel = document.querySelector('.carousel');
    const iconWrappers = document.querySelectorAll('.icon-wrapper');
    const clickSound = new Audio('./sound/click.wav');
    clickSound.preload = 'auto';

    let lastSoundTime = 0;
    const SOUND_DEBOUNCE = 50; // Short debounce

    const playClickSound = () => {
        const now = Date.now();
        if (now - lastSoundTime < SOUND_DEBOUNCE) return;
        lastSoundTime = now;
        const sound = clickSound.cloneNode();
        sound.play().catch(e => console.warn(e));
    };

    // Attach sound logic to icons using pointer events (Zero Delay)
    iconWrappers.forEach(wrapper => {
        wrapper.addEventListener('pointerdown', (e) => {
            // User requested preventDefault to avoid double-trigger fallback
            // This also likely prevents mouse emulation events, so we must rely on pointer events elsewhere
            e.preventDefault();
            playClickSound();
        }, { passive: false });
    });

    let startX = 0;
    let lastX = 0;
    let currentRotation = 0;
    let isDragging = false;
    let totalDragDistance = 0;

    const STEP = 120;
    const DRAG_SENSITIVITY = 0.5;

    const normalizeAngle = (angle) => {
        let a = angle % 360;
        if (a < 0) a += 360;
        return a;
    };

    const updateActiveState = (rotation) => {
        const norm = normalizeAngle(-rotation);
        let activeIndex = 0;
        if (norm > 60 && norm <= 180) activeIndex = 1;
        else if (norm > 180 && norm <= 300) activeIndex = 2;

        iconWrappers.forEach((wrapper, i) => {
            const isActive = i === activeIndex;
            wrapper.classList.toggle('active', isActive);
            wrapper.style.pointerEvents = 'auto';
        });
    };

    updateActiveState(0);

    // Interaction Handlers using Pointer Events (Unified)
    const handleStart = (e) => {
        // Only main pointer (mouse or first touch)
        if (!e.isPrimary) return;

        isDragging = true;
        startX = e.clientX;
        lastX = startX;
        totalDragDistance = 0;

        if (carousel) {
            carousel.style.transition = 'none';
        }

        // Capture pointer to track outside window
        if (e.target.setPointerCapture) {
            e.target.setPointerCapture(e.pointerId);
        }
    };

    const handleMove = (e) => {
        if (!isDragging || !e.isPrimary) return;

        const x = e.clientX;
        const dx = x - lastX;
        lastX = x;
        totalDragDistance += Math.abs(dx);

        currentRotation += dx * DRAG_SENSITIVITY;

        if (carousel) {
            carousel.style.transform = `rotateY(${currentRotation}deg)`;
        }

        requestAnimationFrame(() => updateActiveState(currentRotation));
    };

    const handleEnd = (e) => {
        if (!isDragging || !e.isPrimary) return;
        isDragging = false;

        // We moved sound logic to 'pointerdown' on icon, so no sound logic needed here.
        // But if we want to support click on non-icon parts or complex logic... 
        // User asked for "no delay" which implies pointerdown.
        // So drag logic just handles rotation.

        if (e.target.releasePointerCapture) {
            e.target.releasePointerCapture(e.pointerId);
        }

        const snapTarget = Math.round(currentRotation / STEP) * STEP;
        currentRotation = snapTarget;

        if (carousel) {
            carousel.style.transition = 'transform 0.5s ease-out';
            carousel.style.transform = `rotateY(${snapTarget}deg)`;
            updateActiveState(snapTarget);
        }
    };

    const scene = document.querySelector('.container');
    if (scene) {
        // Use pointer events for drag as well
        scene.addEventListener('pointerdown', handleStart);
        scene.addEventListener('pointermove', handleMove);
        scene.addEventListener('pointerup', handleEnd);
        scene.addEventListener('pointercancel', handleEnd);
        scene.addEventListener('pointerleave', (e) => {
            // If we rely on capture, we might not need leave, but safe fallback
            if (isDragging && !scene.hasPointerCapture && !e.target.hasPointerCapture(e.pointerId)) {
                handleEnd(e);
            }
        });
    }

    window.addEventListener('resize', () => updateActiveState(currentRotation));
});
