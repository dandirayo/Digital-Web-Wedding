import { buildWhatsappUrl, sanitizeText, siteConfig } from "./config.js";
import { closeModal, openModal, showToast } from "./modal.js";
import { templates } from "./data/templates.js";

const requiredFields = ["name", "whatsapp", "eventDate", "eventType", "package", "budget"];

export function setupForms() {
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-open-consultation]");
    if (button) openConsultationForm(button.dataset.template || "", button);

    const packageButton = event.target.closest("[data-open-package]");
    if (packageButton) openPackageDetail(packageButton.dataset.packageName || "Paket Occasio", packageButton);

    const qrButton = event.target.closest("[data-open-qr-demo]");
    if (qrButton) openQrDemo(qrButton);
  });
}

export function openConsultationForm(templateId = "", trigger = null) {
  const selectedTemplate = templates.find((template) => template.id === templateId);
  const draft = loadDraft();
  let submitted = false;

  const formWrap = document.createElement("div");
  formWrap.innerHTML = `
    <form class="consultation-form" id="consultationForm" novalidate>
      ${field("name", "Nama", "text", "Nama lengkap", draft.name)}
      ${field("whatsapp", "Nomor WhatsApp", "tel", "62812xxxx", draft.whatsapp)}
      ${field("eventDate", "Tanggal acara", "date", "", draft.eventDate)}
      ${selectField("eventType", "Jenis acara", ["Pernikahan", "Engagement", "Akad", "Resepsi", "Lainnya"], draft.eventType)}
      ${selectField("template", "Template pilihan", templates.map((item) => item.name), selectedTemplate?.name || draft.template || "")}
      ${selectField("package", "Paket", ["Basic", "Premium", "Custom"], draft.package)}
      ${selectField("budget", "Kisaran budget", ["< Rp1 juta", "Rp1 juta - Rp2 juta", "Rp2 juta - Rp5 juta", "> Rp5 juta"], draft.budget)}
      <div class="field field-wide" data-field="notes">
        <label for="notes">Catatan</label>
        <textarea id="notes" name="notes" placeholder="Ceritakan kebutuhan event kamu">${escapeAttr(draft.notes || "")}</textarea>
        <div class="error" id="notesError"></div>
      </div>
      <div class="field-wide form-actions">
        <button class="btn btn-primary" type="submit">Kirim ke WhatsApp</button>
        <button class="btn btn-secondary" type="button" data-clear-draft>Hapus Draft</button>
      </div>
      <p class="form-status field-wide" aria-live="polite"></p>
    </form>
  `;

  const form = formWrap.querySelector("form");
  const status = formWrap.querySelector(".form-status");
  let dirty = Object.keys(draft).length > 0;

  form.addEventListener("input", (event) => {
    dirty = true;
    validateField(event.target);
    saveDraft(form);
  });

  form.addEventListener("click", (event) => {
    if (!event.target.closest("[data-clear-draft]")) return;
    localStorage.removeItem(siteConfig.consultationDraftKey);
    form.reset();
    dirty = false;
    status.textContent = "Draft sudah dihapus.";
    status.className = "form-status success field-wide";
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateForm(form)) {
      status.textContent = "Periksa kembali field yang wajib diisi.";
      status.className = "form-status error field-wide";
      return;
    }

    const submit = form.querySelector("button[type='submit']");
    submit.disabled = true;
    submit.classList.add("is-loading");
    status.textContent = "Membuka WhatsApp...";

    const data = getFormData(form);
    const message = buildConsultationMessage(data);
    localStorage.removeItem(siteConfig.consultationDraftKey);
    dirty = false;
    submitted = true;

    setTimeout(() => {
      window.open(buildWhatsappUrl(message), "_blank", "noopener");
      showToast("Form valid. WhatsApp dibuka dengan pesan konsultasi.");
      closeModal({ force: true });
    }, 450);
  });

  openModal({
    title: "Form Konsultasi",
    description: "Isi kebutuhan event. Data belum disimpan ke server; pesan akan dikirim lewat WhatsApp.",
    content: formWrap,
    trigger,
    closeGuard: () => {
      if (submitted || !dirty) return true;
      return window.confirm("Form belum dikirim. Tutup dan simpan draft di perangkat ini?");
    },
  });
}

