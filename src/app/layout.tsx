import type { Metadata } from "next";
import localFont from "next/font/local";

import "./globals.css";

/*
 * Self-hosted Latin + CJK fonts via `next/font/local`.
 *
 * Why local + not `next/font/google`?
 *   The user explicitly asked to keep the whole project free of any
 *   outbound network requests on `pnpm dev` / `pnpm build`. `next/font/google`
 *   reaches Google Fonts on first build; `next/font/local` reads .woff2/.otf
 *   from `src/fonts/`, hashes them, and self-hosts the result under
 *   `.next/static/media/`. The browser never sees a third-party domain.
 *
 * File summary (see src/fonts/):
 *   - Inter Regular / Medium / Bold .woff2            ~110 KB each  (Latin UI)
 *   - JetBrains Mono Regular / Medium .woff2          ~90  KB each  (code)
 *   - Source Han Sans CN Regular / Bold .otf          ~8   MB each  (思源黑体, GB2312)
 *   - Source Han Serif CN Regular / Bold .otf         ~11  MB each  (思源宋体, GB2312)
 *   - All under SIL OFL 1.1; redistributable.
 *
 * Each `next/font/local` instance exposes its hashed font-family through
 * the CSS variable we declare below. Tailwind reads those variables
 * directly in `tailwind.config.ts`, and we keep OS-level fallbacks after
 * them so a woff2/otf load failure still renders with the user's system UI
 * font.
 */

const inter = localFont({
  src: [
    { path: "../fonts/Inter-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/Inter-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/Inter-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const sourceHanSansCN = localFont({
  src: [
    { path: "../fonts/SourceHanSansCN-Regular.otf", weight: "400", style: "normal" },
    { path: "../fonts/SourceHanSansCN-Bold.otf", weight: "700", style: "normal" },
  ],
  variable: "--font-sans-cn",
  display: "swap",
  fallback: ["PingFang SC", "Microsoft YaHei", "sans-serif"],
});

const sourceHanSerifCN = localFont({
  src: [
    { path: "../fonts/SourceHanSerifCN-Regular.otf", weight: "400", style: "normal" },
    { path: "../fonts/SourceHanSerifCN-Bold.otf", weight: "700", style: "normal" },
  ],
  variable: "--font-serif",
  display: "swap",
  fallback: ["Songti SC", "STSong", "serif"],
});

const jetbrainsMono = localFont({
  src: [
    { path: "../fonts/JetBrainsMono-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/JetBrainsMono-Medium.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-mono",
  display: "swap",
  fallback: ["ui-monospace", "Menlo", "monospace"],
});

export const metadata: Metadata = {
  title: {
    default: "小川记事",
    template: "%s | 小川记事",
  },
  description: "一个独立创作者的日常与记录。",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${inter.variable} ${sourceHanSansCN.variable} ${sourceHanSerifCN.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-bg font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
