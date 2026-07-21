// PhotoUploader (Phase 6 / Day 1) -- Chinese version

import { useEffect, useRef, useState, useTransition } from "react";
import {
  ImagePlus,
  Loader2,
  MapPin,
  Calendar,
  Camera,
  Trash2,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { readExif, type ExifResult } from "@/lib/exif";
import type { PhotoFormValues } from "@/server/photos";

export interface PhotoUploaderProps {
  /**
   * Kept for API symmetry with future phases; the uploader does not
   * render the album list itself (the parent form owns the picker).
   */
  albums?: readonly { id: string; title: string; slug: string }[];
  /** Default album id when the user wants to bulk-assign on upload. */
  defaultAlbumId?: string;
  /** Fired after each upload completes with the persisted Photo row. */
  onUploaded: (values: PhotoFormValues) => void;
  /** Fired when an upload fails for one file (does not abort the rest). */
  onError?: (fileName: string, error: string) => void;
  /** Disable the whole component (form submitting). */
  disabled?: boolean;
}

interface QueueItem {
  /** Local id used as React key. */
  localId: string;
  /** Original file name (kept for the UI). */
  fileName: string;
  /** Object URL for the in-browser preview thumbnail. */
  previewUrl: string;
  status: "pending" | "reading" | "uploading" | "done" | "error";
  errorMessage?: string;
  /** Server-assigned URL once uploaded. */
  imageUrl?: string;
  /** Extracted EXIF (best-effort; null when the file has none). */
  exif?: ExifResult | null;
  /** Final values handed back via onUploaded. */
  values?: PhotoFormValues;
}


export function PhotoUploader({
  defaultAlbumId,
  onUploaded,
  onError,
  disabled,
}: PhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isUploading, startUploadTransition] = useTransition();
  const [over, setOver] = useState(false);

  useEffect(() => {
    const list = items;
    return () => {
      list.forEach((i) => URL.revokeObjectURL(i.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateItem(localId: string, patch: Partial<QueueItem>) {
    setItems((prev) => prev.map((i) => (i.localId === localId ? { ...i, ...patch } : i)));
  }

  function removeItem(localId: string) {
    setItems((prev) => {
      const found = prev.find((i) => i.localId === localId);
      if (found) URL.revokeObjectURL(found.previewUrl);
      return prev.filter((i) => i.localId !== localId);
    });
  }

  async function handleFiles(files: FileList | File[]) {
    setGlobalError(null);
    // `file.type` is empty for some drag-and-drop / Windows Explorer picks;
    // fall back to the filename extension so we still recognize JPEG / PNG.
    const list = Array.from(files).filter((f) => looksLikeImageFile(f));
    if (list.length === 0) {
      setGlobalError("请选择图片文件（jpg / png / webp / gif / avif）");
      return;
    }
    const drafts: QueueItem[] = list.map((f) => ({
      localId: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      fileName: f.name,
      previewUrl: URL.createObjectURL(f),
      status: "pending",
    }));
    setItems((prev) => [...prev, ...drafts]);

    startUploadTransition(async () => {
      for (let i = 0; i < list.length; i++) {
        const file = list[i];
        const draft = drafts[i];
        if (!draft) continue;
        try {
          updateItem(draft.localId, { status: "reading" });
          const exif = await readExif(file, {
            guessFromFileName: true,
            fileName: file.name,
          });
          updateItem(draft.localId, { exif });

          updateItem(draft.localId, { status: "uploading" });
          const fd = new FormData();
          fd.append("file", file);
          const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
          if (!r.ok) {
            const body = await r.json().catch(() => ({} as { error?: string; declaredType?: string }));
            const reason = body.error ?? `上传失败 (${r.status})`;
            logError("upload", file, reason);
            throw new Error(reason);
          }
          const data = (await r.json()) as {
            url: string;
            bytes: number;
            mime: string;
            ext: string;
            originalName?: string;
          };

          // Fill in width/height when EXIF was missing.
          const dimensions = exif?.width && exif?.height
            ? { width: exif.width, height: exif.height }
            : (await readImageDimensions(file)) ?? null;

          const values: PhotoFormValues = {
            title: "",
            description: "",
            imageUrl: data.url,
            thumbnailUrl: "",
            location: exif?.location ?? "",
            takenAt: exif?.takenAt
              ? toDateTimeLocal(exif.takenAt)
              : "",
            albumId: defaultAlbumId ?? "none",
            visibility: "PUBLIC",
            status: "DRAFT",
            width: dimensions?.width ?? null,
            height: dimensions?.height ?? null,
            order: 0,
          };

          updateItem(draft.localId, {
            status: "done",
            imageUrl: data.url,
            values,
          });
          onUploaded(values);
        } catch (err) {
          const message = err instanceof Error ? err.message : "未知错误";
          logError("uploader", file, message);
          updateItem(draft.localId, { status: "error", errorMessage: message });
          if (onError) onError(file.name, message);
        }
      }
    });
  }

  const pending = items.filter((i) => i.status !== "done" && i.status !== "error").length;
  const done = items.filter((i) => i.status === "done").length;

  return (
    <div className="space-y-3">
      <DropZone
        disabled={disabled}
        over={over}
        onOverChange={setOver}
        onFiles={handleFiles}
        onClickPick={() => fileInputRef.current?.click()}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {globalError ? (
        <p className="rounded border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
          {globalError}
        </p>
      ) : null}

      {isUploading && pending > 0 ? (
        <p className="flex items-center gap-2 text-xs text-muted">
          <Loader2 aria-hidden className="size-3.5 animate-spin" />
          正在上传…已完成 {done} / {items.length}
        </p>
      ) : null}

      {items.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <QueueCard
              key={item.localId}
              item={item}
              onRemove={() => removeItem(item.localId)}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function DropZone({
  disabled,
  over,
  onOverChange,
  onFiles,
  onClickPick,
}: {
  disabled?: boolean;
  over: boolean;
  onOverChange: (b: boolean) => void;
  onFiles: (files: FileList | File[]) => void;
  onClickPick: () => void;
}) {
  return (
    <div
      onDragOver={(e) => {
        if (disabled) return;
        e.preventDefault();
        onOverChange(true);
      }}
      onDragLeave={() => onOverChange(false)}
      onDrop={(e) => {
        if (disabled) return;
        e.preventDefault();
        onOverChange(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) onFiles(files);
      }}
      onClick={disabled ? undefined : onClickPick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClickPick();
        }
      }}
      aria-label="拖入或点击上传照片"
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-8 text-center transition-colors",
        over
          ? "border-accent bg-accent-soft text-accent"
          : "border-hair bg-surface text-muted hover:border-accent hover:text-accent",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <ImagePlus aria-hidden className="size-7" />
      <div className="space-y-0.5">
        <p className="text-sm font-medium">拖入或点击上传照片</p>
        <p className="text-xs text-muted">支持 jpg / png / webp / gif / avif；会自动提取 EXIF。</p>
      </div>
    </div>
  );
}

function QueueCard({
  item,
  onRemove,
}: {
  item: QueueItem;
  onRemove: () => void;
}) {
  return (
    <li className="flex flex-col overflow-hidden rounded-md border border-hair bg-surface shadow-soft">
      <div className="relative aspect-square w-full bg-bg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.previewUrl}
          alt={item.fileName}
          className={cn(
            "absolute inset-0 size-full object-cover transition-opacity",
            item.status === "uploading" || item.status === "reading" ? "opacity-60" : "opacity-100",
          )}
        />
        {item.status === "reading" || item.status === "uploading" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/30 text-white">
            <Loader2 aria-hidden className="size-5 animate-spin" />
          </div>
        ) : null}
        {item.status === "error" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-danger/70 px-2 text-center text-xs text-white">
            {item.errorMessage ?? "上传失败"}
          </div>
        ) : null}
        <button
          type="button"
          onClick={onRemove}
          aria-label="从队列移除"
          className="absolute right-1 top-1 inline-flex size-7 items-center justify-center rounded-full bg-ink/70 text-white opacity-0 transition-opacity hover:bg-ink group-hover:opacity-100 focus-visible:opacity-100"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>
      <div className="flex flex-col gap-1 p-2 text-[11px] text-muted">
        <p className="truncate font-medium text-ink" title={item.fileName}>{item.fileName}</p>
        {item.exif?.takenAt ? (
          <p className="inline-flex items-center gap-1">
            <Calendar aria-hidden className="size-3" />
            {formatDate(item.exif.takenAt)}
          </p>
        ) : null}
        {item.exif?.location ? (
          <p className="inline-flex items-center gap-1">
            <MapPin aria-hidden className="size-3" />
            <span className="truncate">{item.exif.location}</span>
          </p>
        ) : null}
        {(item.exif?.cameraMake || item.exif?.cameraModel || item.exif?.lens) ? (
          <p className="inline-flex items-center gap-1 truncate">
            <Camera aria-hidden className="size-3" />
            {[item.exif.cameraMake, item.exif.cameraModel].filter(Boolean).join(" ")}
            {item.exif.lens ? <span className="text-muted">· {item.exif.lens}</span> : null}
          </p>
        ) : null}
        {item.status === "done" ? (
          <span className="rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] font-medium text-success">
            已上传
          </span>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="inline-flex items-center justify-center gap-1 border-t border-hair px-2 py-1 text-[11px] text-muted hover:bg-danger/10 hover:text-danger"
      >
        <Trash2 aria-hidden className="size-3" />
        移除
      </button>
    </li>
  );
}

function toDateTimeLocal(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

function formatDate(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function looksLikeImageFile(file: File): boolean {
  if (file.type && file.type.startsWith("image/")) return true;
  const lower = file.name.toLowerCase();
  return /\.(jpe?g|png|webp|gif|avif|jfif)$/.test(lower);
}

function readImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const dims = { width: img.naturalWidth || img.width, height: img.naturalHeight || img.height };
      URL.revokeObjectURL(url);
      resolve(dims);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

function logError(scope: string, file: File, message: string) {
  if (typeof console !== "undefined") {
    console.warn(`[${scope}] ${file.name} (${file.size} bytes, ${file.type || "无 MIME"}): ${message}`);
  }
}
