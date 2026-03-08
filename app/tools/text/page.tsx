import type { Metadata } from "next";
import { Type } from "lucide-react";
import { ToolCard } from "@/components/ui/ToolCard";
import { TEXT_TOOLS } from "@/lib/constants/tools";

export const metadata: Metadata = {
  title: "Text 도구",
  description: "언어 감지, 번역, 문장 요약, 키워드 추출, 대체 텍스트 생성 등 텍스트 도구 모음",
};

export default function TextCategoryPage() {
  return (
    <div className="w-full px-4 py-10 md:px-6 lg:px-8">
      <div className="mb-8 flex items-start gap-4 border-b border-border pb-8">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand/10">
          <Type size={22} className="text-brand" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Text</h1>
          <p className="mt-1 text-sm text-text-secondary">
            언어 감지·번역, 문장 요약·키워드 추출, 대체 텍스트 생성 등{" "}
            {TEXT_TOOLS.length}개의 텍스트 도구
          </p>
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {TEXT_TOOLS.map((tool) => (
          <li key={tool.id}>
            <ToolCard {...tool} />
          </li>
        ))}
      </ul>
    </div>
  );
}