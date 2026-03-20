"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronDown, X, Menu, Sun, Moon, Search, Command } from "lucide-react";
import { CATEGORIES } from "@/lib/constants/categories";
import { TOOLS_BY_CATEGORY } from "@/lib/constants/tools";
import { useTheme } from "@/hooks/useTheme";
import { SpotlightSearch, useSpotlightSearch } from "@/components/ui/SpotlightSearch";
import type { Category } from "@/lib/constants/categories";


export function Header() {
  const [openCategoryId, setOpenCategoryId]     = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const categoryNavRef = useRef<HTMLDivElement>(null);
  const { theme, toggle: toggleTheme } = useTheme();
  const { open: searchOpen, setOpen: setSearchOpen } = useSpotlightSearch();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        categoryNavRef.current &&
        !categoryNavRef.current.contains(e.target as Node)
      ) {
        setOpenCategoryId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCategoryToggle = useCallback((categoryId: string) => {
    setOpenCategoryId((prev) => (prev === categoryId ? null : categoryId));
  }, []);

  const handleAllClose = useCallback(() => {
    setOpenCategoryId(null);
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-bg-primary/90 backdrop-blur-md">
        <div className="flex h-14 w-full items-center px-4 md:px-6 lg:px-8">

          {/* 로고 */}
          <Link
            href="/"
            className="shrink-0 font-bold text-text-primary transition-opacity hover:opacity-80"
            onClick={handleAllClose}
          >
            <span className="text-3xl tracking-tight">
              tool<span className="text-brand">.</span>kit
            </span>
          </Link>

          {/* 데스크탑 네비게이션 (가운데 정렬) */}
          <div ref={categoryNavRef} className="hidden flex-1 items-center justify-center md:flex">
            <nav className="flex items-center gap-0.5" aria-label="메인 네비게이션">

              <Link
                href="/about"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
              >
                소개
              </Link>

              <div className="mx-1.5 h-4 w-px bg-border" aria-hidden="true" />

              {CATEGORIES.map((category) => (
                <CategoryDropdownItem
                  key={category.id}
                  category={category}
                  isOpen={openCategoryId === category.id}
                  onToggle={() => handleCategoryToggle(category.id)}
                  onClose={() => setOpenCategoryId(null)}
                />
              ))}
            </nav>
          </div>

          {/* 우측 액션 버튼 */}
          <div className="ml-auto flex items-center gap-1">
            {/* 검색 버튼 */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden items-center gap-1.5 rounded-lg border border-border bg-bg-secondary px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-brand/40 hover:text-brand md:flex"
              aria-label="검색 (Ctrl+K)"
            >
              <Search size={13} />
              <span>검색</span>
              <kbd className="ml-1 flex items-center gap-px rounded bg-bg-primary px-1 py-px font-mono text-[10px] opacity-60">
                <Command size={9} />K
              </kbd>
            </button>

            {/* 모바일 검색 아이콘 */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex size-9 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary md:hidden"
              aria-label="검색"
            >
              <Search size={17} />
            </button>

            {/* 다크/라이트 토글 */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex size-9 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
              aria-label={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* 모바일 햄버거 */}
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary md:hidden"
              aria-label={isMobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            >
              {isMobileMenuOpen ? (
                <X size={18} aria-hidden="true" />
              ) : (
                <Menu size={18} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {isMobileMenuOpen && (
          <div className="w-full border-t border-border bg-bg-primary md:hidden">
            <nav className="px-4 py-3" aria-label="모바일 네비게이션">
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-widest text-text-secondary">
                카테고리
              </p>
              <ul className="mb-3 flex flex-col gap-0.5">
                {CATEGORIES.map((category) => (
                  <li key={category.id}>
                    <Link
                      href={category.href}
                      className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
                      onClick={handleAllClose}
                    >
                      {category.label}
                      {(TOOLS_BY_CATEGORY[category.id]?.length ?? 0) > 0 && (
                        <span className="rounded-full bg-brand/10 px-1.5 py-0.5 text-xs text-brand">
                          {TOOLS_BY_CATEGORY[category.id].length}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mb-3 border-t border-border" />

              <Link
                href="/about"
                className="block rounded-md px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
                onClick={handleAllClose}
              >
                소개
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Spotlight 검색 모달 */}
      <SpotlightSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

/* ── 카테고리 드롭다운 아이템 ── */

interface CategoryDropdownItemProps {
  category: Category;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

function CategoryDropdownItem({
  category,
  isOpen,
  onToggle,
  onClose,
}: CategoryDropdownItemProps) {
  const tools = TOOLS_BY_CATEGORY[category.id] ?? [];
  const hasTools = tools.length > 0;

  return (
    <div className="relative">
      <button
        type="button"
        className={`flex h-9 items-center gap-1 rounded-md px-2.5 text-sm font-medium transition-colors ${
          isOpen
            ? "bg-bg-secondary text-text-primary"
            : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={onToggle}
      >
        {category.label}
        {hasTools && (
          <span className="ml-0.5 rounded-full bg-brand/15 px-1.5 py-px text-[10px] font-semibold leading-none text-brand">
            {tools.length}
          </span>
        )}
        <ChevronDown
          size={13}
          aria-hidden="true"
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* 드롭다운 패널 */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1.5 max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-bg-primary shadow-xl">
          {hasTools ? (
            /* 도구 목록 — 7개 이상이면 2열 Mega Menu */
            <div className="p-2" style={{ minWidth: tools.length >= 7 ? "520px" : "280px" }}>
              <p className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-widest text-text-secondary">
                {category.label}
              </p>
              <ul className={tools.length >= 7 ? "grid grid-cols-2 gap-0.5" : "flex flex-col gap-0.5"}>
                {tools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <li key={tool.id}>
                      <Link
                        href={tool.href}
                        onClick={onClose}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-bg-secondary"
                      >
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-brand/10">
                          <Icon size={14} className="text-brand" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-text-primary">{tool.label}</p>
                          <p className="truncate text-xs text-text-secondary">{tool.description}</p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-2 border-t border-border pt-2">
                <Link
                  href={category.href}
                  onClick={onClose}
                  className="flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-medium text-brand transition-colors hover:bg-brand/10"
                >
                  전체 보기 →
                </Link>
              </div>
            </div>
          ) : (
            /* 준비 중 */
            <div className="px-5 py-4 text-center" style={{ minWidth: "180px" }}>
              <p className="text-xs font-medium text-text-secondary">준비 중입니다</p>
              <p className="mt-0.5 text-xs text-text-secondary/60">곧 도구가 추가될 예정입니다.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
