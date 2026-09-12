"use client";
import { cn } from "@/lib/utils";
import { scoreTone } from "@/resources/utils/helper";
import classes from "./TrustGauge.module.css";

/**
 * Circular trust score gauge (0-100). Pure SVG, theme aware via tone tokens.
 */
export default function TrustGauge({ score, size = 168, stroke = 12, label = "Trust score", sublabel, className }) {
  const value = typeof score === "number" ? Math.max(0, Math.min(100, score)) : null;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = value === null ? circumference : circumference * (1 - value / 100);
  const tone = scoreTone(value);

  return (
    <div className={cn(classes.root, className)} data-tone={tone} style={{ width: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={classes.svg}>
        <circle
          className={classes.track}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          className={classes.value}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className={classes.center}>
        <span className={classes.score}>{value === null ? "—" : value}</span>
        <span className={classes.label}>{label}</span>
        {sublabel && <span className={classes.sublabel}>{sublabel}</span>}
      </div>
    </div>
  );
}

/** Horizontal score bar for breakdown rows. */
export function ScoreBar({ score, max = 100, tone, className }) {
  const pct = max > 0 ? Math.round((Math.max(0, score) / max) * 100) : 0;
  return (
    <div className={cn(classes.bar, className)} data-tone={tone ?? scoreTone(pct)}>
      <div className={classes.barFill} style={{ width: `${pct}%` }} />
    </div>
  );
}
