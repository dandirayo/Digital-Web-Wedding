import { createHash, randomUUID } from "node:crypto";
import { ApiError, eventAccess, owner, put, remove, requireUser, rows } from "./database.mjs";

// Alur bisnis: tagihan manual, versi konten + persetujuan klien, gerbang publish, chat, dan riwayat.
// Semua disimpan sebagai record di SQLite; aturan akses diperiksa di sini, bukan di UI.

const clean = (value, max, label, { required = false } = {}) => {
    if (value === undefined || value === null)
        value = "";
    if (typeof value !== "string" || value.length > max)
        throw new ApiError(label + " tidak valid.");
    const out = value.replace(/[<>]/g, "").trim();
    if (required && !out)
        throw new ApiError(label + " wajib diisi.");
    return out;
};
export const formatRupiah = (value) => "Rp " + new Intl.NumberFormat("id-ID").format(value);
const findEvent = (db, id) => {
    const event = rows(db, "events").find((e) => e.id === id);
    if (!event)
        throw new ApiError("Event tidak ditemukan.", 404);
    return event;
};

// ---------- Riwayat ----------
export function audit(db, user, action, eventId, detail = "") {
    put(db, "audit", {
        id: randomUUID(), at: new Date().toISOString(), actorId: user?.id ?? "", actorName: user?.fullName ?? "Sistem",
        actorRole: user?.role ?? "system", eventId: eventId ?? "", action, detail: String(detail).slice(0, 500),
    });
}
export function listAudit(db, eventId, user) {
    owner(user);
    return rows(db, "audit").filter((a) => !eventId || a.eventId === eventId).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 200);
}

// ---------- Tagihan ----------
const INVOICE_TYPES = { dp: "DP 50%", pelunasan: "Pelunasan", tambahan: "Biaya tambahan" };
const METHODS = ["transfer", "tunai", "lainnya"];

