"use client";

// Phase 6 / Day 1: Batch-delete toolbar + "move to album" action
// for the admin photos list (Chinese version).

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FolderInput, Trash2 } from "lucide-react";

import { softDeletePhotosAction, movePhotosAction } from "@/components/admin/photos/actions";

interface Row {
  id: string;
  title: string;
}

export function BatchDeleteForm({
  rows,
  albums,
  children,
}: {
  rows: Row[];
  albums: { id: string; title: string }[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [targetAlbum, setTargetAlbum] = useState<string>("");

  const allChecked = checked.size === rows.length && rows.length > 0;
  const someChecked = checked.size > 0;

  function toggleAll() {
    if (allChecked) {
      setChecked(new Set());
    } else {
      setChecked(new Set(rows.map((r) => r.id)));
    }
  }

  function handleDelete() {
    if (checked.size === 0) return;
    if (!window.confirm(`确定要删除选中的 ${checked.size} 张照片吗？`)) return;
    startTransition(async () => {
      const ids = Array.from(checked);
      const result = await softDeletePhotosAction(ids);
      if (result.ok) {
        setChecked(new Set());
        router.refresh();
      }
    });
  }

  function handleMove() {
    if (checked.size === 0) return;
    if (!window.confirm(`将选中的 ${checked.size} 张照片移动到目标相册？`)) return;
    startTransition(async () => {
      const ids = Array.from(checked);
      const result = await movePhotosAction({
        ids,
        targetAlbumId: targetAlbum === "" ? null : targetAlbum,
      });
      if (result.ok) {
        setChecked(new Set());
        setTargetAlbum("");
        router.refresh();
      }
    });
  }

  return (
    <div>
      {someChecked ? (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded border border-hair bg-surface p-2 text-sm shadow-soft">
          <span className="text-muted">
            已选 <span className="font-medium text-ink">{checked.size}</span> 项
          </span>
          <select
            value={targetAlbum}
            onChange={(e) => setTargetAlbum(e.target.value)}
            className="rounded border border-hair bg-bg px-2 py-1 text-xs text-ink"
          >
            <option value="">移出相册</option>
            {albums.map((a) => (
              <option key={a.id} value={a.id}>
                移至 {a.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleMove}
            disabled={pending}
            className="inline-flex items-center gap-1 rounded bg-accent-soft px-2 py-1 text-xs font-medium text-accent hover:bg-accent hover:text-white disabled:opacity-50"
          >
            <FolderInput aria-hidden className="size-3" />
            移动
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="inline-flex items-center gap-1 rounded bg-danger/10 px-2 py-1 text-xs font-medium text-danger hover:bg-danger/20 disabled:opacity-50"
          >
            <Trash2 aria-hidden className="size-3" />
            {pending ? "处理中…" : "批量删除"}
          </button>
          <button
            type="button"
            onClick={() => setChecked(new Set())}
            className="text-xs text-muted underline-offset-4 hover:underline"
          >
            取消选择
          </button>
        </div>
      ) : null}
      <form>
        <div className="mb-2 flex justify-end">
          <label className="inline-flex cursor-pointer items-center gap-1 text-xs text-muted select-none">
            <input
              type="checkbox"
              checked={allChecked}
              onChange={toggleAll}
              className="size-3.5 rounded border-hair accent-accent"
            />
            全选
          </label>
        </div>
        {children}
      </form>
    </div>
  );
}