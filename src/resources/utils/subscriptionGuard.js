export function isSubscriptionActive(status) {
  return status === "active" || status === "trialing";
}

export function getSubscriptionRedirect(status) {
  if (isSubscriptionActive(status)) return null;
  return "/subscription";
}
