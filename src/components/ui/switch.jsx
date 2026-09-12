import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";
import classes from "./switch.module.css";

const Switch = React.forwardRef(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root className={cn("peer", classes.switch, className)} {...props} ref={ref}>
    <SwitchPrimitives.Thumb className={cn(classes.thumb)} />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
