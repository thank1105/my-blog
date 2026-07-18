import { Header } from "@/components/frontend/Header";
import { Footer } from "@/components/frontend/Footer";

/**
 * Front-end route group layout (Phase 2 / Day 2).
 *
 * Every page under `(frontend)` gets the public chrome — Header on top,
 * Footer at the bottom, main fills the middle. `/login` deliberately
 * lives at the top level (`app/login/page.tsx`) so it stays chrome-free
 * (a minimal login form is more focused than a website shell).
 *
 * Visual reference: docs/design-explorations/p1-style/01.png.
 * Acceptance (DEVELOPMENT.md Phase 2):
 *   - Frontend has Header (with nav) + Footer.   ✅
 *   - Layout is responsive (Header collapses into a hamburger drawer
 *     under the `sm` breakpoint; see Header.tsx).
 */
export default function FrontendLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
