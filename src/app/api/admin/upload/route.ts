// Cover image upload endpoint (Phase 3 / Day 1).
//
// Accepts multipart/form-data with a single `file` field, runs the same
// MIME + size + magic-byte validation as src/lib/upload.ts, and returns
// the public URL the form should persist into Article.coverImage.
//
// Auth: ADMIN-only -- same shape as the rest of /admin/*. We re-check
// here because the upload URL lives outside the (admin) route group
// (so it does not inherit that group`s <AdminShell> chrome).

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { saveCoverImage, UploadError } from "@/lib/upload";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "缺少 file 字段" }, { status: 400 });
  }

  try {
    const saved = await saveCoverImage(file);
    return NextResponse.json(saved);
  } catch (err) {
    if (err instanceof UploadError) {
      console.warn(`[upload] rejected ${file.name} (${file.size} bytes, ${file.type || "无 MIME"}): ${err.message}`);
      return NextResponse.json({ error: err.message, declaredType: file.type }, { status: err.status });
    }
    console.error(`[upload] unexpected ${file.name} (${file.size} bytes, ${file.type || "无 MIME"})`, err);
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}
