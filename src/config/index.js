export const APP_CONFIG = {
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME ?? "ZTDPP",
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5006/api/v1/",
};

/** Origin of the API without the /api/v1/ prefix, for docs / curl examples. */
export const API_ORIGIN = APP_CONFIG.API_BASE_URL.replace(/\/api\/v\d+\/?$/, "");
