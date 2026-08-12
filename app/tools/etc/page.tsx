import type { Metadata } from "next";
import { CategoryPageLayout } from "@/components/tools/CategoryPageLayout";
import { TOOLS_BY_CATEGORY } from "@/lib/constants/tools";

export const metadata: Metadata = {
  title: "FUN & 미니 툴 | tool.kit",
  description: "오늘의 운세/포춘쿠키, 미니게임, 룰렛, 재미있는 미니 도구 모음",
};

export default function EtcCategoryPage() {
  return (
    <CategoryPageLayout
      categoryId="fun"
      title="FUN & 미니 툴"
      description="오늘의 운세/포춘쿠키, 미니게임, 룰렛, 재미있는 미니 도구 모음"
      tools={TOOLS_BY_CATEGORY["fun"] ?? []}
    />
  );
}

