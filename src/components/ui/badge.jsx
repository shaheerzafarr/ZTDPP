import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";
import classes from "./badge.module.css";

const badgeVariants = cva(classes.badge, {
  variants: {
    variant: {
      default: classes.default,
      secondary: classes.secondary,
      destructive: classes.destructive,
      outline: classes.outline,
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