export function ensureOrder(db, event, user) {
    if (rows(db, "orders").some((o) => o.eventId === event.id))
        return;
    const pkg = rows(db, "packages").find((p) => p.id === event.packageId);
    const total = Number.isInteger(pkg?.priceNumeric) ? pkg.priceNumeric : 0;
    const now = new Date().toISOString();
    put(db, "orders", { id: "order-" + event.id, eventId: event.id, packageId: event.packageId ?? "", packageName: pkg?.name ?? "", total, createdAt: now });
    if (total > 0) {
        const dp = Math.round(total / 2);
        newInvoice(db, event.id, "dp", dp, "50% di awal sebelum produksi dimulai");
        newInvoice(db, event.id, "pelunasan", total - dp, "Dibayar sebelum undangan dipublikasikan");
    }
    audit(db, user, "order_created", event.id, `${pkg?.name ?? "Paket"} ${formatRupiah(total)}`);
}
function newInvoice(db, eventId, type, amount, note) {
    const seq = rows(db, "invoices").length + 1;
    return put(db, "invoices", {
        id: randomUUID(), number: `INV-${new Date().getFullYear()}-${String(seq).padStart(4, "0")}`, eventId, type,
        label: INVOICE_TYPES[type], amount, note, status: "unpaid", proofNote: "", method: "", reference: "", paidAt: null,
        verifiedBy: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
}
export function paymentSummary(db, eventId) {
    const live = rows(db, "invoices").filter((i) => i.eventId === eventId && i.status !== "void");
    const total = live.reduce((s, i) => s + i.amount, 0);
    const paid = live.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
    return { total, paid, outstanding: total - paid };
}
export function billing(db, eventId, user) {
    const event = eventAccess(db, eventId, user, true);
    if (user.role === "owner")
        ensureOrder(db, event, user);
    const invoices = rows(db, "invoices").filter((i) => i.eventId === eventId).sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.number.localeCompare(b.number));
    const settings = rows(db, "settings").find((s) => s.id === "site");
    return { invoices, summary: paymentSummary(db, eventId), instructions: settings?.paymentInstructions ?? "" };
}
export function addInvoice(db, eventId, input, user) {
    owner(user);
    const event = findEvent(db, eventId);
    if (!input || !Object.hasOwn(INVOICE_TYPES, input.type))
        throw new ApiError("Jenis tagihan tidak valid.");
    if (!Number.isInteger(input.amount) || input.amount < 1 || input.amount > 1000000000)
        throw new ApiError("Jumlah tagihan tidak valid.");
    const invoice = newInvoice(db, event.id, input.type, input.amount, clean(input.note, 300, "Catatan"));
    audit(db, user, "invoice_created", eventId, `${invoice.number} ${formatRupiah(invoice.amount)}`);
    return invoice;
}
export function updateInvoice(db, id, input, user) {
    const current = rows(db, "invoices").find((i) => i.id === id);
    if (!current)
        throw new ApiError("Tagihan tidak ditemukan.", 404);
    if (!input || typeof input !== "object")
        throw new ApiError("Data tidak valid.");
    const now = new Date().toISOString();
    let next;
    let note;
    if (input.op === "report") {
        // Klien melaporkan pembayaran; belum dianggap lunas sampai diverifikasi owner.
        eventAccess(db, current.eventId, user, true);
        if (current.status !== "unpaid" && current.status !== "proof_submitted")
            throw new ApiError("Tagihan ini tidak dapat dilaporkan.");
        next = { status: "proof_submitted", proofNote: clean(input.note, 500, "Keterangan pembayaran", { required: true }) };
        note = "pembayaran dilaporkan";
    }
    else {
        owner(user);
        if (input.op === "pay") {
            if (current.status === "paid" || current.status === "void")
                throw new ApiError("Tagihan sudah " + (current.status === "paid" ? "lunas" : "dibatalkan") + ".");
            if (!METHODS.includes(input.method))
                throw new ApiError("Metode pembayaran tidak valid.");
            const date = typeof input.paidAt === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.paidAt) && !Number.isNaN(Date.parse(input.paidAt)) ? input.paidAt : null;
            if (!date)
                throw new ApiError("Tanggal pembayaran tidak valid.");
            next = { status: "paid", method: input.method, reference: clean(input.reference, 200, "Referensi"), paidAt: date + "T00:00:00+07:00", verifiedBy: user.fullName };
            note = "dinyatakan lunas";
        }
        else if (input.op === "reopen") {
            if (current.status !== "paid" && current.status !== "void")
                throw new ApiError("Hanya tagihan lunas atau batal yang bisa dibuka kembali.");
            next = { status: "unpaid", method: "", reference: "", paidAt: null, verifiedBy: "" };
            note = "dibuka kembali";
        }
        else if (input.op === "void") {
            if (current.status === "paid")
                throw new ApiError("Buka kembali tagihan lunas sebelum membatalkannya.");
            next = { status: "void" };
            note = "dibatalkan";
        }
        else if (input.op === "edit") {
            if (current.status === "paid")
                throw new ApiError("Tagihan lunas tidak dapat diubah.");
            next = {};
            if ("amount" in input) {
                if (!Number.isInteger(input.amount) || input.amount < 1 || input.amount > 1000000000)
                    throw new ApiError("Jumlah tagihan tidak valid.");
                next.amount = input.amount;
            }
            if ("note" in input)
                next.note = clean(input.note, 300, "Catatan");
            note = "diubah";
        }
        else
            throw new ApiError("Operasi tagihan tidak dikenal.");
    }
    const saved = put(db, "invoices", { ...current, ...next, updatedAt: now });
    audit(db, user, "invoice_" + (input.op ?? "edit"), current.eventId, `${current.number} ${note}${next.amount ? " " + formatRupiah(next.amount) : ""}`);
    return saved;
}

// ---------- Versi konten & persetujuan ----------
const stable = (value) => JSON.stringify(value, (_key, v) => (v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, v[k]])) : v));
export function contentSnapshot(db, eventId) {
    const event = findEvent(db, eventId);
    const content = rows(db, "content").find((c) => c.eventId === eventId);
    const body = content ? Object.fromEntries(Object.entries(content).filter(([k]) => k !== "eventId" && k !== "updatedAt")) : null;
    const media = rows(db, "media").filter((m) => m.eventId === eventId)
        .map((m) => ({ type: m.type, category: m.category, url: m.url, sortOrder: m.sortOrder }))
        .sort((a, b) => a.category.localeCompare(b.category) || a.sortOrder - b.sortOrder || a.url.localeCompare(b.url));
    return {
        event: { coupleName: event.coupleName, eventDate: event.eventDate, venue: event.venue, templateId: event.templateId, slug: event.slug },
        content: body, media,
    };
}
export const snapshotHash = (snapshot) => createHash("sha256").update(stable(snapshot)).digest("hex");
const versionsOf = (db, eventId) => rows(db, "versions").filter((v) => v.eventId === eventId).sort((a, b) => a.number - b.number);

