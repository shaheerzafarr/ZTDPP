export function formatBusinessAddress(address) {
  if (!address) return "—";
  const parts = [
    address.street,
    address.city,
    address.state,
    address.zipCode,
    address.country,
  ].filter(Boolean);
  return parts.join(", ") || "—";
}

export function getAddressLatLng(address) {
  if (!address?.lat || !address?.lng) return null;
  return { lat: address.lat, lng: address.lng };
}
