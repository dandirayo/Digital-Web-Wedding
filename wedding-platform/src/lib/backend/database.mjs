import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } from "node:crypto";
export const COOKIE = "occasio_session";
export class ApiError extends Error {
    constructor(message, status = 400) { super(message); this.status = status; }
}
const hashToken = (token) => createHash("sha256").update(token).digest("hex");
export function openDatabase(path = resolve(process.cwd(), "data/occasio.sqlite")) {
    if (path !== ":memory:")
        mkdirSync(dirname(path), { recursive: true });
    const db = new DatabaseSync(path, { timeout: 5000 });
    db.exec(`PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, fullName TEXT NOT NULL, role TEXT NOT NULL, password TEXT NOT NULL, createdAt TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, userId TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS records (kind TEXT NOT NULL, id TEXT NOT NULL, body TEXT NOT NULL, PRIMARY KEY(kind,id));
    CREATE TABLE IF NOT EXISTS attempts (email TEXT PRIMARY KEY, count INTEGER NOT NULL, until INTEGER NOT NULL);`);
    return db;
}
export function rows(db, kind) {
    return db.prepare("SELECT body FROM records WHERE kind = ?").all(kind).map((r) => JSON.parse(r.body));
}
export function put(db, kind, value) {
    db.prepare("INSERT INTO records VALUES (?, ?, ?) ON CONFLICT(kind,id) DO UPDATE SET body=excluded.body")
        .run(kind, value.id || value.eventId, JSON.stringify(value));
    return value;
}
export function remove(db, kind, id) { db.prepare("DELETE FROM records WHERE kind=? AND id=?").run(kind, id); }
export function createUser(db, { id = "", email, fullName, role = "client", password }) {
    id ||= randomUUID();
    if (typeof password !== "string" || password.length < 12 || password.length > 128)
        throw new ApiError("Password minimal 12 karakter.");
    if (!["owner", "client"].includes(role) || typeof email !== "string" || !email.includes("@") || !fullName?.trim())
        throw new ApiError("Data akun tidak valid.");
    const salt = randomBytes(16).toString("hex");
    const encoded = salt + ":" + scryptSync(password, salt, 64).toString("hex");
    const createdAt = new Date().toISOString();
    db.prepare("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?)").run(id, email.toLowerCase().trim(), fullName.trim(), role, encoded, createdAt);
    return { id, email: email.toLowerCase().trim(), fullName: fullName.trim(), role, createdAt };
}
export function authenticate(db, email, password) {
    if (typeof email !== "string" || typeof password !== "string" || email.length > 254 || password.length > 128)
        throw new ApiError("Email atau password salah.", 401);
    email = email.toLowerCase().trim();
    const now = Date.now();
    const attempt = db.prepare("SELECT * FROM attempts WHERE email=?").get(email);
    if (attempt && attempt.until > now && attempt.count >= 5)
        throw new ApiError("Terlalu banyak percobaan. Coba lagi dalam 15 menit.", 429);
    const user = db.prepare("SELECT * FROM users WHERE email=?").get(email);
    const [salt, hash] = (user?.password || "dummy:" + "00".repeat(64)).split(":");
    const valid = timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(hash, "hex"));
    if (!user || !valid) {
        db.prepare("INSERT INTO attempts VALUES (?,1,?) ON CONFLICT(email) DO UPDATE SET count=CASE WHEN attempts.until < ? THEN 1 ELSE attempts.count+1 END, until=?")
            .run(email, now + 900000, now, now + 900000);
        throw new ApiError("Email atau password salah.", 401);
    }
    db.prepare("DELETE FROM attempts WHERE email=?").run(email);
    db.prepare("DELETE FROM sessions WHERE expires < ?").run(now);
    const token = randomBytes(32).toString("hex");
    db.prepare("INSERT INTO sessions VALUES (?,?,?)").run(hashToken(token), user.id, now + 8 * 3600000);
    return { token, user: publicUser(user) };
}
function publicUser(user) {
    return { id: user.id, email: user.email, fullName: user.fullName, role: user.role, createdAt: user.createdAt };
}
export function sessionUser(db, token) {
    if (!token)
        return null;
    const user = db.prepare("SELECT u.* FROM sessions s JOIN users u ON s.userId=u.id WHERE s.token=? AND s.expires>?").get(hashToken(token), Date.now());
    return user ? publicUser(user) : null;
}
export function logout(db, token) { if (token)
    db.prepare("DELETE FROM sessions WHERE token=?").run(hashToken(token)); }
