"use client";

// Cover image uploader (Phase 3 / Day 1).
//
// Uploads the picked file to /api/admin/upload, shows a thumbnail preview
// once the URL is known, and lets the user clear the selection. The form
// owns the persisted URL via `value` / `onChange`.

import { useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";

export interface CoverImageUploaderProps {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  error?: string | null;
}

export function CoverImageUploader({
  value,
  onChange,
  disabled,
  error,
}: CoverImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setLocalError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        setLocalError(body.error ?? `上传失败 (${r.status})`);
        return;
      }
      const data = (await r.json()) as { url: string };
      onChange(data.url);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="text-sm font-medium text-ink">封面图</label>
      <div
        className={cn(
          "mt-1 rounded-md border border-dashed border-hair bg-bg/40 p-4",
          "flex items-start gap-4",
          disabled && "opacity-60",
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="封面预览"
            className="h-24 w-32 flex-shrink-0 rounded object-cover ring-1 ring-hair"
          />
        ) : (
          <div className="flex h-24 w-32 flex-shrink-0 items-center justify-center rounded bg-surface text-muted ring-1 ring-hair">
            <ImagePlus aria-hidden className="size-6" />
          </div>
        )}
        <div className="flex flex-1 flex-col gap-2">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            disabled={disabled || uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
              e.target.value = ""; // allow re-selecting the same file
            }}
            aria-label="选择封面图"
            className="block w-full text-sm text-ink file:mr-3 file:rounded file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-accent/90"
          />
          <p className="text-xs text-muted">
            支持 jpg / png / webp / gif / avif，单张不超过 5 MB。
            上传后存到 <code className="font-mono">/uploads/yyyy-mm/&lt;hash&gt;.&lt;ext&gt;</code>。
          </p>
          {value ? (
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={() => onChange("")}
              className="inline-flex w-fit items-center gap-1 rounded border border-hair px-2 py-1 text-xs text-ink hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 aria-hidden className="size-3" />
              移除封面
            </button>
          ) : null}
          {uploading ? (
            <p className="text-xs text-muted">上传中...</p>
          ) : null}
        </div>
      </div>
      {localError || error ? (
        <p className="mt-1 text-xs text-danger">{localError ?? error}</p>
      ) : null}
    </div>
  );
}
