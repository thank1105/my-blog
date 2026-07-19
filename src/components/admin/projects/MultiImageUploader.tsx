"use client";

// MultiImageUploader -- Phase 5 / Day 1.
//
// Behance-style gallery uploader:
//   - One drop zone at the end of the list ("add more")
//   - Each existing image is a card with:
//       drag handle (sortable via @dnd-kit/sortable)
//       thumbnail preview
//       caption input
//       delete button
//   - Cards reorder on drag end; the parent form re-saves with the
//     new order. We also fire `onReorder` so the server can persist
//     immediately (so a refresh between drag and Save does not lose
//     the order).
//
// Data shape (one entry per image):
//   { id?, imageUrl, caption, width?, height? }
//   - `id` is set when the row already lives in `ProjectImage` (edit
//     mode). New uploads leave it undefined; React keys fall back to
//     `imageUrl` in that case.
//   - The parent form owns the array via the Controller in
//     `ProjectForm`. We never mutate server rows from here.

import { useEffect, useRef, useState, useTransition } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ImagePlus, Trash2, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ProjectImageValue {
  /** Server-assigned id; absent for newly uploaded rows not yet saved. */
  id?: string;
  imageUrl: string;
  caption?: string;
  width?: number | null;
  height?: number | null;
}

export interface MultiImageUploaderProps {
  value: ProjectImageValue[];
  onChange: (next: ProjectImageValue[]) => void;
  /**
   * Optional: called after the user releases a drag in the gallery. Use
   * it to persist the new order on the server (the form still has the
   * final say on Save).
   */
  onReorder?: (imageIds: string[]) => void | Promise<void>;
  disabled?: boolean;
  error?: string | null;
}

interface PendingUpload {
  /** Local id used as the React key while the upload is in flight. */
  localId: string;
  previewUrl: string;
  fileName: string;
}

export function MultiImageUploader({
  value,
  onChange,
  onReorder,
  disabled,
  error,
}: MultiImageUploaderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  function patchAt(index: number, patch: Partial<ProjectImageValue>) {
    const next = value.slice();
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function removeAt(index: number) {
    const next = value.slice();
    next.splice(index, 1);
    onChange(next);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = value.findIndex((v) => keyOf(v) === active.id);
    const newIndex = value.findIndex((v) => keyOf(v) === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(value, oldIndex, newIndex);
    onChange(next);
    // Best-effort server persistence: only meaningful in edit mode where
    // every entry has an `id`.
    const ids = next.map((v) => v.id).filter((x): x is string => typeof x === "string");
    if (onReorder && ids.length === next.length && ids.length > 0) {
      startTransition(() => {
        void onReorder(ids);
      });
    }
  }

  async function handleFiles(files: FileList | File[]) {
    setUploadError(null);
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) {
      setUploadError("请选择图片文件");
      return;
    }
    setUploading(true);
    const draft: PendingUpload[] = list.map((f) => ({
      localId: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      previewUrl: URL.createObjectURL(f),
      fileName: f.name,
    }));
    setPending((prev) => [...prev, ...draft]);

    // Upload sequentially so the network is friendly + UI updates per row.
    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      const local = draft[i];
      try {
        const fd = new FormData();
        fd.append("file", file);
        const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error ?? `上传失败 (${r.status})`);
        }
        const data = (await r.json()) as {
          url: string;
          bytes: number;
          mime: string;
        };
        const dims = await readImageDimensions(data.url);
        onChange([
          ...value,
          {
            imageUrl: data.url,
            caption: "",
            width: dims?.width ?? null,
            height: dims?.height ?? null,
          },
        ]);
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "上传失败");
      } finally {
        setPending((prev) => prev.filter((p) => p.localId !== local.localId));
        // Free the object URL we made earlier.
        try {
          URL.revokeObjectURL(local.previewUrl);
        } catch {
          /* noop */
        }
      }
    }
    setUploading(false);
  }

  // Clean up any pending object URLs if the component unmounts mid-upload.
  useEffect(() => {
    return () => {
      pending.forEach((p) => {
        try {
          URL.revokeObjectURL(p.previewUrl);
        } catch {
          /* noop */
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const itemKeys = value.map(keyOf);
  const sortableItems = [...itemKeys, ...pending.map((p) => `pending:${p.localId}`)];

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-medium text-ink">
          作品图集
          <span className="ml-2 text-xs text-muted">
            {value.length} 张{pending.length > 0 ? ` · ${pending.length} 张上传中` : ""}
          </span>
        </label>
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1 rounded border border-hair bg-surface px-2 py-1 text-xs text-ink hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ImagePlus aria-hidden className="size-3.5" />
          添加图片
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="sr-only"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              void handleFiles(e.target.files);
            }
            e.target.value = "";
          }}
        />
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortableItems} strategy={rectSortingStrategy}>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {value.map((img, idx) => (
              <SortableImageCard
                key={keyOf(img)}
                id={keyOf(img)}
                image={img}
                index={idx}
                disabled={disabled}
                onCaptionChange={(v) => patchAt(idx, { caption: v })}
                onRemove={() => removeAt(idx)}
              />
            ))}
            {pending.map((p) => (
              <PendingImageCard key={`pending:${p.localId}`} pending={p} />
            ))}
            <li>
              <DropZone
                disabled={disabled || uploading}
                onFiles={handleFiles}
                onClickPick={() => fileInputRef.current?.click()}
              />
            </li>
          </ul>
        </SortableContext>
      </DndContext>

      {(uploadError || error) && (
        <p className="mt-2 text-xs text-danger">{uploadError ?? error}</p>
      )}
      <p className="mt-2 text-xs text-muted">
        支持 jpg / png / webp / gif / avif，单张不超过 5 MB。拖拽卡片调整顺序，第一张作为列表页封面（若无封面图）。
      </p>
    </div>
  );
}

