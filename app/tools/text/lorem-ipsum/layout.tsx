import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lorem Ipsum Generator",
  description: "단락·단어·문장 단위로 Lorem Ipsum 더미 텍스트 생성. 무료 온라인 로렘 입숨 생성기.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
