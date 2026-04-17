import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이미지 변환기",
  description: "JPEG·PNG·WebP·SVG 포맷 변환, 압축, 리사이즈, 배경 제거. 무료 온라인 이미지 변환기.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
