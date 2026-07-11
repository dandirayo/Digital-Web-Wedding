let activeModal = null;
let lastTrigger = null;
let dirtyGuard = null;

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function setupModal() {
  const root = document.getElementById("modalRoot");
  if (!root) return;

  root.addEventListener("click", (event) => {
    if (event.target.matches("[data-modal-close], .modal-backdrop")) {
      requestCloseModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!activeModal) return;
    if (event.key === "Escape") requestCloseModal();
    if (event.key === "Tab") trapFocus(event);
  });
}

export function openModal({ title, description = "", content, trigger, closeGuard = null }) {
  const root = document.getElementById("modalRoot");
  const titleEl = document.getElementById("modalTitle");
  const descEl = document.getElementById("modalDescription");
  const bodyEl = document.getElementById("modalBody");
  if (!root || !titleEl || !descEl || !bodyEl) return;

  activeModal = root;
  lastTrigger = trigger || document.activeElement;
  dirtyGuard = closeGuard;
  titleEl.textContent = title;
  descEl.textContent = description;
  bodyEl.innerHTML = "";
  if (typeof content === "string") {
    bodyEl.innerHTML = content;
  } else if (content) {
    bodyEl.append(content);
  }
  root.hidden = false;
  document.body.classList.add("modal-open");

  const first = root.querySelector(focusableSelector);
  requestAnimationFrame(() => (first || root.querySelector(".modal__close"))?.focus());
}

export function closeModal({ force = false } = {}) {
  if (!activeModal) return false;
  if (!force && dirtyGuard && !dirtyGuard()) return false;

  activeModal.hidden = true;
  document.body.classList.remove("modal-open");
  const bodyEl = document.getElementById("modalBody");
  if (bodyEl) bodyEl.innerHTML = "";
  activeModal = null;
  dirtyGuard = null;
  lastTrigger?.focus?.();
  lastTrigger = null;
  return true;
}

export function requestCloseModal() {
  closeModal();
}

function trapFocus(event) {
  const focusable = [...activeModal.querySelectorAll(focusableSelector)].filter((el) => el.offsetParent !== null);
  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

export function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.dataset.type = type;
  toast.hidden = false;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.hidden = true;
  }, 4200);
}
