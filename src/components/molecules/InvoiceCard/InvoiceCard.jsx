"use client";
import { StatusBadge } from "@/components/molecules/StatusBadge/StatusBadge";
import classes from "./InvoiceCard.module.css";

export function InvoiceCard({ clientName, dueDate, total, status }) {
  return (
    <div className={classes.root}>
      <div className={classes.info}>
        <p className={classes.clientName}>{clientName}</p>
        <p className={classes.dueDate}>Due {dueDate}</p>
      </div>
      <div className={classes.meta}>
        <span className={classes.total}>${total.toFixed(2)}</span>
        <StatusBadge status={status} />
      </div>
    </div>
  );
}

export default InvoiceCard;
