import * as React from "react";

import { cn } from "@/lib/utils";
import classes from "./input.module.css";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return <input type={type} className={cn(classes.input, className)} ref={ref} {...props} />;
});
Input.displayName = "Input";

export { Input };
