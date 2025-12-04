let cartState = [];
const STORAGE_KEY = "pets-store-cart";

export function initCart() {
  loadFromStorage();
  renderCart();
  setupEventListeners();
  setupAddToCartButtons();
  
  const cartIcon = document.querySelector(".cart__icon");
  const totalItems = cartState.reduce((sum, item) => sum + item.quantity, 0);
  if (cartIcon) {
    cartIcon.style.display = totalItems === 0 ? "none" : "flex";
  }
}

function setupEventListeners() {
  const cartIcon = document.querySelector(".cart__icon");
  const cartModal = document.querySelector("[data-cart-modal]");
  const closeBtn = document.querySelector(".cart-modal__close");
  const overlay = document.querySelector(".cart-modal__overlay");
  const cartForm = document.querySelector("[data-cart-form]");

  if (cartIcon && cartModal) {
    cartIcon.addEventListener("click", () => openModal());
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => closeModal());
  }

  if (overlay) {
    overlay.addEventListener("click", () => closeModal());
  }

  if (cartForm) {
    cartForm.addEventListener("submit", handleCheckout);
  }

  if (cartModal && !cartModal.dataset.itemsListenerAdded) {
    cartModal.dataset.itemsListenerAdded = "true";
    cartModal.addEventListener("click", (e) => {
      const button = e.target.closest("[data-action]");
      if (!button) return;

      const action = button.dataset.action;
      const productId = button.dataset.productId;

      if (!productId) return;

      switch (action) {
        case "increase":
          updateQuantity(productId, 1);
          break;
        case "decrease":
          updateQuantity(productId, -1);
          break;
        case "remove":
          removeItem(productId);
          break;
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const cartModal = document.querySelector("[data-cart-modal]");
      const messageModal = document.querySelector("[data-cart-message]");
      
      if (cartModal?.getAttribute("aria-hidden") === "false") {
        closeModal();
      } else if (messageModal?.getAttribute("aria-hidden") === "false") {
        closeMessageModal();
      }
    }
  });
}

let productsMapCache = null;

async function loadProductsMap() {
  if (productsMapCache) {
    return productsMapCache;
  }

  productsMapCache = new Map();
  try {
    const response = await fetch("api/product.json");
    const products = await response.json();
    products.forEach((product) => {
      productsMapCache.set(product.name, product);
    });
  } catch (error) {
    console.error("Error loading products:", error);
  }
  return productsMapCache;
}

let addToCartListenerAdded = false;

