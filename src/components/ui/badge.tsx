import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * shadcn/ui Badge — small inline label.
 *
 * Use for status pills (DRAFT / 已发布), tags (写作 / 观察), and counts.
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
  {
    variants: {
      variant: {
        default: "border-transparent bg-accent text-white",
        secondary: "border-transparent bg-hair text-ink",
        outline: "border-hair text-ink",
        soft: "border-transparent bg-accent-soft text-accent",
        success: "border-transparent bg-success/10 text-success",
        danger: "border-transparent bg-danger/10 text-danger",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
