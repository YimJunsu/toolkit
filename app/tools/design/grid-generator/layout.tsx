import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "그리드 / 레이아웃 생성기",
  description: "CSS Flexbox / Grid 코드 자동 생성. 무료 온라인 CSS 레이아웃 생성기.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
