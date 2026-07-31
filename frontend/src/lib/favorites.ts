export function getFavoriteIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem("nss_favorites");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function clearFavoriteIds(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("nss_favorites");
    window.dispatchEvent(new Event("nss_favorites_updated"));
  } catch {}
}

export function toggleFavoriteId(propertyId: string): string[] {
  if (typeof window === "undefined" || !propertyId) return [];
  try {
    const favorites = getFavoriteIds();
    const exists = favorites.includes(propertyId);
    let updated: string[];
    if (exists) {
      updated = favorites.filter((id) => id !== propertyId);
    } else {
      updated = [...favorites, propertyId];
    }
    localStorage.setItem("nss_favorites", JSON.stringify(updated));
    window.dispatchEvent(new Event("nss_favorites_updated"));
    return updated;
  } catch {
    return [];
  }
}

export function isFavoriteId(propertyId: string): boolean {
  return getFavoriteIds().includes(propertyId);
}
