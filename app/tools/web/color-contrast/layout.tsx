import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Color Contrast Checker",
  description: "전경색·배경색 조합의 WCAG AA·AAA 명암비 즉시 검사. 무료 온라인 색상 접근성 검사기.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
