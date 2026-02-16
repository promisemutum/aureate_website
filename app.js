const MOBILE_BREAKPOINT = 768;

document.addEventListener('DOMContentLoaded', () => {
    const carousel = document.querySelector('.carousel');
    const iconWrappers = document.querySelectorAll('.icon-wrapper');
    const clickSound = new Audio('./sound/click.wav');

    const playClickSound = () => {
        clickSound.currentTime = 0;
        clickSound.play().catch(() => { });
    };

    iconWrappers.forEach(wrapper => {
        wrapper.addEventListener('click', playClickSound);
        wrapper.addEventListener('mouseenter', playClickSound);
    });

    let startX = 0;
    let currentX = 0;
    let currentRotation = 0;
    let isDragging = false;
    let lastX = 0;
    let lastTime = 0;
    let velocity = 0;
    let rafId = null;

    const STEP = 120;
    const DRAG_SENSITIVITY = 0.5;
    const VELOCITY_THRESHOLD = 0.3;

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
            wrapper.style.pointerEvents = isActive ? 'auto' : 'none';
        });
    };

    if (window.innerWidth <= MOBILE_BREAKPOINT) {
        updateActiveState(0);
    }

    const handleDragStart = (e) => {
        if (window.innerWidth > MOBILE_BREAKPOINT) return;
        isDragging = true;
        startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        lastX = startX;
        lastTime = Date.now();
        velocity = 0;

        if (rafId) cancelAnimationFrame(rafId);
        if (carousel) carousel.style.transition = 'none';
        iconWrappers.forEach(w => w.style.pointerEvents = 'none');
    };

    const handleDragMove = (e) => {
        if (!isDragging || window.innerWidth > MOBILE_BREAKPOINT) return;

        const x = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const now = Date.now();
        const dt = now - lastTime;

        if (dt > 0) velocity = (x - lastX) / dt;
        lastX = x;
        lastTime = now;

        const delta = x - startX;
        currentX = currentRotation + delta * DRAG_SENSITIVITY;

        rafId = requestAnimationFrame(() => {
            if (carousel) carousel.style.transform = `rotateY(${currentX}deg)`;
            updateActiveState(currentX); // Keeping this optimizations from "instant feedback" step
        });
    };

    const snapTo = (target) => {
        if (!carousel) return;
        carousel.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
        carousel.style.transform = `rotateY(${target}deg)`;
        currentRotation = target;
        playClickSound(); // Sound restored on rotation as per revert request

        const onSnap = () => {
            updateActiveState(currentRotation);
            carousel.removeEventListener('transitionend', onSnap);
        };
        carousel.addEventListener('transitionend', onSnap);
    };

    const handleDragEnd = () => {
        if (!isDragging || window.innerWidth > MOBILE_BREAKPOINT) return;
        isDragging = false;

        // Momentum: if swiped fast, nudge by one step
        let target;
        if (Math.abs(velocity) > VELOCITY_THRESHOLD) {
            const direction = velocity > 0 ? 1 : -1;
            target = Math.round(currentRotation / STEP) * STEP + direction * STEP;
        } else {
            target = Math.round(currentX / STEP) * STEP;
        }

        snapTo(target);
    };

    const scene = document.querySelector('.icons-row');
    if (scene) {
        scene.addEventListener('mousedown', handleDragStart);
        scene.addEventListener('touchstart', handleDragStart, { passive: true });
        window.addEventListener('mousemove', handleDragMove);
        window.addEventListener('touchmove', handleDragMove, { passive: true });
        window.addEventListener('mouseup', handleDragEnd);
        window.addEventListener('touchend', handleDragEnd);
    }

    window.addEventListener('resize', () => {
        if (window.innerWidth > MOBILE_BREAKPOINT) {
            if (carousel) carousel.style.transform = 'none';
            iconWrappers.forEach(w => w.style.pointerEvents = '');
        } else {
            if (carousel) carousel.style.transform = `rotateY(${currentRotation}deg)`;
            updateActiveState(currentRotation);
        }
    });
});
