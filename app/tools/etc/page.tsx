import type { Metadata } from "next";
import { CategoryPageLayout } from "@/components/tools/CategoryPageLayout";
import { ETC_TOOLS } from "@/lib/constants/tools";

export const metadata: Metadata = {
  title: "기타 도구",
  description: "공인 IP 조회, 환율 변환기, 암호화폐 시세, 커피내기 등 유틸리티 도구 모음",
};

export default function EtcCategoryPage() {
  return (
    <CategoryPageLayout
      categoryId="etc"
      title="기타"
      description="공인 IP 조회, 환율 변환기, 암호화폐 시세, 뽀모도로 타이머, 커피내기 게임 등"
      tools={ETC_TOOLS}
    />
  );
}
