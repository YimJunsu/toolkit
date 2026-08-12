"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { Search, X, ArrowRight, Sparkles, ChevronDown } from "lucide-react";
import { CATEGORIES } from "@/lib/constants/categories";
import { TOOLS_BY_CATEGORY } from "@/lib/constants/tools";
import { CATEGORY_ICON_MAP } from "@/lib/constants/categoryIcons";
import { ToolCard } from "@/components/ui/ToolCard";
import { QuickAccessBar } from "@/components/ui/QuickAccessBar";

const ALL_TOOLS = CATEGORIES.flatMap((c) => TOOLS_BY_CATEGORY[c.id] ?? []);
const totalTools = ALL_TOOLS.length;

export function DesktopHomePage() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const exploreRef = useRef<HTMLDivElement | null>(null);

  const scrollToExplore = () => {
    exploreRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleHeroInputChange = (val: string) => {
    setQuery(val);
    setSelectedCategory(null);
  };

  const handleHeroSubmit = () => {
    scrollToExplore();
  };

  const handleQuickKeywordClick = (kw: string) => {
    if (kw === "디자인") {
      setSelectedCategory("design");
      setQuery("");
    } else if (kw === "개발자") {
      setSelectedCategory("code");
      setQuery("");
    } else if (kw === "세금" || kw === "퇴직금") {
      setSelectedCategory("jobs");
      setQuery("");
    } else if (kw === "유틸리티") {
      setSelectedCategory("utility");
      setQuery("");
    } else if (kw === "FUN") {
      setSelectedCategory("fun");
      setQuery("");
    } else {
      setQuery(kw);
      setSelectedCategory(null);
    }
    scrollToExplore();
  };

  const filteredTools = useMemo(() => {
    let tools = selectedCategory
      ? (TOOLS_BY_CATEGORY[selectedCategory] ?? [])
      : ALL_TOOLS;

    const q = query.trim().toLowerCase();
    if (!q) return tools;

    return tools.filter(
      (t) =>
        t.label.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.keywords?.some((kw) => kw.toLowerCase().includes(q))
    );
  }, [query, selectedCategory]);

  return (
    <div className="flex flex-col gap-10">
      {/* ── Hero 배너 ── */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-bg-secondary via-bg-primary to-bg-secondary p-6 sm:p-8 md:p-10 shadow-sm">
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-brand/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-brand/5 blur-3xl" />

        <div className="relative z-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-bg-primary/80 px-3 py-1 text-xs font-semibold text-text-secondary shadow-2xs">
            <span>🧰 tool.kit</span>
            <span className="text-brand">· {totalTools}개 스마트 무료 도구</span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-text-primary sm:text-3xl md:text-4xl">
            작업에 필요한 모든 도구를{" "}
            <span className="text-brand underline decoration-brand/30 underline-offset-4">한곳에서</span>
          </h1>

          <p className="mt-2.5 max-w-2xl text-xs leading-relaxed text-text-secondary sm:text-sm md:mt-3">
            개발자 · 디자이너 · 직장인 · 프리랜서를 위한 설치 없는 스마트 웹 도구 모음.
            원하는 키워드를 검색하고 엔터(Enter)를 누르시면 자동으로 아래 스크롤로 이동하여 결과가 표시됩니다.
          </p>

          {/* 🔍 Hero 키워드 검색바 (엔터 입력 시 스크롤 이동) ── */}
          <div className="mt-6 flex flex-col gap-3 max-w-2xl">
            <div className="relative w-full">
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                value={query}
                onChange={(e) => handleHeroInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleHeroSubmit();
                }}
                placeholder="키워드를 입력 후 엔터(Enter)를 눌러보세요 (예: 디자인, JSON, 세금, QR코드)"
                className="w-full rounded-2xl border border-border bg-bg-primary/95 py-3.5 pl-11 pr-32 text-xs sm:text-sm text-text-primary placeholder-text-secondary/60 shadow-sm focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none backdrop-blur-md"
              />
              <button
                type="button"
                onClick={handleHeroSubmit}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-brand px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-hover transition-colors flex items-center gap-1"
              >
                <span>검색</span>
                <ChevronDown size={13} />
              </button>
            </div>

            {/* 인기 키워드 추천 태그 칩 */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
              <span className="font-semibold text-text-primary">인기 키워드:</span>
              {["디자인", "개발자", "세금", "JSON", "Base64", "QR코드", "퇴직금"].map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => handleQuickKeywordClick(kw)}
                  className="rounded-full border border-border bg-bg-secondary/80 px-3 py-1 text-xs text-text-secondary transition-all hover:border-brand hover:bg-brand/10 hover:text-brand shadow-2xs"
                >
                  #{kw}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 즐겨찾기 / 최근 사용 바 ── */}
      <QuickAccessBar />

      {/* ── 🔴 빨간색 영역: 5대 직업 및 작업별 대형 분류 진입 카드 ── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-text-primary sm:text-xl">
              작업별 카테고리 바로가기
            </h2>
            <p className="text-xs text-text-secondary">
              원하는 카테고리 카드를 클릭하면 해당 도구 모음 페이지로 이동합니다.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICON_MAP[cat.id] ?? Sparkles;
            const tools = TOOLS_BY_CATEGORY[cat.id] ?? [];

            return (
              <Link
                key={cat.id}
                href={cat.href}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-bg-secondary p-5 transition-all duration-300 hover:-translate-y-1.5 hover:border-brand hover:shadow-xl"
              >
                <div className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${cat.bgColor} blur-2xl opacity-70 group-hover:opacity-100 transition-opacity`} />

                <div>
                  <div className="flex items-center justify-between">
                    <div className={`flex size-11 items-center justify-center rounded-xl bg-brand/10 ${cat.textColor} transition-transform group-hover:scale-110`}>
                      <Icon size={22} />
                    </div>
                    {cat.badge && (
                      <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold text-brand">
                        {cat.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-4 text-base font-bold text-text-primary transition-colors group-hover:text-brand">
                    {cat.label}
                  </h3>

                  <p className="mt-1.5 text-xs leading-relaxed text-text-secondary line-clamp-2">
                    {cat.description}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-3 text-xs font-semibold text-text-secondary transition-colors group-hover:text-brand">
                  <span>{tools.length}개 도구</span>
                  <span className="flex items-center gap-1 text-brand">
                    모음보기
                    <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── 🔵 파란색 영역: 전체 컨텐츠 그리드 (자동 스크롤 타겟 ref) ── */}
      <section
        ref={exploreRef}
        id="explore-tools"
        className="flex flex-col gap-6 rounded-3xl border border-border bg-bg-primary/50 p-6 md:p-8 shadow-sm scroll-mt-20"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-text-primary sm:text-xl flex items-center gap-2">
              <span>전체 도구 탐색</span>
              {selectedCategory && (
                <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs text-brand font-semibold">
                  {CATEGORIES.find((c) => c.id === selectedCategory)?.label}
                </span>
              )}
            </h2>
            <p className="text-xs text-text-secondary">
              검색창이나 탭을 이용해 원하는 도구를 빠르게 검색해보세요.
            </p>
          </div>

          {/* 하단 검색 바 */}
          <div className="relative min-w-[260px] sm:w-72">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="도구 이름, 키워드 검색…"
              className="w-full rounded-xl border border-border bg-bg-secondary py-2.5 pl-10 pr-10 text-xs text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* 카테고리 필터 탭 */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          <button
            type="button"
            onClick={() => { setSelectedCategory(null); setQuery(""); }}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              selectedCategory === null && !query
                ? "bg-brand text-white shadow-sm"
                : "border border-border text-text-secondary hover:border-brand/40 hover:text-brand"
            }`}
          >
            전체 ({ALL_TOOLS.length})
          </button>
          {CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICON_MAP[cat.id];
            const active = selectedCategory === cat.id;
            const count = (TOOLS_BY_CATEGORY[cat.id] ?? []).length;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => { setSelectedCategory(active ? null : cat.id); setQuery(""); }}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-brand text-white shadow-sm"
                    : "border border-border text-text-secondary hover:border-brand/40 hover:text-brand"
                }`}
              >
                {Icon && <Icon size={12} />}
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        {/* 도구 그리드 */}
        {filteredTools.length === 0 ? (
          <div className="flex h-44 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border">
            <span className="text-3xl">🔍</span>
            <p className="text-sm text-text-secondary">
              <span className="font-bold text-text-primary">&quot;{query}&quot;</span> 검색 조건에 맞는 도구가 없습니다
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredTools.map((tool) => (
              <li key={tool.id}>
                <ToolCard {...tool} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
