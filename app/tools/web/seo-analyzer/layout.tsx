import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SEO 분석기",
  description: "title·description·heading·OpenGraph 태그 분석 및 점수 산출. 무료 온라인 SEO 분석 도구.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
