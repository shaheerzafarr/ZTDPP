"use client";
import { cn } from "@/lib/utils";
import { CLASSIFICATIONS, MATCH_LABELS, ORIGINS, VERDICTS } from "@/resources/constants/ztdpp";
import classes from "./ToneBadge.module.css";

/** Generic pill. tone: success | info | warning | danger | neutral */
export function ToneBadge({ tone = "neutral", children, className, size = "sm", dot = false }) {
  return (
    <span className={cn(classes.badge, className)} data-tone={tone} data-size={size}>
      {dot && <span className={classes.dot} />}
      {children}
    </span>
  );
}

export function VerdictBadge({ verdict, size }) {
  const meta = VERDICTS[verdict] ?? { label: verdict ?? "—", tone: "neutral" };
  return (
    <ToneBadge tone={meta.tone} size={size} dot>
      {meta.label}
    </ToneBadge>
  );
}

export function OriginBadge({ origin, size, short = false }) {
  const meta = ORIGINS[origin] ?? ORIGINS.unknown;
  return (
    <ToneBadge tone={meta.tone} size={size}>
      {short ? meta.short : meta.label}
    </ToneBadge>
  );
}

export function ClassificationBadge({ classification, basis, size }) {
  const meta = CLASSIFICATIONS[classification] ?? ORIGINS.unknown;
  return (
    <ToneBadge tone={meta.tone} size={size}>
      {meta.label}
      {basis === "inferred" && <span className={classes.muted}> · inferred</span>}
    </ToneBadge>
  );
}

export function MatchBadge({ match, size }) {
  const tone = match === "exact" ? "success" : match === "near" ? "warning" : "neutral";
  return (
    <ToneBadge tone={tone} size={size}>
      {MATCH_LABELS[match] ?? match ?? "—"}
    </ToneBadge>
  );
}

export function StatusBadge({ status, size }) {
  const tone =
    status === "active" || status === "sealed"
      ? "success"
      : status === "pending"
        ? "warning"
        : status === "revoked" || status === "inactive"
          ? "danger"
          : "neutral";
  return (
    <ToneBadge tone={tone} size={size}>
      {status ?? "—"}
    </ToneBadge>
  );
}

export default ToneBadge;
