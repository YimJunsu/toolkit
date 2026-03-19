"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, Clock, X, StarOff } from "lucide-react";
import { useToolStorage } from "@/hooks/useToolStorage";
import { toolStorage } from "@/lib/toolStorage";
import { CATEGORIES } from "@/lib/constants/categories";
import { TOOLS_BY_CATEGORY } from "@/lib/constants/tools";
import type { ToolItem } from "@/lib/constants/tools";

const ALL_TOOLS_MAP = new Map<string, ToolItem>(
  CATEGORIES.flatMap((c) => TOOLS_BY_CATEGORY[c.id] ?? []).map((t) => [t.id, t])
);

type Tab = "favorites" | "recent";

export function QuickAccessBar() {
  const { favorites, recent, toggleFavorite } = useToolStorage();
  const [tab, setTab] = useState<Tab>("recent");

  const favTools  = favorites.map((id) => ALL_TOOLS_MAP.get(id)).filter(Boolean) as ToolItem[];
  const recentTools = recent.map((id) => ALL_TOOLS_MAP.get(id)).filter(Boolean) as ToolItem[];

  const isEmpty = tab === "favorites" ? favTools.length === 0 : recentTools.length === 0;
  const tools   = tab === "favorites" ? favTools : recentTools;

  if (favorites.length === 0 && recent.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-bg-secondary p-4">
      {/* 탭 */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setTab("recent")}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            tab === "recent"
              ? "bg-brand text-white"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <Clock size={11} />
          최근 사용
          {recentTools.length > 0 && (
            <span className={`rounded-full px-1.5 py-px text-[10px] font-bold ${
              tab === "recent" ? "bg-white/20" : "bg-brand/15 text-brand"
            }`}>
              {recentTools.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab("favorites")}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            tab === "favorites"
              ? "bg-brand text-white"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <Star size={11} />
          즐겨찾기
          {favTools.length > 0 && (
            <span className={`rounded-full px-1.5 py-px text-[10px] font-bold ${
              tab === "favorites" ? "bg-white/20" : "bg-brand/15 text-brand"
            }`}>
              {favTools.length}
            </span>
          )}
        </button>
      </div>

      {/* 도구 목록 */}
      {isEmpty ? (
        <p className="py-2 text-xs text-text-secondary/60">
          {tab === "favorites"
            ? "도구 카드의 ★ 버튼으로 즐겨찾기를 추가하세요."
            : "도구를 사용하면 여기에 표시됩니다."}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isFav = favorites.includes(tool.id);
            return (
              <div key={tool.id} className="group relative">
                <Link
                  href={tool.href}
                  onClick={() => toolStorage.addRecent(tool.id)}
                  className="flex items-center gap-2 rounded-xl border border-border bg-bg-primary px-3 py-2 text-xs font-medium text-text-primary transition-all hover:border-brand/50 hover:text-brand"
                >
                  <Icon size={13} className="text-brand" />
                  {tool.label}
                </Link>

                {tab === "recent" ? (
                  /* 최근 사용 탭 — X 버튼으로 항목 삭제 */
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      toolStorage.removeRecent(tool.id);
                    }}
                    title="최근 사용에서 제거"
                    className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full border border-border bg-bg-primary text-text-secondary/50 transition-all sm:hidden sm:group-hover:flex hover:border-red-400/50 hover:text-red-400"
                  >
                    <X size={9} />
                  </button>
                ) : (
                  /* 즐겨찾기 탭 — Star 버튼으로 즐겨찾기 해제 */
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleFavorite(tool.id);
                    }}
                    title="즐겨찾기 해제"
                    className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full border border-border bg-bg-primary text-amber-400 transition-all hover:text-red-400"
                  >
                    <Star size={9} fill="currentColor" />
                  </button>
                )}
              </div>
            );
          })}

          {/* 최근 사용 탭 — 전체 지우기 */}
          {tab === "recent" && recentTools.length > 1 && (
            <button
              type="button"
              onClick={() => toolStorage.clearRecent()}
              className="flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs text-text-secondary/50 transition-colors hover:border-red-400/40 hover:text-red-400"
            >
              <X size={11} />
              전체 지우기
            </button>
          )}
        </div>
      )}
    </div>
  );
}
