"use client";

import { useState, useMemo } from "react";
import { Search, X, ChevronRight } from "lucide-react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/constants/categories";
import { TOOLS_BY_CATEGORY } from "@/lib/constants/tools";
import { CATEGORY_ICON_MAP } from "@/lib/constants/categoryIcons";
import type { ToolItem } from "@/lib/constants/tools";

const ACTIVE_CATEGORIES = CATEGORIES.filter(
  (c) => (TOOLS_BY_CATEGORY[c.id]?.length ?? 0) > 0
);
const ALL_TOOLS = ACTIVE_CATEGORIES.flatMap((c) => TOOLS_BY_CATEGORY[c.id] ?? []);

/* ──────────────────────────────────────────
   리스트 행 아이템 — Raycast / Linear 스타일
   ────────────────────────────────────────── */
function ToolRow({ label, description, href, icon: Icon, badge }: ToolItem) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-brand/5 active:bg-brand/8"
    >
      {/* 아이콘 */}
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 transition-colors group-hover:bg-brand/15">
        <Icon size={16} className="text-brand" />
      </div>

      {/* 텍스트 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[13.5px] font-semibold text-text-primary transition-colors group-hover:text-brand">
            {label}
          </span>
          {badge && (
            <span
              className={`rounded-full px-1.5 py-px text-[10px] font-bold leading-4 ${
                badge === "NEW"
                  ? "bg-emerald-500/12 text-emerald-400"
                  : "bg-amber-500/12 text-amber-400"
              }`}
            >
              {badge}
            </span>
          )}
        </div>
        <p className="mt-px truncate text-[11.5px] leading-snug text-text-secondary">
          {description}
        </p>
      </div>

      {/* 화살표 */}
      <ChevronRight
        size={13}
        className="shrink-0 text-text-secondary/30 transition-colors group-hover:text-brand/50"
      />
    </Link>
  );
}

/* 그룹 컨테이너 — divide-y 구분선 */
function ToolGroup({ tools }: { tools: ToolItem[] }) {
  if (!tools.length) return null;
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-bg-secondary">
      <div className="divide-y divide-border/70">
        {tools.map((t) => (
          <ToolRow key={t.id} {...t} />
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   메인
   ────────────────────────────────────────── */
export function MobileHomePage() {
  const [query, setQuery]               = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const isFiltered = query.trim().length > 0 || activeCategory !== null;

  const filtered = useMemo(() => {
    let tools = activeCategory
      ? (TOOLS_BY_CATEGORY[activeCategory] ?? [])
      : ALL_TOOLS;
    const q = query.trim().toLowerCase();
    if (q) {
      tools = tools.filter(
        (t) =>
          t.label.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }
    return tools;
  }, [query, activeCategory]);

  const handleCategoryClick = (id: string) => {
    setActiveCategory((prev) => (prev === id ? null : id));
    setQuery("");
  };

  return (
    <div className="flex flex-col gap-5">

      {/* ── 검색 ── */}
      <div className="relative">
        <Search
          size={15}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary"
        />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setActiveCategory(null); }}
          placeholder={`${ALL_TOOLS.length}개 도구 검색…`}
          className="w-full rounded-2xl border border-border bg-bg-secondary py-3 pl-10 pr-10 text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary transition-colors hover:text-text-primary"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── 카테고리 칩 ── */}
      <div
        className="flex gap-2 overflow-x-auto pb-0.5"
        style={{ scrollbarWidth: "none" }}
      >
        <button
          type="button"
          onClick={() => { setActiveCategory(null); setQuery(""); }}
          className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
            !activeCategory && !query
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

      {/* ── 콘텐츠 ── */}
      {isFiltered ? (
        /* 검색 · 필터 결과 */
        <div className="flex flex-col gap-3">
          <p className="px-1 text-xs text-text-secondary">
            {query
              ? <><span className="font-semibold text-text-primary">&quot;{query}&quot;</span> 검색 결과 · </>
              : <><span className="font-semibold text-text-primary">
                  {ACTIVE_CATEGORIES.find((c) => c.id === activeCategory)?.label}
                </span> · </>
            }
            <span className="font-semibold text-text-primary">{filtered.length}개</span>
          </p>
          {filtered.length === 0 ? (
            <div className="flex h-44 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border">
              <span className="text-3xl">🔍</span>
              <p className="text-sm text-text-secondary">검색 결과가 없습니다</p>
            </div>
          ) : (
            <ToolGroup tools={filtered} />
          )}
        </div>
      ) : (
        /* 기본: 카테고리별 섹션 */
        <div className="flex flex-col gap-7">
          {ACTIVE_CATEGORIES.map((cat) => {
            const tools = TOOLS_BY_CATEGORY[cat.id] ?? [];
            const Icon  = CATEGORY_ICON_MAP[cat.id];

            return (
              <section key={cat.id}>
                {/* 섹션 헤더 */}
                <div className="mb-2.5 flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5">
                    {Icon && <Icon size={12} className="text-brand" />}
                    <span className="text-[11px] font-bold uppercase tracking-widest text-text-secondary/80">
                      {cat.label}
                    </span>
                    <span className="text-[11px] text-text-secondary/40">
                      {tools.length}
                    </span>
                  </div>
                  <Link
                    href={cat.href}
                    className="flex items-center gap-0.5 text-[11px] text-text-secondary/50 transition-colors hover:text-brand"
                  >
                    전체
                    <ChevronRight size={11} />
                  </Link>
                </div>

                <ToolGroup tools={tools} />
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}