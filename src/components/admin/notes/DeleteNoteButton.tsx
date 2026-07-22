"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";

import { softDeleteNoteAction } from "@/components/admin/notes/actions";

interface DeleteNoteButtonProps {
  id: string;
  title: string;
}

export function DeleteNoteButton({ id, title }: DeleteNoteButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (pending) return;
    if (!window.confirm(`\u786e\u5b9a\u8981\u5220\u9664\u7b14\u8bb0\u300a${title}\u300b\u5417\uff1f\u5220\u9664\u540e\u53ef\u4ee5\u4ece\u300c\u5df2\u5f52\u6863\u300d\u7b5b\u9009\u4e2d\u627e\u56de\u3002`)) return;

    startTransition(async () => {
      try {
        const result = await softDeleteNoteAction(id);
        if (result.ok) {
          router.refresh();
          return;
        }
        window.alert(result.error || "\u5220\u9664\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5");
      } catch {
        window.alert("\u5220\u9664\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      aria-label={`\u5220\u9664\u7b14\u8bb0\u300a${title}\u300b`}
      title={`\u5220\u9664\u7b14\u8bb0\u300a${title}\u300b`}
      className="inline-flex items-center gap-1 text-xs text-error underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Trash2 aria-hidden className="size-3.5" />
      {pending ? "\u5220\u9664\u4e2d\u2026" : "\u5220\u9664"}
    </button>
  );
}