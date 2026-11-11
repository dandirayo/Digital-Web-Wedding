import test from "node:test";
import { audit as _audit, ensureOrder, billing, addInvoice, updateInvoice, submitVersion, decideVersion, publishEvent, unpublishEvent, listAudit, sendMessage, listMessages, markRead, chatThreads, overview, removeEventBusinessData } from "../src/lib/backend/business.mjs";
import { mkdtempSync, rmSync as rmDir, existsSync as fileExists, readFileSync as readBytes } from "node:fs";
import { tmpdir } from "node:os";
import { sniff, saveUpload, resolveUploadPath, removeUpload, removeEventUploads, UPLOAD_LIMITS } from "../src/lib/backend/uploads.mjs";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { openDatabase, createUser, authenticate, sessionUser, logout, put, rows, eventAccess, listEvents, mutate, createLead, updateLead, convertLead, getSiteSettings, updateSiteSettings, publicSite, updateCatalog, updateProfile, resetPassword, changeOwnPassword, deleteWish } from "../src/lib/backend/database.mjs";
function fixture() {
    const db = openDatabase(":memory:");
    const owner = createUser(db, { email: "owner@test.local", fullName: "Owner", role: "owner", password: "OwnerPassword123!" });
    const a = createUser(db, { email: "a@test.local", fullName: "A", password: "ClientPassword123!" });
    const b = createUser(db, { email: "b@test.local", fullName: "B", password: "ClientPassword123!" });
    put(db, "events", { id: "event-a", clientId: a.id, ownerId: owner.id, status: "draft", isPublished: false, slug: "a" });
    put(db, "events", { id: "event-b", clientId: b.id, ownerId: owner.id, status: "active", isPublished: true, slug: "b" });
    return { db, owner, a, b };
}
test("data survives closing and reopening the database file", () => {
    const path = resolve("data", `test-${randomUUID()}.sqlite`);
    let db = openDatabase(path);
    try {
        put(db, "content", { eventId: "persistence-test", greeting: "Saved on disk" });
        db.close();
        db = openDatabase(path);
        assert.equal(rows(db, "content")[0].greeting, "Saved on disk");
    }
    finally {
        db.close();
        unlinkSync(path);
    }
});
test("password verification, hashed credentials, revocable expiring sessions", () => {
    const { db } = fixture();
    try {
        assert.throws(() => authenticate(db, "owner@test.local", "WrongPassword123!"), /Email atau password salah/);
        const { token, user } = authenticate(db, "owner@test.local", "OwnerPassword123!");
        assert.equal(user.role, "owner");
        assert.equal("password" in user, false);
        assert.equal(sessionUser(db, token).id, user.id);
        assert.notEqual(db.prepare("SELECT password FROM users WHERE id=?").get(user.id).password, "OwnerPassword123!");
        assert.notEqual(db.prepare("SELECT token FROM sessions").get().token, token);
        logout(db, token);
        assert.equal(sessionUser(db, token), null);
        const second = authenticate(db, "owner@test.local", "OwnerPassword123!");
        db.exec("UPDATE sessions SET expires=0");
        assert.equal(sessionUser(db, second.token), null);
    }
    finally {
        db.close();
    }
});
test("failed logins are throttled", () => {
    const { db } = fixture();
    try {
        for (let n = 0; n < 5; n++)
            assert.throws(() => authenticate(db, "a@test.local", "wrong"), /Email atau password salah/);
        assert.throws(() => authenticate(db, "a@test.local", "ClientPassword123!"), e => e.status === 429);
    }
    finally {
        db.close();
    }
});
test("client isolation, private drafts, expired public events, owner-only event updates", () => {
    const { db, owner, a, b } = fixture();
    try {
        assert.deepEqual(listEvents(db, a).map(e => e.id), ["event-a"]);
        assert.throws(() => eventAccess(db, "event-a", b, true), /tidak dapat diakses/);
        assert.throws(() => eventAccess(db, "event-a", null), /tidak dapat diakses/);
        assert.equal(eventAccess(db, "event-b", null).id, "event-b");
        put(db, "events", { ...eventAccess(db, "event-b", owner), expiresAt: "2020-01-01" });
        assert.throws(() => eventAccess(db, "event-b", null), /tidak dapat diakses/);
        assert.throws(() => mutate(db, "events", "event-a", { isPublished: true }, a), /owner/);
        assert.equal(listEvents(db, owner).length, 2);
    }
    finally {
        db.close();
    }
});
test("content edits persist in SQLite; clients cannot reassign ownership or change other client content", () => {
    const { db, a, b } = fixture();
    try {
        put(db, "content", { eventId: "event-a", greeting: "Original" });
        mutate(db, "content", "event-a", { greeting: "Updated", eventId: "event-b" }, a);
        assert.equal(rows(db, "content")[0].greeting, "Updated");
        assert.equal(rows(db, "content")[0].eventId, "event-a");
        assert.throws(() => mutate(db, "content", "event-a", { greeting: "Invalid" }, b), /tidak dapat diakses/);
        put(db, "guests", { id: "guest-a", eventId: "event-a", paxLimit: 2, paxConfirmed: 0 });
        assert.throws(() => mutate(db, "guests", "guest-a", { paxConfirmed: 3 }, a), /Pax melebihi/);
    }
    finally {
        db.close();
    }
});
test("leads: validated, deduplicated, owner-only management", () => {
    const { db, owner, a } = fixture();
    const input = { name: "Ayu", whatsapp: "0812-3456-7890", eventDate: "2027-02-14", eventType: "Pernikahan", template: "Rose Editorial", package: "Basic", budget: "Rp1 juta - Rp2 juta", notes: "<b>350 tamu</b>" };
    const lead = createLead(db, input);
    assert.equal(lead.whatsapp, "6281234567890");
    assert.equal(lead.notes, "b350 tamu/b");
    assert.equal(lead.status, "Baru");
    assert.equal(createLead(db, input).id, lead.id);
    assert.equal(rows(db, "leads").length, 1);
    for (const bad of [{ ...input, whatsapp: "123" }, { ...input, eventDate: "besok" }, { ...input, package: "Gold" }, { ...input, name: "" }, { ...input, notes: "x".repeat(2001) }])
        assert.throws(() => createLead(db, { ...bad, name: bad.name === "" ? "" : "Budi" }));
    assert.equal(updateLead(db, lead.id, { status: "Dihubungi", ownerNote: "Sudah ditelepon" }, owner).status, "Dihubungi");
    assert.throws(() => updateLead(db, lead.id, { status: "Dihubungi" }, a), /owner/i);
    assert.throws(() => updateLead(db, lead.id, { status: "Aneh" }, owner));
});
test("leads: convert creates client account and draft Basic event atomically", () => {
    const { db, owner, a } = fixture();
    put(db, "packages", { id: "pkg-silver", slug: "silver", isActive: true });
    put(db, "templates", { id: "tpl-1", name: "Classic Elegant", isActive: true });
    const lead = createLead(db, { name: "Ayu & Budi", whatsapp: "081234567890", eventDate: "2027-02-14", eventType: "Pernikahan", template: "Tidak Ada", package: "Basic", budget: "Rp1 juta - Rp2 juta" });
    assert.throws(() => convertLead(db, lead.id, { email: "salah" }, owner));
    assert.throws(() => convertLead(db, lead.id, { email: "a@test.local" }, owner), /dipakai/);
    assert.throws(() => convertLead(db, lead.id, { email: "ayu@test.local" }, a), /owner/i);
    const result = convertLead(db, lead.id, { email: "Ayu@Test.local" }, owner);
    assert.equal(result.client.email, "ayu@test.local");
    assert.equal(result.event.status, "draft");
    assert.equal(result.event.isPublished, false);
    assert.equal(result.event.clientId, result.client.id);
    assert.equal(result.event.templateId, "tpl-1");
    assert.equal(result.lead.status, "Menjadi Klien");
    assert.equal(authenticate(db, "ayu@test.local", result.temporaryPassword).user.role, "client");
    assert.equal(JSON.stringify(rows(db, "leads")).includes(result.temporaryPassword), false);
    assert.throws(() => convertLead(db, lead.id, { email: "lain@test.local" }, owner), /sudah/);
});
test("owner can manage catalog, accounts, event fields and wishes; clients cannot", () => {
    const { db, owner, a } = fixture();
    put(db, "packages", { id: "pkg-silver", slug: "silver", name: "Basic", isActive: true, maxGuests: 150, features: [] });
    put(db, "packages", { id: "pkg-gold", slug: "gold", name: "Premium", isActive: false, maxGuests: 500, features: [] });
    put(db, "templates", { id: "tpl-1", name: "Classic", isActive: true, minPackage: "silver", thumbnailUrl: "" });
    const pkg = updateCatalog(db, "packages", "pkg-silver", { price: "Rp 899.000", priceNumeric: 899000, maxGuests: 200, features: [" A ", "", "B"], isActive: true }, owner);
    assert.deepEqual([pkg.maxGuests, pkg.features, pkg.priceNumeric], [200, ["A", "B"], 899000]);
    assert.throws(() => updateCatalog(db, "packages", "pkg-silver", { maxGuests: -1 }, owner));
    assert.throws(() => updateCatalog(db, "packages", "pkg-silver", { maxGuests: 10 }, a), /owner/i);
    assert.throws(() => updateCatalog(db, "templates", "tpl-1", { thumbnailUrl: "javascript:alert(1)" }, owner));
    assert.equal(updateCatalog(db, "templates", "tpl-1", { name: "Classic 2", thumbnailUrl: "/x.jpg" }, owner).name, "Classic 2");
    assert.equal(mutate(db, "events", "event-a", { packageId: "pkg-silver", venue: "Gedung A", coupleName: "Ani & Budi" }, owner).packageTier, "silver");
    assert.throws(() => mutate(db, "events", "event-a", { packageId: "pkg-gold" }, owner), /Paket/);
    assert.throws(() => mutate(db, "events", "event-a", { eventDate: "bukan tanggal" }, owner));
    assert.throws(() => mutate(db, "events", "event-a", { clientId: owner.id }, owner), /Klien/);
    put(db, "content", { eventId: "event-a", loveStory: [], bankAccounts: [] });
    const content = mutate(db, "content", "event-a", { loveStory: [{ title: " T ", description: "D" }], bankAccounts: [{ bank: "BCA", accountNumber: "123", accountName: "Ani" }], musicUrl: "/m.mp3" }, owner);
    assert.equal(content.loveStory[0].title, "T");
    assert.throws(() => mutate(db, "content", "event-a", { musicUrl: "javascript:alert(1)" }, owner));
    assert.throws(() => mutate(db, "content", "event-a", { bankAccounts: [{ bank: 1 }] }, owner));
    assert.equal(updateProfile(db, a.id, { fullName: "Ani Baru", email: "ANI@test.local" }, owner).email, "ani@test.local");
    assert.throws(() => updateProfile(db, a.id, { email: "owner@test.local" }, owner), /dipakai/);
    authenticate(db, "ani@test.local", "ClientPassword123!");
    const { temporaryPassword } = resetPassword(db, a.id, owner);
    assert.throws(() => authenticate(db, "ani@test.local", "ClientPassword123!"));
    const login = authenticate(db, "ani@test.local", temporaryPassword);
    assert.throws(() => resetPassword(db, a.id, a), /owner/i);
    assert.throws(() => changeOwnPassword(db, login.user, "salah-salah-1", "PasswordBaru12345!"), /salah/);
    changeOwnPassword(db, login.user, temporaryPassword, "PasswordBaru12345!");
    assert.equal(sessionUser(db, login.token), null);
    authenticate(db, "ani@test.local", "PasswordBaru12345!");
    put(db, "wishes", { id: "w1", eventId: "event-a", message: "hi" });
    assert.throws(() => deleteWish(db, "w1", { id: "x", role: "client" }));
    deleteWish(db, "w1", owner);
    assert.equal(rows(db, "wishes").length, 0);
});
test("site settings: owner-managed, validated, and exposed publicly without internal fields", () => {
    const { db, owner, a } = fixture();
    put(db, "packages", { id: "pkg-silver", slug: "silver", name: "Basic", isActive: true, sortOrder: 1, price: "Rp 799.000", features: ["A"], maxGuests: 150, priceNumeric: 799000 });
    put(db, "packages", { id: "pkg-gold", slug: "gold", name: "Premium", isActive: false, sortOrder: 2, price: "Rp 1.490.000", features: [] });
    put(db, "templates", { id: "tpl-1", slug: "classic-elegant", name: "Classic", isActive: true, minPackage: "silver", thumbnailUrl: "/t.jpg", description: "d", configJson: { primaryColor: "#111", secondaryColor: "#eee" } });
    put(db, "templates", { id: "tpl-2", slug: "hidden", name: "Hidden", isActive: false, minPackage: "silver" });
    assert.equal(getSiteSettings(db).faqs.length, 3);
    const saved = updateSiteSettings(db, { whatsappNumber: "0812-3456-7890", showPublicPrices: true, faqs: [{ question: "Q?", answer: "A." }, { question: "", answer: "" }], testimonials: [{ name: "Ani", quote: "<b>Bagus</b>", status: "Klien" }] }, owner);
    assert.equal(saved.whatsappNumber, "6281234567890");
    assert.equal(saved.faqs.length, 1);
    assert.equal(saved.testimonials[0].quote, "bBagus/b");
    assert.throws(() => updateSiteSettings(db, { whatsappNumber: "123" }, owner), /WhatsApp/);
    assert.throws(() => updateSiteSettings(db, { showPublicPrices: "ya" }, owner));
    assert.throws(() => updateSiteSettings(db, { faqs: [{ question: 1, answer: "x" }] }, owner));
    assert.throws(() => updateSiteSettings(db, { contactLabel: "x" }, a), /owner/i);
    assert.equal(getSiteSettings(db).whatsappNumber, "6281234567890");
    updateCatalog(db, "packages", "pkg-gold", { availability: "Segera", featured: true }, owner);
    updateCatalog(db, "templates", "tpl-1", { galleryCategory: "classic", badge: "Terlaris" }, owner);
    assert.throws(() => updateCatalog(db, "templates", "tpl-1", { galleryCategory: "aneh" }, owner));
    const site = publicSite(db);
    assert.deepEqual(site.packages.map((p) => [p.name, p.orderable]), [["Basic", true], ["Premium", false]]);
    assert.equal(site.packages[1].availability, "Segera");
    assert.equal(site.packages[1].featured, true);
    assert.deepEqual(site.templates.map((t) => [t.slug, t.galleryCategory, t.badge, t.packageLevel]), [["classic-elegant", "classic", "Terlaris", "Basic"]]);
    assert.equal(JSON.stringify(site).includes("priceNumeric"), false);
    assert.equal(createLead(db, { name: "Ayu", whatsapp: "081234567890", eventDate: "2027-02-14", package: "Basic", budget: "x" }).package, "Basic");
    assert.throws(() => createLead(db, { name: "Ayu", whatsapp: "081234567890", eventDate: "2027-02-14", package: "Premium", budget: "x" }), /Paket/);
});
test("uploads: type from content, size limits, safe paths, removal", () => {
    const dir = mkdtempSync(resolve(tmpdir(), "occasio-up-"));
    try {
        const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)]);
        const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64)]);
        const mp4 = Buffer.concat([Buffer.alloc(4), Buffer.from("ftypisom"), Buffer.alloc(64)]);
        const m4a = Buffer.concat([Buffer.alloc(4), Buffer.from("ftypM4A "), Buffer.alloc(64)]);
        const mp3 = Buffer.concat([Buffer.from("ID3"), Buffer.alloc(64)]);
        assert.deepEqual([sniff(jpeg), sniff(png), sniff(mp4), sniff(m4a), sniff(mp3)].map((k) => k?.ext), ["jpg", "png", "mp4", "m4a", "mp3"]);
        assert.equal(sniff(Buffer.from("<html><script>alert(1)</script></html>")), null);
        assert.equal(sniff(Buffer.from("MZ" + "x".repeat(64))), null);
        const saved = saveUpload("evt-1", jpeg, dir);
        assert.match(saved.url, /^\/api\/media\/evt-1\/[0-9a-f-]{36}\.jpg$/);
        assert.equal(saved.type, "photo");
        const file = saved.url.split("/").pop();
        const path = resolveUploadPath("evt-1", file, dir);
        assert.ok(path);
        assert.deepEqual(readBytes(path), jpeg);
        assert.throws(() => saveUpload("evt-1", Buffer.from("<script>alert(1)</script>"), dir), /tidak didukung/);
        assert.throws(() => saveUpload("../evil", jpeg, dir), /Event/);
        assert.throws(() => saveUpload("evt-1", mp3, dir, "photo"), /bukan foto/);
        assert.throws(() => saveUpload("evt-1", jpeg, dir, "audio"), /bukan audio/);
        assert.equal(saveUpload("evt-1", mp3, dir, "audio").type, "audio");
        assert.throws(() => saveUpload("evt-1", Buffer.concat([jpeg, Buffer.alloc(UPLOAD_LIMITS.photo)]), dir), /terlalu besar/);
        for (const [e, f] of [["..", file], ["evt-1", "../x.jpg"], ["evt-1", "x.jpg"], ["evt-1", "a/../x.jpg"], ["evt/1", file]])
            assert.equal(resolveUploadPath(e, f, dir), null);
        assert.equal(removeUpload("/etc/passwd", dir), false);
        assert.equal(removeUpload(saved.url, dir), true);
        assert.equal(fileExists(path), false);
        const again = saveUpload("evt-2", png, dir);
        removeEventUploads("evt-2", dir);
        assert.equal(resolveUploadPath("evt-2", again.url.split("/").pop(), dir), null);
    }
    finally {
        rmDir(dir, { recursive: true, force: true });
    }
});
test("business flow: invoices, versions, approval, publish gate, chat, audit", () => {
    const { db, owner, a, b } = fixture();
    put(db, "packages", { id: "pkg-silver", slug: "silver", name: "Basic", isActive: true, priceNumeric: 800000, durationMonths: 3 });
    const event = { ...rows(db, "events").find((e) => e.id === "event-a"), packageId: "pkg-silver", coupleName: "Ani & Budi", eventDate: "2027-02-01T10:00:00+07:00", templateId: "tpl-1" };
    put(db, "events", event);
    put(db, "content", { eventId: "event-a", greeting: "Halo", brideName: "Ani", groomName: "Budi" });
    // order + invoices
    ensureOrder(db, event, owner);
    ensureOrder(db, event, owner);
    let bill = billing(db, "event-a", a);
    assert.deepEqual(bill.invoices.map((i) => [i.type, i.amount, i.status]), [["dp", 400000, "unpaid"], ["pelunasan", 400000, "unpaid"]]);
    assert.equal(bill.summary.outstanding, 800000);
    assert.throws(() => billing(db, "event-a", b), /tidak dapat diakses/);
    assert.match(bill.invoices[0].number, /^INV-\d{4}-0001$/);
    // publish blocked, and cannot be bypassed through a plain update
    assert.throws(() => publishEvent(db, "event-a", {}, owner), /Belum bisa dipublikasikan.*disetujui klien.*lunas/);
    assert.throws(() => publishEvent(db, "event-a", { overrideReason: "singkat" }, owner), /Belum bisa/);
    assert.throws(() => publishEvent(db, "event-a", {}, a), /owner/i);
    assert.throws(() => mutate(db, "events", "event-a", { isPublished: true }, owner), /Publikasikan/);
    // client reports payment, owner verifies
    const [dp, final] = bill.invoices;
    assert.throws(() => updateInvoice(db, dp.id, { op: "report", note: "x" }, b));
    assert.throws(() => updateInvoice(db, dp.id, { op: "report", note: "" }, a), /wajib/);
    assert.equal(updateInvoice(db, dp.id, { op: "report", note: "Transfer BCA 10 Nov" }, a).status, "proof_submitted");
    assert.throws(() => updateInvoice(db, dp.id, { op: "pay", method: "transfer", paidAt: "2026-11-10" }, a), /owner/i);
    assert.throws(() => updateInvoice(db, dp.id, { op: "pay", method: "bitcoin", paidAt: "2026-11-10" }, owner), /Metode/);
    assert.throws(() => updateInvoice(db, dp.id, { op: "pay", method: "transfer", paidAt: "besok" }, owner), /Tanggal/);
    const paid = updateInvoice(db, dp.id, { op: "pay", method: "transfer", reference: "BCA-123", paidAt: "2026-11-10" }, owner);
    assert.deepEqual([paid.status, paid.verifiedBy], ["paid", "Owner"]);
    assert.throws(() => updateInvoice(db, dp.id, { op: "edit", amount: 1 }, owner), /lunas/);
    assert.throws(() => updateInvoice(db, dp.id, { op: "void" }, owner), /Buka kembali/);
    updateInvoice(db, final.id, { op: "edit", amount: 350000, note: "Diskon" }, owner);
    assert.equal(billing(db, "event-a", owner).summary.total, 750000);
    // versions
    assert.equal(overview(db, owner).events.find((e) => e.id === "event-a").stage, "Produksi konten");
    const v1 = submitVersion(db, "event-a", a);
    assert.equal(v1.number, 1);
    assert.throws(() => submitVersion(db, "event-a", a), /masih menunggu/);
    assert.equal(overview(db, owner).events.find((e) => e.id === "event-a").stage, "Menunggu persetujuan klien");
    assert.throws(() => decideVersion(db, v1.id, { decision: "approved" }, b), /tidak dapat diakses/);
    assert.throws(() => decideVersion(db, v1.id, { decision: "changes_requested", note: "" }, a), /wajib/);
    assert.throws(() => decideVersion(db, v1.id, { decision: "approved" }, owner), /Catatan wajib/);
    assert.throws(() => decideVersion(db, v1.id, { decision: "approved", note: "ok" }, owner), /catatan bukti/);
    mutate(db, "content", "event-a", { greeting: "Halo semua" }, a);
    assert.throws(() => decideVersion(db, v1.id, { decision: "approved" }, a), /berubah sejak versi ini diajukan/);
    const v2 = submitVersion(db, "event-a", owner);
    assert.equal(v2.number, 2);
    assert.equal(rows(db, "versions").find((v) => v.id === v1.id).decision, "superseded");
    const changes = decideVersion(db, v2.id, { decision: "changes_requested", note: "Ganti foto" }, a);
    assert.equal(changes.decision, "changes_requested");
    assert.equal(overview(db, owner).events.find((e) => e.id === "event-a").stage, "Perlu revisi");
    assert.throws(() => decideVersion(db, v2.id, { decision: "approved" }, a), /tidak menunggu/);
    mutate(db, "content", "event-a", { greeting: "Salam" }, owner);
    const v3 = submitVersion(db, "event-a", owner);
    // payment still outstanding -> gate lists only payment, approval works
    assert.equal(decideVersion(db, v3.id, { decision: "approved", note: "OK" }, a).decision, "approved");
    assert.equal(overview(db, owner).events.find((e) => e.id === "event-a").stage, "Menunggu pelunasan");
    assert.throws(() => publishEvent(db, "event-a", {}, owner), /Pembayaran belum lunas \(sisa Rp 350\.000\)/);
    assert.throws(() => submitVersion(db, "event-a", a), /Tidak ada perubahan/);
    updateInvoice(db, final.id, { op: "pay", method: "tunai", paidAt: "2026-11-11" }, owner);
    assert.equal(overview(db, owner).events.find((e) => e.id === "event-a").stage, "Siap publish");
    assert.ok(overview(db, owner).tasks.some((t) => t.title.startsWith("Publikasikan")));
    // content edit after approval invalidates it
    mutate(db, "content", "event-a", { greeting: "Diubah lagi" }, a);
    assert.throws(() => publishEvent(db, "event-a", {}, owner), /berubah sejak versi 3/);
    // owner may override with a recorded reason
    const published = publishEvent(db, "event-a", { overrideReason: "Klien setuju via telepon" }, owner);
    assert.equal(published.isPublished, true);
    assert.ok(published.expiresAt > new Date().toISOString());
    assert.throws(() => publishEvent(db, "event-a", {}, owner), /sudah dipublikasikan/);
    assert.equal(unpublishEvent(db, "event-a", owner).isPublished, false);
    const log = listAudit(db, "event-a", owner).map((x) => x.action);
    for (const action of ["order_created", "invoice_pay", "version_submitted", "version_changes_requested", "version_approved", "publish_override", "published", "unpublished"])
        assert.ok(log.includes(action), action);
    assert.throws(() => listAudit(db, "event-a", a), /owner/i);
    // approval on behalf needs evidence
    const v4 = submitVersion(db, "event-a", owner);
    assert.equal(decideVersion(db, v4.id, { decision: "approved", note: "Setuju via WhatsApp 11 Nov" }, owner).decidedByRole, "owner_on_behalf");
    // chat
    sendMessage(db, "event-a", { text: "Halo, foto menyusul ya" }, a);
    assert.throws(() => sendMessage(db, "event-a", { text: "intip" }, b));
    assert.throws(() => listMessages(db, "event-a", b));
    assert.throws(() => sendMessage(db, "event-a", { text: "   " }, a), /wajib/);
    assert.equal(chatThreads(db, owner).find((t) => t.eventId === "event-a").unread, 1);
    assert.equal(chatThreads(db, a).find((t) => t.eventId === "event-a").unread, 0);
    assert.ok(overview(db, owner).tasks.some((t) => t.title.startsWith("Balas pesan")));
    markRead(db, "event-a", owner);
    assert.equal(chatThreads(db, owner).find((t) => t.eventId === "event-a").unread, 0);
    sendMessage(db, "event-a", { text: "Siap" }, owner);
    assert.equal(chatThreads(db, a).find((t) => t.eventId === "event-a").unread, 1);
    assert.equal(listMessages(db, "event-a", a).length, 2);
    // totals
    const totals = overview(db, owner).totals;
    assert.deepEqual([totals.revenuePaid, totals.outstanding, totals.invoicesPaid], [750000, 0, 2]);
    removeEventBusinessData(db, "event-a");
    assert.equal(rows(db, "invoices").length + rows(db, "messages").length + rows(db, "versions").length, 0);
});

