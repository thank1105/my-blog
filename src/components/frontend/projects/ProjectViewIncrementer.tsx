"use client";

// Client island that fires once per mount to bump the project's
// viewCount via /api/projects/[id]/view. The Route Handler is the only
// place that writes the viewed-project-<id> cookie (Server Components
// cannot write cookies in Next.js 15).
//
// Renders nothing visible -- the page already shows the current
// viewCount from SSR; this just nudges the DB on first visit.

import { useEffect } from "react";

export interface ProjectViewIncrementerProps {
  projectId: string;
}

export function ProjectViewIncrementer({ projectId }: ProjectViewIncrementerProps) {
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/projects/${projectId}/view`, { method: "POST" })
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
  }, [projectId]);
  return null;
}
