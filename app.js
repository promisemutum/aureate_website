const MOBILE_BREAKPOINT = 768;

document.addEventListener('DOMContentLoaded', () => {
    const carousel = document.querySelector('.carousel');
    const iconWrappers = document.querySelectorAll('.icon-wrapper');
    const clickSound = new Audio('./sound/click.wav');
    clickSound.preload = 'auto';

    let lastSoundTime = 0;
    const SOUND_DEBOUNCE = 300;
    const TAP_THRESHOLD = 10;

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

    iconWrappers.forEach(wrapper => {
        wrapper.addEventListener('pointerdown', (e) => {
            touchData.startX = e.clientX;
            touchData.startY = e.clientY;
            touchData.isScrolling = false;
        }, { passive: true });

        wrapper.addEventListener('pointermove', (e) => {
            const dx = Math.abs(e.clientX - touchData.startX);
            const dy = Math.abs(e.clientY - touchData.startY);

            if (dx > TAP_THRESHOLD || dy > TAP_THRESHOLD) {
                touchData.isScrolling = true;
            }
        }, { passive: true });

        wrapper.addEventListener('pointerup', (e) => {
            if (!touchData.isScrolling) {
                playClickSound();
            }
        });

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
        if (window.innerWidth > MOBILE_BREAKPOINT) return;

        const norm = normalizeAngle(-rotation);
        let activeIndex = 0;
        if (norm > 60 && norm <= 180) activeIndex = 1;
        else if (norm > 180 && norm <= 300) activeIndex = 2;

        iconWrappers.forEach((wrapper, i) => {
            const isActive = i === activeIndex;
            wrapper.classList.toggle('active', isActive);
            wrapper.style.pointerEvents = isActive ? 'auto' : 'none';
        });
    };

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

        if (carousel) {
            carousel.style.transition = 'none';
        }

        // 🔥 iOS FIX: Use setPointerCapture on the carousel itself
        try {
            if (carousel && carousel.setPointerCapture) {
                carousel.setPointerCapture(e.pointerId);
            }
        } catch (err) {
            console.warn('Pointer capture failed:', err);
        }
    };

    const handleMove = (e) => {
        if (window.innerWidth > MOBILE_BREAKPOINT) return;
        if (!isDragging || !e.isPrimary) return;

        e.preventDefault(); // 🔥 iOS FIX: Prevent default scrolling during drag

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
        if (window.innerWidth > MOBILE_BREAKPOINT) return;
        if (!isDragging || !e.isPrimary) return;
        isDragging = false;

        try {
            if (carousel && carousel.releasePointerCapture) {
                carousel.releasePointerCapture(e.pointerId);
            }
        } catch (err) {
            console.warn('Pointer release failed:', err);
        }

        const snapTarget = Math.round(currentRotation / STEP) * STEP;
        currentRotation = snapTarget;

        if (carousel) {
            carousel.style.transition = 'transform 0.5s ease-out';
            carousel.style.transform = `rotateY(${snapTarget}deg)`;
            updateActiveState(snapTarget);
        }
    };

    // 🔥 iOS FIX: Attach events to carousel instead of container
    if (carousel) {
        carousel.addEventListener('pointerdown', handleStart);
        carousel.addEventListener('pointermove', handleMove);
        carousel.addEventListener('pointerup', handleEnd);
        carousel.addEventListener('pointercancel', handleEnd);
        carousel.addEventListener('pointerleave', (e) => {
            if (isDragging) {
                try {
                    if (carousel.releasePointerCapture) {
                        carousel.releasePointerCapture(e.pointerId);
                    }
                } catch (err) {
                    console.warn('Pointer release failed:', err);
                }
                handleEnd(e);
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

    document.addEventListener('touchstart', () => {
        if (!window._soundUnlocked) {
            const unlockSound = new Audio();
            unlockSound.play().then(() => unlockSound.remove());
            window._soundUnlocked = true;
        }
    }, { once: true });
});