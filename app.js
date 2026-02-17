const MOBILE_BREAKPOINT = 768;

document.addEventListener('DOMContentLoaded', () => {
    const carousel = document.querySelector('.carousel');
    const iconWrappers = document.querySelectorAll('.icon-wrapper');
    // Keep preload but we'll use fresh instances for reliability
    const clickSound = new Audio('./sound/click.wav');
    clickSound.preload = 'auto';

    let lastSoundTime = 0;
    const SOUND_DEBOUNCE = 300; // 🔥 FIX: Increased from 50ms to 300ms (mobile standard)

    const playClickSound = () => {
        const now = Date.now();
        if (now - lastSoundTime < SOUND_DEBOUNCE) return;
        lastSoundTime = now;

        // 🔥 FIX: Create FRESH audio instance (cloneNode causes issues on iOS)
        const sound = new Audio('./sound/click.wav');
        sound.play().catch(e => {
            console.warn("Audio play failed:", e);

            // 🔥 FIX: iOS autoplay fallback
            if (e.name === 'NotAllowedError' && !window._soundUnlocked) {
                document.body.addEventListener('click', () => {
                    window._soundUnlocked = true;
                    sound.play().catch(err => console.error("Fallback failed:", err));
                }, { once: true });
            }
        });
    };

    // Attach sound logic to icons using pointer events
    iconWrappers.forEach(wrapper => {
        wrapper.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            // 🔥 FIX: CRITICAL - Stop event from bubbling to parent container
            e.stopPropagation();
            playClickSound();
        }, { passive: false });
    });

    let startX = 0;
    let lastX = 0;
    let currentRotation = 0;
    let isDragging = false;
    let totalDragDistance = 0;

    const STEP = 120;
    const DRAG_SENSITIVITY = 0.7;

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

    // Interaction Handlers using Pointer Events
    const handleStart = (e) => {
        // 🔥 FIX: Ignore if already handled by child (icon)
        if (e.defaultPrevented) return;

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
        try { // 🔥 FIX: Added try/catch for safer pointer capture
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

        // 🔥 FIX: Safe pointer release with try/catch
        try {
            if (e.target.releasePointerCapture) {
                e.target.releasePointerCapture(e.pointerId);
            }
        } catch (err) {
            // Ignore errors
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
                try { // 🔥 FIX: Safe pointer release in leave handler
                    if (scene.releasePointerCapture) {
                        scene.releasePointerCapture(e.pointerId);
                    }
                } catch (err) {
                    // Ignore errors
                }
                handleEnd(e);
            }
        });
    }

    window.addEventListener('resize', () => updateActiveState(currentRotation));

    // 🔥 FIX: iOS sound unlock mechanism
    document.addEventListener('touchstart', () => {
        if (!window._soundUnlocked) {
            const unlockSound = new Audio();
            unlockSound.play().then(() => unlockSound.remove());
            window._soundUnlocked = true;
        }
    }, { once: true });
});