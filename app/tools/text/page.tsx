import type { Metadata } from "next";
import { CategoryPageLayout } from "@/components/tools/CategoryPageLayout";
import { TEXT_TOOLS } from "@/lib/constants/tools";

export const metadata: Metadata = {
  title: "Text 도구",
  description: "언어 감지, 번역, 문장 요약, 키워드 추출, 대체 텍스트 생성 등 텍스트 도구 모음",
};

export default function TextCategoryPage() {
  return (
    <CategoryPageLayout
      categoryId="text"
      title="Text"
      description="언어 감지·번역, 문장 요약·키워드 추출, Case 변환, Word Counter 등 텍스트 도구"
      tools={TEXT_TOOLS}
    />
  );
}
