import Cookies from "js-cookie";

const ROLE_COOKIE_KEY = "userRole";
const COOKIE_EXPIRY_DAYS = 7;

export function setUserRoleCookie(role) {
  if (!role) return;
  Cookies.set(ROLE_COOKIE_KEY, role, {
    expires: COOKIE_EXPIRY_DAYS,
    sameSite: "strict",
  });
}

export function getUserRoleCookie() {
  return Cookies.get(ROLE_COOKIE_KEY);
}

export function clearAllCookies() {
  const allCookies = Cookies.get();
  Object.keys(allCookies).forEach((name) => Cookies.remove(name));
}
