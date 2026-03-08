import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Breadcrumb {
  label: string;
  href: string;
}

interface ToolPageLayoutProps {
  breadcrumbs: Breadcrumb[];
  title: string;
  description: string;
  icon: LucideIcon;
  children: React.ReactNode;
}

export function ToolPageLayout({
  breadcrumbs,
  title,
  description,
  icon: Icon,
  children,
}: ToolPageLayoutProps) {
  return (
    <div className="w-full px-4 py-10 md:px-6 lg:px-8">

      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-8 flex items-center gap-1.5 text-xs">
        {breadcrumbs.map((crumb) => (
          <span key={crumb.href} className="flex items-center gap-1.5">
            <Link
              href={crumb.href}
              className="text-text-secondary transition-colors hover:text-text-primary"
            >
              {crumb.label}
            </Link>
            <ChevronRight size={12} className="text-border" aria-hidden="true" />
          </span>
        ))}
        <span className="font-medium text-text-primary">{title}</span>
      </nav>

      {/* 도구 헤더 */}
      <div className="mb-10 flex items-start gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand/10 ring-1 ring-brand/20">
          <Icon size={24} className="text-brand" aria-hidden="true" />
        </div>
        <div className="pt-1">
          <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{description}</p>
        </div>
      </div>

      {/* 구분선 */}
      <div className="mb-8 border-t border-border" />

      {/* 도구 콘텐츠 */}
      {children}
    </div>
  );
}