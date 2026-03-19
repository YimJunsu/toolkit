/**
 * 도구 즐겨찾기 & 최근 사용 - 모듈 싱글톤 (여러 훅 인스턴스 간 동기화)
 */

const STORAGE_KEY = "toolkit-tool-storage";

interface ToolStorageData {
  favorites: string[];
  recent: string[];
}

const listeners = new Set<() => void>();

function read(): ToolStorageData {
  if (typeof window === "undefined") return { favorites: [], recent: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { favorites: [], recent: [] };
}

function write(data: ToolStorageData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
  listeners.forEach((fn) => fn());
}

export const toolStorage = {
  subscribe: (fn: () => void): (() => void) => {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },
  get: read,
  toggleFavorite: (id: string) => {
    const data = read();
    const isFav = data.favorites.includes(id);
    data.favorites = isFav
      ? data.favorites.filter((x) => x !== id)
      : [id, ...data.favorites];
    write(data);
  },
  addRecent: (id: string) => {
    const data = read();
    data.recent = [id, ...data.recent.filter((x) => x !== id)].slice(0, 12);
    write(data);
  },
  removeRecent: (id: string) => {
    const data = read();
    data.recent = data.recent.filter((x) => x !== id);
    write(data);
  },
  clearRecent: () => {
    const data = read();
    data.recent = [];
    write(data);
  },
  isFavorite: (id: string) => read().favorites.includes(id),
};
