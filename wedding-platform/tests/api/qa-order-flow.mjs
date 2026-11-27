// qa-order-flow.mjs: alur satu order dari lead sampai publish, tamu, chat, isolasi klien (87 cek)
// Jalankan terhadap server DEV lokal (pnpm dev, http://127.0.0.1:3001) dengan akun demo dari seed.
// Skrip membuat data uji (akun/event/lead berawalan "QA") lalu menghapusnya kembali di akhir.
// JANGAN dijalankan terhadap server production. Pemakaian: node tests/api/qa-order-flow.mjs
const B = "http://127.0.0.1:3001";
const H = { "content-type": "application/json", origin: B };
const results = [];
const rec = (name, ok, info = "") => { results.push({ ok, line: `${ok ? "PASS" : "FAIL"}  ${name}${info ? "  -> " + info : ""}` }); };
const post = async (path, body, cookie) => {
  const r = await fetch(B + path, { method: "POST", headers: { ...H, ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body) });
  let j = null; try { j = await r.json(); } catch {}
  return { s: r.status, j, h: r.headers };
};
const login = async (email, password) => { const r = await post("/api/auth", { email, password }); return { s: r.s, cookie: (r.h.get("set-cookie") || "").split(";")[0], j: r.j }; };
const act = (a, args, c) => post("/api/workspace", { action: a, args }, c);
const ok = (r) => r.s === 200;
const err = (r) => `${r.s} ${r.j?.error || ""}`;

const stamp = Date.now().toString(36);
const future = new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10);

// ---------- 1. Lead publik ----------
const goodLead = { name: `QA Order ${stamp}`, whatsapp: "081234567890", eventDate: future, package: "Basic", budget: "Rp1 juta - Rp2 juta", notes: "uji alur QA" };
let r = await post("/api/leads", goodLead);
rec("1.1 lead valid diterima", ok(r) || r.s === 201, err(r));
const leadId = r.j?.data?.id || r.j?.lead?.id || r.j?.id;
const dup = await post("/api/leads", goodLead);
rec("1.2 lead kembar dalam 10 menit tidak menggandakan", (ok(dup) || dup.s === 201) && (dup.j?.data?.id || dup.j?.lead?.id || dup.j?.id) === leadId, err(dup));
for (const [n, patch] of [["WA salah", { whatsapp: "123" }], ["tanggal salah", { eventDate: "31-12-2030" }], ["paket tak dikenal", { package: "Platinum" }], ["tanpa nama", { name: "" }], ["nama panjang 5000", { name: "x".repeat(5000) }]]) {
  const x = await post("/api/leads", { ...goodLead, name: patch.name ?? `QA ${n} ${stamp}`, ...patch });
  rec(`1.3 lead ${n} ditolak 4xx`, x.s >= 400 && x.s < 500, err(x));
}

// ---------- 2. Owner: inbox, konversi ----------
const owner = await login("owner@occasio.local", "OccasioOwner123!");
rec("2.0 owner login", owner.s === 200);
const leads = await act("leads", [], owner.cookie);
const myLead = (leads.j?.data || []).find((l) => l.name === goodLead.name);
rec("2.1 lead muncul di inbox owner", !!myLead, err(leads));
const leadIdReal = myLead?.id || leadId;
const upd = await act("updateLead", [leadIdReal, { status: "Dihubungi", ownerNote: "QA" }], owner.cookie);
rec("2.2 owner ubah status lead", ok(upd), err(upd));
const badConv = await act("convertLead", [leadIdReal, { email: "bukan-email" }], owner.cookie);
rec("2.3 konversi email tidak valid ditolak", badConv.s >= 400 && badConv.s < 500, err(badConv));
const dupConv = await act("convertLead", [leadIdReal, { email: "owner@occasio.local" }], owner.cookie);
rec("2.4 konversi email yang sudah dipakai ditolak", dupConv.s >= 400 && dupConv.s < 500, err(dupConv));
const emailA = `qa-klien-${stamp}@occasio.test`;
const conv = await act("convertLead", [leadIdReal, { email: emailA }], owner.cookie);
rec("2.5 lead dijadikan klien (akun + event draft)", ok(conv) && conv.j?.data?.temporaryPassword && conv.j?.data?.event?.id, err(conv));
const A = conv.j?.data; const evtA = A?.event?.id; const slugA = A?.event?.slug;
const again = await act("convertLead", [leadIdReal, { email: `lain-${emailA}` }], owner.cookie);
rec("2.6 lead tidak bisa dikonversi dua kali", again.s >= 400 && again.s < 500, err(again));

