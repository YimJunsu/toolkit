import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tailwind v4 테마 생성기",
  description: "베이스 컬러로 oklch 기반 11단계 팔레트 생성 및 @theme 코드 출력. Tailwind CSS 테마 생성기.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
