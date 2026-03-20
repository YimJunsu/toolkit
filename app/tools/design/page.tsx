import type { Metadata } from "next";
import { CategoryPageLayout } from "@/components/tools/CategoryPageLayout";
import { DESIGN_TOOLS } from "@/lib/constants/tools";

export const metadata: Metadata = {
  title: "Design 도구",
  description: "색상, 폰트, 그리드, CSS 이펙트 등 디자인 관련 도구 모음",
};

export default function DesignCategoryPage() {
  return (
    <CategoryPageLayout
      categoryId="design"
      title="Design"
      description="색상 도구, 폰트 미리보기, 그리드 생성기, CSS 이펙트 생성기 등 디자인 도구"
      tools={DESIGN_TOOLS}
    />
  );
}
