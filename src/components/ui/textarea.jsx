import * as React from "react";

import { cn } from "@/lib/utils";
import classes from "./textarea.module.css";

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return <textarea className={cn(classes.textarea, className)} ref={ref} {...props} />;
});
Textarea.displayName = "Textarea";

export { Textarea };
