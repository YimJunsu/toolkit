import type { Metadata } from "next";
import { CategoryPageLayout } from "@/components/tools/CategoryPageLayout";
import { CODE_TOOLS } from "@/lib/constants/tools";

export const metadata: Metadata = {
  title: "Code 도구",
  description: "JSON 포맷터, Regex 테스터, SQL 포맷터, Diff Tool 등 코드 작성 및 분석 도구 모음",
};

export default function CodeCategoryPage() {
  return (
    <CategoryPageLayout
      categoryId="code"
      title="Code"
      description="JSON 포맷터, Regex 테스터, SQL 포맷터, Diff Tool 등 코드 작성·분석 도구"
      tools={CODE_TOOLS}
    />
  );
}
