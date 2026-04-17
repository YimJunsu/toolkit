import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "폰트 미리보기",
  description: "다양한 웹폰트 조합 및 스타일 시각화. 무료 온라인 폰트 미리보기 도구.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