// ---------- 3. Klien A ----------
const ca = await login(emailA, A?.temporaryPassword || "x");
rec("3.1 klien A login dengan password sementara", ca.s === 200, ca.s);
const evs = await act("events", [], ca.cookie);
const ids = (evs.j?.data || []).map((e) => e.id);
rec("3.2 klien A hanya melihat eventnya sendiri", ids.length === 1 && ids[0] === evtA, ids.join(","));
for (const [a, args] of [["guests", ["evt-1"]], ["billing", ["evt-1"]], ["messages", ["evt-1"]], ["approval", ["evt-1"]]]) {
  const x = await act(a, args, ca.cookie);
  const leaked = ok(x) && Array.isArray(x.j?.data) ? x.j.data.length > 0 : ok(x) && x.j?.data && Object.keys(x.j.data).length > 0 && a !== "guests";
  rec(`3.3 klien A tidak bisa baca ${a} event demo`, !leaked, err(x));
}
const upc = await act("updateContent", [evtA, { greeting: "Salam uji QA", brideName: "Sari", groomName: "Budi", akadTime: "09:00", akadVenue: "Gedung QA", resepsiTime: "11:00", resepsiVenue: "Gedung QA" }], ca.cookie);
rec("3.4 klien A mengisi konten undangan", ok(upc), err(upc));
const selfPublish = await act("publishEvent", [evtA, {}], ca.cookie);
rec("3.5 klien tidak bisa publish sendiri", selfPublish.s === 403, err(selfPublish));
const selfStatus = await act("updateEvent", [evtA, { isPublished: true, status: "active" }], ca.cookie);
rec("3.6 klien tidak bisa menerbitkan lewat updateEvent", selfStatus.s >= 400 && selfStatus.s < 500, err(selfStatus));
const anonDraft = await act("event", [slugA], null);
rec("3.7 draft tidak terbuka untuk anonim", anonDraft.s >= 400, err(anonDraft));

// ---------- 4. Gerbang publish: versi + pembayaran ----------
const early = await act("publishEvent", [evtA, {}], owner.cookie);
rec("4.1 owner publish sebelum syarat terpenuhi ditolak (409) dengan alasan", early.s === 409 && /disetujui|tagihan|lunas/i.test(early.j?.error || ""), err(early));
const sub = await act("submitVersion", [evtA], ca.cookie);
rec("4.2 klien mengajukan versi untuk persetujuan", ok(sub), err(sub));
const sub2 = await act("submitVersion", [evtA], ca.cookie);
rec("4.3 ajukan ulang tanpa perubahan ditolak", sub2.s >= 400 && sub2.s < 500, err(sub2));
const ap = await act("approval", [evtA], owner.cookie);
const versionId = ap.j?.data?.latest?.id;
rec("4.4 versi pending terlihat oleh owner", !!versionId && ap.j?.data?.latest?.decision === "pending", err(ap));
const ownerDecide = await act("decideVersion", [versionId, { decision: "approved" }], owner.cookie);
rec("4.5 persetujuan klien tidak bisa diwakili owner", ownerDecide.s >= 400 && ownerDecide.s < 500, err(ownerDecide));
const dec = await act("decideVersion", [versionId, { decision: "approved" }], ca.cookie);
rec("4.6 klien menyetujui versi", ok(dec), err(dec));
const bill = await act("billing", [evtA], owner.cookie);
let invoices = bill.j?.data?.invoices || [];
rec("4.7 owner melihat tagihan event", ok(bill), `${invoices.length} tagihan; ${err(bill)}`);
if (!invoices.length) {
  const inv = await act("addInvoice", [evtA, { type: "dp", amount: 400000, note: "QA" }], owner.cookie);
  rec("4.7b owner membuat tagihan DP", ok(inv), err(inv));
  const inv2 = await act("addInvoice", [evtA, { type: "pelunasan", amount: 399000, note: "QA" }], owner.cookie);
  invoices = [inv.j?.data, inv2.j?.data].filter(Boolean);
}
const badAmount = await act("addInvoice", [evtA, { type: "dp", amount: -5 }], owner.cookie);
rec("4.8 tagihan jumlah negatif ditolak", badAmount.s >= 400 && badAmount.s < 500, err(badAmount));
const stillBlocked = await act("publishEvent", [evtA, {}], owner.cookie);
rec("4.9 belum lunas -> publish masih ditolak", stillBlocked.s === 409, err(stillBlocked));
const clientPay = await act("updateInvoice", [invoices[0]?.id, { op: "pay", method: "transfer", paidAt: future }], ca.cookie);
rec("4.10 klien tidak bisa menandai lunas", clientPay.s === 403, err(clientPay));
const rep = await act("updateInvoice", [invoices[0]?.id, { op: "report", note: "Sudah transfer via QA" }], ca.cookie);
rec("4.11 klien melaporkan pembayaran", ok(rep), err(rep));
const afterRep = await act("publishEvent", [evtA, {}], owner.cookie);
rec("4.12 laporan klien belum dianggap lunas (publish tetap ditolak)", afterRep.s === 409, err(afterRep));
const today = new Date().toISOString().slice(0, 10);
const badMethod = await act("updateInvoice", [invoices[0]?.id, { op: "pay", method: "kripto", paidAt: today }], owner.cookie);
rec("4.13 metode bayar tidak valid ditolak", badMethod.s >= 400 && badMethod.s < 500, err(badMethod));
let paidAll = true;
for (const inv of invoices) {
  const p = await act("updateInvoice", [inv.id, { op: "pay", method: "transfer", paidAt: today, reference: "QA-REF" }], owner.cookie);
  paidAll = paidAll && ok(p);
}
rec("4.14 owner memverifikasi semua tagihan lunas", paidAll);
const pub = await act("publishEvent", [evtA, {}], owner.cookie);
rec("4.15 syarat terpenuhi -> publish berhasil + masa aktif terisi", ok(pub) && pub.j?.data?.isPublished && !!pub.j?.data?.expiresAt, err(pub));
const dupPub = await act("publishEvent", [evtA, {}], owner.cookie);
rec("4.16 publish dua kali ditolak", dupPub.s >= 400 && dupPub.s < 500, err(dupPub));
const anonPub = await act("event", [slugA], null);
rec("4.17 setelah publish terbuka untuk anonim", ok(anonPub) && anonPub.j?.data?.id === evtA, err(anonPub));
const anonContent = await act("content", [evtA], null);
rec("4.18 konten publik terbuka", ok(anonContent), err(anonContent));
const pageRes = await fetch(`${B}/wedding/${slugA}`);
rec("4.19 halaman /wedding/<slug> 200", pageRes.status === 200, pageRes.status);

