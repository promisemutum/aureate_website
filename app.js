// Subtle parallax movement effect for 3:2 image on 16:9 display
document.addEventListener('mousemove', (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;

    // Convert mouse position to percentage (-1 to 1 range from center)
    const xPercent = (clientX / innerWidth - 0.5) * 2;
    const yPercent = (clientY / innerHeight - 0.5) * 2;

    // Subtle movement: 5% range for smooth parallax
    const moveX = xPercent * 5;
    const moveY = yPercent * 5;

    document.body.style.backgroundPosition = `${50 + moveX}% ${50 + moveY}%`;
});

window.addEventListener('load', () => {
    console.log('Aureate Realm loaded successfully');
});
