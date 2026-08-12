import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Performance Test",
  description: "PageSpeed Insights로 Core Web Vitals 측정. 무료 온라인 웹 성능 테스트 도구.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
