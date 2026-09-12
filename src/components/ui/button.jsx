import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";
import classes from "./button.module.css";

const buttonVariants = cva(classes.btn, {
  variants: {
    variant: {
      default: classes.variantDefault,
      destructive: classes.variantDestructive,
      outline: classes.variantOutline,
      secondary: classes.variantSecondary,
      ghost: classes.variantGhost,
      link: classes.variantLink,
    },
    size: {
      default: classes.sizeDefault,
      sm: classes.sizeSm,
      lg: classes.sizeLg,
      icon: classes.sizeIcon,
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";

export { Button, buttonVariants };
