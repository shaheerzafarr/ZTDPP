"use client";
import { cn } from "@/lib/utils";
import classes from "./KeyValueList.module.css";

/** Two-column definition list. items: [{ label, value, mono?, hidden? }] */
export default function KeyValueList({ items = [], columns = 1, className, dense = false }) {
  return (
    <dl className={cn(classes.list, dense && classes.dense, className)} data-columns={columns}>
      {items
        .filter((i) => i && !i.hidden)
        .map((item, i) => (
          <div key={i} className={classes.row}>
            <dt className={classes.label}>{item.label}</dt>
            <dd className={cn(classes.value, item.mono && classes.mono)}>
              {item.value ?? <span className={classes.empty}>—</span>}
            </dd>
          </div>
        ))}
    </dl>
  );
}
