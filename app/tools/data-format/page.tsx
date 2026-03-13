import type { Metadata } from "next";
import { Database } from "lucide-react";
import { ToolCard } from "@/components/ui/ToolCard";
import { DATA_FORMAT_TOOLS } from "@/lib/constants/tools";

export const metadata: Metadata = {
  title: "Data / Format 도구",
  description: "CSV·JSON·Excel 변환, UUID·샘플 데이터 생성, 타임스탬프 변환 도구 모음",
};

export default function DataFormatCategoryPage() {
  return (
    <div className="w-full px-4 py-10 md:px-6 lg:px-8">
      <div className="mb-8 flex items-start gap-4 border-b border-border pb-8">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand/10">
          <Database size={22} className="text-brand" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Data / Format</h1>
          <p className="mt-1 text-sm text-text-secondary">
            데이터 변환 및 테스트 데이터 생성 {DATA_FORMAT_TOOLS.length}개의 도구
          </p>
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {DATA_FORMAT_TOOLS.map((tool) => (
          <li key={tool.id}>
            <ToolCard {...tool} />
          </li>
        ))}
      </ul>
    </div>
  );
}