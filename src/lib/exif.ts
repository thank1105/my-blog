// Phase 6 / Day 1 -- EXIF extraction helper.
//
// Pure browser/Node utility; lives outside the server boundary so the
// photo uploader can extract EXIF tags from a `File` BEFORE uploading
// (no need to round-trip bytes through the API). We accept both:
//   - a `File` (browser, in the uploader)
//   - a `Blob` / `ArrayBuffer` (server-side smoke tests)
//
// The shape we expose is intentionally narrow -- the form only reads:
//   takenAt     -> DateTime on Photo
//   location    -> string   on Photo
//   cameraMake / cameraModel / lens  -> informational only (not persisted)
//   width/height -> Photo.{width,height}
// Anything else is dropped so the Photo row stays a clean fact-table.

import exifr from "exifr";

export interface ExifResult {
  /** Photo capture time, when EXIF DateTimeOriginal exists. */
  takenAt?: Date | null;
  /** Human-readable location string, e.g. "杭州 / 西湖区". */
  location?: string | null;
  /** Camera maker, e.g. "Canon". */
  cameraMake?: string | null;
  /** Camera model, e.g. "EOS R5". */
  cameraModel?: string | null;
  /** Lens, e.g. "RF 24-70mm F2.8 L IS USM". */
  lens?: string | null;
  /** ISO speed. */
  iso?: number | null;
  /** Aperture in f-stops, e.g. 2.8. */
  fNumber?: number | null;
  /** Exposure time in seconds, e.g. 0.005 (1/200). */
  exposureTime?: number | null;
  /** Focal length in mm. */
  focalLength?: number | null;
  /** Pixel width (from EXIF ExifImageWidth, not PixelXDimension which can be 0). */
  width?: number | null;
  /** Pixel height. */
  height?: number | null;
}

export interface ReadExifOptions {
  /** When true (default), falls back to file name parsing for missing tags. */
  guessFromFileName?: boolean;
  /** File name is needed for the filename fallback. */
  fileName?: string;
}

interface RawExif {
  DateTimeOriginal?: Date | string;
  CreateDate?: Date | string;
  ModifyDate?: Date | string;
  Make?: string;
  Model?: string;
  LensModel?: string;
  Lens?: string;
  ISO?: number;
  ISOSpeedRatings?: number;
  FNumber?: number;
  ApertureValue?: number;
  ExposureTime?: number;
  FocalLength?: number;
  GPSLatitude?: number;
  GPSLongitude?: number;
  ExifImageWidth?: number;
  ExifImageHeight?: number;
  ImageWidth?: number;
  ImageHeight?: number;
  PixelXDimension?: number;
  PixelYDimension?: number;
}

const EXIF_PICK = [
  "DateTimeOriginal",
  "CreateDate",
  "ModifyDate",
  "Make",
  "Model",
  "LensModel",
  "Lens",
  "ISO",
  "ISOSpeedRatings",
  "FNumber",
  "ApertureValue",
  "ExposureTime",
  "FocalLength",
  "GPSLatitude",
  "GPSLongitude",
  "ExifImageWidth",
  "ExifImageHeight",
  "ImageWidth",
  "ImageHeight",
  "PixelXDimension",
  "PixelYDimension",
] as const;

/**
 * Read EXIF from a `File`, `Blob`, or `ArrayBuffer`. Returns `null` when
 * no EXIF block is present (e.g. PNG screenshots), which is a normal
 * outcome and never an error.
 */
export async function readExif(
  input: File | Blob | ArrayBuffer,
  options: ReadExifOptions = {},
): Promise<ExifResult | null> {
  let raw: RawExif | undefined;
  try {
    raw = (await exifr.parse(input as unknown as ArrayBuffer, {
      tiff: true,
      exif: true,
      gps: true,
      pick: EXIF_PICK as unknown as string[],
    })) as RawExif | undefined;
  } catch {
    // Malformed EXIF block -- treat as "no EXIF".
    return null;
  }
  if (!raw) return null;

  const result: ExifResult = {
    takenAt: pickDate(raw),
    location: pickLocation(raw),
    cameraMake: trimToNull(raw.Make),
    cameraModel: trimToNull(raw.Model),
    lens: trimToNull(raw.LensModel) ?? trimToNull(raw.Lens),
    iso: pickNumber(raw.ISO ?? raw.ISOSpeedRatings),
    fNumber: pickNumber(raw.FNumber ?? raw.ApertureValue),
    exposureTime: pickNumber(raw.ExposureTime),
    focalLength: pickNumber(raw.FocalLength),
    width: pickNumber(raw.ExifImageWidth ?? raw.ImageWidth ?? raw.PixelXDimension),
    height: pickNumber(raw.ExifImageHeight ?? raw.ImageHeight ?? raw.PixelYDimension),
  };

  if (options.guessFromFileName && !result.takenAt && options.fileName) {
    const guess = guessDateFromFileName(options.fileName);
    if (guess) result.takenAt = guess;
  }
  return result;
}

function pickDate(raw: RawExif): Date | null {
  const candidates = [raw.DateTimeOriginal, raw.CreateDate, raw.ModifyDate];
  for (const c of candidates) {
    if (c instanceof Date && !Number.isNaN(c.getTime())) return c;
    if (typeof c === "string") {
      const d = new Date(c);
      if (!Number.isNaN(d.getTime())) return d;
    }
  }
  return null;
}

function pickLocation(raw: RawExif): string | null {
  const lat = typeof raw.GPSLatitude === "number" ? raw.GPSLatitude : null;
  const lng = typeof raw.GPSLongitude === "number" ? raw.GPSLongitude : null;
  if (lat === null || lng === null) return null;
  // We don't reverse-geocode here (no offline gazetteer). The admin form
  // can override this with a free-text label later; for now we surface
  // the raw coordinates so the field is never empty when the photo has GPS.
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

function pickNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return null;
}

function trimToNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length === 0 ? null : t;
}

/**
 * Best-effort date extraction from a filename like `IMG_20240718_HKTrip.jpg`
 * or `2024-07-18 18.32.05.png`. We only handle the patterns that are
 * realistic in a personal blog's photo dump.
 */
export function guessDateFromFileName(name: string): Date | null {
  const m1 = name.match(/(\d{4})[-_]?(\d{2})[-_]?(\d{2})/);
  if (m1) {
    const [, y, mo, d] = m1;
    const dt = new Date(`${y}-${mo}-${d}T12:00:00`);
    if (!Number.isNaN(dt.getTime())) return dt;
  }
  return null;
}

/** Format a Date into the YYYY-MM-DD HH:MM string used by datetime-local inputs. */
export function toDateTimeLocalString(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

/** Parse a `datetime-local` string back into a Date. */
export function fromDateTimeLocalString(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}