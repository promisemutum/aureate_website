const MOBILE_BREAKPOINT = 768;

document.addEventListener('DOMContentLoaded', () => {
    const carousel = document.querySelector('.carousel');
    const iconWrappers = document.querySelectorAll('.icon-wrapper');
    
    // Single reusable preloaded audio instance
    const clickSound = new Audio('./sound/click.wav');
    clickSound.preload = 'auto';

    let lastSoundTime = 0;
    const SOUND_DEBOUNCE = 300;
    const TAP_THRESHOLD = 10;

    let startX = 0, startY = 0, lastX = 0;
    let currentRotation = 0;
    let isDragging = false;
    let dragMoved = false;
    let activeTargetWrapper = null;

    const STEP = 120;
    const DRAG_SENSITIVITY = 3;

    // Mathematical formula for cleanly normalizing angles
    const normalizeAngle = (angle) => ((angle % 360) + 360) % 360;

    const updateActiveState = (rotation) => {
        if (window.innerWidth > MOBILE_BREAKPOINT) return;

        const norm = normalizeAngle(-rotation);
        // Map ranges: 0-60 & 300-360 -> 0 | 60-180 -> 1 | 180-300 -> 2
        const activeIndex = norm > 60 && norm <= 180 ? 1 : (norm > 180 && norm <= 300 ? 2 : 0);

        iconWrappers.forEach((wrapper, i) => {
            const isActive = i === activeIndex;
            wrapper.classList.toggle('active', isActive);
            wrapper.style.pointerEvents = isActive ? 'auto' : 'none';
        });
    };

    const playClickSound = () => {
        const now = Date.now();
        if (now - lastSoundTime < SOUND_DEBOUNCE) return;
        lastSoundTime = now;

        clickSound.currentTime = 0;
        clickSound.play().catch(e => console.warn("Audio play failed:", e));
    };

    // Global proactive unlock for modern browser audio auto-play restrictions
    const unlockAudio = () => {
        if (!window._soundUnlocked) {
            window._soundUnlocked = true;
            // Reuse the main instance to unlock audio context
            clickSound.play().catch(() => {}); 
        }
    };
    document.addEventListener('touchstart', unlockAudio, { once: true });
    document.addEventListener('click', unlockAudio, { once: true });

    if (window.innerWidth <= MOBILE_BREAKPOINT) {
        updateActiveState(0);
    }

    const managePointerCapture = (action, id) => {
        try {
            if (carousel && carousel[`${action}PointerCapture`]) {
                carousel[`${action}PointerCapture`](id);
            }
        } catch (err) {
            console.warn(`Pointer ${action} capture failed:`, err);
        }
    };

    const handleStart = (e) => {
        if (window.innerWidth > MOBILE_BREAKPOINT || !e.isPrimary || e.defaultPrevented) return;

        isDragging = true;
        dragMoved = false;
        startX = lastX = e.clientX;
        startY = e.clientY;
        activeTargetWrapper = e.target.closest('.icon-wrapper');

        if (carousel) carousel.style.transition = 'none';
        managePointerCapture('set', e.pointerId);
    };

    const handleMove = (e) => {
        if (window.innerWidth > MOBILE_BREAKPOINT || !isDragging || !e.isPrimary) return;

        // 🔥 FIX: Removed e.preventDefault(). 
        // Because we set `touch-action: pan-y` in the CSS, the browser natively 
        // allows vertical page scrolling. If we leave preventDefault() here, 
        // it will trap the user and prevent them from scrolling down to the About section!

        const dx = e.clientX - lastX;
        lastX = e.clientX;

        if (Math.abs(e.clientX - startX) > TAP_THRESHOLD || Math.abs(e.clientY - startY) > TAP_THRESHOLD) {
            dragMoved = true;
        }

        currentRotation += dx * DRAG_SENSITIVITY;
        if (carousel) carousel.style.transform = `rotateY(${currentRotation}deg)`;

        requestAnimationFrame(() => updateActiveState(currentRotation));
    };

    const handleEnd = (e) => {
        if (window.innerWidth > MOBILE_BREAKPOINT || !isDragging || !e.isPrimary) return;
        isDragging = false;

        managePointerCapture('release', e.pointerId);

        // Treat as a legitimate tap if the threshold boundary wasn't violated
        if (!dragMoved && activeTargetWrapper) {
            playClickSound();
        }

        const snapTarget = Math.round(currentRotation / STEP) * STEP;
        currentRotation = snapTarget;

        if (carousel) {
            carousel.style.transition = 'transform 0.5s ease-out';
            carousel.style.transform = `rotateY(${snapTarget}deg)`;
            updateActiveState(snapTarget);
        }
    };

    if (carousel) {
        carousel.addEventListener('pointerdown', handleStart);
        carousel.addEventListener('pointermove', handleMove);
        carousel.addEventListener('pointerup', handleEnd);
        carousel.addEventListener('pointercancel', handleEnd);
        carousel.addEventListener('pointerleave', handleEnd);

        // Delegated listener dealing with desktop-only interactions 
        carousel.addEventListener('click', (e) => {
            if (window.innerWidth > MOBILE_BREAKPOINT && e.target.closest('.icon-wrapper')) {
                playClickSound();
            }
        });
    }

    window.addEventListener('resize', () => {
        if (window.innerWidth <= MOBILE_BREAKPOINT) {
            updateActiveState(currentRotation);
        } else {
            if (carousel) {
                carousel.style.transform = '';
                carousel.style.transition = '';
            }
            iconWrappers.forEach(wrapper => {
                wrapper.classList.remove('active');
                wrapper.style.pointerEvents = 'auto';
            });
            isDragging = false;
        }
    });
});