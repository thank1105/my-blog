"use client";

// Cover image uploader (Phase 3 / Day 1).
//
// Uploads the picked file to /api/admin/upload, shows a thumbnail preview
// once the URL is known, and lets the user clear the selection. The form
// owns the persisted URL via `value` / `onChange`.

import { useState } from "react";
import { ImagePlus } from "lucide-react";

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
      <div className="flex items-baseline justify-between gap-4">
        <label className="text-sm font-medium text-ink">
          封面图 <span className="text-danger">*</span>
        </label>
        <span className="font-mono text-[11px] text-muted">推荐 1200 × 750</span>
      </div>
      <div
        className={cn(
          "mt-2 rounded-md border border-dashed bg-bg/50 p-4",
          "grid items-start gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]",
          error || localError ? "border-danger/60" : "border-hair",
          disabled && "opacity-60",
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="封面预览"
            className="aspect-[16/10] w-full rounded-md object-cover ring-1 ring-hair"
          />
        ) : (
          <div className="flex aspect-[16/10] w-full items-center justify-center rounded-md bg-surface text-muted ring-1 ring-hair">
            <div className="text-center">
              <ImagePlus aria-hidden className="mx-auto size-7" />
              <p className="mt-2 text-xs">文章必须有封面</p>
            </div>
          </div>
        )}
        <div className="flex min-w-0 flex-col gap-3 pt-1">
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
          {value ? <p className="text-xs font-medium text-success">封面已就绪，可重新选择图片替换。</p> : null}
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
