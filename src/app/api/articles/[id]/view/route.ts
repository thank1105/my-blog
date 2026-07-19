// POST /api/articles/[id]/view -- bump viewCount once per (id, client)
// per 30-minute window. Called by <ArticleViewIncrementer /> on mount;
// the page itself stays a pure reader so the SSR payload is cache-friendly.

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { incrementArticleView } from "@/server/articles-public";

const VIEW_COOKIE_MAX_AGE = 30 * 60; // 30 minutes

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const cookieJar = await cookies();
  const key = `viewed-${id}`;
  if (cookieJar.get(key)) {
    return NextResponse.json({ ok: true, deduped: true });
  }
  try {
    await incrementArticleView(id);
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
