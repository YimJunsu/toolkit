import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "문장 요약 / 키워드 추출",
  description: "긴 글에서 핵심 문장과 주요 키워드 자동 추출. 무료 온라인 텍스트 요약 도구.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
