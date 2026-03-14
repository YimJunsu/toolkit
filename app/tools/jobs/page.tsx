import type { Metadata } from "next";
import { Briefcase } from "lucide-react";
import { ToolCard } from "@/components/ui/ToolCard";
import { JOBS_TOOLS } from "@/lib/constants/tools";

export const metadata: Metadata = {
  title: "Jobs 도구",
  description: "부동산, 생활 계산 등 실생활에 유용한 도구 모음",
};

export default function JobsCategoryPage() {
  return (
    <div className="w-full px-4 py-10 md:px-6 lg:px-8">
      <div className="mb-8 flex items-start gap-4 border-b border-border pb-8">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand/10">
          <Briefcase size={22} className="text-brand" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Jobs</h1>
          <p className="mt-1 text-sm text-text-secondary">
            부동산 · 생활 계산 등 실무에 유용한 {JOBS_TOOLS.length}개 도구
          </p>
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {JOBS_TOOLS.map((tool) => (
          <li key={tool.id}>
            <ToolCard {...tool} />
          </li>
        ))}
      </ul>
    </div>
  );
}