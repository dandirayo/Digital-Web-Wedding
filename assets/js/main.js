import { setupForms } from "./forms.js";
import { setupGalleryPage, setupTemplateBlocks } from "./gallery.js";
import { setupModal } from "./modal.js";
import { setupNavigation } from "./navigation.js";

document.addEventListener("DOMContentLoaded", () => {
  setupModal();
  setupNavigation();
  setupTemplateBlocks();
  setupGalleryPage();
  setupForms();
  setupFaq();
});

function setupFaq() {
  document.querySelectorAll("[data-faq-question]").forEach((button) => {
    button.addEventListener("click", () => {
      const answer = document.getElementById(button.getAttribute("aria-controls"));
      const expanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!expanded));
      if (answer) answer.hidden = expanded;
    });
  });
}
