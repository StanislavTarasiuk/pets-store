// Cart state
let cartState = [];

// Storage key
const STORAGE_KEY = "pets-store-cart";

// Initialize cart
export function initCart() {
  loadFromStorage();
  renderCart();
  setupEventListeners();
  setupAddToCartButtons();
  
  // Initial icon visibility check
  const cartIcon = document.querySelector(".cart__icon");
  const totalItems = cartState.reduce((sum, item) => sum + item.quantity, 0);
  if (cartIcon) {
    if (totalItems === 0) {
      cartIcon.style.display = "none";
    } else {
      cartIcon.style.display = "flex";
    }
  }
}

// Setup event listeners for cart icon and modal
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

  // Setup event delegation for cart items (quantity buttons, remove buttons)
  // Use modal as delegate to avoid multiple listeners
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

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && cartModal?.getAttribute("aria-hidden") === "false") {
      closeModal();
    }
  });
}

// Products map cache
let productsMapCache = null;

// Load products map (cached)
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

// Flag to track if add to cart listener is set up
let addToCartListenerAdded = false;

// Setup Add to Cart buttons from carousels
function setupAddToCartButtons() {
  // Use event delegation on document level (only once)
  if (addToCartListenerAdded) {
    return; // Already set up
  }
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
      // Load products map
      const productsMap = await loadProductsMap();

      // Get product ID from data attribute first, then from map, then fallback
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

// Add item to cart
function addItem(product) {
  const existingItem = cartState.find((item) => item.id === product.id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cartState.push({
      ...product,
      quantity: 1,
    });
  }

  saveToStorage();
  renderCart();
}

// Remove item from cart
function removeItem(id) {
  cartState = cartState.filter((item) => item.id !== id);
  saveToStorage();
  renderCart();
}

// Update quantity
function updateQuantity(id, delta) {
  const item = cartState.find((item) => item.id === id);
  if (!item) return;

  item.quantity = Math.max(1, item.quantity + delta);
  saveToStorage();
  renderCart();
}

// Calculate total
function calculateTotal() {
  return cartState.reduce((total, item) => {
    // Parse price like "$8,00" or "$23,00"
    const priceStr = item.price.replace(/[^0-9,]/g, "").replace(",", ".");
    const price = parseFloat(priceStr) || 0;
    return total + price * item.quantity;
  }, 0);
}

// Format price
function formatPrice(price) {
  return `$${price.toFixed(2).replace(".", ",")}`;
}

// Render cart
function renderCart() {
  const itemsContainer = document.querySelector("[data-cart-items]");
  const totalElement = document.querySelector("[data-cart-total]");
  const badgeElement = document.querySelector("[data-cart-count]");
  const cartIcon = document.querySelector(".cart__icon");

  if (!itemsContainer) return;

  // Update badge and icon visibility
  const totalItems = cartState.reduce((sum, item) => sum + item.quantity, 0);
  if (badgeElement) {
    badgeElement.textContent = totalItems;
    badgeElement.setAttribute("data-cart-count", totalItems);
  }

  // Show/hide cart icon based on cart state
  if (cartIcon) {
    if (totalItems === 0) {
      cartIcon.style.display = "none";
    } else {
      cartIcon.style.display = "flex";
    }
  }

  // Render items
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

  const itemsHtml = cartState
    .map(
      (item) => `
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
  `
    )
    .join("");

  itemsContainer.innerHTML = itemsHtml;

  // Update total
  const total = calculateTotal();
  if (totalElement) {
    totalElement.textContent = formatPrice(total);
  }
}

// Open modal
function openModal() {
  const modal = document.querySelector("[data-cart-modal]");
  if (!modal) return;

  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

// Close modal
function closeModal() {
  const modal = document.querySelector("[data-cart-modal]");
  if (!modal) return;

  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

// Handle checkout
function handleCheckout(e) {
  e.preventDefault();

  if (cartState.length === 0) {
    alert("Your cart is empty");
    return;
  }

  const formData = new FormData(e.target);
  const orderData = {
    items: cartState,
    total: calculateTotal(),
    customer: {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      comment: formData.get("comment"),
    },
  };

  // Here you would typically send the order to a server
  console.log("Order submitted:", orderData);

  // For now, just show an alert
  alert(
    `Order placed successfully!\nTotal: ${formatPrice(orderData.total)}\n\nThank you for your order!`
  );

  // Clear cart
  cartState = [];
  saveToStorage();
  renderCart();
  closeModal();
}

// Save to localStorage
function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cartState));
  } catch (error) {
    console.error("Error saving cart to storage:", error);
  }
}

// Load from localStorage
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

// Clear cart (exported for external use)
export function clearCart() {
  cartState = [];
  saveToStorage();
  renderCart();
  console.log("Cart cleared successfully");
}

// Initialize on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCart);
} else {
  initCart();
}

// Re-initialize on HTMX swaps
if (typeof htmx !== "undefined") {
  document.body.addEventListener("htmx:afterSwap", () => {
    // Only re-setup if modal was swapped (recreated)
    const cartModal = document.querySelector("[data-cart-modal]");
    if (cartModal && !cartModal.dataset.itemsListenerAdded) {
      setupEventListeners();
    }
    setupAddToCartButtons();
    renderCart(); // Re-render cart after swap
  });
}

