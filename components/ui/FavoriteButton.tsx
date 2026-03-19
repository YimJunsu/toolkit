"use client";

import { Star } from "lucide-react";
import { toolStorage } from "@/lib/toolStorage";
import { useToolStorage } from "@/hooks/useToolStorage";

interface FavoriteButtonProps {
  toolId: string;
}

export function FavoriteButton({ toolId }: FavoriteButtonProps) {
  const { isFavorite } = useToolStorage();
  const fav = isFavorite(toolId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toolStorage.toggleFavorite(toolId);
      }}
      title={fav ? "즐겨찾기 해제" : "즐겨찾기 추가"}
      className={`absolute right-2.5 top-2.5 flex size-6 items-center justify-center rounded-full border border-border bg-bg-primary/80 backdrop-blur-sm transition-all ${
        fav
          ? "text-amber-400 opacity-100"
          : "text-text-secondary/40 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:!text-amber-400"
      }`}
    >
      <Star size={11} fill={fav ? "currentColor" : "none"} />
    </button>
  );
}
