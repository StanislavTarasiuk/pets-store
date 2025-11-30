(function () {
  function getHomepageUrl(productId) {
    const pathname = window.location.pathname;
    const basePath = pathname.substring(0, pathname.lastIndexOf('/') + 1);
    return basePath + 'homepage?id=' + productId;
  }

  function renderProducts(products) {
    const track = document.querySelector(".trending-carousel__track");
    if (!track) return;

    const productsHtml = [];

    for (const product of products) {
      const productHtml = `
          <article class="trending-carousel__item" data-product-id="${product.id}">
            <div class="trending-carousel__item-image-wrapper">
              <img
                class="trending-carousel__item-image"
                src="${product.image}"
                alt="${product.name}"
              />
            </div>
            <h3 class="trending-carousel__item-title">
              <a href="${getHomepageUrl(product.id)}" class="trending-carousel__item-link">${product.name}</a>
            </h3>
            <p class="trending-carousel__item-price">${product.price}</p>
            <button class="trending-carousel__item-button" type="button">
              Add to Cart
            </button>
          </article>`;
      productsHtml.push(productHtml);
    }

    track.innerHTML = productsHtml.join("");
  }

  async function loadAndRenderProducts() {
    try {
      const response = await fetch("api/product.json");
      const products = await response.json();
      renderProducts(products);
      return products;
    } catch (error) {
      console.error("Error loading products:", error);
      return [];
    }
  }

  async function initTrendingCarousel() {
    const trendingCarouselSection = document.querySelector(".trending-carousel");
    if (!trendingCarouselSection) {
      console.warn("Trending section not found");
      return;
    }

    const carousel = trendingCarouselSection.querySelector(".trending-carousel__carousel");
    const track = trendingCarouselSection.querySelector(".trending-carousel__track");
    let prevBtn = trendingCarouselSection.querySelector(".trending-carousel__nav--prev");
    let nextBtn = trendingCarouselSection.querySelector(".trending-carousel__nav--next");

    if (!carousel || !track || !prevBtn || !nextBtn) {
      console.warn("Trending carousel elements not found");
      return;
    }

    const products = await loadAndRenderProducts();
    if (products.length === 0) {
      console.warn("No products loaded");
      return;
    }

    const items = track.querySelectorAll(".trending-carousel__item");
    if (items.length === 0) {
      console.warn("No items found after rendering");
      return;
    }

  const wasInitialized = track.dataset.initialized === "true";
  track.dataset.initialized = "true";

  const originalItems = Array.from(items);
  const totalItems = originalItems.length;
  if (totalItems === 0) return;

  let isScrolling = false;

  function cloneItems() {
    const existingClones = track.querySelectorAll(".trending-carousel__item--clone");
    existingClones.forEach((clone) => clone.remove());

    originalItems.forEach((item) => {
      const clone = item.cloneNode(true);
      clone.classList.add("trending-carousel__item--clone");
      track.appendChild(clone);
    });

    originalItems.forEach((item) => {
      const clone = item.cloneNode(true);
      clone.classList.add("trending-carousel__item--clone");
      track.insertBefore(clone, originalItems[0]);
    });
  }

  cloneItems();

  let allItems = Array.from(track.querySelectorAll(".trending-carousel__item"));
  const clonesAtStart = totalItems;
  const firstOriginalIndex = clonesAtStart;
  const lastOriginalIndex = firstOriginalIndex + totalItems - 1;

  function updateAllItems() {
    allItems = Array.from(track.querySelectorAll(".trending-carousel__item"));
  }

  function setInitialPosition() {
    if (allItems.length === 0) return;
    const firstItem = allItems[firstOriginalIndex];
    if (!firstItem) return;

    const itemWidth = firstItem.offsetWidth;
    const gap = parseInt(
      window.getComputedStyle(track).getPropertyValue("gap") || "0"
    );
    const scrollAmount = firstOriginalIndex * (itemWidth + gap);

    track.style.scrollBehavior = "auto";
    track.scrollLeft = scrollAmount;
    setTimeout(() => {
      track.style.scrollBehavior = "smooth";
    }, 50);
  }

  function getItemWidth() {
    if (allItems.length === 0) return 0;
    return allItems[0].offsetWidth;
  }

  function getGap() {
    return parseInt(
      window.getComputedStyle(track).getPropertyValue("gap") || "0"
    );
  }

  function scrollNext() {
    if (isScrolling) return;
    isScrolling = true;

    const itemWidth = getItemWidth();
    const gap = getGap();
    const scrollLeft = track.scrollLeft;
    const nextScroll = scrollLeft + itemWidth + gap;

    track.scrollTo({
      left: nextScroll,
      behavior: "smooth",
    });

    setTimeout(() => {
      isScrolling = false;
      checkAndResetPosition();
    }, 500);
  }

  function scrollPrev() {
    if (isScrolling) return;
    isScrolling = true;

    const itemWidth = getItemWidth();
    const gap = getGap();
    const scrollLeft = track.scrollLeft;
    const prevScroll = scrollLeft - itemWidth - gap;

    track.scrollTo({
      left: prevScroll,
      behavior: "smooth",
    });

    setTimeout(() => {
      isScrolling = false;
      checkAndResetPosition();
    }, 500);
  }

  function checkAndResetPosition() {
    if (isScrolling) return;

    const itemWidth = getItemWidth();
    const gap = getGap();
    if (itemWidth === 0) return;

    const scrollLeft = track.scrollLeft;
    const itemSize = itemWidth + gap;
    const currentIndex = Math.round(scrollLeft / itemSize);

    if (currentIndex >= firstOriginalIndex + totalItems) {
      const offset = currentIndex - (firstOriginalIndex + totalItems);
      const newIndex = firstOriginalIndex + offset;
      track.style.scrollBehavior = "auto";
      track.scrollLeft = newIndex * itemSize;
      setTimeout(() => {
        track.style.scrollBehavior = "smooth";
      }, 50);
    } else if (currentIndex < clonesAtStart) {
      const offset = clonesAtStart - currentIndex;
      const newIndex = lastOriginalIndex - offset + 1;
      track.style.scrollBehavior = "auto";
      track.scrollLeft = newIndex * itemSize;
      setTimeout(() => {
        track.style.scrollBehavior = "smooth";
      }, 50);
    }
  }

  if (prevBtn && nextBtn) {
    if (wasInitialized) {
      const newPrevBtn = prevBtn.cloneNode(true);
      const newNextBtn = nextBtn.cloneNode(true);
      prevBtn.replaceWith(newPrevBtn);
      nextBtn.replaceWith(newNextBtn);
      prevBtn = newPrevBtn;
      nextBtn = newNextBtn;
    }
    
    prevBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      scrollPrev();
    });
    nextBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      scrollNext();
    });
  } else {
    console.error("Trending carousel buttons not found for event listeners", { prevBtn, nextBtn });
  }

  track.addEventListener("scroll", () => {
    if (!isScrolling) {
      checkAndResetPosition();
    }
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      cloneItems();
      updateAllItems();
      setTimeout(() => {
        setInitialPosition();
      }, 100);
    }, 250);
  });

    setTimeout(() => {
      setInitialPosition();
    }, 200);
  }

  async function init() {
    await initTrendingCarousel();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  if (typeof htmx !== "undefined") {
    document.body.addEventListener("htmx:afterSwap", init);
  }
})();
