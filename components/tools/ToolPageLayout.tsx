"use client";

import Link from "next/link";
import { ChevronRight, Share2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { RelatedTools } from "@/components/ui/RelatedTools";

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

function handleShare(title: string, description: string) {
  if (navigator.share) {
    navigator.share({ title, text: description, url: window.location.href });
  } else {
    navigator.clipboard.writeText(window.location.href).then(() => {
      // 링크 복사 완료 (Toast는 전역 시스템에서 처리)
    });
  }
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
        <div className="flex-1 pt-1">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
            <button
              type="button"
              onClick={() => handleShare(title, description)}
              aria-label="이 도구 공유하기"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
            >
              <Share2 size={15} />
            </button>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{description}</p>
        </div>
      </div>

      {/* 구분선 */}
      <div className="mb-8 border-t border-border" />

      {/* 도구 콘텐츠 */}
      {children}

      {/* 관련 도구 */}
      <RelatedTools />
    </div>
  );
}