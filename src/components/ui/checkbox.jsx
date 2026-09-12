import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import classes from "./checkbox.module.css";

const Checkbox = React.forwardRef(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root ref={ref} className={cn("peer", classes.checkbox, className)} {...props}>
    <CheckboxPrimitive.Indicator className={cn(classes.indicator)}>
      <Check className={classes.icon} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
