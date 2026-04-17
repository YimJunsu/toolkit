import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Glassmorphism Generator",
  description: "blur·투명도·테두리 조절로 유리 효과 CSS 코드 생성. 무료 글래스모피즘 생성기.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
