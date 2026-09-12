import { ROLE_SUPER_ADMIN } from "@/resources/constants/ztdpp";
import { getUserRoleCookie } from "./cookie";

export function getDashboardPathFromRole(role) {
  return role === ROLE_SUPER_ADMIN ? "/admin/dashboard" : "/dashboard";
}

export function getStoredDashboardPath() {
  return getDashboardPathFromRole(getUserRoleCookie());
}

export function getLoginPathFromRole(role) {
  return role === ROLE_SUPER_ADMIN ? "/admin/login" : "/login";
}
