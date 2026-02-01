// =====================================================
// Helpers
// =====================================================
const $ = (q, el = document) => el.querySelector(q);
const $$ = (q, el = document) => [...el.querySelectorAll(q)];

// Lock scroll saat pertama load (cover)
document.body.classList.add("lock-scroll");

// URL Params: ?to=Nama%20Tamu
function getGuestName() {
  const url = new URL(window.location.href);
  const raw = url.searchParams.get("to");
  if (!raw) return "Reza Pramudita";
  return decodeURIComponent(raw).replace(/\s+/g, " ").trim() || "Reza Pramudita";
}


// =====================================================
// Hero background slideshow (prewed)
// =====================================================
const prewedImages = [
  "assets/image/prewed-1.jpg",
  "assets/image/prewed-2.jpg",
  "assets/image/prewed-3.jpg",
  "assets/image/prewed-4.jpg",
  "assets/image/prewed-5.jpg",
];

setInterval(() => { /* ganti image */ }, 5000);


function setHeroLayerBg(el, imgUrl){
  if (!el) return;
  el.style.backgroundImage = `
    linear-gradient(rgba(15,17,21,0.55), rgba(15,17,21,0.75)),
    url("${imgUrl}")
  `;
}

function startHeroSlideshow(){
  const hero = document.querySelector(".hero");
  if (!hero) return;

  const layerA = hero.querySelector(".hero-bg-a");
  const layerB = hero.querySelector(".hero-bg-b");
  if (!layerA || !layerB) return;

  let idx = 0;
  let useA = true;

  // initial
  setHeroLayerBg(layerA, prewedImages[idx % prewedImages.length]);
  layerA.style.opacity = 1;
  layerB.style.opacity = 0;

  setInterval(() => {
    idx = (idx + 1) % prewedImages.length;
    const next = prewedImages[idx];

    const show = useA ? layerB : layerA;
    const hide = useA ? layerA : layerB;

    setHeroLayerBg(show, next);
    show.style.opacity = 1;
    hide.style.opacity = 0;

    useA = !useA;
  }, 5000);
}


// =====================================================
// Music (BGM)
// =====================================================
function setupMusic(){
  const audio = document.getElementById("bgm");
  const btn = document.getElementById("musicBtn");
  if (!audio || !btn) return { tryAutoPlay: () => {} };

  const syncUi = () => {
    const playing = !audio.paused;
    btn.classList.toggle("is-playing", playing);
    btn.setAttribute("aria-pressed", String(playing));
    btn.textContent = playing ? "❚❚" : "♫";
  };

  btn.addEventListener("click", async () => {
    try {
      if (audio.paused) await audio.play();
      else audio.pause();
    } catch {
      // ignore autoplay restrictions
    }
    syncUi();
  });

  audio.addEventListener("play", syncUi);
  audio.addEventListener("pause", syncUi);
  syncUi();

  return {
    tryAutoPlay: async () => {
      try {
        await audio.play();
      } catch {
        // Browser mungkin blok autoplay: user bisa klik tombol ♫
      }
      syncUi();
    }
  };
}

