import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Slug Generator",
  description: "제목 또는 문장을 URL 친화적인 slug로 즉시 변환. 무료 온라인 슬러그 생성기.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
