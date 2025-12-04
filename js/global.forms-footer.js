function setupFooterNewsletterForm() {
  const footerForm = document.querySelector(".footer__form");
  if (!footerForm) return;

  if (footerForm.dataset.listenerAdded === "true") return;
  footerForm.dataset.listenerAdded = "true";

  footerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    try {
      const response = await fetch(form.action, {
        method: form.method,
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const { showMessageModal } = await import("./global.cart.js");
        showMessageModal("Thank you for subscribing", "success");
        form.reset();
      } else {
        const data = await response.json();
        const errorMessage = data.error || "Oops! There was a problem subscribing";
        const { showMessageModal } = await import("./global.cart.js");
        showMessageModal(errorMessage, "error");
      }
    } catch (error) {
      console.error("Error submitting newsletter form:", error);
      const { showMessageModal } = await import("./global.cart.js");
      showMessageModal("Oops! There was a problem subscribing", "error");
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupFooterNewsletterForm);
} else {
  setupFooterNewsletterForm();
}

if (typeof htmx !== "undefined") {
  document.body.addEventListener("htmx:afterSwap", () => {
    setTimeout(setupFooterNewsletterForm, 100);
  });
}

