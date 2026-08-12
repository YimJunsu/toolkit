import type { Metadata } from "next";
import { CategoryPageLayout } from "@/components/tools/CategoryPageLayout";
import { TOOLS_BY_CATEGORY } from "@/lib/constants/tools";

export const metadata: Metadata = {
  title: "개발자 도구 | tool.kit",
  description: "JSON 포맷터, Regex 테스터, SQL 포맷터, Diff Tool, Base64, UUID/비밀번호 생성기 등 개발자 필수 도구 모음",
};

export default function CodeCategoryPage() {
  return (
    <CategoryPageLayout
      categoryId="code"
      title="개발자 도구"
      description="JSON 포맷터, Regex 테스터, SQL 포맷터, Diff Tool, Base64/Hash, UUID/비밀번호 생성기 등"
      tools={TOOLS_BY_CATEGORY["code"] ?? []}
    />
  );
}

