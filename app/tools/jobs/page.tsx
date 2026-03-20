import type { Metadata } from "next";
import { CategoryPageLayout } from "@/components/tools/CategoryPageLayout";
import { JOBS_TOOLS } from "@/lib/constants/tools";

export const metadata: Metadata = {
  title: "Jobs 도구",
  description: "부동산, 생활 계산 등 실생활에 유용한 도구 모음",
};

export default function JobsCategoryPage() {
  return (
    <CategoryPageLayout
      categoryId="jobs"
      title="Jobs"
      description="평수 계산기, 회계 계산기 등 직장인·프리랜서·자영업자를 위한 실무 도구"
      tools={JOBS_TOOLS}
    />
  );
}
