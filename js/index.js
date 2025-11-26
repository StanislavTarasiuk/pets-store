async function init() {
    // Завантажуємо модулі каруселей
    // Обидва модулі мають власні обробники HTMX для автоматичної ініціалізації
    await import('./index.pets-carousel.js');
    await import('./index.trending-carousel.js');
}

const totalPartials = document.querySelectorAll('[hx-trigger="load"], [data-hx-trigger="load"]').length;
let loadedPartialsCount = 0;

document.body.addEventListener('htmx:afterOnLoad', () => {
    loadedPartialsCount++;
    if (loadedPartialsCount === totalPartials) {
        init();
    }
});