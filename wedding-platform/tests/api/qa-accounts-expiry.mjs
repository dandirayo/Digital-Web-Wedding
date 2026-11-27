// qa-accounts-expiry.mjs: akun klien (nonaktif/hapus), undangan kedaluwarsa, input rusak (28 cek)
// Jalankan terhadap server DEV lokal (pnpm dev, http://127.0.0.1:3001) dengan akun demo dari seed.
// Skrip membuat data uji (akun/event/lead berawalan "QA") lalu menghapusnya kembali di akhir.
// JANGAN dijalankan terhadap server production. Pemakaian: node tests/api/qa-accounts-expiry.mjs
const B = "http://127.0.0.1:3001";
const H = { "content-type": "application/json", origin: B };
const out = [];
const rec = (n, ok, i = "") => out.push(`${ok ? "PASS" : "FAIL"}  ${n}${i ? "  -> " + i : ""}`);
const post = async (path, body, cookie) => {
  const r = await fetch(B + path, { method: "POST", headers: { ...H, ...(cookie ? { cookie } : {}) }, body: typeof body === "string" ? body : JSON.stringify(body) });
  let j = null; try { j = await r.json(); } catch {}
  return { s: r.status, j, h: r.headers };
};
const login = async (email, password) => { const r = await post("/api/auth", { email, password }); return { s: r.s, j: r.j, cookie: (r.h.get("set-cookie") || "").split(";")[0] }; };
const act = (a, args, c) => post("/api/workspace", { action: a, args }, c);
const err = (r) => `${r.s} ${r.j?.error || ""}`;
const stamp = Date.now().toString(36);

const owner = await login("owner@occasio.local", "OccasioOwner123!");
rec("owner login", owner.s === 200);

// A4: input rusak pada aksi publik
const w = await act("addWish", ["evt-1"], null);
rec("A4 addWish tanpa input -> 400, bukan 500", w.s === 400, err(w));
const w2 = await act("addWish", ["evt-1", "teks"], null);
rec("A4 addWish input bukan objek -> 400", w2.s === 400, err(w2));
const j1 = await post("/api/workspace", "{bukan json", owner.cookie);
const j2 = await post("/api/workspace", "null", owner.cookie);
rec("body JSON rusak/null -> 400", j1.s === 400 && j2.s === 400, `${j1.s}/${j2.s}`);
const g0 = await act("addGuest", ["evt-1", null], owner.cookie);
rec("addGuest null -> 400", g0.s === 400, err(g0));

// A8: akun klien
const email = `qa-disable-${stamp}@occasio.test`;
const pw = "KataSandiQA-12345!";
const cc = await act("createClient", [{ email, password: pw, fullName: "Klien Uji Nonaktif" }], owner.cookie);
rec("buat klien uji", cc.s === 200, err(cc));
const cid = cc.j?.data?.id;
const profs = await act("profiles", [], owner.cookie);
const mine = (profs.j?.data || []).find((p) => p.id === cid);
rec("profiles memuat flag disabled=false", mine && mine.disabled === false, JSON.stringify(mine));
const cl = await login(email, pw);
rec("klien bisa login", cl.s === 200);
const dis = await act("setClientDisabled", [cid, true], owner.cookie);
rec("owner menonaktifkan klien", dis.s === 200 && dis.j?.data?.disabled === true, err(dis));
const after = await act("events", [], cl.cookie);
rec("sesi lama klien langsung tidak berlaku", after.s === 401, err(after));
const relog = await login(email, pw);
rec("login klien nonaktif ditolak (403)", relog.s === 403 && /dinonaktifkan/.test(relog.j?.error || ""), err(relog));
const clientDisable = await act("setClientDisabled", [cid, false], cl.cookie);
rec("klien tidak bisa mengaktifkan diri sendiri", clientDisable.s === 401 || clientDisable.s === 403, err(clientDisable));
const ownerDisable = await act("setClientDisabled", ["usr-1", true], owner.cookie);
rec("owner tidak bisa menonaktifkan akun owner", ownerDisable.s === 403, err(ownerDisable));
const en = await act("setClientDisabled", [cid, false], owner.cookie);
const relog2 = await login(email, pw);
rec("diaktifkan lagi -> login berhasil", en.s === 200 && relog2.s === 200, err(en));

