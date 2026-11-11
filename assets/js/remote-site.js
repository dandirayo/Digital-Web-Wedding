import { buildManagementUrl, siteConfig } from "./config.js";
import { templates } from "./data/templates.js";

const FALLBACK_IMAGE = "assets/images/prewed-1.jpg";
const CATEGORY_LABEL = { modern: "Modern", classic: "Classic", luxury: "Luxury", minimal: "Minimal" };

// Mengambil pengaturan, paket, dan template dari server Occasio. Bila server tidak
// terjangkau, isi bawaan (config.js dan data/templates.js) tetap dipakai.
export async function loadRemoteSite(timeoutMs = 3000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(buildManagementUrl("api/public-site"), { signal: controller.signal, cache: "no-store" });
    if (!response.ok) return false;
    const { data } = await response.json();
    applyRemoteSite(data);
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function absolute(url) {
  if (!url) return FALLBACK_IMAGE;
  return url.startsWith("/") ? buildManagementUrl(url) : url;
}

function applyRemoteSite({ settings, packages, templates: remoteTemplates }) {
  siteConfig.whatsappNumber = settings.whatsappNumber || "";
  siteConfig.contactLabel = settings.contactLabel;
  siteConfig.showPublicPrices = settings.showPublicPrices;
  siteConfig.priceDisclaimer = settings.priceDisclaimer;
  siteConfig.faqs = settings.faqs;
  siteConfig.testimonials = settings.testimonials;

  if (packages.length) siteConfig.packages = packages;

  const mapped = remoteTemplates.map((item) => {
    const thumbnail = absolute(item.thumbnailUrl);
    return {
      id: item.slug,
      name: item.name,
      category: item.galleryCategory,
      description: item.description,
      thumbnail,
      images: [thumbnail],
      colors: item.colors.length ? item.colors : ["#171717", "#d7bd8a"],
      features: [`Tersedia mulai paket ${item.packageLevel}`],
      badge: item.badge || CATEGORY_LABEL[item.galleryCategory] || "Template",
      priceFrom: 0,
      packageLevel: item.packageLevel,
    };
  });
  if (mapped.length) templates.splice(0, templates.length, ...mapped);
}
