/**
 * Domain vocabulary shared by every ZTDPP screen. Mirrors the backend enums
 * in Backend/src/common/constants/enums/enums.ts.
 */

export const VERDICTS = {
  trusted: { label: "Trusted", tone: "success", description: "Provenance verified and consistent." },
  likely_authentic: { label: "Likely authentic", tone: "info", description: "Strong indicators, minor gaps." },
  suspicious: { label: "Suspicious", tone: "warning", description: "Conflicting or missing evidence." },
  untrusted: { label: "Untrusted", tone: "danger", description: "Strong indicators of manipulation or unknown origin." },
};

export const ORIGINS = {
  camera: { label: "Camera captured", short: "Camera", tone: "success" },
  ai_generated: { label: "AI generated", short: "AI", tone: "info" },
  digital_creation: { label: "Digital creation", short: "Digital", tone: "neutral" },
  edited: { label: "Edited", short: "Edited", tone: "warning" },
  ai_generated_edited: { label: "AI generated, then edited", short: "AI + edited", tone: "warning" },
  unknown: { label: "Unknown", short: "Unknown", tone: "neutral" },
};

export const CLASSIFICATIONS = {
  camera_captured: ORIGINS.camera,
  ai_generated: ORIGINS.ai_generated,
  edited: ORIGINS.edited,
  ai_generated_edited: ORIGINS.ai_generated_edited,
  digital_creation: ORIGINS.digital_creation,
  unknown: ORIGINS.unknown,
};

export const SOURCE_TYPES = [
  { value: "camera", label: "Camera captured" },
  { value: "ai_generated", label: "AI generated" },
  { value: "digital_creation", label: "Digital creation (drawn / rendered)" },
];

export const PROVENANCE_ACTIONS = [
  { value: "c2pa.edited", label: "Generic edit" },
  { value: "c2pa.ai_edited", label: "AI assisted edit (inpainting, upscaling…)" },
  { value: "c2pa.cropped", label: "Cropped" },
  { value: "c2pa.resized", label: "Resized" },
  { value: "c2pa.filtered", label: "Filter applied" },
  { value: "c2pa.color_adjustments", label: "Colour adjustments" },
  { value: "c2pa.drawing", label: "Drawing / painting" },
  { value: "c2pa.placed", label: "Object placed" },
  { value: "c2pa.removed", label: "Object removed" },
  { value: "c2pa.transcoded", label: "Transcoded / re-encoded" },
  { value: "c2pa.watermarked", label: "Watermarked" },
];

export const ACTION_LABELS = {
  "c2pa.created": "Captured / created",
  "c2pa.ai_generated": "AI generated",
  ...Object.fromEntries(PROVENANCE_ACTIONS.map((a) => [a.value, a.label])),
  "c2pa.unknown": "Unknown action",
};

export const API_SCOPES = [
  { value: "provenance:write", label: "Register content", description: "POST /provenance/register and /provenance/edit" },
  { value: "provenance:read", label: "Read provenance", description: "Lookup manifests and history" },
  { value: "verify", label: "Verify", description: "POST /verify and read reports" },
];

export const MATCH_LABELS = {
  exact: "Exact match",
  near: "Near match",
  none: "No record",
};

export const SEVERITY_TONES = {
  critical: "danger",
  warning: "warning",
  positive: "success",
  info: "info",
};

export function aiSignalLabel(label) {
  if (label === "fake") return "AI-generated signal";
  if (label === "real") return "No AI pixel signal";
  return label ? String(label).replace(/_/g, " ") : "Unknown";
}

export const ROLE_SUPER_ADMIN = "super-admin";
export const ROLE_USER = "user";
