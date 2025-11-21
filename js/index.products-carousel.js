(function () {
  function initProductsCarousel() {
    const carousel = document.querySelector(".products-carousel");
    if (!carousel) return;

    const track = carousel.querySelector(".products-carousel__track");
    const prevBtn = carousel.querySelector(".products-carousel__nav--prev");
    const nextBtn = carousel.querySelector(".products-carousel__nav--next");

    if (!track || !prevBtn || !nextBtn) return;

    const originalItems = Array.from(
      track.querySelectorAll(
        ".products-carousel__item:not(.products-carousel__item--clone)"
      )
    );
    if (originalItems.length === 0) return;

    const totalItems = originalItems.length;
    let isScrolling = false;
    let currentIndex = 0;

    // Clone items for infinite loop
    function cloneItems() {
      // Remove existing clones
      const existingClones = track.querySelectorAll(
        ".products-carousel__item--clone"
      );
      existingClones.forEach((clone) => clone.remove());

      // Clone first 4 items to the end
      const itemsToClone = Math.min(4, totalItems);
      for (let i = 0; i < itemsToClone; i++) {
        const clone = originalItems[i].cloneNode(true);
        clone.classList.add("products-carousel__item--clone");
        track.appendChild(clone);
      }

      // Clone last 4 items to the beginning
      const startIndex = Math.max(0, totalItems - itemsToClone);
      for (let i = startIndex; i < totalItems; i++) {
        const clone = originalItems[i].cloneNode(true);
        clone.classList.add("products-carousel__item--clone");
        track.insertBefore(clone, originalItems[0]);
      }
    }

    // Initialize clones
    cloneItems();

    const allItems = Array.from(
      track.querySelectorAll(".products-carousel__item")
    );
    const clones = Array.from(
      track.querySelectorAll(".products-carousel__item--clone")
    );
    const clonesAtStart = clones.length / 2;
    const firstOriginalIndex = clonesAtStart;
    const lastOriginalIndex = firstOriginalIndex + totalItems - 1;

    // Set initial position to first original item
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
      const currentIndex = Math.round(scrollLeft / (itemWidth + gap));

      // If scrolled to clones at the end, jump to original items
      if (currentIndex >= allItems.length - 2) {
        const offset = currentIndex - (allItems.length - 4);
        const newIndex = firstOriginalIndex + offset;
        track.style.scrollBehavior = "auto";
        track.scrollLeft = newIndex * (itemWidth + gap);
        setTimeout(() => {
          track.style.scrollBehavior = "smooth";
        }, 50);
      }
      // If scrolled to clones at the beginning, jump to original items
      else if (currentIndex <= clonesAtStart) {
        const offset = clonesAtStart - currentIndex;
        const newIndex = lastOriginalIndex - offset;
        track.style.scrollBehavior = "auto";
        track.scrollLeft = newIndex * (itemWidth + gap);
        setTimeout(() => {
          track.style.scrollBehavior = "smooth";
        }, 50);
      }
    }

    // Event listeners
    prevBtn.addEventListener("click", scrollPrev);
    nextBtn.addEventListener("click", scrollNext);

    track.addEventListener("scroll", () => {
      if (!isScrolling) {
        checkAndResetPosition();
      }
    });

    // Handle window resize
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        cloneItems();
        setTimeout(() => {
          setInitialPosition();
        }, 100);
      }, 250);
    });

    // Initialize position
    setTimeout(() => {
      setInitialPosition();
    }, 200);
  }

  // Initialize on load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initProductsCarousel);
  } else {
    initProductsCarousel();
  }

  // Initialize for HTMX (if used)
  if (typeof htmx !== "undefined") {
    document.body.addEventListener("htmx:afterSwap", initProductsCarousel);
  }
})();

