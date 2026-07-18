import type { Config } from "tailwindcss";

// Design tokens source: docs/design-decisions.md (merged into REQUIREMENTS.md section 6).
const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#FAFAFA",
        surface: "#FFFFFF",
        ink: "#1A1A1A",
        muted: "#6B7280",
        hair: "#E5E7EB",
        accent: "#E85A2C",
        "accent-soft": "#FBE6DC",
        success: "#10B981",
        danger: "#EF4444",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Noto Serif SC", "Source Han Serif SC", "serif"],
        sans: ["var(--font-sans)", "Inter", "Noto Sans SC", "Source Han Sans SC", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "Menlo", "monospace"],
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
        soft: "0 1px 3px rgba(0, 0, 0, 0.05)",
        float: "0 4px 12px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
