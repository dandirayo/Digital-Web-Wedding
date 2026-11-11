import { randomUUID } from "node:crypto";
import { ApiError, rows, put, eventAccess } from "./database.mjs";

const TOKEN = /^[A-Za-z0-9-]{8,64}$/;
const MAX_BAD_TOKENS = 30;
const BAD_WINDOW_MS = 15 * 60 * 1000;
const MAX_WISHES = 1000;

export const guestPublic = (guest) => ({
    id: guest.id, eventId: guest.eventId, name: guest.name, paxLimit: guest.paxLimit,
    rsvpStatus: guest.rsvpStatus, paxConfirmed: guest.paxConfirmed, rsvpAt: guest.rsvpAt ?? null,
});

function badToken(db, eventId) {
    const key = `rsvp-bad:${eventId}`, now = Date.now();
    const row = db.prepare("SELECT * FROM attempts WHERE email=?").get(key);
    if (row && row.until > now && row.count >= MAX_BAD_TOKENS)
        throw new ApiError("Terlalu banyak percobaan. Coba lagi nanti.", 429);
    db.prepare("INSERT INTO attempts VALUES (?,1,?) ON CONFLICT(email) DO UPDATE SET count=CASE WHEN attempts.until < ? THEN 1 ELSE attempts.count+1 END, until=?")
        .run(key, now + BAD_WINDOW_MS, now, now + BAD_WINDOW_MS);
    throw new ApiError("Link undangan tidak valid.", 404);
}

function findByToken(db, eventId, token) {
    // Hitung percobaan gagal dulu agar penebakan token tidak bisa diulang tanpa batas.
    const attempt = db.prepare("SELECT * FROM attempts WHERE email=?").get(`rsvp-bad:${eventId}`);
    if (attempt && attempt.until > Date.now() && attempt.count >= MAX_BAD_TOKENS)
        throw new ApiError("Terlalu banyak percobaan. Coba lagi nanti.", 429);
    if (typeof token !== "string" || !TOKEN.test(token))
        return badToken(db, eventId);
    const guest = rows(db, "guests").find((g) => g.eventId === eventId && g.qrCode === token);
    return guest || badToken(db, eventId);
}

/** Tamu membuka link pribadi: kembalikan hanya data yang ia perlukan, tanpa nomor telepon. */
export function guestByToken(db, eventId, token, user) {
    eventAccess(db, eventId, user);
    return guestPublic(findByToken(db, eventId, token));
}

/** RSVP idempoten: pengiriman ulang dengan isi sama tidak mengubah apa pun. */
export function submitRsvp(db, eventId, token, input, user) {
    eventAccess(db, eventId, user);
    const guest = findByToken(db, eventId, token);
    if (!input || typeof input !== "object")
        throw new ApiError("RSVP tidak valid.");
    const status = input.rsvpStatus;
    if (!["attending", "declined"].includes(status))
        throw new ApiError("RSVP tidak valid.");
    let pax = 0;
    if (status === "attending") {
        pax = Number(input.paxConfirmed ?? 1);
        if (!Number.isInteger(pax) || pax < 1)
            throw new ApiError("Jumlah tamu yang hadir tidak valid.");
        if (pax > guest.paxLimit)
            throw new ApiError(`Undangan ini untuk maksimal ${guest.paxLimit} orang.`);
    }
    if (guest.rsvpStatus === status && guest.paxConfirmed === pax)
        return guestPublic(guest);
    return guestPublic(put(db, "guests", { ...guest, rsvpStatus: status, paxConfirmed: pax, rsvpAt: new Date().toISOString() }));
}

/** Kuota tamu mengikuti paket event: menambah di atas batas ditolak. */
export function assertGuestQuota(db, eventId, adding) {
    const event = rows(db, "events").find((e) => e.id === eventId);
    const pkg = rows(db, "packages").find((p) => p.id === event?.packageId) || rows(db, "packages").find((p) => p.slug === event?.packageTier);
    const max = Number(pkg?.maxGuests);
    if (!Number.isFinite(max) || max <= 0)
        return;
    const current = rows(db, "guests").filter((g) => g.eventId === eventId).length;
    if (current + adding > max)
        throw new ApiError(`Kuota tamu paket ${pkg.name} adalah ${max}. Saat ini ${current} tamu terdaftar, tidak bisa menambah ${adding} lagi.`, 409);
}

export function newGuest(eventId, g, text, now) {
    const name = text(g.name, 200), paxLimit = g.paxLimit ?? 1, paxConfirmed = g.paxConfirmed ?? 0;
    if (!name || !Number.isInteger(paxLimit) || paxLimit < 1 || paxLimit > 100 || !Number.isInteger(paxConfirmed) || paxConfirmed < 0 || paxConfirmed > paxLimit)
        throw new ApiError("Data tamu tidak valid.");
    return {
        id: randomUUID(), eventId, name, phone: text(g.phone ?? "", 40), paxLimit, paxConfirmed,
        rsvpStatus: ["attending", "declined"].includes(String(g.rsvpStatus)) ? g.rsvpStatus : "pending",
        qrCode: randomUUID(), checkedInAt: null, createdAt: now,
    };
}

/** Ucapan publik: batasi jumlah per event dan tolak pengiriman ganda yang identik. */
export function assertWishAllowed(db, eventId, name, message) {
    const wishes = rows(db, "wishes").filter((w) => w.eventId === eventId);
    if (wishes.length >= MAX_WISHES)
        throw new ApiError("Kolom ucapan penuh.", 429);
    if (wishes.some((w) => w.guestName === name && w.message === message))
        throw new ApiError("Ucapan ini sudah terkirim.", 409);
}

export function guestsCsv(guests, event, origin = "") {
    const esc = (v) => {
        let s = String(v ?? "");
        if (/^[=+\-@]/.test(s))
            s = "'" + s; // cegah formula injection di Excel
        return `"${s.replace(/"/g, '""')}"`;
    };
    const head = ["Nama", "Telepon", "Maks tamu", "RSVP", "Hadir (konfirmasi)", "Check-in", "Link undangan"];
    const status = { pending: "Belum", attending: "Hadir", declined: "Tidak hadir" };
    const lines = guests.map((g) => [g.name, g.phone, g.paxLimit, status[g.rsvpStatus] ?? g.rsvpStatus, g.paxConfirmed, g.checkedInAt ?? "", `${origin}/wedding/${event.slug}?g=${g.qrCode}`].map(esc).join(","));
    return "﻿" + [head.map(esc).join(","), ...lines].join("\r\n") + "\r\n";
}
