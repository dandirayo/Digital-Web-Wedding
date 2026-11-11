import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { database } from "@/lib/backend/server";
import { isSameOrigin } from "@/lib/backend/origin";
import { resolveDemoAssetUrl } from "@/lib/demo-assets.mjs";
import { assertGuestQuota, assertWishAllowed, guestByToken, guestsCsv, newGuest, submitRsvp } from "@/lib/backend/guests.mjs";
import { removeEventUploads, removeUpload } from "@/lib/backend/uploads.mjs";
import { addInvoice, approvalState, audit, billing, chatThreads, decideVersion, ensureOrder, listAudit, listMessages, markRead, overview, publishEvent, removeEventBusinessData, sendMessage, submitVersion, unpublishEvent, updateInvoice } from "@/lib/backend/business.mjs";
import { ApiError, COOKIE, sessionUser, rows, put, remove, owner, requireUser, eventAccess, listEvents, summarize, mutate, createUser, text, updateLead, convertLead, updateCatalog, updateProfile, resetPassword, changeOwnPassword, deleteWish, getSiteSettings, updateSiteSettings } from "@/lib/backend/database.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
    if (!isSameOrigin(request))
        return NextResponse.json({ error: "Origin tidak diizinkan." }, { status: 403 });
    try {
        const raw = await request.text();
        if (Buffer.byteLength(raw) > 512000)
            throw new ApiError("Data terlalu besar.", 413);
        const { action, args = [] } = JSON.parse(raw);
        if (typeof action !== "string" || !Array.isArray(args))
            throw new ApiError("Permintaan tidak valid.");
        const db = database(), user = sessionUser(db, request.cookies.get(COOKIE)?.value);
        const [id, input] = args;
        const now = new Date().toISOString();
        let data: unknown = null;
        switch (action) {
            case "init": break;
            case "profiles":
                owner(user);
                data = db.prepare("SELECT id,email,fullName,role,createdAt FROM users").all();
                break;
            case "createClient":
                owner(user);
                data = createUser(db, { ...id, role: "client", id: randomUUID() });
                break;
            case "leads":
                owner(user);
                data = rows(db, "leads").sort((a: Record<string, string>, b: Record<string, string>) => b.createdAt.localeCompare(a.createdAt));
                break;
            case "updateLead":
                data = updateLead(db, id, input, user);
                break;
            case "updatePackage":
                data = updateCatalog(db, "packages", id, input, user);
                break;
            case "updateTemplate":
                data = updateCatalog(db, "templates", id, input, user);
                break;
            case "updateProfile":
                data = updateProfile(db, id, input, user);
                break;
            case "resetPassword":
                data = resetPassword(db, id, user);
                break;
            case "changePassword":
                changeOwnPassword(db, user, id, input);
                break;
            case "deleteWish":
                deleteWish(db, id, user);
                break;
            case "siteSettings":
                owner(user);
                data = getSiteSettings(db);
                break;
            case "updateSiteSettings":
                data = updateSiteSettings(db, id, user);
                break;
            case "billing":
                data = billing(db, id, user);
                break;
            case "addInvoice":
                data = addInvoice(db, id, input, user);
                break;
            case "updateInvoice":
                data = updateInvoice(db, id, input, user);
                break;
            case "approval":
                data = approvalState(db, id, user);
                break;
            case "submitVersion":
                data = submitVersion(db, id, user);
                break;
            case "decideVersion":
                data = decideVersion(db, id, input, user);
                break;
            case "publishEvent":
                data = publishEvent(db, id, input, user);
                break;
            case "unpublishEvent":
                data = unpublishEvent(db, id, user);
                break;
            case "messages":
                data = listMessages(db, id, user);
                break;
            case "sendMessage":
                data = sendMessage(db, id, input, user);
                break;
            case "markRead":
                markRead(db, id, user);
                break;
            case "threads":
                data = chatThreads(db, user);
                break;
            case "overview":
                data = overview(db, user);
                break;
            case "audit":
                data = listAudit(db, id || null, user);
                break;
            case "convertLead":
                data = convertLead(db, id, input, user);
                ensureOrder(db, (data as { event: Record<string, string> }).event, user);
                audit(db, user, "lead_converted", (data as { event: Record<string, string> }).event.id, (data as { lead: Record<string, string> }).lead.name);
                break;
            case "deleteLead":
                owner(user);
                if (!rows(db, "leads").some((l: Record<string, unknown>) => l.id === id))
                    throw new ApiError("Lead tidak ditemukan.", 404);
                remove(db, "leads", id);
                break;
            case "templates":
                data = rows(db, "templates").map((template: Record<string, string>) => ({ ...template, thumbnailUrl: resolveDemoAssetUrl(template.thumbnailUrl) }));
                break;
            case "packages":
                data = rows(db, "packages");
                break;
            case "events":
                data = listEvents(db, user).filter((e: Record<string, unknown>) => !id || Object.entries(id).every(([k, v]) => !v || e[k] === v));
                break;
            case "event": {
                const found = rows(db, "events").find((e: Record<string, unknown>) => e.id === id || e.slug === id);
                if (found) {
                    eventAccess(db, found.id, user);
                    data = summarize(db, found);
                }
                break;
            }
            case "content":
            case "wishes":
            case "media":
            case "gallery":
            case "guests": {
                const event = eventAccess(db, id, user);
                const member = user?.role === "owner" || user?.id === event.clientId;
                if (action === "guests" && !member) {
                    data = [];
                    break;
                }
                const found = rows(db, action).filter((r: Record<string, unknown>) => r.eventId === id && (action !== "wishes" || member || r.isVisible));
                data = action === "content" ? (found[0] ? {
                    ...found[0],
                    bridePhotoUrl: resolveDemoAssetUrl(found[0].bridePhotoUrl),
                    groomPhotoUrl: resolveDemoAssetUrl(found[0].groomPhotoUrl),
                } : null) : found;
                break;
            }
            case "createEvent": {
                owner(user);
                if (!id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id.slug) || rows(db, "events").some((e: Record<string, unknown>) => e.slug === id.slug))
                    throw new ApiError("Slug tidak valid atau sudah dipakai.");
                const pkg = rows(db, "packages").find((p: Record<string, unknown>) => p.id === id.packageId && p.isActive);
                if (!pkg || !rows(db, "templates").some((t: Record<string, unknown>) => t.id === id.templateId && t.isActive))
                    throw new ApiError("Paket/template tidak tersedia.");
                if (!db.prepare("SELECT id FROM users WHERE id=? AND role='client'").get(id.clientId))
                    throw new ApiError("Klien tidak ditemukan.");
                data = put(db, "events", { ...id, id: randomUUID(), ownerId: user!.id, packageTier: pkg.slug, status: "draft", isPublished: false, publishedAt: null, createdAt: now, lastActivity: now });
                ensureOrder(db, data as Record<string, string>, user);
                audit(db, user, "event_created", (data as Record<string, string>).id, (data as Record<string, string>).coupleName);
                break;
            }
            case "updateEvent": {
                const before = rows(db, "events").find((e: Record<string, unknown>) => e.id === id) as Record<string, unknown> | undefined;
                data = mutate(db, "events", id, input, user);
                for (const field of ["status", "packageId", "templateId", "clientId", "slug", "eventDate", "isPublished"])
                    if (before && before[field] !== (data as Record<string, unknown>)[field])
                        audit(db, user, "event_updated", id, `${field}: ${String(before[field] ?? "-")} → ${String((data as Record<string, unknown>)[field] ?? "-")}`);
                break;
            }
            case "updateContent": {
                if (!rows(db, "content").some((c: Record<string, unknown>) => c.eventId === id)) {
                    eventAccess(db, id, user, true);
                    put(db, "content", { eventId: id, greeting: "", brideName: "", bridePhotoUrl: "", brideParent: "", groomName: "", groomPhotoUrl: "", groomParent: "", akadTime: "", akadVenue: "", resepsiTime: "", resepsiVenue: "", loveStory: [], bankAccounts: [], musicUrl: "", customCss: "", updatedAt: now });
                }
                const before = rows(db, "content").find((c: Record<string, unknown>) => c.eventId === id) as Record<string, string> | undefined;
                data = mutate(db, "content", id, input, user);
                for (const field of ["bridePhotoUrl", "groomPhotoUrl", "musicUrl"])
                    if (before?.[field] && before[field] !== (data as Record<string, string>)[field] && !rows(db, "media").some((m: Record<string, unknown>) => m.url === before[field]))
                        removeUpload(before[field]);
                break;
            }
            case "deleteEvent": {
                owner(user);
                eventAccess(db, id, user, true);
                db.exec("BEGIN IMMEDIATE");
                try {
                    for (const kind of ["content", "guests", "wishes", "media", "gallery"])
                        for (const r of rows(db, kind))
                            if (r.eventId === id)
                                remove(db, kind, r.id || r.eventId);
                    removeEventBusinessData(db, id);
                    audit(db, user, "event_deleted", "", id);
                    remove(db, "events", id);
                    db.exec("COMMIT");
                    removeEventUploads(id);
                }
                catch (e) {
                    db.exec("ROLLBACK");
                    throw e;
                }
                break;
            }
            case "addGuest":
            case "importGuests": {
                const event = eventAccess(db, id, user, true);
                const inputs = action === "addGuest" ? [input] : input;
                if (!Array.isArray(inputs) || inputs.length > 1000)
                    throw new ApiError("Daftar tamu tidak valid.");
                const created = inputs.map((g: Record<string, unknown>) => newGuest(id, g, text, now));
                db.exec("BEGIN IMMEDIATE");
                try {
                    assertGuestQuota(db, event.id, created.length);
                    for (const g of created)
                        put(db, "guests", g);
                    db.exec("COMMIT");
                }
                catch (e) {
                    db.exec("ROLLBACK");
                    throw e;
                }
                data = action === "addGuest" ? created[0] : created;
                break;
            }
            case "updateGuest": {
                const guest = rows(db, "guests").find((g: Record<string, unknown>) => g.id === id);
                if (!guest)
                    throw new ApiError("Tamu tidak ditemukan.", 404);
                data = mutate(db, "guests", id, input, user);
                break;
            }
            case "guestByToken":
                data = guestByToken(db, id, args[1], user);
                break;
            case "rsvp":
                data = submitRsvp(db, id, args[1], args[2], user);
                break;
            case "exportGuests": {
                const event = eventAccess(db, id, user, true);
                data = guestsCsv(rows(db, "guests").filter((g: Record<string, unknown>) => g.eventId === id), event, typeof input === "string" ? input.slice(0, 200) : "");
                break;
            }
            case "deleteGuest":
            case "deleteMedia": {
                requireUser(user);
                const kind = action === "deleteGuest" ? "guests" : "media";
                const r = rows(db, kind).find((r: Record<string, unknown>) => r.id === id);
                if (!r)
                    throw new ApiError("Data tidak ditemukan.", 404);
                eventAccess(db, r.eventId, user, true);
                if (kind === "media")
                    owner(user);
                remove(db, kind, id);
                if (kind === "media")
                    removeUpload(r.url);
                break;
            }
            case "updateMedia":
                data = mutate(db, "media", id, input, user);
                break;
            case "addWish": {
                eventAccess(db, id, user);
                const name = text(input.guestName, 200), message = text(input.message, 2000);
                if (!name || !message)
                    throw new ApiError("Nama dan ucapan wajib diisi.");
                assertWishAllowed(db, id, name, message);
                data = put(db, "wishes", { id: randomUUID(), eventId: id, guestName: name, message, isVisible: true, createdAt: now });
                break;
            }
            case "updateWish":
                data = mutate(db, "wishes", id, input, user);
                break;
            case "addMedia":
            case "addGallery": {
                owner(user);
                eventAccess(db, id, user, true);
                if (!input || typeof input !== "object")
                    throw new ApiError("Data tidak valid.");
                const r = action === "addMedia"
                    ? { id: randomUUID(), eventId: id, url: input.url, type: input.type, category: input.category, altText: text(input.altText ?? "", 200),
                        sortOrder: Number.isInteger(input.sortOrder) ? input.sortOrder : rows(db, "media").filter((m: Record<string, unknown>) => m.eventId === id && m.category === input.category).length,
                        createdAt: now }
                    : { ...input, id: randomUUID(), eventId: id, createdAt: now };
                if (!(r.url || r.photoUrl || "").startsWith("/"))
                    throw new ApiError("File perlu diunggah ke server; URL browser tidak dapat disimpan.");
                if (action === "addMedia" && (!["photo", "video", "audio"].includes(r.type) || !["cover", "bride", "groom", "prewedding", "gallery", "map"].includes(r.category)))
                    throw new ApiError("Jenis atau kategori media tidak valid.");
                data = put(db, action === "addMedia" ? "media" : "gallery", r);
                break;
            }
            default: throw new ApiError("Operasi tidak dikenal.", 404);
        }
        return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
    }
    catch (e) {
        const known = e instanceof ApiError;
        if (!known)
            console.error("Workspace request failed", e instanceof Error ? e.message : "unknown");
        return NextResponse.json({ error: known ? e.message : "Permintaan gagal." }, { status: known ? e.status : 500 });
    }
}
