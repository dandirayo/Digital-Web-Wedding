import { siteConfig } from "./config.js";

export function setupProductionData() {
  renderPackages();
  renderTestimonials();
  renderFooterData();
  renderDemoLinks();
  syncRuntimeMetadata();
}

function renderPackages() {
  const grid = document.querySelector("[data-package-grid]");
  if (!grid) return;

  grid.innerHTML = siteConfig.packages
    .map(
      (item) => `
        <article class="card price-card ${item.featured ? "is-featured" : ""}">
          <span class="badge">${item.name}</span>
          <div class="price">${item.price}</div>
          <p>${item.description}</p>
          <ul class="feature-list">
            ${item.features.map((feature) => `<li>${feature}</li>`).join("")}
          </ul>
          <button
            class="btn ${item.featured ? "btn-primary" : "btn-secondary"}"
            type="button"
            data-open-package
            data-package-name="${item.name}"
          >
            Detail Paket
          </button>
        </article>
      `,
    )
    .join("");

  const disclaimer = document.querySelector("[data-price-disclaimer]");
  if (disclaimer) disclaimer.textContent = siteConfig.priceDisclaimer;
}

function renderTestimonials() {
  const grid = document.querySelector("[data-testimonial-grid]");
  if (!grid) return;

  grid.innerHTML = siteConfig.testimonials
    .map(
      (item) => `
        <article class="card testimonial-card">
          <p>"${item.quote}"</p>
          <strong>${item.name}</strong>
          <small>${item.status}</small>
        </article>
      `,
    )
    .join("");
}

function renderFooterData() {
  document.querySelectorAll("[data-brand-name]").forEach((element) => {
    element.textContent = siteConfig.brandName;
  });

  document.querySelectorAll("[data-contact-label]").forEach((element) => {
    element.textContent = siteConfig.contactLabel;
  });

  document.querySelectorAll("[data-publish-year]").forEach((element) => {
    element.textContent = siteConfig.publishYear;
  });
}

function renderDemoLinks() {
  document.querySelectorAll("[data-demo-wedding-link]").forEach((element) => {
    element.setAttribute("href", siteConfig.demoWeddingUrl);
  });
}

function syncRuntimeMetadata() {
  const canonical = document.querySelector("link[rel='canonical']");
  if (canonical) canonical.setAttribute("href", new URL(window.location.pathname.replace(/^\//, ""), siteConfig.baseUrl).href);

  const ogUrl = document.querySelector("meta[property='og:url']");
  if (ogUrl) ogUrl.setAttribute("content", window.location.href);
}
