"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { TOOLS_BY_CATEGORY } from "@/lib/constants/tools";

export function RelatedTools() {
  const pathname = usePathname();
  // pathname = /tools/code/json-formatter → ["tools", "code", "json-formatter"]
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 3) return null;

  const categoryId = parts[1];
  const toolId = parts[2];

  const related = (TOOLS_BY_CATEGORY[categoryId] ?? [])
    .filter((t) => t.id !== toolId)
    .slice(0, 4);

  if (!related.length) return null;

  return (
    <div className="mt-12 border-t border-border pt-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-text-secondary/70">
          같은 카테고리 도구
        </h2>
        <Link
          href={`/tools/${categoryId}`}
          className="flex items-center gap-0.5 text-xs text-text-secondary/60 transition-colors hover:text-brand"
        >
          전체 보기
          <ChevronRight size={12} />
        </Link>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {related.map((tool) => {
          const Icon = tool.icon;
          return (
            <li key={tool.id}>
              <Link
                href={tool.href}
                className="group flex items-center gap-2.5 rounded-xl border border-border bg-bg-secondary p-3 transition-all hover:border-brand/50 hover:shadow-sm"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand/10">
                  <Icon size={14} className="text-brand" aria-hidden="true" />
                </div>
                <p className="min-w-0 truncate text-xs font-semibold text-text-primary transition-colors group-hover:text-brand">
                  {tool.label}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
