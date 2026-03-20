import type { Metadata } from "next";
import { CategoryPageLayout } from "@/components/tools/CategoryPageLayout";
import { DATA_FORMAT_TOOLS } from "@/lib/constants/tools";

export const metadata: Metadata = {
  title: "Data / Format 도구",
  description: "CSV·JSON·Excel 변환, UUID·샘플 데이터 생성, 타임스탬프 변환 도구 모음",
};

export default function DataFormatCategoryPage() {
  return (
    <CategoryPageLayout
      categoryId="data-format"
      title="Data / Format"
      description="CSV↔JSON 변환, Excel 파싱, UUID 생성, 샘플 데이터 생성, 타임스탬프 변환 도구"
      tools={DATA_FORMAT_TOOLS}
    />
  );
}
