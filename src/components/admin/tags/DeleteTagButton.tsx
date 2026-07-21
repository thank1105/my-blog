"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";

import { deleteTagAction } from "@/components/admin/tags/actions";

interface DeleteTagButtonProps {
  id: string;
  name: string;
}

export function DeleteTagButton({ id, name }: DeleteTagButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (pending) return;
    if (!window.confirm(`确定要删除标签“${name}”吗？所有关联会被清理。`)) return;

    startTransition(async () => {
      try {
        const result = await deleteTagAction(id);
        if (result.ok) {
          router.refresh();
          return;
        }
        window.alert(result.error || "删除失败，请稍后重试");
      } catch {
        window.alert("删除失败，请稍后重试");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      aria-label={`删除标签“${name}”`}
      title={`删除标签“${name}”`}
      className="inline-flex items-center gap-1 text-xs text-error underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Trash2 aria-hidden className="size-3.5" />
      {pending ? "删除中…" : "删除"}
    </button>
  );
}
