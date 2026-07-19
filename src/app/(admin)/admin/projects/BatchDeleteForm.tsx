"use client";

// Phase 5 / Day 1: Batch-delete toolbar for the admin projects list.
// Pattern mirrors BatchDeleteForm under /admin/notes.

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

import { softDeleteProjectsAction } from "@/components/admin/projects/actions";

interface Row {
  id: string;
  title: string;
}

export function BatchDeleteForm({
  rows,
  children,
}: {
  rows: Row[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [checked, setChecked] = useState<Set<string>>(new Set());

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
    if (!window.confirm(`确定要删除选中的 ${checked.size} 个作品吗？`)) return;
    startTransition(async () => {
      const ids = Array.from(checked);
      const result = await softDeleteProjectsAction(ids);
      if (result.ok) {
        setChecked(new Set());
        router.refresh();
      }
    });
  }

  return (
    <div>
      {someChecked ? (
        <div className="mb-3 flex items-center gap-3 rounded border border-hair bg-surface p-2 text-sm shadow-soft">
          <span className="text-muted">
            已选 <span className="font-medium text-ink">{checked.size}</span> 项
          </span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="inline-flex items-center gap-1 rounded bg-error/10 px-2 py-1 text-xs font-medium text-error hover:bg-error/20 disabled:opacity-50"
          >
            <Trash2 aria-hidden className="size-3" />
            {pending ? "删除中…" : "批量删除"}
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