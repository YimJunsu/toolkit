import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CSS Animation Generator",
  description: "keyframes 시각적 편집·프리셋 애니메이션·라이브 미리보기. 무료 CSS 애니메이션 생성기.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
