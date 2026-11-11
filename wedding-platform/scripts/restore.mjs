// Pemulihan: node scripts/restore.mjs <folder-cadangan> --yes
// Hentikan server dulu. Kondisi saat ini disimpan ke backups/pre-restore-<waktu>/ sebelum ditimpa.
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const source = process.argv[2] ? resolve(process.argv[2]) : "";
if (!source || !process.argv.includes("--yes")) {
    console.error("Pemakaian: node scripts/restore.mjs <folder-cadangan> --yes\nPastikan server sudah dihentikan.");
    process.exit(1);
}
if (!existsSync(join(source, "occasio.sqlite"))) {
    console.error(`Bukan folder cadangan yang valid (occasio.sqlite tidak ada): ${source}`);
    process.exit(1);
}
const dbPath = resolve("data/occasio.sqlite");
const uploads = resolve(process.env.OCCASIO_UPLOAD_DIR || "data/uploads");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

// Simpan kondisi sekarang lebih dulu, memakai skrip cadangan yang sama.
if (existsSync(dbPath)) {
    const safety = join("backups", `pre-restore-${stamp}`);
    const r = spawnSync(process.execPath, [join(dirname(fileURLToPath(import.meta.url)), "backup.mjs"), safety], { stdio: "inherit" });
    if (r.status !== 0) {
        console.error("Gagal menyimpan kondisi saat ini; pemulihan dibatalkan.");
        process.exit(1);
    }
}
mkdirSync(dirname(dbPath), { recursive: true });
for (const ext of ["", "-wal", "-shm"])
    rmSync(dbPath + ext, { force: true });
cpSync(join(source, "occasio.sqlite"), dbPath);
rmSync(uploads, { recursive: true, force: true });
if (existsSync(join(source, "uploads")))
    cpSync(join(source, "uploads"), uploads, { recursive: true });
console.log(`Pemulihan selesai dari ${source}. Jalankan ulang server.`);
