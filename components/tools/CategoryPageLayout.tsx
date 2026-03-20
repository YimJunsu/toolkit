import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ToolCard } from "@/components/ui/ToolCard";
import { CATEGORY_ICON_MAP } from "@/lib/constants/categoryIcons";
import type { ToolItem } from "@/lib/constants/tools";

interface CategoryPageLayoutProps {
  categoryId: string;
  title: string;
  description: string;
  tools: ToolItem[];
}

export function CategoryPageLayout({
  categoryId,
  title,
  description,
  tools,
}: CategoryPageLayoutProps) {
  const Icon = CATEGORY_ICON_MAP[categoryId];
  const featured = tools.filter((t) => t.badge);
  const all = tools;

  return (
    <div className="w-full px-4 py-10 md:px-6 lg:px-8">

      {/* 헤더 */}
      <div className="mb-8 flex items-start gap-4 border-b border-border pb-8">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand/10">
          {Icon && <Icon size={22} className="text-brand" aria-hidden="true" />}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {description}
            {" · "}
            <span className="font-semibold text-brand">{tools.length}개 도구</span>
          </p>
        </div>
        <Link
          href="/"
          className="flex shrink-0 items-center gap-1 text-xs text-text-secondary/60 transition-colors hover:text-brand"
        >
          전체 카테고리
          <ChevronRight size={12} />
        </Link>
      </div>

      {/* 주목 도구 (NEW / 인기 배지) */}
      {featured.length > 0 && (
        <div className="mb-10">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-text-secondary/70">
              신규 · 인기
            </span>
            <div className="flex-1 border-t border-border" />
          </div>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featured.map((tool) => (
              <li key={tool.id}>
                <ToolCard {...tool} />
              </li>
            ))}
          </ul>
          <div className="mt-8 mb-3 flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-text-secondary/70">
              전체 도구
            </span>
            <div className="flex-1 border-t border-border" />
          </div>
        </div>
      )}

      {/* 전체 도구 그리드 */}
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {all.map((tool) => (
          <li key={tool.id}>
            <ToolCard {...tool} />
          </li>
        ))}
      </ul>
    </div>
  );
}
