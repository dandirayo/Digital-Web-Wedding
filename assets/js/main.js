import { setupForms } from "./forms.js";
import { setupGalleryPage, setupTemplateBlocks } from "./gallery.js";
import { setupModal } from "./modal.js";
import { setupNavigation } from "./navigation.js";
import { setupProductionData } from "./production-data.js";

document.addEventListener("DOMContentLoaded", () => {
  setupProductionData();
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
