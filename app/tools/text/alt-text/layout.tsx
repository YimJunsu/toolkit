import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "대체 텍스트 생성기",
  description: "이미지 설명용 alt 텍스트 작성 가이드 및 접근성 향상. 무료 alt 텍스트 생성기.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