export function publishGate(db, eventId) {
    const versions = versionsOf(db, eventId);
    const approved = [...versions].reverse().find((v) => v.decision === "approved");
    const currentHash = snapshotHash(contentSnapshot(db, eventId));
    const reasons = [];
    if (!approved)
        reasons.push("Belum ada versi undangan yang disetujui klien");
    else if (approved.hash !== currentHash)
        reasons.push(`Isi undangan berubah sejak versi ${approved.number} disetujui`);
    const orders = rows(db, "invoices").some((i) => i.eventId === eventId && i.status !== "void");
    const pay = paymentSummary(db, eventId);
    if (!orders)
        reasons.push("Belum ada tagihan");
    else if (pay.outstanding > 0)
        reasons.push(`Pembayaran belum lunas (sisa ${formatRupiah(pay.outstanding)})`);
    return { ok: reasons.length === 0, reasons, approvedVersion: approved?.number ?? null };
}
export function approvalState(db, eventId, user) {
    const event = eventAccess(db, eventId, user, true);
    const versions = versionsOf(db, eventId).map((v) => ({ ...v, snapshot: undefined }));
    const gate = publishGate(db, eventId);
    const latest = versions[versions.length - 1] ?? null;
    return { versions: [...versions].reverse(), latest, gate, published: Boolean(event.isPublished), currentHash: snapshotHash(contentSnapshot(db, eventId)) };
}
export function submitVersion(db, eventId, user) {
    const event = eventAccess(db, eventId, user, true);
    if (!rows(db, "content").some((c) => c.eventId === eventId))
        throw new ApiError("Isi undangan belum ada.");
    const snapshot = contentSnapshot(db, eventId);
    const hash = snapshotHash(snapshot);
    const versions = versionsOf(db, eventId);
    const approved = [...versions].reverse().find((v) => v.decision === "approved");
    if (approved?.hash === hash)
        throw new ApiError(`Tidak ada perubahan sejak versi ${approved.number} disetujui.`);
    const pending = versions.find((v) => v.decision === "pending" && v.hash === hash);
    if (pending)
        throw new ApiError(`Versi ${pending.number} dengan isi yang sama masih menunggu persetujuan.`);
    for (const v of versions.filter((x) => x.decision === "pending"))
        put(db, "versions", { ...v, decision: "superseded" });
    const version = put(db, "versions", {
        id: randomUUID(), eventId, number: versions.length + 1, hash, snapshot, decision: "pending", note: "",
        submittedBy: user.id, submittedByName: user.fullName, submittedAt: new Date().toISOString(), decidedAt: null, decidedBy: "", decidedByRole: "",
    });
    audit(db, user, "version_submitted", eventId, `Versi ${version.number} diajukan untuk persetujuan klien`);
    return { ...version, snapshot: undefined, eventSlug: event.slug };
}
export function decideVersion(db, id, input, user) {
    requireUser(user);
    const version = rows(db, "versions").find((v) => v.id === id);
    if (!version)
        throw new ApiError("Versi tidak ditemukan.", 404);
    const event = eventAccess(db, version.eventId, user, true);
    const decision = input?.decision;
    if (!["approved", "changes_requested"].includes(decision))
        throw new ApiError("Keputusan tidak valid.");
    if (version.decision !== "pending")
        throw new ApiError("Versi ini sudah tidak menunggu keputusan.");
    const onBehalf = user.role === "owner" && event.clientId !== user.id;
    const note = clean(input.note, 1000, "Catatan", { required: decision === "changes_requested" || onBehalf });
    if (onBehalf && note.length < 10)
        throw new ApiError("Persetujuan atas nama klien wajib disertai catatan bukti (mis. persetujuan via WhatsApp).");
    if (decision === "approved" && snapshotHash(contentSnapshot(db, version.eventId)) !== version.hash)
        throw new ApiError("Isi undangan berubah sejak versi ini diajukan. Ajukan versi baru.");
    const saved = put(db, "versions", { ...version, decision, note, decidedAt: new Date().toISOString(), decidedBy: user.id, decidedByRole: user.role + (onBehalf ? "_on_behalf" : "") });
    audit(db, user, onBehalf ? `version_${decision}_on_behalf` : `version_${decision}`, version.eventId, `Versi ${version.number}${note ? ": " + note : ""}`);
    return { ...saved, snapshot: undefined };
}

