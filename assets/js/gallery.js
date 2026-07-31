import { buildWhatsappUrl, siteConfig } from "./config.js";
import { openModal, showToast } from "./modal.js";
import { categories, formatRupiah, templates } from "./data/templates.js";

const state = {
  query: "",
  category: "all",
  sort: "featured",
};

export function setupTemplateBlocks() {
  document.querySelectorAll("[data-template-grid]").forEach((grid) => {
    const limit = Number(grid.dataset.limit || templates.length);
    renderTemplates(grid, templates.slice(0, limit));
  });

  document.addEventListener("click", (event) => {
    const previewButton = event.target.closest("[data-preview-template]");
    if (previewButton) {
      const template = templates.find((item) => item.id === previewButton.dataset.previewTemplate);
      if (template) openTemplatePreview(template, previewButton);
    }

    const chooseButton = event.target.closest("[data-choose-template]");
    if (chooseButton) {
      const template = templates.find((item) => item.id === chooseButton.dataset.chooseTemplate);
      if (template) window.open(buildWhatsappUrl(template.whatsappMessage), "_blank", "noopener");
    }
  });
}

export function setupGalleryPage() {
  const grid = document.querySelector("[data-gallery-grid]");
  if (!grid) return;

  const search = document.querySelector("[data-template-search]");
  const category = document.querySelector("[data-template-category]");
  const sort = document.querySelector("[data-template-sort]");
  const reset = document.querySelector("[data-reset-filters]");

  if (category) {
    category.innerHTML = categories.map((item) => `<option value="${item.id}">${item.label}</option>`).join("");
  }

  const sync = () => {
    state.query = normalize(search?.value || "");
    state.category = category?.value || "all";
    state.sort = sort?.value || "featured";
    renderGallery(grid);
  };

  search?.addEventListener("input", sync);
  category?.addEventListener("change", sync);
  sort?.addEventListener("change", sync);
  reset?.addEventListener("click", () => {
    if (search) search.value = "";
    if (category) category.value = "all";
    if (sort) sort.value = "featured";
    sync();
    showToast("Filter template sudah direset.");
  });

  renderGallery(grid);
  highlightHashTemplate();
}

function renderGallery(grid) {
  const filtered = templates
    .filter((template) => matchesCategory(template))
    .filter((template) => matchesQuery(template));

  const sorted = sortTemplates(filtered);
  renderTemplates(grid, sorted);

  const count = document.querySelector("[data-result-count]");
  const empty = document.querySelector("[data-empty-state]");
  if (count) count.textContent = `${sorted.length} template ditemukan`;
  if (empty) empty.hidden = sorted.length > 0;
}

function renderTemplates(grid, items) {
  grid.innerHTML = items.map(templateCard).join("");
}

function templateCard(template) {
  const colors = template.colors
    .map((color) => `<span class="color-swatch" aria-hidden="true" style="--swatch-color:${color}"></span>`)
    .join("");

  return `
    <article class="template-card card" id="template-${template.id}" data-template-id="${template.id}">
      <div class="template-card__media">
        <img src="${template.thumbnail}" alt="Preview template ${template.name}" loading="lazy" onerror="this.src='assets/images/prewed-1.jpg'">
      </div>
      <div class="template-card__body">
        <div class="template-card__meta">
          <span class="badge">${template.badge}</span>
          <span class="color-swatches" aria-label="Palet warna ${template.name}">${colors}</span>
        </div>
        <h3 class="template-card__title">${template.name}</h3>
        <p>${template.description}</p>
        <p><strong>Mulai ${formatRupiah(template.priceFrom)}</strong></p>
        <div class="template-card__actions">
          <button class="btn btn-primary" type="button" data-preview-template="${template.id}">Preview Detail</button>
          <button class="btn btn-secondary" type="button" data-choose-template="${template.id}">Konsultasi</button>
        </div>
      </div>
    </article>
  `;
}

function openTemplatePreview(template, trigger) {
  let current = 0;
  const wrapper = document.createElement("div");
  wrapper.className = "preview-grid";

  const render = () => {
    wrapper.innerHTML = `
      <div>
        <img class="preview-main-image" src="${template.images[current]}" alt="Preview ${template.name}" onerror="this.src='assets/images/prewed-1.jpg'">
        <div class="thumb-row" aria-label="Pilih gambar preview">
          ${template.images.map((image, index) => `
            <button class="thumb-btn ${index === current ? "is-active" : ""}" type="button" data-preview-index="${index}" aria-label="Gambar ${index + 1}">
              <img src="${image}" alt="" loading="lazy" onerror="this.src='assets/images/prewed-1.jpg'">
            </button>
          `).join("")}
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" type="button" data-preview-prev>Previous</button>
          <button class="btn btn-secondary" type="button" data-preview-next>Next</button>
        </div>
      </div>
      <div>
        <span class="badge">${template.category}</span>
        <h3 class="section-title modal-preview-title">${template.name}</h3>
        <p>${template.description}</p>
        <p><strong>Harga mulai ${formatRupiah(template.priceFrom)}</strong></p>
        <ul class="feature-list">
          ${template.features.map((feature) => `<li>${feature}</li>`).join("")}
        </ul>
        <div class="modal-actions">
          <a class="btn btn-primary" href="${buildWhatsappUrl(template.whatsappMessage)}" target="_blank" rel="noopener">Pilih Template</a>
          <a class="btn btn-secondary" href="${template.demoUrl || siteConfig.demoWeddingUrl}" target="_blank" rel="noopener">Demo Penuh</a>
        </div>
      </div>
    `;
  };

  wrapper.addEventListener("click", (event) => {
    const thumb = event.target.closest("[data-preview-index]");
    if (thumb) {
      current = Number(thumb.dataset.previewIndex);
      render();
    }
    if (event.target.closest("[data-preview-prev]")) {
      current = (current - 1 + template.images.length) % template.images.length;
      render();
    }
    if (event.target.closest("[data-preview-next]")) {
      current = (current + 1) % template.images.length;
      render();
    }
  });

  render();
  openModal({
    title: `Preview ${template.name}`,
    description: template.description,
    content: wrapper,
    trigger,
  });
}

function normalize(value) {
  return String(value).toLowerCase().trim();
}

function matchesCategory(template) {
  return state.category === "all" || template.category === state.category;
}

function matchesQuery(template) {
  if (!state.query) return true;
  const tokens = state.query.split(/\s+/).filter(Boolean);
  const haystack = [
    template.name,
    template.category,
    template.description,
    template.packageLevel,
    ...template.features,
  ].map(normalize);
  return tokens.every((token) => haystack.some((field) => field.split(/[\s,.-]+/).includes(token) || field.startsWith(token)));
}

function sortTemplates(items) {
  return [...items].sort((a, b) => {
    if (state.sort === "price-low") return a.priceFrom - b.priceFrom;
    if (state.sort === "price-high") return b.priceFrom - a.priceFrom;
    if (state.sort === "name") return a.name.localeCompare(b.name);
    return templates.findIndex((item) => item.id === a.id) - templates.findIndex((item) => item.id === b.id);
  });
}

function highlightHashTemplate() {
  if (!window.location.hash) return;
  const id = window.location.hash.replace("#", "");
  const card = document.getElementById(`template-${id}`);
  if (!card) return;
  card.scrollIntoView({ behavior: "smooth", block: "center" });
  card.classList.add("is-highlighted");
  setTimeout(() => card.classList.remove("is-highlighted"), 2400);
}