function keyOf(img: ProjectImageValue): string {
  return img.id ?? `url:${img.imageUrl}`;
}

function SortableImageCard({
  id,
  image,
  index,
  disabled,
  onCaptionChange,
  onRemove,
}: {
  id: string;
  image: ProjectImageValue;
  index: number;
  disabled?: boolean;
  onCaptionChange: (next: string) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-md border border-hair bg-surface shadow-soft",
        isDragging && "z-10 ring-2 ring-accent/40",
      )}
    >
      <div className="relative aspect-[4/3] w-full bg-bg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.imageUrl}
          alt={image.caption || `图片 ${index + 1}`}
          className="absolute inset-0 size-full object-cover"
          loading="lazy"
        />
        <button
          type="button"
          aria-label="拖动排序"
          disabled={disabled}
          {...attributes}
          {...listeners}
          className="absolute left-1 top-1 inline-flex size-7 cursor-grab items-center justify-center rounded bg-ink/60 text-white opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        >
          <GripVertical aria-hidden className="size-4" />
        </button>
        <span className="absolute right-1 top-1 rounded-full bg-ink/70 px-1.5 py-0.5 font-mono text-[10px] text-white">
          #{index + 1}
        </span>
      </div>
      <div className="flex flex-col gap-1 p-2">
        <input
          type="text"
          value={image.caption ?? ""}
          disabled={disabled}
          onChange={(e) => onCaptionChange(e.target.value)}
          placeholder="图片说明（可选）"
          maxLength={200}
          className="block w-full rounded border border-hair bg-bg px-2 py-1 text-xs text-ink outline-none focus-visible:border-accent"
        />
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-muted truncate" title={image.imageUrl}>
            {image.id ? "已保存" : "待保存"}
          </span>
          <button
            type="button"
            disabled={disabled}
            onClick={onRemove}
            aria-label="删除图片"
            className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[11px] text-muted hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed"
          >
            <Trash2 aria-hidden className="size-3" />
            删除
          </button>
        </div>
      </div>
    </li>
  );
}

function PendingImageCard({ pending }: { pending: PendingUpload }) {
  return (
    <li className="flex flex-col overflow-hidden rounded-md border border-dashed border-hair bg-bg/40">
      <div className="relative aspect-[4/3] w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={pending.previewUrl}
          alt={`上传中：${pending.fileName}`}
          className="absolute inset-0 size-full object-cover opacity-70"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-ink/30 text-white">
          <Loader2 aria-hidden className="size-5 animate-spin" />
        </div>
      </div>
      <div className="p-2">
        <p className="truncate text-[11px] text-muted" title={pending.fileName}>
          上传中…
        </p>
      </div>
    </li>
  );
}

function DropZone({
  disabled,
  onFiles,
  onClickPick,
}: {
  disabled?: boolean;
  onFiles: (files: FileList | File[]) => void;
  onClickPick: () => void;
}) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        if (disabled) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        if (disabled) return;
        e.preventDefault();
        setOver(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) onFiles(files);
      }}
      onClick={onClickPick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClickPick();
        }
      }}
      aria-label="拖入或点击添加图片"
      className={cn(
        "flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed text-xs transition-colors",
        over
          ? "border-accent bg-accent-soft text-accent"
          : "border-hair bg-surface text-muted hover:border-accent hover:text-accent",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <ImagePlus aria-hidden className="size-5" />
      <span>拖入或点击上传</span>
    </div>
  );
}

/**
 * Read the pixel dimensions of an image that lives at `url` by loading
 * it into an HTMLImageElement. The server-side `ProjectImage` row
 * stores the values so Day 2's detail layout can decide on-the-fly
 * whether to render 100% / 70% / 80% width based on aspect ratio.
 */
function readImageDimensions(
  url: string,
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = url;
  });
}