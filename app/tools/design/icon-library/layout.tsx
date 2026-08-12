import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "아이콘 라이브러리",
  description: "무료 SVG 아이콘 검색 및 React/SVG 코드 복사. 온라인 무료 아이콘 라이브러리.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
