"use client";

// PhotoUploadPage (Phase 6 / Day 1) -- Chinese version

import { useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Images, RefreshCw, Save } from "lucide-react";

import { PhotoUploader } from "@/components/admin/photos/PhotoUploader";
import {
  createPhotoAction,
} from "@/components/admin/photos/actions";
import type { PhotoFormValues } from "@/server/photos";

export interface UploadPageProps {
  albums: { id: string; title: string; slug: string }[];
  defaultAlbumId?: string;
}

export function PhotoUploadPage({ albums, defaultAlbumId }: UploadPageProps) {
  const router = useRouter();
  const [queue, setQueue] = useState<PhotoFormValues[]>([]);
  const [pending, startTransition] = useTransition();
  const [progress, setProgress] = useState<{ done: number; total: number; failed: number }>({
    done: 0,
    total: 0,
    failed: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const onUploaded = useCallback((values: PhotoFormValues) => {
    setQueue((prev) => [...prev, values]);
  }, []);

  const handleSubmitAll = useCallback(() => {
    if (queue.length === 0) return;
    setError(null);
    setProgress({ done: 0, total: queue.length, failed: 0 });
    startTransition(async () => {
      const ids: string[] = [];
      let failed = 0;
      for (const v of queue) {
        const res = await createPhotoAction(v);
        if (res.ok && res.id) ids.push(res.id);
        else failed += 1;
        setProgress((p) => ({ ...p, done: p.done + 1, failed }));
      }
      setSavedIds(ids);
      if (failed === 0) {
        const lastId = ids[ids.length - 1];
        if (lastId) router.push(`/admin/photos/${lastId}/edit`);
        else router.push("/admin/photos");
        return;
      }
      // Surface the concrete failure from the server action so the user can fix it.
      const firstError = await (async () => {
        for (const v of queue) {
          const res = await createPhotoAction(v);
          if (!res.ok) return res;
        }
        return null;
      })();
      setError(firstError ? firstError.error : "部分照片保存失败，请检查上面的提示后重试。");
    });
  }, [queue, router]);

  function handleReset() {
    setQueue([]);
    setSavedIds([]);
    setProgress({ done: 0, total: 0, failed: 0 });
    setError(null);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink">上传照片</h1>
          <p className="mt-1 text-sm text-muted">
            拖入多张图片，系统会先在浏览器里读取 EXIF（拍摄时间 / 地点 / 相机），
            然后批量入库。
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <Images aria-hidden className="size-4" />
          {queue.length} 张待保存
          {savedIds.length > 0 ? (
            <span className="ml-2 inline-flex items-center gap-1 text-success">
              <CheckCircle2 aria-hidden className="size-3.5" />
              {savedIds.length} 张已入库
            </span>
          ) : null}
        </div>
      </header>

      <section className="rounded-md border border-hair bg-surface p-6 shadow-soft">
        <PhotoUploader
          albums={albums}
          defaultAlbumId={defaultAlbumId}
          onUploaded={onUploaded}
          onError={(name, msg) => setError(`${name}：${msg}`)}
          disabled={pending}
        />
      </section>

      {progress.total > 0 ? (
        <section className="rounded-md border border-hair bg-surface p-4 shadow-soft">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>正在保存… {progress.done} / {progress.total}</span>
            <span className={progress.failed > 0 ? "text-danger" : "text-success"}>
              失败 {progress.failed}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-hair">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${(progress.done / Math.max(1, progress.total)) * 100}%` }}
            />
          </div>
        </section>
      ) : null}

      {error ? (
        <p className="rounded border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
          {error}
        </p>
      ) : null}

      <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-2 rounded-md border border-hair bg-surface/95 px-4 py-3 shadow-float backdrop-blur">
        <button
          type="button"
          onClick={handleReset}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded border border-hair px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
        >
          <RefreshCw aria-hidden className="size-4" />
          清空队列
        </button>
        <button
          type="button"
          onClick={handleSubmitAll}
          disabled={pending || queue.length === 0}
          className="inline-flex items-center gap-1.5 rounded bg-accent px-4 py-1.5 text-sm font-medium text-white shadow-soft transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save aria-hidden className="size-4" />
          {pending ? "保存中…" : `保存 ${queue.length} 张照片`}
        </button>
      </div>
    </div>
  );
}