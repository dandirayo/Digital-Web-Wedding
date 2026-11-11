import { buildManagementUrl, isPublicUrlConfigured, siteConfig } from "./config.js";

export function setupProductionData() {
  renderPackages();
  renderTestimonials();
  renderFaq();
  renderFooterData();
  renderDemoLinks();
  renderManagementLinks();
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
          <small>${item.availability}</small>
          <div class="price">${siteConfig.showPublicPrices ? item.price : item.orderable ? "Harga pilot belum final" : "Belum dirilis"}</div>
          <p>${item.description}</p>
          <ul class="feature-list">
            ${item.features.map((feature) => `<li>${feature}</li>`).join("")}
          </ul>
          <button
            class="btn ${item.featured ? "btn-primary" : "btn-secondary"}"
            type="button"
            ${item.orderable ? "data-open-package" : "disabled"}
            data-package-name="${item.name}"
          >
            ${item.orderable ? "Detail Paket" : "Belum Tersedia"}
          </button>
        </article>
      `,
    )
    .join("");

  const disclaimer = document.querySelector("[data-price-disclaimer]");
  if (disclaimer) disclaimer.textContent = siteConfig.priceDisclaimer;
}

function renderFaq() {
  const list = document.querySelector("[data-faq-list]");
  if (!list) return;
  list.innerHTML = siteConfig.faqs
    .map(
      (item, index) => `
        <article class="card faq-item">
          <button class="faq-question" type="button" data-faq-question aria-expanded="false" aria-controls="faq${index + 1}">${escapeHtml(item.question)}<span>+</span></button>
          <div class="faq-answer" id="faq${index + 1}" hidden>${escapeHtml(item.answer)}</div>
        </article>
      `,
    )
    .join("");
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderTestimonials() {
  const grid = document.querySelector("[data-testimonial-grid]");
  if (!grid) return;

  if (!siteConfig.testimonials.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <h3>Belum ada testimoni yang dipublikasikan.</h3>
        <p>Testimoni akan tampil setelah pilot selesai dan klien memberikan izin.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = siteConfig.testimonials
    .map(
      (item) => `
        <article class="card testimonial-card">
          <p>"${escapeHtml(item.quote)}"</p>
          <strong>${escapeHtml(item.name)}</strong>
          <small>${escapeHtml(item.status)}</small>
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

function renderManagementLinks() {
  document.querySelectorAll("[data-management-link]").forEach((element) => {
    element.setAttribute("href", buildManagementUrl());
  });
}

function syncRuntimeMetadata() {
  const canonical = document.querySelector("link[rel='canonical']");
  const canonicalUrl = isPublicUrlConfigured()
    ? new URL(window.location.pathname.replace(/^\//, ""), siteConfig.baseUrl).href
    : window.location.href.split("#")[0];
  if (canonical) canonical.setAttribute("href", canonicalUrl);

  const ogUrl = document.querySelector("meta[property='og:url']");
  if (ogUrl) ogUrl.setAttribute("content", canonicalUrl);

  const schema = document.querySelector("script[data-site-schema]");
  if (schema) {
    const data = JSON.parse(schema.textContent);
    data.url = canonicalUrl;
    schema.textContent = JSON.stringify(data);
  }
}