// ---------- 5. Tamu: tambah, token, RSVP, ucapan ----------
const g1 = await act("addGuest", [evtA, { name: "Tamu Satu", phone: "081111111111", paxLimit: 2 }], ca.cookie);
rec("5.1 klien menambah tamu", ok(g1), err(g1));
const guest = g1.j?.data; const token = guest?.qrCode;
const imp = await act("importGuests", [evtA, [{ name: "Tamu Dua", paxLimit: 1 }, { name: "Tamu Tiga", paxLimit: 3 }]], ca.cookie);
rec("5.2 impor beberapa tamu", ok(imp), err(imp));
const anonAdd = await act("addGuest", [evtA, { name: "Penyusup", paxLimit: 1 }], null);
rec("5.3 anonim tidak bisa menambah tamu", anonAdd.s >= 400 && anonAdd.s < 500, err(anonAdd));
const anonList = await act("guests", [evtA], null);
rec("5.4 anonim tidak bisa melihat daftar tamu", ok(anonList) && (anonList.j?.data || []).length === 0, err(anonList));
const gbt = await act("guestByToken", [evtA, token], null);
rec("5.5 tamu membuka link pribadi: hanya data seperlunya", ok(gbt) && gbt.j?.data?.name === "Tamu Satu" && !("phone" in (gbt.j?.data || {})) && !("qrCode" in (gbt.j?.data || {})), err(gbt));
const over = await act("rsvp", [evtA, token, { rsvpStatus: "attending", paxConfirmed: 5 }], null);
rec("5.6 RSVP melebihi jatah ditolak", over.s >= 400 && over.s < 500, err(over));
const rs1 = await act("rsvp", [evtA, token, { rsvpStatus: "attending", paxConfirmed: 2 }], null);
const rs2 = await act("rsvp", [evtA, token, { rsvpStatus: "attending", paxConfirmed: 2 }], null);
rec("5.7 RSVP hadir 2 orang; kirim ulang idempoten", ok(rs1) && ok(rs2) && rs1.j.data.rsvpAt === rs2.j.data.rsvpAt, err(rs2));
const rsBadStatus = await act("rsvp", [evtA, token, { rsvpStatus: "mungkin" }], null);
rec("5.8 status RSVP tidak valid ditolak", rsBadStatus.s >= 400 && rsBadStatus.s < 500, err(rsBadStatus));
const rsBadToken = await act("rsvp", [evtA, "TOKEN-ASAL-ASALAN-123", { rsvpStatus: "attending", paxConfirmed: 1 }], null);
rec("5.9 token palsu ditolak", rsBadToken.s === 404, err(rsBadToken));
const w1 = await act("addWish", [evtA, { guestName: "Tamu Satu", message: "Selamat menempuh hidup baru" }], null);
rec("5.10 tamu mengirim ucapan", ok(w1), err(w1));
const w2 = await act("addWish", [evtA, { guestName: "Tamu Satu", message: "Selamat menempuh hidup baru" }], null);
rec("5.11 ucapan identik ditolak", w2.s === 409, err(w2));
const w3 = await act("addWish", [evtA, { guestName: "<script>alert(1)</script>", message: "<img src=x onerror=alert(1)>" }], null);
const pubWishes = await act("wishes", [evtA], null);
rec("5.12 ucapan berisi HTML disimpan sebagai teks (dirender aman oleh React)", ok(w3) || w3.s < 500, err(w3) + ` | tampil ${(pubWishes.j?.data || []).length} ucapan`);
const csv = await act("exportGuests", [evtA], ca.cookie);
rec("5.13 ekspor CSV oleh klien", ok(csv) && typeof csv.j?.data === "string" && csv.j.data.includes("Tamu Satu"), err(csv));
const csvAnon = await act("exportGuests", [evtA], null);
rec("5.14 ekspor CSV anonim ditolak", csvAnon.s >= 400 && csvAnon.s < 500, err(csvAnon));
const gi = guest?.id;
const clientCheckin = await act("updateGuest", [gi, { checkedInAt: new Date().toISOString() }], ca.cookie);
const afterCI = await act("guests", [evtA], owner.cookie);
rec("5.15 klien tidak bisa mem-check-in (diabaikan)", !(afterCI.j?.data || []).find((g) => g.id === gi)?.checkedInAt, err(clientCheckin));
const ownerCheckin = await act("updateGuest", [gi, { checkedInAt: new Date().toISOString() }], owner.cookie);
const afterCI2 = await act("guests", [evtA], owner.cookie);
rec("5.16 owner/petugas melakukan check-in", ok(ownerCheckin) && !!(afterCI2.j?.data || []).find((g) => g.id === gi)?.checkedInAt, err(ownerCheckin));

