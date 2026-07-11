export function setupNavigation() {
  const toggle = document.querySelector("[data-nav-toggle]");
  const menu = document.getElementById("primaryMenu");
  const links = [...document.querySelectorAll(".nav-link")];
  const backToTop = document.querySelector("[data-back-to-top]");

  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const isOpen = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.setAttribute("aria-label", isOpen ? "Tutup menu navigasi" : "Buka menu navigasi");
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Buka menu navigasi");
    });
  }

  links.forEach((link) => {
    link.addEventListener("click", () => {
      links.forEach((item) => item.classList.remove("is-active"));
      link.classList.add("is-active");
      menu?.classList.remove("is-open");
      toggle?.setAttribute("aria-expanded", "false");
    });
  });

  setupScrollSpy(links);

  window.addEventListener("scroll", () => {
    if (!backToTop) return;
    backToTop.hidden = window.scrollY < 680;
  }, { passive: true });

  backToTop?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function setupScrollSpy(links) {
  const sectionLinks = links.filter((link) => link.hash && document.querySelector(link.hash));
  const sections = sectionLinks.map((link) => document.querySelector(link.hash));
  if (!sections.length || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;

    links.forEach((link) => link.classList.remove("is-active"));
    const active = sectionLinks.find((link) => link.hash === `#${visible.target.id}`);
    active?.classList.add("is-active");
  }, {
    rootMargin: "-30% 0px -58% 0px",
    threshold: [0.2, 0.45, 0.7],
  });

  sections.forEach((section) => observer.observe(section));
}