function field(name, label, type, placeholder, value = "") {
  return `
    <div class="field" data-field="${name}">
      <label for="${name}">${label} <span aria-hidden="true">*</span></label>
      <input id="${name}" name="${name}" type="${type}" placeholder="${placeholder}" value="${escapeAttr(value || "")}" required>
      <div class="error" id="${name}Error"></div>
    </div>
  `;
}

function selectField(name, label, options, value = "") {
  return `
    <div class="field" data-field="${name}">
      <label for="${name}">${label}${requiredFields.includes(name) ? " <span aria-hidden=\"true\">*</span>" : ""}</label>
      <select id="${name}" name="${name}" ${requiredFields.includes(name) ? "required" : ""}>
        <option value="">Pilih</option>
        ${options.map((option) => `<option value="${escapeAttr(option)}" ${option === value ? "selected" : ""}>${option}</option>`).join("")}
      </select>
      <div class="error" id="${name}Error"></div>
    </div>
  `;
}

function validateField(input) {
  if (!input?.name) return true;
  const field = input.closest(".field");
  const error = field?.querySelector(".error");
  let message = "";
  const value = sanitizeText(input.value);

  if (requiredFields.includes(input.name) && !value) message = "Field ini wajib diisi.";
  if (input.name === "whatsapp" && value && !/^(\+?62|0)\d{8,14}$/.test(value)) {
    message = "Masukkan nomor WhatsApp Indonesia yang valid.";
  }

  field?.classList.toggle("is-invalid", Boolean(message));
  if (error) error.textContent = message;
  return !message;
}

function validateForm(form) {
  return [...form.elements].filter((el) => el.name).every(validateField);
}

function getFormData(form) {
  return Object.fromEntries([...new FormData(form).entries()].map(([key, value]) => [key, sanitizeText(value)]));
}

function saveDraft(form) {
  localStorage.setItem(siteConfig.consultationDraftKey, JSON.stringify(getFormData(form)));
}

function loadDraft() {
  try {
    return JSON.parse(localStorage.getItem(siteConfig.consultationDraftKey) || "{}");
  } catch {
    return {};
  }
}

function buildConsultationMessage(data) {
  return [
    "Halo Occasio, saya ingin konsultasi undangan digital.",
    "",
    `Nama: ${data.name}`,
    `WhatsApp: ${data.whatsapp}`,
    `Tanggal acara: ${data.eventDate}`,
    `Jenis acara: ${data.eventType}`,
    `Template: ${data.template || "-"}`,
    `Paket: ${data.package}`,
    `Budget: ${data.budget}`,
    `Catatan: ${data.notes || "-"}`,
  ].join("\n");
}

function openPackageDetail(name, trigger) {
  openModal({
    title: name,
    description: "Detail paket frontend demo. Fitur produksi seperti database RSVP dan pembayaran akan masuk tahap backend.",
    trigger,
    content: `
      <p>Paket dapat disesuaikan dengan jumlah halaman, kebutuhan konten, domain, dan fitur tambahan.</p>
      <ul class="feature-list">
        <li>Desain undangan digital responsive</li>
        <li>Form RSVP dan QR check-in berstatus demo jika belum ada backend</li>
        <li>Gallery, ucapan, maps, gift, dan copywriting acara</li>
      </ul>
      <button class="btn btn-primary" type="button" data-open-consultation>Konsultasi Paket</button>
    `,
  });
}

function openQrDemo(trigger) {
  openModal({
    title: "Demo QR Check-in",
    description: "Ilustrasi alur QR. Belum tersambung database produksi.",
    trigger,
    content: `
      <div class="demo-flow">
        <div class="card feature-card">
          <div class="icon-box">QR</div>
          <h3>Alur Demo</h3>
          <p>Tamu mengisi RSVP, mendapat kode undangan, lalu panitia melakukan scan saat check-in.</p>
        </div>
        <div class="card feature-card">
          <h3>Status saat ini</h3>
          <p>Frontend demo siap. Untuk produksi dibutuhkan backend, database tamu, autentikasi panitia, dan log check-in.</p>
        </div>
      </div>
    `,
  });
}

function escapeAttr(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
