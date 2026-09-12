"use client";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import classes from "./StripeAlertBar.module.css";

export default function StripeAlertBar() {
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();

  if (dismissed) return null;

  return (
    <div className={classes.root}>
      <div className={classes.content}>
        <AlertTriangle size={18} className={classes.icon} />
        <span className={classes.text}>
          Connect Stripe to proceed with bookings.{" "}
          <button type="button" onClick={() => router.push("/settings?tab=payment")}
            className={classes.link}>
            Connect now
          </button>
        </span>
      </div>
    </div>
  );
}
