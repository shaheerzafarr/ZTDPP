"use client";
import classes from "./StatusBadge.module.css";

export function StatusBadge({ status }) {
  return (
    <span className={classes.badge} data-status={status}>
      {status}
    </span>
  );
}

export default StatusBadge;
