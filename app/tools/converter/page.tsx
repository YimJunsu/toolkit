import type { Metadata } from "next";
import { CategoryPageLayout } from "@/components/tools/CategoryPageLayout";
import { CONVERTER_TOOLS } from "@/lib/constants/tools";

export const metadata: Metadata = {
  title: "Converter 도구",
  description: "오디오·비디오·폰트·문서 포맷 변환 도구 모음",
};

export default function ConverterCategoryPage() {
  return (
    <CategoryPageLayout
      categoryId="converter"
      title="Converter"
      description="오디오·비디오·이미지·폰트·문서 포맷 변환, QR코드 생성 등 변환 도구"
      tools={CONVERTER_TOOLS}
    />
  );
}
