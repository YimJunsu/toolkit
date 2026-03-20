import Link from "next/link";
import { CATEGORIES } from "@/lib/constants/categories";
import { TOOLS_BY_CATEGORY } from "@/lib/constants/tools";
import { CATEGORY_ICON_MAP } from "@/lib/constants/categoryIcons";
import { MobileHomePage } from "./MobileHomePage";
import { DesktopHomePage } from "./DesktopHomePage";

const totalTools = Object.values(TOOLS_BY_CATEGORY).reduce((s, a) => s + a.length, 0);

export default function MainPage() {
  const activeCategories  = CATEGORIES.filter((c) => (TOOLS_BY_CATEGORY[c.id]?.length ?? 0) > 0);
  const pendingCategories = CATEGORIES.filter((c) => (TOOLS_BY_CATEGORY[c.id]?.length ?? 0) === 0);

  return (
    <div className="w-full px-4 py-6 md:px-6 md:py-10 lg:px-8">

      {/* ── Hero ── */}
      <section className="relative mb-8 overflow-hidden rounded-2xl border border-border bg-background p-5 sm:p-8 md:mb-12 md:p-10">

        {/* 배경 장식 (데스크탑만) */}
        <div className="pointer-events-none absolute -top-24 -right-24 hidden h-64 w-64 rounded-full bg-border/30 blur-3xl md:block" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 hidden h-64 w-64 rounded-full bg-border/20 blur-3xl md:block" />

        <div className="relative z-10">

          {/* 배지 */}
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-text-secondary">
            🧰 tool.kit
            <span className="opacity-70">· {totalTools}개 무료 도구</span>
          </div>

          {/* 제목 */}
          <h1 className="text-xl font-bold tracking-tight text-text-primary sm:text-2xl md:text-3xl">
            필요한 도구를{" "}
            <span className="underline decoration-border">한 곳에서</span>
          </h1>

          {/* 설명 */}
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-secondary md:mt-3">
            개발, 디자인, 업무에 자주 쓰이는 도구들을 설치 없이 바로 사용하세요.
          </p>

          {/* CTA — 데스크탑에서만 크게 표시 */}
          <div className="mt-4 flex flex-wrap gap-2 md:mt-6 md:gap-3">
            <Link
              href="/about"
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-muted md:px-4 md:py-2 md:text-sm"
            >
              페이지 소개
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-muted md:px-4 md:py-2 md:text-sm"
            >
              전체 도구 탐색
            </Link>
          </div>

          {/* 퀵 태그 */}
          <div
            className="mt-4 flex flex-wrap gap-2 overflow-x-auto pb-0.5 text-xs text-text-secondary"
            style={{ scrollbarWidth: "none" }}
          >
            {["JSON", "Base64", "UUID", "Hash", "QR코드", "환율"].map((tag) => (
              <span
                key={tag}
                className="shrink-0 rounded-full border border-border px-3 py-1"
              >
                {tag}
              </span>
            ))}
          </div>

        </div>
      </section>

      {/* ── 모바일 뷰: 검색 + 카테고리 칩 + 미리보기 ── */}
      <div className="md:hidden">
        <MobileHomePage />
      </div>

      {/* ── 데스크탑 뷰: 검색 + 카테고리 섹션 ── */}
      <div className="hidden md:block">
        <DesktopHomePage activeCategories={activeCategories} />
      </div>

      {/* ── 준비 중 카테고리 ── */}
      {pendingCategories.length > 0 && (
        <div className="mt-10 md:mt-14">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-xs font-semibold text-text-secondary">준비 중인 카테고리</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {pendingCategories.map((category) => {
              const Icon = CATEGORY_ICON_MAP[category.id];
              return (
                <div
                  key={category.id}
                  className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-text-secondary"
                >
                  {Icon && <Icon size={13} aria-hidden="true" />}
                  {category.label}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}