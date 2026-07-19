"use client";

// Client island that fires once per mount to bump the note's
// viewCount via /api/notes/[id]/view. The Route Handler is the only
// place that writes the viewed-note-<id> cookie (Server Components
// cannot write cookies in Next.js 15).
//
// Renders nothing visible -- the page already shows the current
// viewCount from SSR; this just nudges the DB on first visit.

import { useEffect } from "react";

export interface NoteViewIncrementerProps {
  noteId: string;
}

export function NoteViewIncrementer({ noteId }: NoteViewIncrementerProps) {
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/notes/${noteId}/view`, { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.deduped) return;
      })
      .catch(() => {
        // Best-effort; ignore network errors.
      });
    return () => {
      cancelled = true;
    };
  }, [noteId]);
  return null;
}
