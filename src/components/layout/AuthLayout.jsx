"use client";
import React from "react";
import { ShieldCheck } from "lucide-react";
import { APP_CONFIG } from "@/config";
import { cn } from "@/lib/utils";
import classes from "./AuthLayout.module.css";

export default function AuthLayout({ children, badge }) {
  return (
    <div className={cn("auth-wave-texture", classes.wrapper)}>
      <div className={classes.inner}>
        <div className={classes.header}>
          <div className={classes.brand}>
            <span className={classes.brandMark}>
              <ShieldCheck size={22} />
            </span>
            <span>
              <span className={classes.brandName}>{APP_CONFIG.APP_NAME}</span>
              <span className={classes.brandTag}>Zero Trust Digital Provenance</span>
            </span>
          </div>
          {badge && <span className={classes.badge}>{badge}</span>}
        </div>
        <div className={classes.card}>{children}</div>
      </div>
    </div>
  );
}
