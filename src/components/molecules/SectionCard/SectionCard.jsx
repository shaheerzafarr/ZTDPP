"use client";
import { cn } from "@/lib/utils";
import classes from "./SectionCard.module.css";

/** Card with optional header row (title, description, actions). */
export default function SectionCard({ title, description, actions, children, className, bodyClassName, padded = true }) {
  return (
    <section className={cn(classes.card, className)}>
      {(title || actions) && (
        <header className={classes.header}>
          <div>
            {title && <h2 className={classes.title}>{title}</h2>}
            {description && <p className={classes.description}>{description}</p>}
          </div>
          {actions && <div className={classes.actions}>{actions}</div>}
        </header>
      )}
      <div className={cn(padded && classes.body, bodyClassName)}>{children}</div>
    </section>
  );
}
