(async function () {
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
    const response = await fetch("api/product.json");
    if (!response.ok) {
      throw new Error("Failed to load products");
    }

    const products = await response.json();
    const product = products.find((p) => p.id == id);

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
  }
})();
