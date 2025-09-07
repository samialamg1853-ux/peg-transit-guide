export type FavoriteStop = {
  key: number;
  name: string;
  number: number;
  direction?: string;
  side?: string;
};

const STORAGE_KEY = 'wt_favorite_stops_v1';

export function getFavorites(): FavoriteStop[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isFavorite(stopKey: number): boolean {
  return getFavorites().some((s) => s.key === stopKey);
}

export function addFavorite(stop: FavoriteStop) {
  const list = getFavorites();
  if (!list.find((s) => s.key === stop.key)) {
    const next = [stop, ...list].slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
}

export function removeFavorite(stopKey: number) {
  const next = getFavorites().filter((s) => s.key !== stopKey);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
