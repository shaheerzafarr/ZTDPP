import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";
import classes from "./toggle.module.css";

const toggleVariants = cva(classes.toggle, {
  variants: {
    variant: {
      default: classes.variantDefault,
      outline: classes.variantOutline,
    },
    size: {
      default: classes.sizeDefault,
      sm: classes.sizeSm,
      lg: classes.sizeLg,
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

const Toggle = React.forwardRef(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root ref={ref} className={cn(toggleVariants({ variant, size, className }))} {...props} />
));

Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle, toggleVariants };
