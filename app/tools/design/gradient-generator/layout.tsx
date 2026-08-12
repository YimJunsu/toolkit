import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gradient / CSS Generator",
  description: "색상 조합으로 그라데이션 CSS 코드 즉시 생성. 무료 온라인 그라디언트 생성기.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
