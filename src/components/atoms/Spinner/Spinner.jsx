"use client";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import classes from "./Spinner.module.css";

export default function Spinner({ className, style }) {
  return (
    <div className={cn(classes.container, className)} style={style}>
      <Loader2 className={classes.icon} />
    </div>
  );
}
