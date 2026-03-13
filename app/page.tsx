import type { LucideIcon } from "lucide-react";
import {
  Code2, Database, ArrowLeftRight, Palette,
  Globe, Type, Lock, MoreHorizontal, Clock,
} from "lucide-react";
import { CATEGORIES } from "@/lib/constants/categories";
import { TOOLS_BY_CATEGORY } from "@/lib/constants/tools";
import { ToolCard } from "@/components/ui/ToolCard";
import type { Category } from "@/lib/constants/categories";
import Link from "next/link";

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  "code":           Code2,
  "data-format":    Database,
  "converter":      ArrowLeftRight,
  "design":         Palette,
  "web":            Globe,
  "text":           Type,
  "encode-decode":  Lock,
  "etc":            MoreHorizontal,
};

export default function MainPage() {
  const activeCategories = CATEGORIES.filter((c) => (TOOLS_BY_CATEGORY[c.id]?.length ?? 0) > 0);
  const pendingCategories = CATEGORIES.filter((c) => (TOOLS_BY_CATEGORY[c.id]?.length ?? 0) === 0);

  return (
    <div className="w-full px-4 py-10 md:px-6 lg:px-8">

      {/* ── Hero ── */}
      <section className="relative mb-12 overflow-hidden rounded-2xl border border-border bg-background p-10">

        {/* subtle background decoration */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-border/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-border/20 blur-3xl" />

        <div className="relative z-10">

          {/* badge */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-text-secondary">
            🧰 tool.kit
            <span className="opacity-70">무료 온라인 도구 모음</span>
          </div>

          {/* title */}
          <h1 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
            필요한 도구를 <span className="underline decoration-border">한 곳에서</span>
          </h1>

          {/* description */}
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-secondary">
            개발, 디자인, 업무에 자주 쓰이는 작은 도구들을
            <br />
            설치 없이 바로 사용할 수 있습니다.
          </p>

          {/* CTA */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
                href="/about"
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-text-primary hover:bg-muted"
            >
              페이지 소개
            </Link>

            <Link
                href="/"
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-muted"
            >
              전체 도구 탐색
            </Link>
          </div>

          {/* quick tags */}
          <div className="mt-6 flex flex-wrap gap-2 text-xs text-text-secondary">
            <span className="rounded-full border border-border px-3 py-1">JSON</span>
            <span className="rounded-full border border-border px-3 py-1">Base64</span>
            <span className="rounded-full border border-border px-3 py-1">UUID</span>
            <span className="rounded-full border border-border px-3 py-1">Hash</span>
          </div>

        </div>
      </section>

      {/* ── 도구가 있는 카테고리 ── */}
      <div className="flex flex-col gap-12">
        {activeCategories.map((category) => (
          <CategorySection key={category.id} category={category} />
        ))}
      </div>

      {/* ── 준비 중 카테고리 ── */}
      {pendingCategories.length > 0 && (
        <div className="mt-14">
          <div className="mb-4 flex items-center gap-2">
            <Clock size={15} className="text-text-secondary" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-text-secondary">준비 중인 카테고리</h2>
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

/* ── 카테고리 섹션 ── */

interface CategorySectionProps {
  category: Category;
}

function CategorySection({ category }: CategorySectionProps) {
  const Icon = CATEGORY_ICON_MAP[category.id];
  const tools = TOOLS_BY_CATEGORY[category.id] ?? [];

  return (
    <section aria-labelledby={`category-${category.id}`}>
      {/* 카테고리 헤더 */}
      <div className="mb-4 flex items-center gap-2.5">
        {Icon && (
          <Icon size={18} className="shrink-0 text-brand" aria-hidden="true" />
        )}
        <h2
          id={`category-${category.id}`}
          className="text-base font-bold text-text-primary"
        >
          {category.label}
        </h2>
        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
          {tools.length}
        </span>
        <div className="ml-2 flex-1 border-t border-border" />
      </div>

      {/* 도구 카드 그리드 */}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {tools.map((tool) => (
          <li key={tool.id}>
            <ToolCard {...tool} />
          </li>
        ))}
      </ul>
    </section>
  );
}