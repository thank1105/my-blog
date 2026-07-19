"use client";

// Client island that fires once per mount to bump the article's
// viewCount via the /api/articles/[id]/view Route Handler. The Route
// Handler is the only place that writes the `viewed-<id>` cookie
// (Server Components cannot write cookies in Next.js 15).
//
// Renders nothing visible -- the page already shows the current
// viewCount from SSR; this just nudges the DB on first visit.

import { useEffect } from "react";

export interface ArticleViewIncrementerProps {
  articleId: string;
}

export function ArticleViewIncrementer({ articleId }: ArticleViewIncrementerProps) {
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/articles/${articleId}/view`, { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.deduped) return;
        // Page already shows the previous viewCount. We could trigger a
        // router.refresh() here to re-render with the bumped value, but
        // for Phase 3 Day 3 the +1 is shown on the next visit -- the
        // server will return the up-to-date count then.
      })
      .catch(() => {
        // Best-effort; ignore network errors.
      });
    return () => {
      cancelled = true;
    };
  }, [articleId]);
  return null;
}
