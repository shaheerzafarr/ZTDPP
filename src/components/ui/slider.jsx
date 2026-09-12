import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";
import classes from "./slider.module.css";

const Slider = React.forwardRef(({ className, ...props }, ref) => (
  <SliderPrimitive.Root ref={ref} className={cn(classes.root, className)} {...props}>
    <SliderPrimitive.Track className={classes.track}>
      <SliderPrimitive.Range className={classes.range} />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className={classes.thumb} />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
