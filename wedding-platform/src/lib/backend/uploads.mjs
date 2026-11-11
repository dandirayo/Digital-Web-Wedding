import { mkdirSync, writeFileSync, existsSync, readdirSync, statSync, unlinkSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { ApiError } from "./database.mjs";

// Unggahan disimpan di disk server (bukan di database) dan dilayani lewat /api/media/<event>/<file>.
export const uploadDir = () => resolve(process.env.OCCASIO_UPLOAD_DIR || resolve(process.cwd(), "data/uploads"));
export const MB = 1024 * 1024;
export const UPLOAD_LIMITS = { photo: 8 * MB, video: 60 * MB, audio: 15 * MB };
export const EVENT_QUOTA = 500 * MB;
export const MAX_UPLOAD_BYTES = UPLOAD_LIMITS.video;

const EVENT_ID = /^[A-Za-z0-9-]{1,64}$/;
const FILE_NAME = /^[0-9a-f-]{36}\.(jpg|png|webp|mp4|m4a|mp3)$/;
export const CONTENT_TYPES = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", mp4: "video/mp4", m4a: "audio/mp4", mp3: "audio/mpeg" };

// Jenis file ditentukan dari isi file, bukan dari nama atau header yang dikirim browser.
export function sniff(buffer) {
    if (buffer.length < 12)
        return null;
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)
        return { ext: "jpg", type: "photo" };
    if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
        return { ext: "png", type: "photo" };
    if (buffer.toString("latin1", 0, 4) === "RIFF" && buffer.toString("latin1", 8, 12) === "WEBP")
        return { ext: "webp", type: "photo" };
    if (buffer.toString("latin1", 4, 8) === "ftyp")
        return buffer.toString("latin1", 8, 12) === "M4A " ? { ext: "m4a", type: "audio" } : { ext: "mp4", type: "video" };
    if (buffer.toString("latin1", 0, 3) === "ID3" || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0))
        return { ext: "mp3", type: "audio" };
    return null;
}

const safeEvent = (eventId) => {
    if (typeof eventId !== "string" || !EVENT_ID.test(eventId))
        throw new ApiError("Event tidak valid.");
    return eventId;
};

function directorySize(dir) {
    if (!existsSync(dir))
        return 0;
    return readdirSync(dir).reduce((sum, name) => sum + statSync(resolve(dir, name)).size, 0);
}

export function saveUpload(eventId, buffer, dir = uploadDir(), expect = "") {
    safeEvent(eventId);
    const kind = sniff(buffer);
    if (!kind)
        throw new ApiError("Jenis file tidak didukung. Gunakan JPG, PNG, WebP, MP4, M4A, atau MP3.", 415);
    if (expect && kind.type !== expect)
        throw new ApiError(expect === "audio" ? "Isi file bukan audio MP3 atau M4A." : "Isi file bukan foto JPG, PNG, atau WebP.", 415);
    if (buffer.length > UPLOAD_LIMITS[kind.type])
        throw new ApiError(`File terlalu besar (maksimal ${UPLOAD_LIMITS[kind.type] / MB} MB untuk ${kind.type === "photo" ? "foto" : kind.type === "video" ? "video" : "audio"}).`, 413);
    const target = resolve(dir, eventId);
    if (directorySize(target) + buffer.length > EVENT_QUOTA)
        throw new ApiError("Kuota penyimpanan event penuh.", 413);
    mkdirSync(target, { recursive: true });
    const name = `${randomUUID()}.${kind.ext}`;
    writeFileSync(resolve(target, name), buffer);
    return { url: `/api/media/${eventId}/${name}`, type: kind.type, size: buffer.length };
}

// Mengembalikan path file bila nama valid dan file ada; selain itu null (tanpa membocorkan alasan).
export function resolveUploadPath(eventId, file, dir = uploadDir()) {
    if (typeof eventId !== "string" || typeof file !== "string" || !EVENT_ID.test(eventId) || !FILE_NAME.test(file))
        return null;
    const path = resolve(dir, eventId, file);
    return existsSync(path) ? path : null;
}

const URL_PATTERN = /^\/api\/media\/([A-Za-z0-9-]{1,64})\/([0-9a-f-]{36}\.[a-z0-9]{3,4})$/;
export function removeUpload(url, dir = uploadDir()) {
    const match = typeof url === "string" ? URL_PATTERN.exec(url) : null;
    if (!match)
        return false;
    const path = resolveUploadPath(match[1], match[2], dir);
    if (!path)
        return false;
    unlinkSync(path);
    return true;
}

export function removeEventUploads(eventId, dir = uploadDir()) {
    safeEvent(eventId);
    rmSync(resolve(dir, eventId), { recursive: true, force: true });
}
