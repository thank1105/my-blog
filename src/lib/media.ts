import { z } from "zod";

/**
 * Cover images may be served from the local public uploads directory or
 * referenced by an external HTTP(S) URL.
 */
export const coverImageSchema = z
  .string()
  .trim()
  .refine(
    (value) => {
      if (value === "" || value.startsWith("/uploads/")) return true;
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    },
    "封面图需为有效的 URL",
  )
  .optional();

/** Articles always need a real cover image. Other content types stay optional. */
export const requiredCoverImageSchema = z
  .string()
  .trim()
  .min(1, "请上传封面图")
  .refine(
    (value) => {
      if (value.startsWith("/uploads/")) return true;
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    },
    "封面图需为有效的 URL",
  );
