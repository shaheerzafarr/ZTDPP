"use client";
import React from "react";
import { Fingerprint, Network, ShieldCheck } from "lucide-react";
import { APP_CONFIG } from "@/config";
import { cn } from "@/lib/utils";
import classes from "./AuthLayout.module.css";

export default function AuthLayout({ children, badge }) {
  return (
    <div className={cn("auth-wave-texture", classes.wrapper)}>
      <div className={classes.inner}>
        <aside className={classes.contextPanel}>
          <div className={classes.brand}>
            <span className={classes.brandMark} aria-hidden="true">
              <ShieldCheck size={23} />
            </span>
            <span>
              <span className={classes.brandName}>{APP_CONFIG.APP_NAME}</span>
              <span className={classes.brandTag}>Zero Trust Digital Provenance</span>
            </span>
          </div>

          <div className={classes.message}>
            <p className={classes.eyebrow}>Trust infrastructure for digital media</p>
            <h2>Verify origin. Detect change. Prove integrity.</h2>
            <p>
              Create a defensible chain of custody for every image, from its first
              fingerprint to its latest verification.
            </p>
          </div>

          <div>
            <div className={classes.signalList}>
              <div className={classes.signal}>
                <Fingerprint size={18} />
                <span><strong>Content fingerprints</strong>SHA-256 and perceptual matching</span>
              </div>
              <div className={classes.signal}>
                <Network size={18} />
                <span><strong>Signed provenance</strong>Ledger-backed evidence trails</span>
              </div>
            </div>
            <div className={classes.systemState}>
              <span className={classes.pulse} />
              Verification network ready
            </div>
          </div>
        </aside>

        <main className={classes.formPanel}>
          <div className={classes.mobileBrand}>
            <span className={classes.brandMark}><ShieldCheck size={21} /></span>
            <span className={classes.brandName}>{APP_CONFIG.APP_NAME}</span>
          </div>
          {badge && <span className={classes.badge}>{badge}</span>}
          <div className={classes.card}>{children}</div>
          <p className={classes.securityNote}>Protected by encrypted sessions and zero-trust access controls.</p>
        </main>
      </div>
    </div>
  );
}
