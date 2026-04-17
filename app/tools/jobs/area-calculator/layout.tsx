import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "평수 계산기",
  description: "평, m2, ft2 면적 단위 변환 및 전용·공급·계약면적 계산. 무료 온라인 평수 계산기.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
