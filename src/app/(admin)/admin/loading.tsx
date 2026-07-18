// Admin loading skeleton. Two stacked stat-card placeholders mimic the
// real dashboard so the layout doesn't shift when data streams in.

export default function AdminLoading() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-md border border-hair bg-surface p-5 shadow-soft"
          >
            <div className="h-3 w-16 animate-pulse rounded bg-hair" />
            <div className="mt-3 h-6 w-32 animate-pulse rounded bg-hair" />
            <div className="mt-2 h-3 w-20 animate-pulse rounded bg-hair" />
          </div>
        ))}
      </div>
      <div className="rounded-md border border-hair bg-surface p-8 shadow-soft">
        <div className="h-5 w-24 animate-pulse rounded bg-hair" />
        <div className="mt-2 h-3 w-80 max-w-full animate-pulse rounded bg-hair" />
        <div className="mt-6 h-12 w-full animate-pulse rounded bg-hair" />
      </div>
    </div>
  );
}
