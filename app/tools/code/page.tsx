import type { Metadata } from "next";
import { Code2 } from "lucide-react";
import { ToolCard } from "@/components/ui/ToolCard";
import { CODE_TOOLS } from "@/lib/constants/tools";

export const metadata: Metadata = {
  title: "Code 도구",
  description: "JSON 포맷터, Regex 테스터, SQL 포맷터, Diff Tool 등 코드 작성 및 분석 도구 모음",
};

export default function CodeCategoryPage() {
  return (
    <div className="w-full px-4 py-10 md:px-6 lg:px-8">
      <div className="mb-8 flex items-start gap-4 border-b border-border pb-8">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand/10">
          <Code2 size={22} className="text-brand" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Code</h1>
          <p className="mt-1 text-sm text-text-secondary">
            JSON 포맷터, Regex 테스터, SQL 포맷터, Diff Tool 등{" "}
            {CODE_TOOLS.length}개의 코드 도구
          </p>
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {CODE_TOOLS.map((tool) => (
          <li key={tool.id}>
            <ToolCard {...tool} />
          </li>
        ))}
      </ul>
    </div>
  );
}