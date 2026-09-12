"use client";
import { cn } from "@/lib/utils";
import classes from "./EmptyState.module.css";

export default function EmptyState({ icon, title, description, action, className, compact = false }) {
  return (
    <div className={cn(classes.root, compact && classes.compact, className)}>
      {icon && <div className={classes.icon}>{icon}</div>}
      <h3 className={classes.title}>{title}</h3>
      {description && <p className={classes.description}>{description}</p>}
      {action && <div className={classes.action}>{action}</div>}
    </div>
  );
}
