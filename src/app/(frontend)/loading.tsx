// Front-end loading skeleton. Mirrors the structure of the home page so
// the visible "shape" doesn't jump when the real content streams in.

export default function FrontendLoading() {
  return (
    <>
      {/* Hero skeleton */}
      <section
        aria-hidden
        className="flex h-[42vh] min-h-[320px] items-end border-b border-hair bg-gradient-to-br from-hair/40 via-bg to-accent-soft/30"
      >
        <div className="mx-auto w-full max-w-container px-8 pb-10">
          <div className="h-3 w-32 animate-pulse rounded bg-hair" />
          <div className="mt-4 h-12 w-80 animate-pulse rounded bg-hair" />
          <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-hair" />
        </div>
      </section>

      {/* 4 stream cards skeleton */}
      <section className="mx-auto max-w-container px-8 py-16">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="rounded-md border border-hair bg-surface p-6 shadow-soft">
              <div className="h-3 w-16 animate-pulse rounded bg-hair" />
              <div className="mt-3 h-5 w-3/4 animate-pulse rounded bg-hair" />
              <div className="mt-2 h-3 w-full animate-pulse rounded bg-hair" />
              <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-hair" />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
