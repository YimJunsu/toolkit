import type { Metadata } from "next";
import { CategoryPageLayout } from "@/components/tools/CategoryPageLayout";
import { TOOLS_BY_CATEGORY } from "@/lib/constants/tools";

export const metadata: Metadata = {
  title: "디자이너 도구 | tool.kit",
  description: "Color Picker, Palette Generator, Gradient, Glassmorphism, Aspect Ratio 등 디자이너 도구 모음",
};

export default function DesignCategoryPage() {
  return (
    <CategoryPageLayout
      categoryId="design"
      title="디자이너 도구"
      description="Color Picker, Palette Generator, Gradient, Glassmorphism, Aspect Ratio 등"
      tools={TOOLS_BY_CATEGORY["design"] ?? []}
    />
  );
}

