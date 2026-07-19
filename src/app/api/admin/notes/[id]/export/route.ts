// API route: export a note as .md file download (Phase 4).

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getNote, exportNoteAsMarkdown } from "@/server/notes";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { id } = await params;
  const note = await getNote(id);
  if (!note) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const md = exportNoteAsMarkdown(note);
  const safeName = note.slug.replace(/[^a-z0-9-]/g, "-");

  return new NextResponse(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeName}.md"`,
    },
  });
}
