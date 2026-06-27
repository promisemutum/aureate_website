const MOBILE_BREAKPOINT = 768;

document.addEventListener('DOMContentLoaded', () => {
    const carousel = document.querySelector('.carousel');
    const iconWrappers = document.querySelectorAll('.icon-wrapper');
    // Reuse a single Audio instance to avoid creating new objects on every click
    const clickSound = new Audio('./sound/click.wav');
    clickSound.preload = 'none'; // load on first user interaction, not upfront

    let lastSoundTime = 0;
    const SOUND_DEBOUNCE = 300;
    const TAP_THRESHOLD = 10; // Max movement to count as tap (px)

    // Track touch position to distinguish taps from scrolls
    const touchData = {
        startX: 0,
        startY: 0,
        isScrolling: false
    };

    const playClickSound = () => {
        const now = Date.now();
        if (now - lastSoundTime < SOUND_DEBOUNCE) return;
        lastSoundTime = now;
        // Rewind and play the shared instance
        clickSound.currentTime = 0;
        clickSound.play().catch(e => {
            if (e.name === 'NotAllowedError' && !window._soundUnlocked) {
                document.body.addEventListener('click', () => {
                    window._soundUnlocked = true;
                    clickSound.play().catch(() => {});
                }, { once: true });
            }
        });
    };

    // Hybrid approach for touch/click differentiation
    iconWrappers.forEach(wrapper => {
        wrapper.addEventListener('pointerdown', (e) => {
            // Store initial touch position
            touchData.startX = e.clientX;
            touchData.startY = e.clientY;
            touchData.isScrolling = false;
        }, { passive: true }); 

        wrapper.addEventListener('pointermove', (e) => {
            // Calculate movement distance
            const dx = Math.abs(e.clientX - touchData.startX);
            const dy = Math.abs(e.clientY - touchData.startY);

            // If movement exceeds threshold, mark as scroll
            if (dx > TAP_THRESHOLD || dy > TAP_THRESHOLD) {
                touchData.isScrolling = true;
            }
        }, { passive: true });

        wrapper.addEventListener('pointerup', (e) => {
            // Play sound ONLY if it was a tap (not scroll)
            if (!touchData.isScrolling) {
                playClickSound();
            }
        });

        // Also handle click for Desktop
        wrapper.addEventListener('click', (e) => {
            if (window.innerWidth > MOBILE_BREAKPOINT) {
                playClickSound();
            }
        });
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
        // Only run active state logic on mobile
        if (window.innerWidth > MOBILE_BREAKPOINT) return;

        const norm = normalizeAngle(-rotation);
        let activeIndex = 0;
        if (norm > 60 && norm <= 180) activeIndex = 1;
        else if (norm > 180 && norm <= 300) activeIndex = 2;

        iconWrappers.forEach((wrapper, i) => {
            const isActive = i === activeIndex;
            wrapper.classList.toggle('active', isActive);

            // Only active icon should receive pointer events (Mobile only)
            wrapper.style.pointerEvents = isActive ? 'auto' : 'none';
        });
    };

    // ─── 3D CAROUSEL: Mobile-only setup ──────────────────────────────────────
    // Guard the entire drag/snap logic so desktop never allocates these listeners
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
        updateActiveState(0);
    }


    const handleStart = (e) => {
        if (window.innerWidth > MOBILE_BREAKPOINT) return;
        if (!e.isPrimary || e.defaultPrevented) return;

        isDragging = true;
        startX = e.clientX;
        lastX = startX;
        totalDragDistance = 0;

        if (carousel) carousel.style.transition = 'none';

        try {
            if (e.currentTarget.setPointerCapture) {
                e.currentTarget.setPointerCapture(e.pointerId);
            }
        } catch (err) { /* ignore */ }
    };

    const handleMove = (e) => {
        if (window.innerWidth > MOBILE_BREAKPOINT) return;
        if (!isDragging || !e.isPrimary) return;

        const x = e.clientX;
        const dx = x - lastX;
        lastX = x;
        totalDragDistance += Math.abs(dx);
        currentRotation += dx * DRAG_SENSITIVITY;

        if (carousel) carousel.style.transform = `rotateY(${currentRotation}deg)`;
        requestAnimationFrame(() => updateActiveState(currentRotation));
    };

    const handleEnd = (e) => {
        if (window.innerWidth > MOBILE_BREAKPOINT) return;
        if (!isDragging || !e.isPrimary) return;
        isDragging = false;

        try {
            if (e.currentTarget.releasePointerCapture) {
                e.currentTarget.releasePointerCapture(e.pointerId);
            }
        } catch (err) { /* ignore */ }

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
        scene.addEventListener('pointerdown', handleStart);
        scene.addEventListener('pointermove', handleMove);
        scene.addEventListener('pointerup', handleEnd);
        scene.addEventListener('pointercancel', handleEnd);
        scene.addEventListener('pointerleave', (e) => {
            if (isDragging) {
                try {
                    if (scene.releasePointerCapture) scene.releasePointerCapture(e.pointerId);
                } catch (err) { /* ignore */ }
                handleEnd(e);
            }
        });
    }

    // Resize Handler
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

    // iOS sound unlock on first touch
    document.addEventListener('touchstart', () => {
        if (!window._soundUnlocked) {
            clickSound.play().then(() => {
                clickSound.pause();
                clickSound.currentTime = 0;
            }).catch(() => {});
            window._soundUnlocked = true;
        }
    }, { once: true });
});