import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Color Palette Generator",
  description: "입력 색상 기반 보색·유사색·삼색 팔레트 생성. 무료 온라인 컬러 팔레트 생성기.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
