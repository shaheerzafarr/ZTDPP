import { APP_CONFIG } from "@/config";
import { format, formatDistanceToNowStrict, parseISO } from "date-fns";

export const baseURL = APP_CONFIG.API_BASE_URL;

export function getRoleName(user) {
  const role = user?.role;
  if (!role) return null;
  return typeof role === "string" ? role : role.name ?? null;
}

export function getDisplayName(user) {
  if (!user) return "";
  return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email || "User";
}

export function getInitials(name = "") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

export function shortHash(hash, head = 8, tail = 6) {
  if (!hash) return "—";
  if (hash.length <= head + tail + 1) return hash;
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`;
}

export function shortId(id, tail = 8) {
  if (!id) return "—";
  const last = id.split(":").pop();
  return last.length > tail ? `…${last.slice(-tail)}` : last;
}

export function toDate(value) {
  if (!value) return null;
  try {
    const d = typeof value === "string" ? parseISO(value) : new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export function formatDate(value, pattern = "MMM d, yyyy") {
  const d = toDate(value);
  return d ? format(d, pattern) : "—";
}

export function formatDateTime(value) {
  const d = toDate(value);
  return d ? format(d, "MMM d, yyyy HH:mm") : "—";
}

export function timeAgo(value) {
  const d = toDate(value);
  return d ? `${formatDistanceToNowStrict(d)} ago` : "—";
}

export function formatBytes(bytes) {
  if (typeof bytes !== "number" || Number.isNaN(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatPercent(value, digits = 0) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatNumber(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "0";
  return value.toLocaleString("en-US");
}

export function titleCase(value = "") {
  return String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Score 0-100 -> tone used by badges / gauges. */
export function scoreTone(score) {
  if (typeof score !== "number") return "neutral";
  if (score >= 80) return "success";
  if (score >= 60) return "info";
  if (score >= 40) return "warning";
  return "danger";
}

export function truncateText(text, maxLength) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}
