// POST /api/notes/[id]/view -- bump viewCount once per (id, client)
// per 30-minute window. Mirror of /api/articles/[id]/view so notes
// share the same read-cookie dedupe UX as articles.

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { incrementNoteView } from "@/server/notes-public";

const VIEW_COOKIE_MAX_AGE = 30 * 60; // 30 minutes

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const cookieJar = await cookies();
  const key = `viewed-note-${id}`;
  if (cookieJar.get(key)) {
    return NextResponse.json({ ok: true, deduped: true });
  }
  try {
    await incrementNoteView(id);
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
  cookieJar.set({
    name: key,
    value: "1",
    path: "/",
    maxAge: VIEW_COOKIE_MAX_AGE,
    sameSite: "lax",
    httpOnly: false,
  });
  return NextResponse.json({ ok: true });
}
