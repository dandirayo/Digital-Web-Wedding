export const siteConfig = {
  brandName: "Occasio",
  baseUrl: "https://example.com/Digital-Web-Wedding/",
  whatsappNumber: "6280000000000",
  whatsappFallbackUrl: "https://wa.me/6280000000000",
  consultationDraftKey: "occasio_consultation_draft_v1",
};

export function asset(path) {
  return new URL(path, window.location.href).href;
}

export function sanitizeText(value) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildWhatsappUrl(message) {
  const number = siteConfig.whatsappNumber || "";
  const encodedMessage = encodeURIComponent(message);
  if (/^62\d{8,15}$/.test(number)) {
    return `https://wa.me/${number}?text=${encodedMessage}`;
  }
  return `${siteConfig.whatsappFallbackUrl}?text=${encodedMessage}`;
}
