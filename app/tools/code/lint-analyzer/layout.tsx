import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lint / Static Analyzer",
  description: "JS·TS·Python·HTML·CSS 코드 품질 검사 및 이슈 리포트. 무료 온라인 린트 도구.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
