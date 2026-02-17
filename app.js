const MOBILE_BREAKPOINT = 768;

document.addEventListener('DOMContentLoaded', () => {
    const carousel = document.querySelector('.carousel');
    const iconWrappers = document.querySelectorAll('.icon-wrapper');
    const clickSound = new Audio('./sound/click.wav');
    clickSound.preload = 'auto';

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

        const sound = new Audio('./sound/click.wav');
        sound.play().catch(e => {
            console.warn("Audio play failed:", e);
            if (e.name === 'NotAllowedError' && !window._soundUnlocked) {
                document.body.addEventListener('click', () => {
                    window._soundUnlocked = true;
                    sound.play().catch(() => { });
                }, { once: true });
            }
        });
    };

    // FIXED: Hybrid approach for touch/click differentiation
    iconWrappers.forEach(wrapper => {
        wrapper.addEventListener('pointerdown', (e) => {
            // Store initial touch position
            touchData.startX = e.clientX;
            touchData.startY = e.clientY;
            touchData.isScrolling = false;

            // Only play sound on pointerdown if we're sure it's a tap
            // We'll confirm in pointerup
        }, { passive: true }); // 👈 Critical: passive: true for scroll performance

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
                e.preventDefault(); // Only prevent default for actual taps
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
        const norm = normalizeAngle(-rotation);
        let activeIndex = 0;
        if (norm > 60 && norm <= 180) activeIndex = 1;
        else if (norm > 180 && norm <= 300) activeIndex = 2;

        iconWrappers.forEach((wrapper, i) => {
            const isActive = i === activeIndex;
            wrapper.classList.toggle('active', isActive);

            // 🔥 FIX: Only active icon should receive pointer events
            wrapper.style.pointerEvents = isActive ? 'auto' : 'none';
        });
    };

    updateActiveState(0);

    const handleStart = (e) => {
        // Only handle primary pointer and ignore if already processed by icon
        if (!e.isPrimary || e.defaultPrevented) return;

        isDragging = true;
        startX = e.clientX;
        lastX = startX;
        totalDragDistance = 0;

        if (carousel) {
            carousel.style.transition = 'none';
        }

        try {
            if (e.target.setPointerCapture) {
                e.target.setPointerCapture(e.pointerId);
            }
        } catch (err) {
            if (e.currentTarget.setPointerCapture) {
                e.currentTarget.setPointerCapture(e.pointerId);
            }
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

        try {
            if (e.target.releasePointerCapture) {
                e.target.releasePointerCapture(e.pointerId);
            }
        } catch (err) {
            // Ignore
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
        scene.addEventListener('pointerdown', handleStart);
        scene.addEventListener('pointermove', handleMove);
        scene.addEventListener('pointerup', handleEnd);
        scene.addEventListener('pointercancel', handleEnd);
        scene.addEventListener('pointerleave', (e) => {
            if (isDragging) {
                try {
                    if (scene.releasePointerCapture) {
                        scene.releasePointerCapture(e.pointerId);
                    }
                } catch (err) {
                    // Ignore
                }
                handleEnd(e);
            }
        });
    }

    window.addEventListener('resize', () => updateActiveState(currentRotation));

    // iOS sound unlock (keep this)
    document.addEventListener('touchstart', () => {
        if (!window._soundUnlocked) {
            const unlockSound = new Audio();
            unlockSound.play().then(() => unlockSound.remove());
            window._soundUnlocked = true;
        }
    }, { once: true });
});