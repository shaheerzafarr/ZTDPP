"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { copyToClipboard, shortHash } from "@/resources/utils/helper";
import classes from "./HashChip.module.css";

/** Monospace hash / id with one-click copy. */
export default function HashChip({ value, label, head = 10, tail = 8, full = false, className }) {
  const [copied, setCopied] = useState(false);
  if (!value) return <span className={classes.empty}>—</span>;

  const handleCopy = async (e) => {
    e.stopPropagation();
    if (await copyToClipboard(value)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <span className={cn(classes.chip, full && classes.full, className)} title={value}>
      {label && <span className={classes.label}>{label}</span>}
      <code className={classes.code}>{full ? value : shortHash(value, head, tail)}</code>
      <button type="button" className={classes.copy} onClick={handleCopy} aria-label="Copy">
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
    </span>
  );
}