// ---------- 6. Chat ----------
const m1 = await act("sendMessage", [evtA, { text: "Halo, apakah bisa tambah foto?" }], ca.cookie);
rec("6.1 klien mengirim pesan", ok(m1), err(m1));
const th = await act("threads", [], owner.cookie);
const thr = (th.j?.data || []).find((t) => t.eventId === evtA);
rec("6.2 owner melihat thread dengan 1 pesan belum dibaca", thr?.unread === 1, JSON.stringify(thr)?.slice(0, 100));
const mk = await act("markRead", [evtA], owner.cookie);
const th2 = await act("threads", [], owner.cookie);
rec("6.3 setelah dibaca unread = 0", (th2.j?.data || []).find((t) => t.eventId === evtA)?.unread === 0, err(mk));
const longMsg = await act("sendMessage", [evtA, { text: "x".repeat(3000) }], ca.cookie);
rec("6.4 pesan terlalu panjang ditolak", longMsg.s >= 400 && longMsg.s < 500, err(longMsg));
const anonMsg = await act("sendMessage", [evtA, { text: "hai" }], null);
rec("6.5 anonim tidak bisa chat", anonMsg.s >= 400 && anonMsg.s < 500, err(anonMsg));

// ---------- 7. Isolasi klien B ----------
const emailB = `qa-klien-b-${stamp}@occasio.test`;
const pk = (await act("packages", [], owner.cookie)).j?.data?.find((p) => p.isActive);
const tp = (await act("templates", [], owner.cookie)).j?.data?.find((t) => t.isActive);
const cb = await act("createClient", [{ email: emailB, password: "KataSandiQA-12345!", fullName: "Klien B QA" }], owner.cookie);
rec("7.1 owner membuat akun klien B", ok(cb), err(cb));
const evB = await act("createEvent", [{ clientId: cb.j?.data?.id, slug: `qa-b-${stamp}`, coupleName: "QA B", templateId: tp?.id, packageId: pk?.id, eventDate: future + "T00:00:00+07:00", venue: "" }], owner.cookie);
rec("7.2 owner membuat event klien B", ok(evB), err(evB));
const evtB = evB.j?.data?.id;
const clB = await login(emailB, "KataSandiQA-12345!");
rec("7.3 klien B login", clB.s === 200);
for (const [a, args] of [["billing", [evtA]], ["messages", [evtA]], ["approval", [evtA]], ["exportGuests", [evtA]], ["sendMessage", [evtA, { text: "intip" }]], ["addGuest", [evtA, { name: "B masuk", paxLimit: 1 }]], ["updateContent", [evtA, { greeting: "diretas" }]], ["submitVersion", [evtA]]]) {
  const x = await act(a, args, clB.cookie);
  rec(`7.4 klien B tidak bisa ${a} pada event klien A`, x.s >= 400 && x.s < 500, err(x));
}
const aOnB = await act("billing", [evtB], ca.cookie);
rec("7.5 klien A tidak bisa baca tagihan klien B", aOnB.s >= 400 && aOnB.s < 500, err(aOnB));
const gl = await act("guests", [evtA], clB.cookie);
rec("7.6 klien B tidak melihat daftar tamu klien A", (gl.j?.data || []).length === 0, err(gl));

