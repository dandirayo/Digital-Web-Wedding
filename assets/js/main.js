import { setupForms } from "./forms.js";
import { refreshTemplateViews, setupGalleryPage, setupTemplateBlocks } from "./gallery.js";
import { setupModal } from "./modal.js";
import { setupNavigation } from "./navigation.js";
import { setupProductionData } from "./production-data.js";
import { loadRemoteSite } from "./remote-site.js";

document.addEventListener("DOMContentLoaded", () => {
  setupProductionData();
  setupModal();
  setupNavigation();
  setupTemplateBlocks();
  setupGalleryPage();
  setupForms();
  setupFaq();

  // Isi bawaan tampil lebih dulu; bila server menjawab, tampilan diperbarui dari data admin.
  loadRemoteSite().then((loaded) => {
    if (!loaded) return;
    setupProductionData();
    refreshTemplateViews();
  });
});

function setupFaq() {
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-faq-question]");
    if (!button) return;
    const answer = document.getElementById(button.getAttribute("aria-controls"));
    const expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!expanded));
    if (answer) answer.hidden = expanded;
  });
}
