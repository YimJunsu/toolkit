import type { Metadata } from "next";
import { CategoryPageLayout } from "@/components/tools/CategoryPageLayout";
import { WEB_TOOLS } from "@/lib/constants/tools";

export const metadata: Metadata = {
  title: "Web 도구",
  description: "색상 대비, SEO 분석, 성능 테스트, 메타 태그 미리보기 등 웹 개발 도구 모음",
};

export default function WebCategoryPage() {
  return (
    <CategoryPageLayout
      categoryId="web"
      title="Web"
      description="색상 대비, SEO 분석기, 성능 테스트, 메타 태그 미리보기 등 웹 개발 도구"
      tools={WEB_TOOLS}
    />
  );
}