test("guest links use tokens; RSVP is idempotent, capped by pax, and quota follows the package", async () => {
    const g = await import("../src/lib/backend/guests.mjs");
    const { db, a } = fixture();
    put(db, "packages", { id: "pkg-basic", name: "Basic", slug: "basic", maxGuests: 2, isActive: true });
    put(db, "events", { id: "event-p", clientId: a.id, packageId: "pkg-basic", status: "active", isPublished: true, slug: "p", expiresAt: null });
    const text = (v) => String(v).trim();
    const guest = g.newGuest("event-p", { name: "Budi", paxLimit: 3 }, text, new Date().toISOString());
    put(db, "guests", guest);
    // public sees only safe fields, via token
    const view = g.guestByToken(db, "event-p", guest.qrCode, null);
    assert.equal(view.name, "Budi");
    assert.equal("phone" in view || "qrCode" in view, false);
    assert.throws(() => g.guestByToken(db, "event-p", randomUUID(), null), /tidak valid/);
    assert.throws(() => g.guestByToken(db, "event-p", "Budi", null), /tidak valid/);
    // RSVP rules
    assert.throws(() => g.submitRsvp(db, "event-p", guest.qrCode, { rsvpStatus: "attending", paxConfirmed: 4 }, null), /maksimal 3/);
    assert.throws(() => g.submitRsvp(db, "event-p", guest.qrCode, { rsvpStatus: "attending", paxConfirmed: 0 }, null), /tidak valid/);
    const first = g.submitRsvp(db, "event-p", guest.qrCode, { rsvpStatus: "attending", paxConfirmed: 2 }, null);
    const again = g.submitRsvp(db, "event-p", guest.qrCode, { rsvpStatus: "attending", paxConfirmed: 2 }, null);
    assert.equal(first.rsvpAt, again.rsvpAt);
    assert.equal(rows(db, "guests").filter((x) => x.eventId === "event-p").length, 1);
    assert.equal(g.submitRsvp(db, "event-p", guest.qrCode, { rsvpStatus: "declined" }, null).paxConfirmed, 0);
    // draft events are not reachable by guests
    const draft = g.newGuest("event-a", { name: "Dina" }, text, "now");
    put(db, "guests", draft);
    assert.throws(() => g.guestByToken(db, "event-a", draft.qrCode, null), /tidak dapat diakses/);
    // quota
    g.assertGuestQuota(db, "event-p", 1);
    assert.throws(() => g.assertGuestQuota(db, "event-p", 2), /Kuota tamu paket Basic/);
    // wishes
    g.assertWishAllowed(db, "event-p", "A", "Selamat");
    put(db, "wishes", { id: "w-1", eventId: "event-p", guestName: "A", message: "Selamat" });
    assert.throws(() => g.assertWishAllowed(db, "event-p", "A", "Selamat"), /sudah terkirim/);
    // csv escapes formulas and quotes
    const csv = g.guestsCsv([{ ...guest, name: '=HYPERLINK("x")', phone: "62812" }], { slug: "p" }, "http://x");
    assert.match(csv, /"'=HYPERLINK/);
    assert.match(csv, /\?g=/);
    // customCss restrictions
    const owner2 = rows(db, "events").length && { id: "o", role: "owner" };
    put(db, "content", { eventId: "event-p", customCss: "" });
    assert.throws(() => mutate(db, "content", "event-p", { customCss: "@import url(http://evil)" }, owner2), /CSS kustom/);
    assert.throws(() => mutate(db, "content", "event-p", { customCss: "</style><script>" }, owner2), /CSS kustom/);
    assert.equal(mutate(db, "content", "event-p", { customCss: ".a{color:red}" }, owner2).customCss, ".a{color:red}");
});

test("repeated bad guest tokens are rate limited per event", async () => {
    const g = await import("../src/lib/backend/guests.mjs");
    const { db, b } = fixture();
    for (let i = 0; i < 30; i++)
        assert.throws(() => g.guestByToken(db, "event-b", randomUUID(), null), /tidak valid/);
    assert.throws(() => g.guestByToken(db, "event-b", randomUUID(), null), /Terlalu banyak/);
    void b;
});