function setupAddToCartButtons() {
  if (addToCartListenerAdded) return;
  addToCartListenerAdded = true;

  document.addEventListener("click", async (e) => {
    const button = e.target.closest(
      ".trending-carousel__item-button, .arrivals-carousel__item-button"
    );
    if (!button) return;

    const item = button.closest(
      ".trending-carousel__item, .arrivals-carousel__item"
    );
    if (!item) return;

    const productName = item.querySelector(
      ".trending-carousel__item-title a, .arrivals-carousel__item-title a"
    )?.textContent?.trim();
    const productPrice = item.querySelector(
      ".trending-carousel__item-price, .arrivals-carousel__item-price"
    )?.textContent?.trim();
    const productImage = item.querySelector(
      ".trending-carousel__item-image, .arrivals-carousel__item-image"
    )?.src;

    if (productName && productPrice && productImage) {
      const productsMap = await loadProductsMap();
      const productIdFromData = item.dataset.productId;
      let productId = productIdFromData;

      if (!productId) {
        const productData = productsMap.get(productName);
        productId = productData
          ? productData.id.toString()
          : `${productName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
      }

      const product = {
        id: productId,
        name: productName,
        price: productPrice,
        image: productImage,
        quantity: 1,
      };

      addItem(product);
    }
  });
}

export function addItem(product) {
  const existingItem = cartState.find((item) => item.id === product.id);

  if (existingItem) {
    existingItem.quantity += (product.quantity || 1);
  } else {
    cartState.push({
      ...product,
      quantity: product.quantity || 1,
    });
  }

  saveToStorage();
  renderCart();
}

function removeItem(id) {
  cartState = cartState.filter((item) => item.id !== id);
  saveToStorage();
  renderCart();
}

function updateQuantity(id, delta) {
  const item = cartState.find((item) => item.id === id);
  if (!item) return;

  item.quantity = Math.max(1, item.quantity + delta);
  saveToStorage();
  renderCart();
}

function calculateTotal() {
  return cartState.reduce((total, item) => {
    const priceStr = item.price.replace(/[^0-9,]/g, "").replace(",", ".");
    const price = parseFloat(priceStr) || 0;
    return total + price * item.quantity;
  }, 0);
}

function formatPrice(price) {
  return `$${price.toFixed(2).replace(".", ",")}`;
}

function renderCart() {
  const itemsContainer = document.querySelector("[data-cart-items]");
  const totalElement = document.querySelector("[data-cart-total]");
  const badgeElement = document.querySelector("[data-cart-count]");
  const cartIcon = document.querySelector(".cart__icon");

  if (!itemsContainer) return;

  const totalItems = cartState.reduce((sum, item) => sum + item.quantity, 0);
  if (badgeElement) {
    badgeElement.textContent = totalItems;
    badgeElement.setAttribute("data-cart-count", totalItems);
  }

  if (cartIcon) {
    cartIcon.style.display = totalItems === 0 ? "none" : "flex";
  }

  if (cartState.length === 0) {
    itemsContainer.innerHTML = `
      <li class="cart-modal__empty">
        <p>Your cart is empty</p>
      </li>
    `;
    if (totalElement) {
      totalElement.textContent = "$0,00";
    }
    return;
  }

  const itemsHtml = cartState.map((item) => `
    <li class="cart-modal__product-item" data-product-id="${item.id}">
      <img
        class="cart-modal__product-image"
        src="${item.image}"
        alt="${item.name}"
      />
      <div class="cart-modal__product-info">
        <h4 class="cart-modal__product-name">${item.name}</h4>
        <div class="cart-modal__product-controls">
          <div class="cart-modal__quantity-control">
            <button
              class="cart-modal__quantity-btn"
              type="button"
              data-action="decrease"
              data-product-id="${item.id}"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span class="cart-modal__quantity-value">${item.quantity}</span>
            <button
              class="cart-modal__quantity-btn"
              type="button"
              data-action="increase"
              data-product-id="${item.id}"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <span class="cart-modal__product-price">${item.price}</span>
        </div>
      </div>
      <button
        class="cart-modal__product-remove"
        type="button"
        data-action="remove"
        data-product-id="${item.id}"
        aria-label="Remove item"
      >
        <svg
          class="cart-modal__product-remove-icon"
          width="14"
          height="18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          focusable="false"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M10 2h3.6c.2 0 .4.2.4.4v1.2c0 .2-.2.4-.4.4H.4C.2 4 0 3.9 0 3.6V2.4c0-.2.2-.4.4-.3h3.7V2L4.9.3c.1-.2.2-.3.4-.3h3.5c.1 0 .3.1.4.2l.8 1.7V2zM1.8 16.1c.1 1 1 1.9 2 1.9h6.3c1.1 0 1.9-.8 2-1.9l1-11.1H1l.8 11.1zM12 6l-.8 10.1c0 .5-.5.9-1 .9H3.8c-.5 0-1-.4-1-.9L2 6h10zM5 8.1h1v6H5v-6zm4 0H8v6h1v-6z"
            fill="#9199AB"
          ></path>
        </svg>
      </button>
    </li>
  `).join("");

  itemsContainer.innerHTML = itemsHtml;

  const total = calculateTotal();
  if (totalElement) {
    totalElement.textContent = formatPrice(total);
  }
}

function openModal() {
  const modal = document.querySelector("[data-cart-modal]");
  if (!modal) return;

  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const modal = document.querySelector("[data-cart-modal]");
  if (!modal) return;

  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

export function showMessageModal(message, type) {
  const messageModal = document.querySelector("[data-cart-message]");
  const messageIcon = document.querySelector("[data-message-icon]");
  const messageText = document.querySelector("[data-message-text]");
  
  if (!messageModal || !messageIcon || !messageText) return;

  messageText.textContent = message;

  if (type === "success") {
    messageIcon.innerHTML = `
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
        <path d="M8 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    messageIcon.className = "cart-modal__message-icon cart-modal__message-icon--success";
  } else {
    messageIcon.innerHTML = `
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
        <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    messageIcon.className = "cart-modal__message-icon cart-modal__message-icon--error";
  }

  messageModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  setTimeout(() => {
    closeMessageModal();
  }, 3000);
}

function closeMessageModal() {
  const messageModal = document.querySelector("[data-cart-message]");
  if (!messageModal) return;

  messageModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

async function handleCheckout(e) {
  e.preventDefault();

  if (cartState.length === 0) {
    alert("Your cart is empty");
    return;
  }

  const form = e.target;
  const formData = new FormData(form);
  const total = calculateTotal();

  cartState.forEach((item, index) => {
    const itemPrefix = `cart_item_${index}_`;
    formData.append(`${itemPrefix}name`, item.name);
    formData.append(`${itemPrefix}price`, item.price);
    formData.append(`${itemPrefix}quantity`, item.quantity);
  });
  formData.append('cart_total', formatPrice(total));
  formData.append('cart_items_count', cartState.reduce((sum, item) => sum + item.quantity, 0));

  try {
    const response = await fetch(form.action, {
      method: form.method,
      body: formData,
      headers: {
        Accept: "application/json",
      },
    });

    if (response.ok) {
      showMessageModal("Thank you for your purchase, we will contact you", "success");
      cartState = [];
      saveToStorage();
      renderCart();
      form.reset();
      closeModal();
    } else {
      const data = await response.json();
      const errorMessage = data.error || "Oops! There was a problem submitting your form";
      showMessageModal(errorMessage, "error");
    }
  } catch (error) {
    console.error("Error submitting form:", error);
    showMessageModal("Oops! There was a problem submitting your form", "error");
  }
}

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cartState));
  } catch (error) {
    console.error("Error saving cart to storage:", error);
  }
}

function loadFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      cartState = JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error loading cart from storage:", error);
    cartState = [];
  }
}

export function clearCart() {
  cartState = [];
  saveToStorage();
  renderCart();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCart);
} else {
  initCart();
}

if (typeof htmx !== "undefined") {
  document.body.addEventListener("htmx:afterSwap", () => {
    const cartModal = document.querySelector("[data-cart-modal]");
    if (cartModal && !cartModal.dataset.itemsListenerAdded) {
      setupEventListeners();
    }
    setupAddToCartButtons();
    renderCart();
  });
}