// ---------- Publish ----------
export function publishEvent(db, id, input, user) {
    owner(user);
    const event = findEvent(db, id);
    if (event.isPublished)
        throw new ApiError("Undangan sudah dipublikasikan.");
    ensureOrder(db, event, user);
    const gate = publishGate(db, id);
    const reason = clean(input?.overrideReason, 500, "Alasan");
    if (!gate.ok) {
        if (reason.length < 10)
            throw new ApiError("Belum bisa dipublikasikan: " + gate.reasons.join("; ") + ".", 409);
        audit(db, user, "publish_override", id, `${gate.reasons.join("; ")} — alasan: ${reason}`);
    }
    const now = new Date();
    let expiresAt = event.expiresAt;
    if (!expiresAt) {
        const months = rows(db, "packages").find((p) => p.id === event.packageId)?.durationMonths;
        if (Number.isInteger(months)) {
            const d = new Date(now);
            d.setMonth(d.getMonth() + months);
            expiresAt = d.toISOString();
        }
    }
    const saved = put(db, "events", { ...event, status: "active", isPublished: true, publishedAt: now.toISOString(), expiresAt, updatedAt: now.toISOString() });
    audit(db, user, "published", id, expiresAt ? `Berlaku sampai ${expiresAt.slice(0, 10)}` : "");
    return saved;
}
export function unpublishEvent(db, id, user) {
    owner(user);
    const event = findEvent(db, id);
    const saved = put(db, "events", { ...event, isPublished: false, status: "draft", updatedAt: new Date().toISOString() });
    audit(db, user, "unpublished", id);
    return saved;
}

// ---------- Chat ----------
export function listMessages(db, eventId, user) {
    eventAccess(db, eventId, user, true);
    return rows(db, "messages").filter((m) => m.eventId === eventId).sort((a, b) => a.seq - b.seq).slice(-300);
}
export function sendMessage(db, eventId, input, user) {
    eventAccess(db, eventId, user, true);
    const text = clean(input?.text, 2000, "Pesan", { required: true });
    // seq menjaga urutan dan status baca tetap tepat walau dua pesan masuk pada milidetik yang sama.
    const seq = rows(db, "messages").reduce((max, m) => Math.max(max, m.seq ?? 0), 0) + 1;
    const message = put(db, "messages", { id: randomUUID(), seq, eventId, senderId: user.id, senderRole: user.role, senderName: user.fullName, text, createdAt: new Date().toISOString() });
    put(db, "reads", { id: `${eventId}:${user.role}`, eventId, role: user.role, lastSeq: seq });
    return message;
}
export function markRead(db, eventId, user) {
    eventAccess(db, eventId, user, true);
    const lastSeq = rows(db, "messages").filter((m) => m.eventId === eventId).reduce((max, m) => Math.max(max, m.seq ?? 0), 0);
    put(db, "reads", { id: `${eventId}:${user.role}`, eventId, role: user.role, lastSeq });
}
export function chatThreads(db, user) {
    requireUser(user);
    const events = rows(db, "events").filter((e) => user.role === "owner" || e.clientId === user.id);
    const messages = rows(db, "messages");
    const reads = rows(db, "reads");
    const other = user.role === "owner" ? "client" : "owner";
    return events.map((e) => {
        const thread = messages.filter((m) => m.eventId === e.id).sort((a, b) => a.seq - b.seq);
        const lastRead = reads.find((r) => r.id === `${e.id}:${user.role}`)?.lastSeq ?? 0;
        const last = thread[thread.length - 1] ?? null;
        return {
            eventId: e.id, coupleName: e.coupleName, lastMessage: last ? { text: last.text.slice(0, 120), at: last.createdAt, senderRole: last.senderRole } : null,
            unread: thread.filter((m) => m.senderRole === other && m.seq > lastRead).length,
        };
    }).sort((a, b) => (b.lastMessage?.at ?? "").localeCompare(a.lastMessage?.at ?? ""));
}

