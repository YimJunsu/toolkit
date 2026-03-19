"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { CATEGORIES } from "@/lib/constants/categories";
import { TOOLS_BY_CATEGORY } from "@/lib/constants/tools";
import { CATEGORY_ICON_MAP } from "@/lib/constants/categoryIcons";
import { CollapsibleCategorySection } from "./CollapsibleCategorySection";
import { ToolCard } from "@/components/ui/ToolCard";
import { QuickAccessBar } from "@/components/ui/QuickAccessBar";
import type { Category } from "@/lib/constants/categories";

const ACTIVE_CATEGORIES = CATEGORIES.filter(
  (c) => (TOOLS_BY_CATEGORY[c.id]?.length ?? 0) > 0
);
const ALL_TOOLS = ACTIVE_CATEGORIES.flatMap((c) => TOOLS_BY_CATEGORY[c.id] ?? []);

interface Props {
  activeCategories: Category[];
}

export function DesktopHomePage({ activeCategories }: Props) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const handleCategoryClick = (id: string) => {
    setActiveCategory((prev) => (prev === id ? null : id));
    setQuery("");
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return ALL_TOOLS.filter(
      (t) =>
        t.label.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.keywords?.some((kw) => kw.toLowerCase().includes(q))
    );
  }, [query]);

  const visibleCategories = activeCategory
    ? activeCategories.filter((c) => c.id === activeCategory)
    : activeCategories;

  return (
    <div className="flex flex-col gap-6">
      {/* 즐겨찾기 / 최근 사용 */}
      <QuickAccessBar />

      {/* 검색 바 */}
      <div className="relative">
        <Search
          size={15}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary"
        />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setActiveCategory(null); }}
          placeholder={`${ALL_TOOLS.length}개 도구 검색…`}
          className="w-full rounded-2xl border border-border bg-bg-secondary py-3 pl-11 pr-11 text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary transition-colors hover:text-text-primary"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* 카테고리 칩 필터 */}
      {filtered === null && (
        <div
          className="flex gap-2 overflow-x-auto pb-0.5"
          style={{ scrollbarWidth: "none" }}
        >
          <button
            type="button"
            onClick={() => { setActiveCategory(null); setQuery(""); }}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              !activeCategory
                ? "bg-brand text-white shadow-sm"
                : "border border-border text-text-secondary hover:border-brand/40 hover:text-brand"
            }`}
          >
            전체
          </button>
          {ACTIVE_CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICON_MAP[cat.id];
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryClick(cat.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-brand text-white shadow-sm"
                    : "border border-border text-text-secondary hover:border-brand/40 hover:text-brand"
                }`}
              >
                {Icon && <Icon size={11} />}
                {cat.label}
              </button>
            );
          })}
        </div>
      )}

      {/* 검색 결과 */}
      {filtered !== null ? (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-text-secondary">
            <span className="font-semibold text-text-primary">&quot;{query}&quot;</span>
            {" "}검색 결과 · <span className="font-semibold text-text-primary">{filtered.length}개</span>
          </p>
          {filtered.length === 0 ? (
            <div className="flex h-44 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border">
              <span className="text-3xl">🔍</span>
              <p className="text-sm text-text-secondary">검색 결과가 없습니다</p>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((tool) => (
                <li key={tool.id}>
                  <ToolCard {...tool} />
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        /* 기본: 카테고리 섹션 */
        <div className="flex flex-col gap-12">
          {visibleCategories.map((category) => (
            <CollapsibleCategorySection key={category.id} category={category} />
          ))}
        </div>
      )}
    </div>
  );
}