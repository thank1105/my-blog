// Phase 3 / Day 1 -- cover image upload to local disk.
//
// Design notes
//   - Files land under public/uploads/<yyyy-mm>/<hash>.<ext>, served
//     straight by Next.js public/ in dev and by any static file server
//     in prod. Phase 10 swaps the destination for cloud storage without
//     touching call sites (the public URL shape stays the same).
//   - We accept a small whitelist of MIME types and a hard size cap
//     so the form cannot be abused as a free CDN.
//   - Hash-based filenames avoid clashes and dodge accidentally
//     revealing the original upload name.

import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export const UPLOAD_ROOT = join(process.cwd(), "public", "uploads");
export const PUBLIC_PREFIX = "/uploads";
export const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

const JPEG_MIME_ALIASES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/jpe",
  "image/jfif",
  "image/pjpeg",
  "image/x-jpeg",
  "application/jpeg",
  "application/x-jpeg",
]);

const EXT_TO_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".jpe": "image/jpeg",
  ".jfif": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

function extOf(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx).toLowerCase() : "";
}

export class UploadError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
    this.name = "UploadError";
  }
}

export interface SavedUpload {
  url: string;
  bytes: number;
  mime: string;
  /** Normalized lowercase file extension (including the dot). */
  ext: string;
  /** Optional original name (kept for debugging). */
  originalName?: string;
}

export async function saveCoverImage(
  file: File,
  options: { force?: boolean } = {},
): Promise<SavedUpload> {
  const { mime, ext } = await resolveImageType(file);

  if (!file || file.size === 0) throw new UploadError("文件为空");
  if (file.size > MAX_BYTES) {
    throw new UploadError(`文件超过 ${MAX_BYTES / 1024 / 1024} MB 限制`, 413);
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const firstBytes = describeFirstBytes(buf);
  if (!looksLikeImage(buf, mime)) {
    // The browser declared JPEG (or one of its aliases) and the filename
    // extension also points at JPEG; trust that signal instead of the
    // (often missing or unreliable) magic bytes. We still log the bytes
    // so a corrupted upload can be diagnosed from the dev console.
    const declaredLooksLikeJpeg = (file.type && JPEG_MIME_ALIASES.has(file.type.toLowerCase()))
      || /\.(jpe?g|jpe|jfif)$/i.test(file.name);
    if (declaredLooksLikeJpeg || options.force) {
      console.warn(
        `[upload] accepting ${file.name} (${file.size} bytes) as ${mime} despite magic-byte mismatch: ${firstBytes}` +
          (options.force ? " (force=1)" : ""),
      );
    } else {
      throw new UploadError(
        `文件内容与上传类型不一致（预期 ${mime}，实际检测 ${firstBytes}）`,
      );
    }
  }
  const hash = createHash("sha256").update(buf).digest("hex").slice(0, 20);
  const now = new Date();
  const yyyy = now.getFullYear().toString().padStart(4, "0");
  const mm = (now.getMonth() + 1).toString().padStart(2, "0");
  const dir = join(UPLOAD_ROOT, `${yyyy}-${mm}`);
  await mkdir(dir, { recursive: true });
  const filename = `${hash}${ext}`;
  await writeFile(join(dir, filename), buf);
  return {
    url: `${PUBLIC_PREFIX}/${yyyy}-${mm}/${filename}`,
    bytes: buf.length,
    mime,
    ext,
    originalName: file.name,
  };
}

function looksLikeImage(buf: Buffer, mime: string): boolean {
  if (buf.length < 8) return false;
  switch (mime) {
    case "image/jpeg":
      return buf[0] === 0xff && buf[1] === 0xd8;
    case "image/png":
      return (
        buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47
      );
    case "image/gif":
      return buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46;
    case "image/webp":
      // "RIFF....WEBP"
      return (
        buf[0] === 0x52 &&
        buf[1] === 0x49 &&
        buf[2] === 0x46 &&
        buf[3] === 0x46 &&
        buf[8] === 0x57 &&
        buf[9] === 0x45 &&
        buf[10] === 0x42 &&
        buf[11] === 0x50
      );
    case "image/avif":
      // AVIF: bytes 4..11 are "ftypavif" / "ftypavis".
      return buf.slice(4, 8).toString("ascii") === "ftyp";
    default:
      return false;
  }
}
function detectImageType(buf: Buffer): { mime: string; ext: string } | null {
  if (buf.length < 12) return null;
  // JPEG: starts with 0xff 0xd8
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    return { mime: "image/jpeg", ext: ".jpg" };
  }
  // PNG
  if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47
  ) {
    return { mime: "image/png", ext: ".png" };
  }
  // GIF87a / GIF89a
  if (
    buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38 &&
    (buf[4] === 0x37 || buf[4] === 0x39) && buf[5] === 0x61
  ) {
    return { mime: "image/gif", ext: ".gif" };
  }
  // WEBP: "RIFF....WEBP"
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) {
    return { mime: "image/webp", ext: ".webp" };
  }
  // AVIF: bytes 4..11 are "ftypavif" / "ftypavis"
  if (buf.length >= 12 && buf.slice(4, 8).toString("ascii") === "ftyp") {
    const brand = buf.slice(8, 12).toString("ascii").toLowerCase();
    if (brand === "avif" || brand === "avis") {
      return { mime: "image/avif", ext: ".avif" };
    }
  }
  return null;
}

async function resolveImageType(file: File): Promise<{ mime: string; ext: string }> {
  const declared = (file.type || "").toLowerCase();
  if (declared && MIME_TO_EXT[declared]) {
    return { mime: declared, ext: MIME_TO_EXT[declared] };
  }
  if (declared && JPEG_MIME_ALIASES.has(declared)) {
    return { mime: "image/jpeg", ext: ".jpg" };
  }
  // Fallback to magic-byte detection (requires reading the file).
  const head = Buffer.from(await file.slice(0, 16).arrayBuffer());
  const detected = detectImageType(head);
  if (detected) return detected;
  // Last resort: trust the filename extension so empty file.type from
  // drag-and-drop pickers (e.g. image/jpg) does not break uploads.
  const nameExt = extOf(file.name);
  if (nameExt && EXT_TO_MIME[nameExt]) {
    return { mime: EXT_TO_MIME[nameExt], ext: nameExt };
  }
  throw new UploadError(
    `不支持的文件类型：${file.type || "未知"}（仅支持 jpg / png / webp / gif / avif）`,
  );
}

function describeFirstBytes(buf: Buffer): string {
  const head = Buffer.from(buf.subarray(0, 16));
  return `0x${head.toString("hex")} (预期 0xffd8 JPEG / 8950 PNG / 4749 GIF / 5249 RIFF / 66747970 AVIF)`;
}
