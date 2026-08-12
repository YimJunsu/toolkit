import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "언어 감지 / 번역",
  description: "텍스트 언어 자동 감지 및 10개 언어 번역. 무료 온라인 언어 감지 도구.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
