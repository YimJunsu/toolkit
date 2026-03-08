import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export interface ToolCardProps {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  badge?: "NEW" | "인기";
}

export function ToolCard({ label, description, href, icon: Icon, badge }: ToolCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-bg-secondary p-4 transition-all duration-200 hover:border-brand/60 hover:shadow-lg"
    >
      {/* 아이콘 + 배지 */}
      <div className="flex items-start justify-between">
        <div className="flex size-10 items-center justify-center rounded-lg bg-brand/10">
          <Icon size={18} className="text-brand" aria-hidden="true" />
        </div>
        {badge && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              badge === "NEW"
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-amber-500/10 text-amber-400"
            }`}
          >
            {badge}
          </span>
        )}
      </div>

      {/* 텍스트 */}
      <div>
        <h3 className="text-sm font-semibold text-text-primary transition-colors duration-200 group-hover:text-brand">
          {label}
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-text-secondary">{description}</p>
      </div>
    </Link>
  );
}