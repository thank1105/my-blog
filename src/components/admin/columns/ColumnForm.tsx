"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { createColumnAction, deleteColumnAction, updateColumnAction } from "./actions";

const formSchema = z.object({
  name: z.string().trim().min(1, "专栏名称不能为空").max(80),
  slug: z.string().trim().max(80).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).optional().or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  parentId: z.string().optional(),
  order: z.number().int().min(0),
});

type Values = z.infer<typeof formSchema>;

export function ColumnForm({
  mode,
  columnId,
  initial,
  rootOptions,
}: {
  mode: "create" | "edit";
  columnId?: string;
  initial: Values;
  rootOptions: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(formSchema),
    defaultValues: initial,
  });

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    const result = columnId
      ? await updateColumnAction(columnId, values)
      : await createColumnAction(values);
    if (!result.ok) {
      setServerError(result.error);
      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        setError(field as keyof Values, { message });
      }
      return;
    }
    if (result.redirectTo) router.push(result.redirectTo);
    router.refresh();
  });

  async function remove() {
    if (!columnId || !window.confirm("确定删除这个专栏吗？相关文章将变为无专栏。")) return;
    const result = await deleteColumnAction(columnId);
    if (!result.ok) return setServerError(result.error);
    router.push(result.redirectTo ?? "/admin/columns");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="rounded-md border border-hair bg-surface p-6 shadow-soft">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="名称" error={errors.name?.message}>
            <input {...register("name")} className="form-control" />
          </Field>
          <Field label="slug" error={errors.slug?.message} hint="留空时根据名称自动生成。">
            <input {...register("slug")} className="form-control font-mono" />
          </Field>
          <Field label="父专栏" error={errors.parentId?.message} hint="留空创建一级专栏；只能选择一级专栏作为父级。">
            <select {...register("parentId")} className="form-control">
              <option value="">无，作为一级专栏</option>
              {rootOptions.filter((option) => option.id !== columnId).map((option) => (
                <option key={option.id} value={option.id}>{option.name}</option>
              ))}
            </select>
          </Field>
          <Field label="排序" error={errors.order?.message} hint="数字越小越靠前，同级内生效。">
            <input type="number" min={0} {...register("order", { valueAsNumber: true })} className="form-control w-32 font-mono" />
          </Field>
        </div>
        <div className="mt-5">
          <Field label="描述" error={errors.description?.message}>
            <textarea rows={4} {...register("description")} className="form-control resize-y" />
          </Field>
        </div>
      </div>

      {serverError ? <p role="alert" className="rounded border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{serverError}</p> : null}

      <div className="flex items-center justify-between gap-3">
        <Link href="/admin/columns" className="text-sm text-muted hover:text-accent">返回专栏列表</Link>
        <div className="flex gap-2">
          {mode === "edit" ? (
            <button type="button" onClick={remove} className="inline-flex items-center gap-1.5 rounded border border-hair px-3 py-2 text-sm text-ink hover:border-danger hover:text-danger">
              <Trash2 aria-hidden className="size-4" />删除
            </button>
          ) : null}
          <button disabled={isSubmitting} className="inline-flex items-center gap-1.5 rounded bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-60">
            <Save aria-hidden className="size-4" />{isSubmitting ? "保存中" : "保存专栏"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-ink">
      {label}
      <span className="mt-1 block">{children}</span>
      {error ? <span className="mt-1 block text-xs text-danger">{error}</span> : hint ? <span className="mt-1 block text-xs font-normal text-muted">{hint}</span> : null}
    </label>
  );
}
