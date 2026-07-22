import type { Config } from "tailwindcss";

// Design tokens source: docs/design-decisions.md (merged into REQUIREMENTS.md section 6).
//
// Font stacks:
//   - Self-hosted fonts are loaded in `src/app/layout.tsx` via
//     `next/font/local`. Each instance exposes a CSS variable that holds
//     the hashed font-family name.
//   - `var(--font-sans)`       -> Inter (Latin UI / body)
//   - `var(--font-sans-cn)`    -> Source Han Sans CN (思源黑体)
//   - `var(--font-serif)`      -> Source Han Serif CN (思源宋体, Chinese titles)
//   - `var(--font-mono)`       -> JetBrains Mono (code)
//   - We keep OS-level fallbacks so the page still renders with the user's
//     system UI font if a font file fails to load.
const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#F6F5F2",
        surface: "#FFFFFF",
        ink: "#172033",
        muted: "#667085",
        hair: "#E2E4E9",
        accent: "#E85A2C",
        "accent-soft": "#FBE6DC",
        indigo: "#4F46E5",
        "indigo-soft": "#ECEBFF",
        teal: "#0F887F",
        "teal-soft": "#E1F3F0",
        success: "#10B981",
        danger: "#EF4444",
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "var(--font-sans-cn)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "PingFang SC",
          "Hiragino Sans GB",
          "Microsoft YaHei UI",
          "Microsoft YaHei",
          "Source Han Sans CN",
          "Noto Sans CJK SC",
          "WenQuanYi Micro Hei",
          "system-ui",
          "sans-serif",
        ],
        serif: [
          "var(--font-serif)",
          "var(--font-sans-cn)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Songti SC",
          "STSong",
          "Source Han Serif CN",
          "Noto Serif CJK SC",
          "Hiragino Mincho ProN",
          "SimSun",
          "serif",
        ],
        mono: [
          "var(--font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "SF Mono",
          "Menlo",
          "Consolas",
          "Liberation Mono",
          "Roboto Mono",
          "Courier New",
          "monospace",
        ],
      },
      maxWidth: {
        container: "1280px",
        prose: "720px",
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
      },
      boxShadow: {
        soft: "0 1px 3px rgba(23, 32, 51, 0.06)",
        float: "0 10px 30px rgba(23, 32, 51, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
