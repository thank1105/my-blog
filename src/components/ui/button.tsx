import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * shadcn/ui Button (new-york flavour), adapted to the project token set.
 *
 * Notes:
 *   - Dropped `asChild` / `@radix-ui/react-slot` on purpose for Phase 2:
 *     we don't render `<Button><Link/></Button>` yet, and avoiding the
 *     dependency keeps the bundle smaller. Re-introduce in Phase 3 when
 *     article cards need the polymorphic API.
 *   - Variants follow the design tokens (accent / danger / hair / bg) so
 *     we never reach for an arbitrary hex at the call site.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-1 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-accent text-white shadow-soft hover:bg-accent/90",
        destructive: "bg-danger text-white shadow-soft hover:bg-danger/90",
        outline:
          "border border-hair bg-surface text-ink shadow-soft hover:border-accent hover:text-accent",
        secondary: "bg-hair text-ink hover:bg-hair/70",
        ghost: "text-ink hover:bg-bg hover:text-accent",
        link: "text-accent underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded px-3 text-xs",
        lg: "h-11 rounded-md px-6 text-base",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
