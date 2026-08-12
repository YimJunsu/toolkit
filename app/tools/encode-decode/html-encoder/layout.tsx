import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HTML 인코더 / 디코더",
  description: "특수 문자와 HTML 엔티티 양방향 변환. 무료 온라인 HTML 인코더.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
