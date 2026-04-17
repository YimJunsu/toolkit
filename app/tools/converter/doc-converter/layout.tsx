import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "문서 변환기",
  description: "이미지에서 PDF 변환 및 PDF에서 이미지 추출. 무료 온라인 문서 변환기.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
