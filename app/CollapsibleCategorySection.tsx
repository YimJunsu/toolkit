"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { ToolCard } from "@/components/ui/ToolCard";
import { TOOLS_BY_CATEGORY } from "@/lib/constants/tools";
import { CATEGORY_ICON_MAP } from "@/lib/constants/categoryIcons";
import type { Category } from "@/lib/constants/categories";

interface Props {
  category: Category;
}

export function CollapsibleCategorySection({ category }: Props) {
  const [open, setOpen] = useState(true);
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

        {/* 토글 버튼 */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={`grid-${category.id}`}
          className="ml-2 flex size-7 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
          aria-label={open ? "접기" : "펼치기"}
        >
          <ChevronDown
            size={15}
            className={`transition-transform duration-200 ${open ? "rotate-0" : "-rotate-90"}`}
          />
        </button>
      </div>

      {/* 도구 카드 그리드 (접기/펼치기) */}
      <div
        id={`grid-${category.id}`}
        className={`grid overflow-hidden transition-all duration-300 ease-in-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0">
          <ul className="grid grid-cols-2 gap-3 pb-0 sm:grid-cols-3 lg:grid-cols-4">
            {tools.map((tool) => (
              <li key={tool.id}>
                <ToolCard {...tool} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}