export function owner(user) { if (user?.role !== "owner")
    throw new ApiError("Akses owner diperlukan.", 403); }
export function requireUser(user) { if (!user)
    throw new ApiError("Silakan login.", 401); }
export function eventAccess(db, id, user, write = false) {
    const event = rows(db, "events").find((e) => e.id === id);
    if (!event)
        throw new ApiError("Event tidak ditemukan.", 404);
    if (user?.role === "owner" || (user && event.clientId === user.id))
        return event;
    if (!write && event.isPublished && event.status === "active" && (!event.expiresAt || Date.parse(event.expiresAt) > Date.now()))
        return event;
    throw new ApiError("Event tidak dapat diakses.", 403);
}
export function listEvents(db, user) {
    requireUser(user);
    return rows(db, "events").filter((e) => user.role === "owner" || e.clientId === user.id).map((event) => summarize(db, event));
}
export function summarize(db, event) {
    const guests = rows(db, "guests").filter((g) => g.eventId === event.id);
    const wishes = rows(db, "wishes").filter((w) => w.eventId === event.id);
    return { ...event, guestCount: guests.length, rsvpYes: guests.filter((g) => g.rsvpStatus === "attending").length,
        rsvpNo: guests.filter((g) => g.rsvpStatus === "declined").length, wishCount: wishes.length,
        checkInCount: guests.filter((g) => g.checkedInAt).length };
}
export function text(value, max = 2000) {
    if (typeof value !== "string" || value.length > max)
        throw new ApiError("Teks tidak valid.");
    return value.trim();
}
export function mutate(db, kind, id, data, user) {
    if (!data || typeof data !== "object" || Array.isArray(data))
        throw new ApiError("Data tidak valid.");
    const current = rows(db, kind).find((r) => (r.id || r.eventId) === id);
    const eventId = kind === "events" ? id : (current?.eventId || data.eventId);
    if (kind === "events")
        owner(user);
    else
        eventAccess(db, eventId, user, true);
    if (kind !== "content" && user?.role !== "owner" && !["guests"].includes(kind))
        owner(user);
    const allowed = {
        events: ["coupleName", "slug", "templateId", "packageId", "eventDate", "venue", "status", "isPublished", "publishedAt", "expiresAt", "clientId"],
        content: ["greeting", "brideName", "bridePhotoUrl", "brideParent", "groomName", "groomPhotoUrl", "groomParent", "akadTime", "akadVenue", "resepsiTime", "resepsiVenue", "loveStory", "bankAccounts", "musicUrl", "customCss"],
        guests: ["name", "phone", "paxLimit", "rsvpStatus", "paxConfirmed", "checkedInAt"],
        wishes: ["isVisible", "message", "guestName"],
        media: ["url", "type", "category", "altText", "sortOrder"],
        gallery: ["photoUrl", "caption", "uploadedBy"],
    }[kind];
    if (!allowed)
        throw new ApiError("Operasi tidak dikenal.");
    const patch = Object.fromEntries(Object.entries(data).filter(([key]) => allowed.includes(key)));
    if (kind === "guests" && user?.role !== "owner")
        delete patch.checkedInAt;
    if (kind === "events" && patch.slug && (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(patch.slug) || rows(db, kind).some((e) => e.id !== id && e.slug === patch.slug)))
        throw new ApiError("Slug tidak valid atau sudah dipakai.");
    if (kind === "events" && patch.templateId && !rows(db, "templates").some((t) => t.id === patch.templateId && t.isActive))
        throw new ApiError("Template tidak tersedia.");
    if (kind === "events") {
        if (patch.isPublished === true && !current?.isPublished)
            throw new ApiError("Gunakan tombol Publikasikan agar persetujuan dan pembayaran diperiksa.");
        if (patch.packageId !== undefined) {
            const pkg = rows(db, "packages").find((p) => p.id === patch.packageId);
            if (!pkg || (!pkg.isActive && pkg.id !== current?.packageId))
                throw new ApiError("Paket tidak tersedia.");
            patch.packageTier = pkg.slug;
        }
        if ("coupleName" in patch && (typeof patch.coupleName !== "string" || !patch.coupleName.trim() || patch.coupleName.length > 200))
            throw new ApiError("Nama pasangan tidak valid.");
        if ("venue" in patch && (typeof patch.venue !== "string" || patch.venue.length > 300))
            throw new ApiError("Venue tidak valid.");
        if ("eventDate" in patch && (typeof patch.eventDate !== "string" || Number.isNaN(Date.parse(patch.eventDate))))
            throw new ApiError("Tanggal acara tidak valid.");
        if (patch.expiresAt && (typeof patch.expiresAt !== "string" || Number.isNaN(Date.parse(patch.expiresAt))))
            throw new ApiError("Tanggal kedaluwarsa tidak valid.");
        if ("status" in patch && !["draft", "active", "completed", "archived"].includes(patch.status))
            throw new ApiError("Status tidak valid.");
        if (patch.clientId && !db.prepare("SELECT id FROM users WHERE id=? AND role='client'").get(patch.clientId))
            throw new ApiError("Klien tidak ditemukan.");
    }
    if (kind === "content") {
        for (const field of ["bridePhotoUrl", "groomPhotoUrl", "musicUrl"])
            if (patch[field] && !(patch[field].startsWith("/") || patch[field].startsWith("https://")))
                throw new ApiError("Alamat file harus diawali / atau https://.");
        if ("customCss" in patch) {
            const css = patch.customCss;
            if (typeof css !== "string" || css.length > 5000 || /<\s*\/?\s*(style|script)|@import|url\s*\(|expression\s*\(|javascript:|behavior\s*:|-moz-binding/i.test(css))
                throw new ApiError("CSS kustom tidak diizinkan (maks 5000 karakter, tanpa @import, url(), atau skrip).");
        }
        if ("loveStory" in patch) {
            const list = patch.loveStory;
            if (!Array.isArray(list) || list.length > 20 || list.some((i) => !i || typeof i.title !== "string" || typeof i.description !== "string" || i.title.length > 200 || i.description.length > 2000))
                throw new ApiError("Love story tidak valid.");
            patch.loveStory = list.map((i) => ({ title: i.title.trim(), description: i.description.trim() }));
        }
        if ("bankAccounts" in patch) {
            const list = patch.bankAccounts;
            if (!Array.isArray(list) || list.length > 10 || list.some((i) => !i || ["bank", "accountNumber", "accountName"].some((k) => typeof i[k] !== "string" || i[k].length > 100)))
                throw new ApiError("Rekening tidak valid.");
            patch.bankAccounts = list.map((i) => ({ bank: i.bank.trim(), accountNumber: i.accountNumber.trim(), accountName: i.accountName.trim() }));
        }
    }
    if (kind === "guests") {
        for (const field of ["paxLimit", "paxConfirmed"])
            if (field in patch && (!Number.isInteger(patch[field]) || patch[field] < (field === "paxLimit" ? 1 : 0) || patch[field] > 100))
                throw new ApiError("Jumlah pax tidak valid.");
        if (patch.rsvpStatus && !["pending", "attending", "declined"].includes(patch.rsvpStatus))
            throw new ApiError("RSVP tidak valid.");
    }
    for (const value of Object.values(patch))
        if (typeof value === "string" && value.length > 20000)
            throw new ApiError("Konten terlalu panjang.");
    if (kind === "media" && patch.url && !patch.url.startsWith("/"))
        throw new ApiError("Media harus diunggah ke server terlebih dahulu.");
    const result = { ...current, ...patch, ...(kind === "content" ? { eventId: id } : { id }), updatedAt: new Date().toISOString() };
    if (kind === "guests" && result.paxConfirmed > result.paxLimit)
        throw new ApiError("Pax melebihi batas undangan.");
    return put(db, kind, result);
}
export const LEAD_STATUSES = ["Baru", "Dihubungi", "Menjadi Klien", "Batal"];
const LEAD_PACKAGES = ["Basic", "Premium", "Signature"];
const clean = (value, max) => {
    if (value === undefined || value === null)
        return "";
    if (typeof value !== "string" || value.length > max)
        throw new ApiError("Data konsultasi tidak valid.");
    return value.replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
};
export function normalizeWhatsapp(value) {
    const digits = String(value || "").replace(/\D/g, "");
    return digits.startsWith("0") ? "62" + digits.slice(1) : digits;
}
export function createLead(db, input, source = "Website Occasio") {
    if (!input || typeof input !== "object" || Array.isArray(input))
        throw new ApiError("Data konsultasi tidak valid.");
    const lead = {
        name: clean(input.name, 120), whatsapp: normalizeWhatsapp(clean(input.whatsapp, 30)),
        eventDate: clean(input.eventDate, 10), eventType: clean(input.eventType, 40) || "Pernikahan",
        template: clean(input.template, 120), package: clean(input.package, 20),
        budget: clean(input.budget, 60), notes: clean(input.notes, 2000),
    };
    if (!lead.name || !lead.budget)
        throw new ApiError("Nama dan kisaran budget wajib diisi.");
    if (!/^62\d{8,14}$/.test(lead.whatsapp))
        throw new ApiError("Nomor WhatsApp Indonesia tidak valid.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lead.eventDate) || Number.isNaN(Date.parse(lead.eventDate)))
        throw new ApiError("Tanggal acara tidak valid.");
    const activeNames = rows(db, "packages").filter((p) => p.isActive && p.name).map((p) => p.name);
    if (!(activeNames.length ? activeNames : LEAD_PACKAGES).includes(lead.package))
        throw new ApiError("Paket tidak valid.");
    const existing = rows(db, "leads");
    const now = Date.now();
    const duplicate = existing.find((l) => l.whatsapp === lead.whatsapp && l.name === lead.name && l.eventDate === lead.eventDate && now - Date.parse(l.createdAt) < 600000);
    if (duplicate)
        return duplicate;
    if (existing.length >= 5000)
        throw new ApiError("Inbox penuh. Hubungi kami melalui WhatsApp.", 429);
    const stamp = new Date(now).toISOString();
    return put(db, "leads", { ...lead, id: randomUUID(), source: clean(source, 60) || "Website Occasio", status: "Baru", ownerNote: "", createdAt: stamp, updatedAt: stamp });
}
export function updateLead(db, id, data, user) {
    owner(user);
    const current = rows(db, "leads").find((l) => l.id === id);
    if (!current)
        throw new ApiError("Lead tidak ditemukan.", 404);
    if (!data || typeof data !== "object" || Array.isArray(data))
        throw new ApiError("Data tidak valid.");
    const patch = {};
    if ("status" in data) {
        if (!LEAD_STATUSES.includes(data.status))
            throw new ApiError("Status tidak valid.");
        patch.status = data.status;
    }
    if ("ownerNote" in data)
        patch.ownerNote = clean(data.ownerNote, 2000);
    return put(db, "leads", { ...current, ...patch, updatedAt: new Date().toISOString() });
}
const slugify = (value) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "undangan";
// Mengubah lead menjadi akun klien + event draft Basic. Password sementara hanya dikembalikan sekali.
export function convertLead(db, id, input, user) {
    owner(user);
    const lead = rows(db, "leads").find((l) => l.id === id);
    if (!lead)
        throw new ApiError("Lead tidak ditemukan.", 404);
    if (lead.eventId)
        throw new ApiError("Lead ini sudah dijadikan klien.");
    const email = typeof input?.email === "string" ? input.email.toLowerCase().trim() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
        throw new ApiError("Email klien tidak valid.");
    if (db.prepare("SELECT id FROM users WHERE email=?").get(email))
        throw new ApiError("Email sudah dipakai akun lain.");
    const pkg = rows(db, "packages").find((p) => p.slug === "silver" && p.isActive) || rows(db, "packages").find((p) => p.isActive);
    const templates = rows(db, "templates").filter((t) => t.isActive);
    const template = templates.find((t) => t.name.toLowerCase() === (lead.template || "").toLowerCase()) || templates[0];
    if (!pkg || !template)
        throw new ApiError("Paket atau template aktif tidak tersedia.");
    const base = slugify(lead.name);
    const taken = new Set(rows(db, "events").map((e) => e.slug));
    let slug = base;
    while (taken.has(slug))
        slug = base + "-" + randomBytes(2).toString("hex");
    const temporaryPassword = randomBytes(12).toString("base64url");
    const now = new Date().toISOString();
    db.exec("BEGIN IMMEDIATE");
    try {
        const client = createUser(db, { email, fullName: lead.name, role: "client", password: temporaryPassword });
        const event = put(db, "events", {
            id: randomUUID(), ownerId: user.id, clientId: client.id, slug, coupleName: lead.name, templateId: template.id,
            packageId: pkg.id, packageTier: pkg.slug, eventDate: lead.eventDate + "T00:00:00+07:00", venue: "", status: "draft",
            isPublished: false, publishedAt: null, expiresAt: null, createdAt: now, lastActivity: now,
        });
        const updated = put(db, "leads", { ...lead, status: "Menjadi Klien", clientId: client.id, eventId: event.id, updatedAt: now });
        db.exec("COMMIT");
        return { lead: updated, event, client, temporaryPassword };
    }
    catch (e) {
        db.exec("ROLLBACK");
        throw e;
    }
}
const str = (value, max, label) => {
    if (typeof value !== "string" || !value.trim() || value.length > max)
        throw new ApiError(label + " tidak valid.");
    return value.trim();
};
const int = (value, min, max, label) => {
    if (!Number.isInteger(value) || value < min || value > max)
        throw new ApiError(label + " tidak valid.");
    return value;
};
// Pengelolaan katalog paket dan template oleh owner (hanya mengubah item yang sudah ada).
export function updateCatalog(db, kind, id, data, user) {
    owner(user);
    if (!["packages", "templates"].includes(kind))
        throw new ApiError("Operasi tidak dikenal.");
    const current = rows(db, kind).find((r) => r.id === id);
    if (!current)
        throw new ApiError("Data tidak ditemukan.", 404);
    if (!data || typeof data !== "object" || Array.isArray(data))
        throw new ApiError("Data tidak valid.");
    const patch = {};
    if ("name" in data)
        patch.name = str(data.name, 100, "Nama");
    if ("description" in data)
        patch.description = str(data.description, 1000, "Deskripsi");
    if ("isActive" in data) {
        if (typeof data.isActive !== "boolean")
            throw new ApiError("Status aktif tidak valid.");
        patch.isActive = data.isActive;
    }
    if (kind === "packages") {
        if ("price" in data)
            patch.price = str(data.price, 40, "Harga");
        if ("priceNumeric" in data)
            patch.priceNumeric = int(data.priceNumeric, 0, 1000000000, "Harga");
        if ("maxGuests" in data)
            patch.maxGuests = int(data.maxGuests, 1, 100000, "Kuota undangan");
        if ("maxRevisions" in data)
            patch.maxRevisions = int(data.maxRevisions, 0, 100, "Jumlah revisi");
        if ("durationMonths" in data)
            patch.durationMonths = int(data.durationMonths, 1, 60, "Masa aktif");
        if ("sortOrder" in data)
            patch.sortOrder = int(data.sortOrder, 0, 1000, "Urutan");
        if ("features" in data) {
            if (!Array.isArray(data.features) || data.features.length > 30 || data.features.some((f) => typeof f !== "string" || f.length > 200))
                throw new ApiError("Fitur tidak valid.");
            patch.features = data.features.map((f) => f.trim()).filter(Boolean);
        }
        if ("availability" in data) {
            if (typeof data.availability !== "string" || data.availability.length > 100)
                throw new ApiError("Keterangan ketersediaan tidak valid.");
            patch.availability = data.availability.replace(/[<>]/g, "").trim();
        }
        if ("featured" in data) {
            if (typeof data.featured !== "boolean")
                throw new ApiError("Pilihan unggulan tidak valid.");
            patch.featured = data.featured;
        }
        for (const flag of ["includesTablet", "includesLiveGallery", "includesPhotoBooth", "includesQrCheckin"])
            if (flag in data) {
                if (typeof data[flag] !== "boolean")
                    throw new ApiError("Pilihan fitur tidak valid.");
                patch[flag] = data[flag];
            }
    }
    else {
        if ("thumbnailUrl" in data) {
            if (typeof data.thumbnailUrl !== "string" || data.thumbnailUrl.length > 500 || (data.thumbnailUrl && !data.thumbnailUrl.startsWith("/") && !data.thumbnailUrl.startsWith("https://")))
                throw new ApiError("Alamat thumbnail tidak valid.");
            patch.thumbnailUrl = data.thumbnailUrl;
        }
        if ("galleryCategory" in data) {
            if (!["modern", "classic", "luxury", "minimal"].includes(data.galleryCategory))
                throw new ApiError("Kategori tidak valid.");
            patch.galleryCategory = data.galleryCategory;
        }
        if ("badge" in data) {
            if (typeof data.badge !== "string" || data.badge.length > 30)
                throw new ApiError("Label tidak valid.");
            patch.badge = data.badge.replace(/[<>]/g, "").trim();
        }
        if ("minPackage" in data) {
            if (!["silver", "gold", "platinum"].includes(data.minPackage))
                throw new ApiError("Paket minimum tidak valid.");
            patch.minPackage = data.minPackage;
        }
    }
    return put(db, kind, { ...current, ...patch });
}
// Pengelolaan akun oleh owner.
export function updateProfile(db, id, data, user) {
    owner(user);
    const target = db.prepare("SELECT * FROM users WHERE id=?").get(id);
    if (!target)
        throw new ApiError("Akun tidak ditemukan.", 404);
    const fullName = "fullName" in (data || {}) ? str(data.fullName, 120, "Nama") : target.fullName;
    let email = target.email;
    if ("email" in (data || {})) {
        email = typeof data.email === "string" ? data.email.toLowerCase().trim() : "";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
            throw new ApiError("Email tidak valid.");
        if (db.prepare("SELECT id FROM users WHERE email=? AND id<>?").get(email, id))
            throw new ApiError("Email sudah dipakai akun lain.");
    }
    db.prepare("UPDATE users SET fullName=?, email=? WHERE id=?").run(fullName, email, id);
    return publicUser({ ...target, fullName, email });
}
export function resetPassword(db, id, user) {
    owner(user);
    const target = db.prepare("SELECT * FROM users WHERE id=?").get(id);
    if (!target)
        throw new ApiError("Akun tidak ditemukan.", 404);
    const temporaryPassword = randomBytes(12).toString("base64url");
    setPassword(db, id, temporaryPassword);
    return { temporaryPassword };
}
function setPassword(db, id, password) {
    const salt = randomBytes(16).toString("hex");
    db.prepare("UPDATE users SET password=? WHERE id=?").run(salt + ":" + scryptSync(password, salt, 64).toString("hex"), id);
    db.prepare("DELETE FROM sessions WHERE userId=?").run(id);
}
export function changeOwnPassword(db, user, current, next) {
    requireUser(user);
    if (typeof next !== "string" || next.length < 12 || next.length > 128)
        throw new ApiError("Password baru minimal 12 karakter.");
    const row = db.prepare("SELECT password FROM users WHERE id=?").get(user.id);
    const [salt, hash] = row.password.split(":");
    if (typeof current !== "string" || current.length > 128 || !timingSafeEqual(scryptSync(current, salt, 64), Buffer.from(hash, "hex")))
        throw new ApiError("Password saat ini salah.", 403);
    setPassword(db, user.id, next);
}
export function deleteWish(db, id, user) {
    requireUser(user);
    const wish = rows(db, "wishes").find((w) => w.id === id);
    if (!wish)
        throw new ApiError("Ucapan tidak ditemukan.", 404);
    eventAccess(db, wish.eventId, user, true);
    remove(db, "wishes", id);
}
// Pengaturan situs publik (satu record "settings"/"site") dan data yang dibaca website statis.
export const DEFAULT_SITE_SETTINGS = {
    whatsappNumber: "",
    contactLabel: "WhatsApp belum diset",
    showPublicPrices: false,
    paymentInstructions: "",
    priceDisclaimer: "Harga final mengikuti kebutuhan konten, domain, revisi, dan fitur tambahan yang dipilih.",
    faqs: [
        { question: "Paket mana yang memiliki QR check-in?", answer: "QR tamu dan check-in tersedia mulai paket Premium. Paket Signature menambahkan dukungan operasional hari acara." },
        { question: "Apa yang terjadi setelah konsultasi?", answer: "Brief masuk ke inbox Occasio, tim mengonfirmasi kebutuhan dan pembayaran, lalu workspace klien dibuat untuk proses konten." },
        { question: "Apakah desain bisa disesuaikan?", answer: "Bisa. Penyesuaian warna dan konten mengikuti paket, sedangkan arah visual khusus tersedia sebagai bagian paket Signature." },
    ],
    testimonials: [],
};
export function getSiteSettings(db) {
    const stored = rows(db, "settings").find((s) => s.id === "site") || {};
    const rest = { ...stored };
    delete rest.id;
    delete rest.updatedAt;
    return { ...DEFAULT_SITE_SETTINGS, ...rest };
}
const list = (value, max, label, shape) => {
    if (!Array.isArray(value) || value.length > max)
        throw new ApiError(label + " tidak valid.");
    return value.map((item) => {
        if (!item || typeof item !== "object")
            throw new ApiError(label + " tidak valid.");
        return Object.fromEntries(Object.entries(shape).map(([key, limit]) => {
            if (typeof item[key] !== "string" || item[key].length > limit)
                throw new ApiError(label + " tidak valid.");
            return [key, item[key].replace(/[<>]/g, "").trim()];
        }));
    }).filter((item) => Object.values(item).some(Boolean));
};
export function updateSiteSettings(db, data, user) {
    owner(user);
    if (!data || typeof data !== "object" || Array.isArray(data))
        throw new ApiError("Data tidak valid.");
    const patch = {};
    if ("whatsappNumber" in data) {
        const number = normalizeWhatsapp(typeof data.whatsappNumber === "string" ? data.whatsappNumber : "");
        if (number && !/^62\d{8,14}$/.test(number))
            throw new ApiError("Nomor WhatsApp harus nomor Indonesia (62...).");
        patch.whatsappNumber = number;
    }
    if ("contactLabel" in data)
        patch.contactLabel = str(data.contactLabel, 100, "Label kontak").replace(/[<>]/g, "");
    if ("paymentInstructions" in data) {
        if (typeof data.paymentInstructions !== "string" || data.paymentInstructions.length > 1000)
            throw new ApiError("Petunjuk pembayaran tidak valid.");
        patch.paymentInstructions = data.paymentInstructions.replace(/[<>]/g, "").trim();
    }
    if ("priceDisclaimer" in data)
        patch.priceDisclaimer = str(data.priceDisclaimer, 500, "Catatan harga").replace(/[<>]/g, "");
    if ("showPublicPrices" in data) {
        if (typeof data.showPublicPrices !== "boolean")
            throw new ApiError("Pilihan harga tidak valid.");
        patch.showPublicPrices = data.showPublicPrices;
    }
    if ("faqs" in data)
        patch.faqs = list(data.faqs, 20, "FAQ", { question: 200, answer: 1500 });
    if ("testimonials" in data)
        patch.testimonials = list(data.testimonials, 12, "Testimoni", { name: 100, quote: 500, status: 100 });
    const next = { ...getSiteSettings(db), ...patch };
    put(db, "settings", { id: "site", ...next, updatedAt: new Date().toISOString() });
    return next;
}
// Data publik: tanpa field internal. Template hanya yang aktif.
export function publicSite(db) {
    const packages = rows(db, "packages").sort((a, b) => a.sortOrder - b.sortOrder).map((p) => ({
        id: p.id, slug: p.slug, name: p.name, price: p.price, description: p.description, features: p.features || [],
        availability: p.availability || (p.isActive ? "Tersedia" : "Belum tersedia untuk dipesan"),
        featured: Boolean(p.featured), orderable: Boolean(p.isActive),
    }));
    const tierName = Object.fromEntries(packages.map((p) => [p.slug, p.name]));
    const templates = rows(db, "templates").filter((t) => t.isActive).map((t) => ({
        id: t.id, slug: t.slug, name: t.name, description: t.description, thumbnailUrl: t.thumbnailUrl || "",
        galleryCategory: t.galleryCategory || "modern", badge: t.badge || "", packageLevel: tierName[t.minPackage] || "Basic",
        colors: [t.configJson?.primaryColor, t.configJson?.secondaryColor].filter(Boolean),
    }));
    const settings = getSiteSettings(db);
    delete settings.paymentInstructions; // berisi data rekening: hanya untuk klien yang login
    return { settings, packages, templates };
}
