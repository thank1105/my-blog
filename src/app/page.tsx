export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-container flex-col items-center justify-center px-8 py-16">
      <div className="rounded-md border border-hair bg-surface px-10 py-12 text-center shadow-soft">
        <p className="font-serif text-sm tracking-widest text-muted">PHASE 0 · FOUNDATION</p>
        <h1 className="mt-3 font-serif text-4xl font-bold text-ink">小川记事</h1>
        <p className="mt-4 max-w-prose text-base text-muted">
          项目脚手架已完成。访问本页看到占位页，即可验证基础工具链。
        </p>
        <p className="mt-2 max-w-prose text-sm text-muted">
          Hello world · scaffold ready
        </p>
      </div>
    </main>
  );
}
