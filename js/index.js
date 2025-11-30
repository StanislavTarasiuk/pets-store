async function init() {
    await import('./index.pets-carousel.js');
    await import('./index.trending-carousel.js');
    await import('./index.arrivals-carousel.js');
    await import('./index.testimonials.js');
    await import('./homepage.js');
    const { initCart } = await import('./global.cart.js');
    initCart();
}

const totalPartials = document.querySelectorAll('[hx-trigger="load"], [data-hx-trigger="load"]').length;
let loadedPartialsCount = 0;

document.body.addEventListener('htmx:afterOnLoad', () => {
    loadedPartialsCount++;
    if (loadedPartialsCount === totalPartials) {
        init();
    }
});