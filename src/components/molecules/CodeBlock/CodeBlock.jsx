"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { copyToClipboard } from "@/resources/utils/helper";
import classes from "./CodeBlock.module.css";

/** Pre-formatted code with a copy button. Accepts a string or an object (pretty printed). */
export default function CodeBlock({ code, language = "text", title, className, maxHeight }) {
  const [copied, setCopied] = useState(false);
  const text = typeof code === "string" ? code : JSON.stringify(code, null, 2);

  const handleCopy = async () => {
    if (await copyToClipboard(text)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className={cn(classes.root, className)}>
      <div className={classes.bar}>
        <span className={classes.title}>{title ?? language}</span>
        <button type="button" onClick={handleCopy} className={classes.copy}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className={classes.pre} style={maxHeight ? { maxHeight } : undefined}>
        <code>{text}</code>
      </pre>
    </div>
  );
}
