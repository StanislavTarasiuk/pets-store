(function () {
  function initPetsCarousel() {
    const carousel = document.querySelector(".pets-carousel");
    if (!carousel) return;

    const track = carousel.querySelector(".pets-carousel__track");
    const prevBtn = carousel.querySelector(".pets-carousel__nav--prev");
    const nextBtn = carousel.querySelector(".pets-carousel__nav--next");

    if (!track || !prevBtn || !nextBtn) return;

    const originalItems = Array.from(
      track.querySelectorAll(
        ".pets-carousel__item:not(.pets-carousel__item--clone)"
      )
    );
    if (originalItems.length === 0) return;

    const totalItems = originalItems.length;
    let isScrolling = false;
    let currentIndex = 0;

    // Clone items for infinite loop - клонуємо всі елементи для справжнього безкінечного скролу
    function cloneItems() {
      // Remove existing clones
      const existingClones = track.querySelectorAll(
        ".pets-carousel__item--clone"
      );
      existingClones.forEach((clone) => clone.remove());

      // Clone all items to the end for seamless infinite scroll
      originalItems.forEach((item) => {
        const clone = item.cloneNode(true);
        clone.classList.add("pets-carousel__item--clone");
        track.appendChild(clone);
      });

      // Clone all items to the beginning for seamless infinite scroll
      originalItems.forEach((item) => {
        const clone = item.cloneNode(true);
        clone.classList.add("pets-carousel__item--clone");
        track.insertBefore(clone, originalItems[0]);
      });
    }

    // Initialize clones
    cloneItems();

    let allItems = Array.from(
      track.querySelectorAll(".pets-carousel__item")
    );
    const clonesAtStart = totalItems; // Кількість клонів на початку = кількість оригінальних елементів
    const firstOriginalIndex = clonesAtStart;
    const lastOriginalIndex = firstOriginalIndex + totalItems - 1;

    // Функція для оновлення списку всіх елементів
    function updateAllItems() {
      allItems = Array.from(track.querySelectorAll(".pets-carousel__item"));
    }

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
      const itemSize = itemWidth + gap;
      const currentIndex = Math.round(scrollLeft / itemSize);

      // Якщо доскролили до клонів в кінці, перестрибнути на оригінальні елементи
      if (currentIndex >= firstOriginalIndex + totalItems) {
        const offset = currentIndex - (firstOriginalIndex + totalItems);
        const newIndex = firstOriginalIndex + offset;
        track.style.scrollBehavior = "auto";
        track.scrollLeft = newIndex * itemSize;
        setTimeout(() => {
          track.style.scrollBehavior = "smooth";
        }, 50);
      }
      // Якщо доскролили до клонів на початку, перестрибнути на оригінальні елементи
      else if (currentIndex < clonesAtStart) {
        const offset = clonesAtStart - currentIndex;
        const newIndex = lastOriginalIndex - offset + 1;
        track.style.scrollBehavior = "auto";
        track.scrollLeft = newIndex * itemSize;
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
        updateAllItems();
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
    document.addEventListener("DOMContentLoaded", initPetsCarousel);
  } else {
    initPetsCarousel();
  }

  // Initialize for HTMX (if used)
  if (typeof htmx !== "undefined") {
    document.body.addEventListener("htmx:afterSwap", initPetsCarousel);
  }
})();

