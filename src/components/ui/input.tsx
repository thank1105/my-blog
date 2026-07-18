import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * shadcn/ui Input — single-line text field.
 *
 * Use `aria-invalid` for error styling; pair with `<label>` for accessibility.
 */
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "block w-full rounded border border-hair bg-bg px-3 py-2 text-base text-ink outline-none transition-colors",
          "placeholder:text-muted",
          "focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:ring-danger/30",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
