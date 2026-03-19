"use client";

import { useState, useEffect } from "react";
import { toolStorage } from "@/lib/toolStorage";

export function useToolStorage() {
  const [state, setState] = useState<{ favorites: string[]; recent: string[] }>(
    () =>
      typeof window !== "undefined"
        ? toolStorage.get()
        : { favorites: [], recent: [] }
  );

  useEffect(() => {
    setState(toolStorage.get());
    const unsub = toolStorage.subscribe(() => setState(toolStorage.get()));
    return unsub;
  }, []);

  return {
    favorites: state.favorites,
    recent: state.recent,
    toggleFavorite: toolStorage.toggleFavorite,
    addRecent: toolStorage.addRecent,
    isFavorite: (id: string) => state.favorites.includes(id),
  };
}
