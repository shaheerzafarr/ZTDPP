export function unwrapApiData(response) {
  if (!response) return null;
  return response.data ?? null;
}

/** Backend list shape: { data: { items: [], totalCount } } (or users/contacts for legacy routes). */
export function extractItems(response, itemsKey = "items") {
  const data = unwrapApiData(response);
  if (!data) return [];
  const items = data[itemsKey];
  return Array.isArray(items) ? items : [];
}

export function extractTotalRecords(response, key = "totalCount") {
  const data = unwrapApiData(response);
  if (!data) return 0;
  const total = data[key];
  return typeof total === "number" ? total : 0;
}

export function extractObject(response) {
  return unwrapApiData(response);
}