// event milik klien -> hapus akun ditolak; event diterbitkan lalu kedaluwarsa
const pk = (await act("packages", [], owner.cookie)).j?.data?.find((p) => p.isActive);
const tp = (await act("templates", [], owner.cookie)).j?.data?.find((t) => t.isActive);
const future = new Date(Date.now() + 90 * 864e5).toISOString();
const ev = await act("createEvent", [{ clientId: cid, slug: `qa-exp-${stamp}`, coupleName: "QA Kedaluwarsa", templateId: tp?.id, packageId: pk?.id, eventDate: future, venue: "" }], owner.cookie);
rec("buat event untuk klien", ev.s === 200, err(ev));
const eid = ev.j?.data?.id, slug = `qa-exp-${stamp}`;
const delWith = await act("deleteClient", [cid], owner.cookie);
rec("hapus klien yang masih punya event -> 409", delWith.s === 409, err(delWith));
const draftAnon = await act("event", [slug], null);
rec("draft: anonim ditolak (403)", draftAnon.s === 403, err(draftAnon));
const nope = await act("event", ["slug-tidak-ada-" + stamp], null);
rec("slug tidak ada -> data null (bukan sinyal expired)", nope.s === 200 && !nope.j?.data, JSON.stringify(nope.j));
const toDisabled = await act("updateEvent", [eid, { clientId: cid }], owner.cookie);
rec("event tetap bisa diatur untuk klien aktif", toDisabled.s === 200, err(toDisabled));
const past = new Date(Date.now() - 864e5).toISOString();
const pub0 = await act("publishEvent", [eid, { overrideReason: "uji otomatis kedaluwarsa (QA)" }], owner.cookie);
const pub = await act("updateEvent", [eid, { expiresAt: past }], owner.cookie);
rec("owner menerbitkan (override tercatat) lalu set kedaluwarsa", pub0.s === 200 && pub.s === 200, `${err(pub0)} | ${err(pub)}`);
const exp = await act("event", [slug], null);
const d = exp.j?.data || {};
rec("kedaluwarsa: anonim menerima sinyal expired minimal", exp.s === 200 && d.expired === true && d.coupleName === "QA Kedaluwarsa", JSON.stringify(d));
rec("sinyal expired tidak membocorkan data privat", !("clientId" in d) && !("ownerId" in d) && !("venue" in d) && !("guestCount" in d), Object.keys(d).join(","));
const page = await fetch(`${B}/wedding/${slug}`);
rec("halaman kedaluwarsa tidak 500", page.status === 200, page.status);
const content = await act("content", [eid], null);
rec("konten event kedaluwarsa tetap tertutup untuk anonim", content.s === 403, err(content));
const tok = await act("guestByToken", [eid, "TOKEN-ASAL-ASALAN-123"], null);
rec("guestByToken pada event kedaluwarsa ditolak", tok.s === 403, err(tok));

// bersih-bersih
const delEv = await act("deleteEvent", [eid], owner.cookie);
const delCl = await act("deleteClient", [cid], owner.cookie);
rec("hapus event lalu hapus akun klien berhasil", delEv.s === 200 && delCl.s === 200, `${err(delEv)} | ${err(delCl)}`);
const gone = await login(email, pw);
rec("akun yang dihapus tidak bisa login", gone.s === 401, err(gone));
const audit = await act("audit", [null], owner.cookie);
const acts = (audit.j?.data || []).map((a) => a.action || a.type || a.kind);
rec("jejak audit mencatat nonaktif/aktif/hapus klien", ["client_disabled", "client_enabled", "client_deleted"].every((k) => acts.includes(k)), acts.slice(0, 8).join(","));

console.log(out.join("\n"));
console.log(`\nTOTAL ${out.length}  FAIL ${out.filter((l) => l.startsWith("FAIL")).length}`);
