import { cn } from "@/lib/utils";
import classes from "./skeleton.module.css";

function Skeleton({ className, ...props }) {
  return <div className={cn(classes.skeleton, className)} {...props} />;
}

export { Skeleton };