// ---------- Ringkasan owner ----------
export function stageOf(db, event) {
    if (event.isPublished)
        return event.status === "completed" || event.status === "archived" ? "Selesai" : "Aktif";
    if (event.status === "completed" || event.status === "archived")
        return "Selesai";
    const invoices = rows(db, "invoices").filter((i) => i.eventId === event.id && i.status !== "void");
    if (!invoices.length)
        return "Belum ada tagihan";
    const dp = invoices.find((i) => i.type === "dp");
    if (dp && dp.status !== "paid")
        return dp.status === "proof_submitted" ? "Verifikasi DP" : "Menunggu DP";
    const versions = versionsOf(db, event.id);
    const latest = versions[versions.length - 1];
    const gate = publishGate(db, event.id);
    if (gate.ok)
        return "Siap publish";
    if (latest?.decision === "pending")
        return "Menunggu persetujuan klien";
    if (latest?.decision === "changes_requested" && gate.approvedVersion === null)
        return "Perlu revisi";
    if (gate.approvedVersion !== null && gate.reasons.some((r) => r.startsWith("Pembayaran")))
        return "Menunggu pelunasan";
    return "Produksi konten";
}
export function overview(db, user) {
    owner(user);
    const now = Date.now();
    const events = rows(db, "events");
    const invoices = rows(db, "invoices");
    const names = Object.fromEntries(events.map((e) => [e.id, e.coupleName]));
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const items = events.map((e) => ({ id: e.id, coupleName: e.coupleName, slug: e.slug, eventDate: e.eventDate, status: e.status, isPublished: Boolean(e.isPublished), stage: stageOf(db, e), ...paymentSummary(db, e.id) }));
    const live = invoices.filter((i) => i.status !== "void");
    const paid = live.filter((i) => i.status === "paid");
    const tasks = [];
    for (const i of invoices.filter((x) => x.status === "proof_submitted"))
        tasks.push({ id: "pay-" + i.id, eventId: i.eventId, title: `Verifikasi pembayaran ${names[i.eventId] ?? ""}`, detail: `${i.number} · ${formatRupiah(i.amount)} · ${i.proofNote}`, priority: "high" });
    for (const item of items) {
        if (item.stage === "Perlu revisi")
            tasks.push({ id: "rev-" + item.id, eventId: item.id, title: `Kerjakan revisi ${item.coupleName}`, detail: "Klien meminta perubahan pada versi terakhir", priority: "high" });
        if (item.stage === "Siap publish")
            tasks.push({ id: "pub-" + item.id, eventId: item.id, title: `Publikasikan ${item.coupleName}`, detail: "Sudah disetujui klien dan lunas", priority: "high" });
        if (item.stage === "Menunggu persetujuan klien")
            tasks.push({ id: "wait-" + item.id, eventId: item.id, title: `Tunggu persetujuan ${item.coupleName}`, detail: "Versi diajukan, belum ada keputusan klien", priority: "normal" });
        const days = (Date.parse(item.eventDate) - now) / 86400000;
        if (!item.isPublished && item.status !== "completed" && item.status !== "archived" && days >= 0 && days <= 14)
            tasks.push({ id: "soon-" + item.id, eventId: item.id, title: `Acara ${item.coupleName} ${Math.ceil(days)} hari lagi`, detail: "Undangan belum dipublikasikan", priority: "high" });
    }
    for (const t of chatThreads(db, user).filter((x) => x.unread > 0))
        tasks.push({ id: "chat-" + t.eventId, eventId: t.eventId, title: `Balas pesan ${t.coupleName}`, detail: `${t.unread} pesan belum dibaca`, priority: "normal" });
    const leads = rows(db, "leads");
    const newLeads = leads.filter((l) => l.status === "Baru").length;
    if (newLeads)
        tasks.push({ id: "leads", eventId: "", title: `Follow-up ${newLeads} lead baru`, detail: "Buka inbox konsultasi", priority: "normal" });
    const pkgName = (e) => rows(db, "packages").find((p) => p.id === e.packageId)?.name ?? "Tanpa paket";
    const byPackage = {};
    for (const e of events)
        byPackage[pkgName(e)] = (byPackage[pkgName(e)] ?? 0) + 1;
    return {
        events: items,
        totals: {
            revenuePaid: paid.reduce((s, i) => s + i.amount, 0),
            revenueThisMonth: paid.filter((i) => (i.paidAt ?? "") >= monthStart).reduce((s, i) => s + i.amount, 0),
            outstanding: live.filter((i) => i.status !== "paid").reduce((s, i) => s + i.amount, 0),
            awaitingVerification: invoices.filter((i) => i.status === "proof_submitted").length,
            invoicesPaid: paid.length,
            invoicesOpen: live.filter((i) => i.status !== "paid").length,
        },
        packages: Object.entries(byPackage).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
        leads: { baru: newLeads, dihubungi: leads.filter((l) => l.status === "Dihubungi").length },
        tasks: tasks.sort((a, b) => (a.priority === b.priority ? 0 : a.priority === "high" ? -1 : 1)),
    };
}
export function removeEventBusinessData(db, eventId) {
    for (const kind of ["orders", "invoices", "versions", "messages"])
        for (const r of rows(db, kind))
            if (r.eventId === eventId)
                remove(db, kind, r.id);
    remove(db, "reads", `${eventId}:owner`);
    remove(db, "reads", `${eventId}:client`);
}
