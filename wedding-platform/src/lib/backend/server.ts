import { openDatabase, createUser, rows, put } from "./database.mjs";
import { seedData } from "@/lib/store/seed";
const globalDb = globalThis as typeof globalThis & {
    occasioDb?: ReturnType<typeof openDatabase>;
};
let demoMediaChecked = false;
export function database() {
    if (globalDb.occasioDb) {
        // Basis data yang sudah terbuka sebelum modul ini dimuat ulang tetap diperiksa satu kali.
        if (!demoMediaChecked && process.env.NODE_ENV !== "production") {
            demoMediaChecked = true;
            ensureDemoMedia(globalDb.occasioDb);
        }
        return globalDb.occasioDb;
    }
    const db = openDatabase();
    const existing = db.prepare("SELECT count(*) AS count FROM users").get() as {
        count: number;
    };
    if (!existing.count) {
        if (process.env.NODE_ENV === "production") {
            if (!process.env.OCCASIO_OWNER_EMAIL || !process.env.OCCASIO_OWNER_PASSWORD)
                throw new Error("Konfigurasi akun owner diperlukan saat instalasi production pertama.");
            createUser(db, { email: process.env.OCCASIO_OWNER_EMAIL, password: process.env.OCCASIO_OWNER_PASSWORD, fullName: "Owner Occasio", role: "owner" });
        }
        else {
            createUser(db, { id: "usr-1", email: "owner@occasio.local", password: "OccasioOwner123!", fullName: "Owner Occasio", role: "owner" });
            createUser(db, { id: "usr-client-1", email: "client@occasio.local", password: "OccasioClient123!", fullName: "Client Demo", role: "client" });
        }
    }
    if (!rows(db, "packages").length) {
        for (const item of seedData.packages)
            put(db, "packages", item);
        for (const item of seedData.templates)
            put(db, "templates", item);
        if (process.env.NODE_ENV !== "production") {
            const original = seedData.events[0];
            put(db, "events", { ...original, eventDate: "2026-12-27T10:00:00+07:00", expiresAt: "2027-12-27T00:00:00+07:00" });
            put(db, "content", seedData.eventContents[0]);
            for (const item of seedData.guests)
                put(db, "guests", item);
            for (const item of seedData.wishes)
                put(db, "wishes", item);
        }
    }
    if (process.env.NODE_ENV !== "production") {
        demoMediaChecked = true;
        ensureDemoMedia(db);
    }
    globalDb.occasioDb = db;
    return db;
}
// Tema tidak lagi memakai foto bawaan, jadi event contoh Sheila & Yoga diberi media yang sama dengan
// yang sebelumnya disematkan di tema. Dijalankan sekali (penanda disimpan) agar penghapusan oleh owner tetap berlaku.
function ensureDemoMedia(db: ReturnType<typeof openDatabase>) {
    if (rows(db, "meta").some((m: Record<string, unknown>) => m.id === "demo-media-seeded"))
        return;
    put(db, "meta", { id: "demo-media-seeded", at: new Date().toISOString() });
    if (!rows(db, "events").some((e: Record<string, unknown>) => e.id === "evt-1") || rows(db, "media").some((m: Record<string, unknown>) => m.eventId === "evt-1"))
        return;
    const base = "/templates/sheila-yoga/assets";
    const items: Array<[string, string, string, string]> = [
        ["photo", "cover", `${base}/images/cover.jpg`, "Sampul"],
        ["photo", "prewedding", `${base}/images/prewed-1.jpg`, "Prewedding"],
        ...["g1", "g2", "g3", "g4", "g5", "g6"].map((n): [string, string, string, string] => ["photo", "gallery", `${base}/images/${n}.jpg`, "Galeri"]),
        ["video", "gallery", `${base}/videos/intro.mp4`, "Video pembuka"],
        ["photo", "map", `${base}/images/maps-akad.jpg`, "Peta akad"],
        ["photo", "map", `${base}/images/maps-resepsi.jpg`, "Peta resepsi"],
    ];
    const counters: Record<string, number> = {};
    items.forEach(([type, category, url, altText], index) => {
        const sortOrder = counters[category] = (counters[category] ?? -1) + 1;
        put(db, "media", { id: `demo-media-${index + 1}`, eventId: "evt-1", type, category, url, altText, sortOrder, createdAt: new Date().toISOString() });
    });
}
