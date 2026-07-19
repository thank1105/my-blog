"use client";

// Client island that walks the DOM after mount, finds every
// <pre data-copy-target> emitted by the MDX renderer, and injects a
// <CopyButton /> into it. Runs once per mount; cleanup unmounts the
// React roots so HMR + SPA navigations do not leak listeners.

import { useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";

import { CopyButton } from "./CopyButton";

export function CodeBlockEnhancer() {
  useEffect(() => {
    const pres = Array.from(
      document.querySelectorAll<HTMLPreElement>("pre[data-copy-target]"),
    );
    const roots: Root[] = [];
    for (const pre of pres) {
      if (pre.querySelector("[data-copy-button-root]")) continue;
      const slot = document.createElement("div");
      slot.setAttribute("data-copy-button-root", "");
      pre.appendChild(slot);
      const root = createRoot(slot);
      root.render(<CopyButton />);
      roots.push(root);
    }
    return () => {
      for (const r of roots) r.unmount();
    };
  }, []);
  return null;
}
