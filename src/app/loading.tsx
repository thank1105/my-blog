// Global loading skeleton (Phase 2 / Day 2). Rendered by Suspense while
// any server component under app/ is fetching. A page-level
// `loading.tsx` would replace this for that subtree; we keep one at the
// root so unauthenticated visitors (e.g. /login redirects) don't see
// a blank frame.

export default function GlobalLoading() {
  return (
    <div className="mx-auto flex max-w-container flex-col gap-6 px-8 py-16">
      <div className="h-8 w-40 animate-pulse rounded bg-hair" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-hair" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-hair" />
    </div>
  );
}
