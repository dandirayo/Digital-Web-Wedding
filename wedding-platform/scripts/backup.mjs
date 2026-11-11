// Cadangan: node scripts/backup.mjs [folder-tujuan]
// Menyalin database (snapshot konsisten via VACUUM INTO) dan folder unggahan ke backups/<waktu>/.
import { DatabaseSync } from "node:sqlite";
import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";

const dbPath = resolve("data/occasio.sqlite");
const uploads = resolve(process.env.OCCASIO_UPLOAD_DIR || "data/uploads");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const target = resolve(process.argv[2] || join("backups", stamp));

if (!existsSync(dbPath)) {
    console.error(`Database tidak ditemukan: ${dbPath}`);
    process.exit(1);
}
if (existsSync(target)) {
    console.error(`Folder tujuan sudah ada: ${target}`);
    process.exit(1);
}
mkdirSync(target, { recursive: true });
const db = new DatabaseSync(dbPath, { timeout: 5000 });
try {
    db.exec(`VACUUM INTO '${join(target, "occasio.sqlite").replace(/'/g, "''")}'`);
} finally {
    db.close();
}
if (existsSync(uploads))
    cpSync(uploads, join(target, "uploads"), { recursive: true });

const size = (dir) => readdirSync(dir, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? size(join(dir, e.name)) : statSync(join(dir, e.name)).size), 0);
writeFileSync(join(target, "MANIFEST.json"), JSON.stringify({ createdAt: new Date().toISOString(), bytes: size(target) }, null, 2));
console.log(`Cadangan selesai: ${target} (${(size(target) / 1048576).toFixed(1)} MB)`);
