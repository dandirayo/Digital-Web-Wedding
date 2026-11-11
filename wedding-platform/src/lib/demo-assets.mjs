// Compatibility for the old bundled demo data; custom URLs are left unchanged.
export const DEMO_ASSETS = {
  bride: "/templates/sheila-yoga/assets/images/bride.jpg",
  groom: "/templates/sheila-yoga/assets/images/groom.jpg",
  thumbnail: "/sample-wedding.svg",
};

export const LEGACY_DEMO_ASSETS = {
  "/demo/sheila.jpg": DEMO_ASSETS.bride,
  "/demo/yoga.jpg": DEMO_ASSETS.groom,
  "/templates/classic-elegant-thumb.jpg": DEMO_ASSETS.thumbnail,
  "/templates/modern-minimal-thumb.jpg": DEMO_ASSETS.thumbnail,
  "/templates/rustic-garden-thumb.jpg": DEMO_ASSETS.thumbnail,
  "/templates/netflix-thumb.jpg": DEMO_ASSETS.thumbnail,
  "/templates/spotify-thumb.jpg": DEMO_ASSETS.thumbnail,
  "/templates/boarding-pass-thumb.jpg": DEMO_ASSETS.thumbnail,
};

export function resolveDemoAssetUrl(value = "") {
  return Object.hasOwn(LEGACY_DEMO_ASSETS, value) ? LEGACY_DEMO_ASSETS[value] : value;
}
