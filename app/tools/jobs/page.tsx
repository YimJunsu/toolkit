import type { Metadata } from "next";
import { CategoryPageLayout } from "@/components/tools/CategoryPageLayout";
import { TOOLS_BY_CATEGORY } from "@/lib/constants/tools";

export const metadata: Metadata = {
  title: "세금 & 업무 계산기 | tool.kit",
  description: "연봉 실수령액, 퇴직금 계산기, 주휴수당/알바, 세금/부가세, 프리랜서 단가 계산기 등",
};

export default function JobsCategoryPage() {
  return (
    <CategoryPageLayout
      categoryId="jobs"
      title="세금 & 업무 계산기"
      description="연봉 실수령액, 퇴직금 계산기, 주휴수당/알바, 세금/부가세, 프리랜서 단가 계산기 등"
      tools={TOOLS_BY_CATEGORY["jobs"] ?? []}
    />
  );
}

