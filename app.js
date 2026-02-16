const MOBILE_BREAKPOINT = 768;

document.addEventListener('DOMContentLoaded', () => {
    const carousel = document.querySelector('.carousel');
    const iconWrappers = document.querySelectorAll('.icon-wrapper');
    const clickSound = new Audio('./sound/click.wav');
    clickSound.preload = 'auto';

    let lastSoundTime = 0;
    const SOUND_DEBOUNCE = 150; // ms

    // Force unlock audio on first interaction
    const unlockAudio = () => {
        clickSound.play().then(() => {
            clickSound.pause();
            clickSound.currentTime = 0;
        }).catch(() => { });
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('touchstart', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio, { passive: true });

    const playClickSound = () => {
        const now = Date.now();
        if (now - lastSoundTime < SOUND_DEBOUNCE) return;

        lastSoundTime = now;
        const sound = clickSound.cloneNode();
        sound.play().catch(e => console.warn(e));
    };

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

    const getX = (e) => e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;

    const handleStart = (e) => {
        isDragging = true;
        startX = getX(e);
        lastX = startX;
        totalDragDistance = 0;

        if (carousel) {
            carousel.style.transition = 'none';
        }
    };

    const handleMove = (e) => {
        if (!isDragging) return;

        const x = getX(e);
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
        if (!isDragging) return;
        isDragging = false;

        if (totalDragDistance < 10) {
            const target = e.target.closest('.icon-wrapper');
            if (target) {
                playClickSound();
            }
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
        scene.addEventListener('mousedown', handleStart);
        scene.addEventListener('touchstart', handleStart, { passive: true });

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchmove', handleMove, { passive: true });

        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchend', handleEnd);
    }

    window.addEventListener('resize', () => updateActiveState(currentRotation));
});
