import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Diff / Merge Tool",
  description: "두 텍스트 라인 단위 비교·추가/삭제 하이라이트. 무료 온라인 Diff 도구.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