// =====================================================
// Reveal (scroll-based)
// =====================================================
function setupReveal(root = document) {
  const items = $$(".reveal", root);

  // fallback kalau browser lama
  if (!("IntersectionObserver" in window)) {
    items.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i * 0.03, 0.25)}s`;
      el.classList.add("is-in");
    });
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const el = entry.target;
        if (el.classList.contains("is-in")) {
          io.unobserve(el);
          return;
        }

        const parentSection = el.closest(".section") || root;
        const siblings = $$(".reveal", parentSection);
        const idx = siblings.indexOf(el);
        const delay = Math.min(idx * 0.05, 0.35);

        el.style.transitionDelay = `${delay}s`;
        el.classList.add("is-in");
        io.unobserve(el);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );

  items.forEach((el) => io.observe(el));
}

// =====================================================
// DOM READY
// =====================================================
window.addEventListener("DOMContentLoaded", () => {
  const guest = getGuestName();

  // setup music (needs user gesture for autoplay in most browsers)
  const music = setupMusic();

  const paxWrap = $("#paxWrap");
  const paxButtons = $$(".pax-btn");

  // Set guest name
  const g1 = $("#guestName");
  const g2 = $("#guestName2");
  if (g1) g1.textContent = guest;
  if (g2) g2.textContent = guest;

  // ===================================================
  // PAGE TRANSITION (Cover → Main)
  // ===================================================
  const pageCover = $("#pageCover");
  const pageMain = $("#pageMain");
  const openBtn = $("#openInviteBtn");

  // reveal cover items
  if (pageCover) setupReveal(pageCover);

  if (openBtn && pageCover && pageMain) {
    openBtn.addEventListener("click", () => {
      pageCover.classList.add("is-hidden");
      pageCover.classList.remove("is-shown");

      pageMain.classList.remove("is-hidden");
      pageMain.classList.add("is-shown");

      document.body.classList.remove("lock-scroll");

      // start slideshow + try autoplay music (allowed because this click is a user gesture)
      startHeroSlideshow();
      music.tryAutoPlay();

      requestAnimationFrame(() => setupReveal(pageMain));

      const scrollArea = $("#scrollArea");
      if (scrollArea) scrollArea.scrollTop = 0;
    });
  }

  // ===================================================
  // COUNTDOWN
  // ===================================================
  const targetDate = new Date("2026-12-27T08:00:00+07:00");

  const cdDays = $("#cdDays");
  const cdHours = $("#cdHours");
  const cdMinutes = $("#cdMinutes");
  const cdSeconds = $("#cdSeconds");
  const countdownNote = $("#countdownNote");

  function updateCountdown() {
    if (!cdDays || !cdHours || !cdMinutes || !cdSeconds) return;

    const now = new Date();
    const diff = targetDate - now;

    if (diff <= 0) {
      cdDays.textContent = "0";
      cdHours.textContent = "00";
      cdMinutes.textContent = "00";
      cdSeconds.textContent = "00";
      if (countdownNote) countdownNote.textContent = "Hari ini! Sampai jumpa di lokasi.";
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    cdDays.textContent = String(days);
    cdHours.textContent = String(hours).padStart(2, "0");
    cdMinutes.textContent = String(minutes).padStart(2, "0");
    cdSeconds.textContent = String(seconds).padStart(2, "0");
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  // ===================================================
  // RSVP + QR
  // ===================================================
  const rsvpGuest = $("#rsvpGuest");
  const rsvpBadge = $("#rsvpBadge");
  const btnHadir = $("#btnHadir");
  const btnTidakHadir = $("#btnTidakHadir");
  const btnResetRsvp = $("#btnResetRsvp");

  const qrWrap = $("#qrWrap");
  const qrCanvas = $("#qrCanvas");
  const qrCodeText = $("#qrCodeText");
  const btnCopyCode = $("#btnCopyCode");

  const RSVP_KEY = "wedding_rsvp_v1";
  if (rsvpGuest) rsvpGuest.textContent = guest;

  function buildTicketCode(name) {
    const safe = (name || "Tamu")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return `SA-${safe}-${Date.now().toString(36)}`.toUpperCase();
  }

  function saveRsvp(data) {
    localStorage.setItem(RSVP_KEY, JSON.stringify(data));
  }

  function loadRsvp() {
    try {
      const raw = localStorage.getItem(RSVP_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function setBadge(status) {
    if (!rsvpBadge) return;
    rsvpBadge.classList.remove("ok", "no");

    if (status === "hadir") {
      rsvpBadge.textContent = "Hadir";
      rsvpBadge.classList.add("ok");
    } else if (status === "tidak_hadir") {
      rsvpBadge.textContent = "Tidak Hadir";
      rsvpBadge.classList.add("no");
    } else {
      rsvpBadge.textContent = "Belum Konfirmasi";
    }
  }

  function renderQr(code) {
    if (!qrWrap || !qrCanvas) return;

    // kalau CDN qrious nggak kebaca, kasih info jelas
    if (typeof QRious === "undefined") {
      qrWrap.hidden = false;
      if (qrCodeText) qrCodeText.textContent = code;
      alert("QR library belum kebaca. Pastikan internet aktif (karena qrious dari CDN).");
      return;
    }

    qrWrap.hidden = false;

    new QRious({
      element: qrCanvas,
      value: code,
      size: 220,
      level: "M",
    });

    if (qrCodeText) qrCodeText.textContent = code;
  }

  function hideQr() {
    if (qrWrap) qrWrap.hidden = true;
  }

  const saved = loadRsvp();
  if (saved?.status) {
    setBadge(saved.status);
    if (saved.status === "hadir" && saved.code) renderQr(saved.code);
    else hideQr();
  } else {
    setBadge(null);
    hideQr();
  }

  paxButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const pax = Number(btn.dataset.pax);
    if (!pax) return;

    // highlight active
    paxButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    // generate QR SETELAH pax dipilih
    const code = buildTicketCode(guest);

    saveRsvp({
      status: "hadir",
      name: guest,
      pax: pax,
      code: code
    });

    renderQr(code);
  });
});


  if (btnHadir) {
    btnHadir.addEventListener("click", () => {
      // simpan status dulu, QR BELUM muncul
      saveRsvp({ status: "hadir", name: guest });

      setBadge("hadir");

      // tampilkan pilihan pax
      if (paxWrap) paxWrap.hidden = false;

      // sembunyikan QR dulu
      hideQr();
    });
  }

  if (btnTidakHadir) {
    btnTidakHadir.addEventListener("click", () => {
      saveRsvp({ status: "tidak_hadir", name: guest });
      setBadge("tidak_hadir");
      hideQr();
      if (paxWrap) paxWrap.hidden = true;
    });
  }

  if (btnResetRsvp) {
    btnResetRsvp.addEventListener("click", () => {
      localStorage.removeItem(RSVP_KEY);
      setBadge(null);
      hideQr();
      if (paxWrap) paxWrap.hidden = true;
    });
  }



  if (btnTidakHadir) {
    btnTidakHadir.addEventListener("click", () => {
      saveRsvp({ status: "tidak_hadir", name: guest });
      setBadge("tidak_hadir");
      hideQr();
    });
  }

  if (btnResetRsvp) {
    btnResetRsvp.addEventListener("click", () => {
      localStorage.removeItem(RSVP_KEY);
      setBadge(null);
      hideQr();
    });
  }

  if (btnCopyCode) {
    btnCopyCode.addEventListener("click", async () => {
      const data = loadRsvp();
      const val = data?.code || "";
      if (!val) return;

      try {
        await navigator.clipboard.writeText(val);
        const old = btnCopyCode.textContent;
        btnCopyCode.textContent = "Tersalin ✓";
        setTimeout(() => (btnCopyCode.textContent = old), 1200);
      } catch {
        prompt("Copy manual:", val);
      }
    });
  }


// ===============================
// DOWNLOAD QR (pakai tombol #btnCopyCode)
// ===============================
if (btnCopyCode) {
  btnCopyCode.addEventListener("click", () => {
    const data = loadRsvp();

    // QR cuma valid kalau sudah pilih pax (karena code baru dibuat saat pax dipilih)
    if (!data?.code || data?.status !== "hadir") {
      alert("QR belum tersedia. Klik 'Hadir' lalu pilih jumlah tamu (PAX) dulu ya.");
      return;
    }

    if (!qrCanvas) return;

    // Pastikan canvas sudah terisi QR (kalau belum, render dulu)
    // Ini penting kalau user refresh halaman
    renderQr(data.code);

    // Ambil nama tamu untuk nama file
    const guestName =
      data?.name ||
      document.getElementById("rsvpGuest")?.innerText ||
      document.getElementById("guestName")?.innerText ||
      "tamu";

    const safeName = String(guestName)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Optional: bikin canvas export yang lebih “rapih” (ada padding + background putih)
    const exportCanvas = document.createElement("canvas");
    const size = 320;
    exportCanvas.width = size;
    exportCanvas.height = size;

    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    // background putih
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);

    // gambar QR dari canvas utama ke tengah dengan padding
    const qrSize = 260;
    const x = Math.floor((size - qrSize) / 2);
    const y = Math.floor((size - qrSize) / 2);
    ctx.drawImage(qrCanvas, x, y, qrSize, qrSize);

    // download
    const link = document.createElement("a");
    link.href = exportCanvas.toDataURL("image/png");
    link.download = `QR-Undangan-${safeName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}


  // ===================================================
  // WISHES (chat bubble + 5 last)
  // ===================================================
  const wishForm = $("#wishForm");
  const fillGuestBtn = $("#fillGuestBtn");
  const wishListEl = $("#wishList");

  const WISH_KEY = "wedding_wishes_v1";
  const MAX_RENDER = 5;
  const MAX_STORE = 200;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function loadWishes() {
    try {
      const raw = localStorage.getItem(WISH_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function saveWishes(arr) {
    localStorage.setItem(WISH_KEY, JSON.stringify(arr));
  }

  function formatTime(ts) {
    try {
      const d = new Date(ts);
      return d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
    } catch {
      return "";
    }
  }

  function renderWishes({ animateNew = false } = {}) {
    if (!wishListEl) return;

    const wishes = loadWishes();
    const lastFive = wishes.slice(-MAX_RENDER).reverse();

    if (wishes.length === 0) {
      wishListEl.innerHTML = `
        <div class="wish-bubble left">
          <div class="wish-text">Belum ada ucapan. Jadi yang pertama ya 🙂</div>
        </div>
      `;
      return;
    }

    wishListEl.innerHTML = lastFive
      .map((w, idx) => {
        const side = idx % 2 === 0 ? "left" : "right";
        const newClass = animateNew && idx === 0 ? " is-new" : "";
        return `
          <div class="wish-bubble ${side}${newClass}">
            <div class="wish-meta">
              <div class="wish-name">${escapeHtml(w.name)}</div>
              <div class="wish-time">${escapeHtml(formatTime(w.ts))}</div>
            </div>
            <div class="wish-text">${escapeHtml(w.text)}</div>
          </div>
        `;
      })
      .join("");

    if (wishes.length > MAX_RENDER) {
      wishListEl.innerHTML += `
        <div class="wish-bubble left">
          <div class="wish-text">Scroll untuk lihat yang lain.</div>
        </div>
      `;
    }
  }

  if (fillGuestBtn) {
    fillGuestBtn.addEventListener("click", () => {
      const wishName = $("#wishName");
      const wishText = $("#wishText");
      if (wishName) wishName.value = guest;
      if (wishText) wishText.focus();
    });
  }

  if (wishForm) {
    wishForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = $("#wishName")?.value.trim();
      const text = $("#wishText")?.value.trim();
      if (!name || !text) return;

      const wishes = loadWishes();
      wishes.push({ name, text, ts: Date.now() });
      saveWishes(wishes.slice(-MAX_STORE));

      wishForm.reset();
      renderWishes({ animateNew: true });

      // tampilkan newest di atas
      wishListEl.scrollTop = 0;
    });
  }

  renderWishes();
});

// ===================================================
// LIGHTBOX (Gallery + Couple photos)
// ===================================================
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxCap = document.getElementById("lightboxCap");

function openLightbox(src, caption = "") {
  if (!lightbox || !lightboxImg) return;
  lightbox.hidden = false;
  lightboxImg.src = src;
  lightboxImg.alt = caption || "Preview";
  if (lightboxCap) lightboxCap.textContent = caption || "";
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.hidden = true;
  if (lightboxImg) {
    lightboxImg.src = "";
    lightboxImg.alt = "";
  }
  if (lightboxCap) lightboxCap.textContent = "";
  document.body.style.overflow = "";
}

// click handler for all .zoomable
document.addEventListener("click", (e) => {
  const z = e.target.closest(".zoomable");
  if (z) {
    const src = z.getAttribute("data-full") || z.getAttribute("src");
    const cap = z.getAttribute("data-caption") || z.getAttribute("alt") || "";
    if (src) openLightbox(src, cap);
  }

  // close by clicking backdrop or close button
  const closeEl = e.target.closest("[data-close='1']");
  if (closeEl) closeLightbox();
});

// close with ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && lightbox && !lightbox.hidden) closeLightbox();
});