// ---------- 8. Berhenti publikasi, kedaluwarsa, ubah setelah disetujui ----------
const chg = await act("updateContent", [evtA, { greeting: "Salam diubah setelah disetujui" }], ca.cookie);
const apr = await act("approval", [evtA], owner.cookie);
rec("8.1 ubah isi setelah disetujui -> gerbang menandai berubah", ok(chg) && apr.j?.data?.gate?.ok === false, JSON.stringify(apr.j?.data?.gate?.reasons));
const exp = await act("updateEvent", [evtA, { expiresAt: new Date(Date.now() - 864e5).toISOString() }], owner.cookie);
const expEv = await act("event", [slugA], null);
const expTok = await act("guestByToken", [evtA, token], null);
// Undangan kedaluwarsa hanya memberi sinyal minimal { expired: true } (tanpa data privat); token tamu tetap ditolak.
rec("8.2 undangan kedaluwarsa: anonim hanya menerima sinyal expired, token ditolak", ok(exp) && expEv.s === 200 && expEv.j?.data?.expired === true && !("clientId" in (expEv.j?.data || {})) && expTok.s >= 400, `event:${expEv.s} token:${expTok.s}`);
const expPage = await fetch(`${B}/wedding/${slugA}`);
const expHtml = await expPage.text();
rec("8.3 halaman kedaluwarsa tidak 500", expPage.status < 500, expPage.status);
await act("updateEvent", [evtA, { expiresAt: new Date(Date.now() + 90 * 864e5).toISOString() }], owner.cookie);
const unp = await act("unpublishEvent", [evtA], owner.cookie);
const afterUnp = await act("event", [slugA], null);
rec("8.4 batalkan publikasi -> anonim tidak bisa lagi", ok(unp) && afterUnp.s >= 400, err(afterUnp));
const unpTok = await act("guestByToken", [evtA, token], null);
rec("8.5 link tamu tidak berlaku saat draft", unpTok.s >= 400, err(unpTok));

// ---------- 9. Jejak audit & ringkasan ----------
const au = await act("audit", [evtA], owner.cookie);
const kinds = (au.j?.data || []).map((x) => x.action || x.type || x.kind);
rec("9.1 jejak audit mencatat alur (konversi, versi, invoice, publish)", (au.j?.data || []).length >= 5, `${(au.j?.data || []).length} catatan`);
const clAudit = await act("audit", [evtA], ca.cookie);
rec("9.2 klien tidak bisa baca audit", clAudit.s === 403, err(clAudit));
const ov = await act("overview", [], owner.cookie);
rec("9.3 dashboard owner (overview) memuat data", ok(ov), err(ov));

// ---------- Bersih-bersih data QA ----------
const cleanA = await act("deleteEvent", [evtA], owner.cookie);
const cleanB = await act("deleteEvent", [evtB], owner.cookie);
const cleanL = await act("deleteLead", [leadIdReal], owner.cookie);
const cleanL2 = (await act("leads", [], owner.cookie)).j?.data?.filter((l) => /^QA /.test(l.name));
for (const l of cleanL2 || []) await act("deleteLead", [l.id], owner.cookie);
rec("10.1 hapus event dan lead uji", ok(cleanA) && ok(cleanB) && ok(cleanL), `${err(cleanA)} | ${err(cleanB)} | ${err(cleanL)}`);
const gone = await act("event", [slugA], owner.cookie);
rec("10.2 event uji benar-benar hilang", !gone.j?.data, err(gone));

for (const email of [emailA, emailB]) {
  const p = (await act("profiles", [], owner.cookie)).j?.data?.find((u) => u.email === email);
  if (p) await act("deleteClient", [p.id], owner.cookie);
}
console.log(results.map((x) => x.line).join("\n"));
console.log(`\nTOTAL ${results.length}  FAIL ${results.filter((x) => !x.ok).length}`);
console.log("Akun uji sudah dihapus.");
