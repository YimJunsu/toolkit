import type { Metadata } from "next";
import { Globe } from "lucide-react";
import { ToolCard } from "@/components/ui/ToolCard";
import { WEB_TOOLS } from "@/lib/constants/tools";

export const metadata: Metadata = {
  title: "Web 도구",
  description: "색상 대비, SEO 분석, 성능 테스트, 쿠키 뷰어, 메타 태그 미리보기 등 웹 개발 도구 모음",
};

export default function WebCategoryPage() {
  return (
    <div className="w-full px-4 py-10 md:px-6 lg:px-8">
      <div className="mb-8 flex items-start gap-4 border-b border-border pb-8">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand/10">
          <Globe size={22} className="text-brand" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Web</h1>
          <p className="mt-1 text-sm text-text-secondary">
            색상 대비, SEO, 성능 테스트, 메타 태그 미리보기 등{" "}
            {WEB_TOOLS.length}개의 웹 개발 도구
          </p>
        </div>
      </div>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {WEB_TOOLS.map((tool) => (
          <li key={tool.id}>
            <ToolCard {...tool} />
          </li>
        ))}
      </ul>
    </div>
  );
}