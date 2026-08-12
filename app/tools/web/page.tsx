import type { Metadata } from "next";
import { CategoryPageLayout } from "@/components/tools/CategoryPageLayout";
import { TOOLS_BY_CATEGORY } from "@/lib/constants/tools";

export const metadata: Metadata = {
  title: "유틸리티 | tool.kit",
  description: "QR 코드 생성기, 단위 변환기, 스톱워치, PDF 변환, 글자수 세기 등 유틸리티 도구 모음",
};

export default function WebCategoryPage() {
  return (
    <CategoryPageLayout
      categoryId="utility"
      title="유틸리티"
      description="QR 코드 생성기, 단위 변환기, 스톱워치/타이머, PDF 변환, 글자수 세기 등 유용한 유틸리티 모음"
      tools={TOOLS_BY_CATEGORY["utility"] ?? []}
    />
  );
}

