import type { Metadata } from "next";
import { Palette } from "lucide-react";
import { ToolCard } from "@/components/ui/ToolCard";
import { DESIGN_TOOLS } from "@/lib/constants/tools";

export const metadata: Metadata = {
  title: "Design 도구",
  description: "색상, 폰트, 그리드, 이미지 최적화 등 디자인 관련 도구 모음",
};

export default function DesignCategoryPage() {
  return (
    <div className="w-full px-4 py-10 md:px-6 lg:px-8">
      {/* 헤더 */}
      <div className="mb-8 flex items-start gap-4 border-b border-border pb-8">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand/10">
          <Palette size={22} className="text-brand" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Design</h1>
          <p className="mt-1 text-sm text-text-secondary">
            색상 도구, 폰트 미리보기, 그리드 생성기, 이미지 최적화 등{" "}
            {DESIGN_TOOLS.length}개의 디자인 도구
          </p>
        </div>
      </div>

      {/* 도구 카드 그리드 */}
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {DESIGN_TOOLS.map((tool) => (
          <li key={tool.id}>
            <ToolCard {...tool} />
          </li>
        ))}
      </ul>
    </div>
  );
}