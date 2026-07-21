"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";

import { softDeleteArticleAction } from "@/components/admin/articles/actions";

interface DeleteArticleButtonProps {
  id: string;
  title: string;
}

export function DeleteArticleButton({ id, title }: DeleteArticleButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (pending) return;
    if (!window.confirm(`确定要将《${title}》移入回收站吗？`)) return;

    startTransition(async () => {
      try {
        const result = await softDeleteArticleAction(id);
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
      aria-label={`删除《${title}》`}
      title={`删除《${title}》`}
      className="inline-flex items-center gap-1 text-error underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Trash2 aria-hidden className="size-3.5" />
      {pending ? "删除中…" : "删除"}
    </button>
  );
}
