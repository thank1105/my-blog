"use client";

import { useState } from "react";
import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";

export interface AvatarUploaderProps {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}

export function AvatarUploader({ value, onChange, disabled }: AvatarUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.error ?? `上传失败（${response.status}）`);
        return;
      }
      const data = (await response.json()) as { url: string };
      onChange(data.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="text-sm font-medium text-ink">头像</label>
      <div className="mt-1 flex items-center gap-4 rounded-md border border-dashed border-hair bg-bg/40 p-4">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="头像预览"
            className="size-24 shrink-0 rounded-full object-cover ring-1 ring-hair"
          />
        ) : (
          <div className="flex size-24 shrink-0 items-center justify-center rounded-full bg-surface text-muted ring-1 ring-hair">
            <ImagePlus aria-hidden className="size-6" />
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            disabled={disabled || uploading}
            aria-label="选择头像"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
              event.target.value = "";
            }}
            className="block w-full text-sm text-ink file:mr-3 file:rounded file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-accent/90"
          />
          <p className="text-xs text-muted">
            支持 jpg / png / webp / gif / avif，单张不超过 5 MB。
          </p>
          {uploading ? (
            <p className="inline-flex items-center gap-1 text-xs text-muted">
              <LoaderCircle aria-hidden className="size-3 animate-spin" />
              上传中…
            </p>
          ) : null}
          {value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              disabled={disabled || uploading}
              className="inline-flex w-fit items-center gap-1 rounded border border-hair px-2 py-1 text-xs text-ink hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 aria-hidden className="size-3" />
              移除头像
            </button>
          ) : null}
          {error ? <p className="text-xs text-danger">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
