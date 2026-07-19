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
}

export async function saveCoverImage(file: File): Promise<SavedUpload> {
  if (!file || file.size === 0) throw new UploadError("文件为空");
  if (file.size > MAX_BYTES) {
    throw new UploadError(`文件超过 ${MAX_BYTES / 1024 / 1024} MB 限制`, 413);
  }
  const ext = MIME_TO_EXT[file.type];
  if (!ext) {
    throw new UploadError(
      `不支持的文件类型：${file.type || "未知"}（仅支持 jpg / png / webp / gif / avif）`,
    );
  }
  const buf = Buffer.from(await file.arrayBuffer());
  // sanity check: the first bytes should match the declared MIME.
  if (!looksLikeImage(buf, file.type)) {
    throw new UploadError("文件内容与声明的类型不一致");
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
    mime: file.type,
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
