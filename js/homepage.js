(async function () {
  // Initialize cart after HTMX loads cart elements
  async function initCartAfterLoad() {
    const totalPartials = document.querySelectorAll('[hx-trigger="load"]').length;
    let loadedPartialsCount = 0;

    const checkAndInit = async () => {
      loadedPartialsCount++;
      if (loadedPartialsCount === totalPartials) {
        const { initCart } = await import('./global.cart.js');
        initCart();
        setupProductPageAddToCart();
      }
    };

    document.body.addEventListener('htmx:afterOnLoad', checkAndInit);
    
    // Fallback: if all partials already loaded
    setTimeout(async () => {
      if (document.querySelector('.cart__icon') && document.querySelector('[data-cart-modal]')) {
        const { initCart } = await import('./global.cart.js');
        initCart();
        setupProductPageAddToCart();
      }
    }, 100);
  }

  // Setup Add to Cart button for product page
  async function setupProductPageAddToCart() {
    const addToCartBtn = document.querySelector(".product-page__add-to-cart");
    if (!addToCartBtn) return;

    // Remove existing listener if any
    const newBtn = addToCartBtn.cloneNode(true);
    addToCartBtn.parentNode.replaceChild(newBtn, addToCartBtn);

    newBtn.addEventListener("click", async () => {
      const productName = document.getElementById("product-name")?.textContent?.trim();
      const productPrice = document.getElementById("product-price")?.textContent?.trim();
      const productImage = document.getElementById("product-image")?.src;
      const productCode = document.getElementById("product-code")?.textContent?.trim();
      const quantityInput = document.querySelector(".product-page__quantity-input");
      const quantity = parseInt(quantityInput?.value, 10) || 1;

      if (!productName || !productPrice || !productImage) {
        console.error("Product information missing");
        return;
      }

      const productId = productCode || window.location.search.match(/id=(\d+)/)?.[1] || Date.now().toString();

      const { addItem } = await import('./global.cart.js');
      
      const product = {
        id: productId,
        name: productName,
        price: productPrice,
        image: productImage,
        quantity: quantity,
      };

      addItem(product);
    });
  }

  // Start initialization
  initCartAfterLoad();

  function initQuantityControls() {
    const quantityInput = document.querySelector(".product-page__quantity-input");
    const quantityBtnUp = document.querySelector(".product-page__quantity-btn--up");
    const quantityBtnDown = document.querySelector(".product-page__quantity-btn--down");

    if (!quantityInput || !quantityBtnUp || !quantityBtnDown) {
      return;
    }

    quantityBtnUp.addEventListener("click", () => {
      const currentValue = parseInt(quantityInput.value, 10) || 1;
      const newValue = currentValue + 1;
      quantityInput.value = newValue;
      quantityInput.dispatchEvent(new Event("change", { bubbles: true }));
    });

    quantityBtnDown.addEventListener("click", () => {
      const currentValue = parseInt(quantityInput.value, 10) || 1;
      const min = parseInt(quantityInput.min, 10) || 1;
      const newValue = Math.max(min, currentValue - 1);
      quantityInput.value = newValue;
      quantityInput.dispatchEvent(new Event("change", { bubbles: true }));
    });

    quantityInput.addEventListener("change", () => {
      const value = parseInt(quantityInput.value, 10);
      const min = parseInt(quantityInput.min, 10) || 1;
      if (isNaN(value) || value < min) {
        quantityInput.value = min;
      }
    });
  }

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initQuantityControls);
  } else {
    initQuantityControls();
  }

  if (!id) {
    console.warn("Product ID not found in URL");
    return;
  }

  try {
    const apiUrl = new URL('api/product.json', window.location.href);
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error("Failed to load products");
    }

    const products = await response.json();
    const productId = parseInt(id, 10);
    const product = products.find((p) => p.id === productId);

    if (product) {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => renderProduct(product));
      } else {
        renderProduct(product);
      }
    } else {
      const container = document.querySelector(".product-page__container");
      if (container) container.innerHTML = "<h1>Product not found</h1>";
    }
  } catch (error) {
    console.error("Error:", error);
    const container = document.querySelector(".product-page__container");
    if (container) container.innerHTML = "<h1>Error loading details</h1>";
  }

  function renderProduct(product) {
    const img = document.getElementById("product-image");
    const thumbnail = document.getElementById("product-thumbnail");
    const name = document.getElementById("product-name");
    const code = document.getElementById("product-code");
    const price = document.getElementById("product-price");
    const desc = document.getElementById("product-description");

    if (img) {
      img.src = product.image;
      img.alt = product.name;
    }
    
    if (thumbnail) {
      thumbnail.src = product.image;
      thumbnail.alt = product.name;
    }
    
    if (name) name.innerText = product.name;
    
    const breadcrumbName = document.getElementById("breadcrumb-name");
    if (breadcrumbName) breadcrumbName.innerText = product.name;
    
    if (code) code.innerText = product.id;
    if (price) price.innerText = product.price;
    if (desc) desc.innerText = product.description;

    document.title = `${product.name} - Product Details`;
    
    // Ensure add to cart button is set up after product is rendered
    setupProductPageAddToCart();
  }
})();
