import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sitemap Generator",
  description: "URL 목록을 XML sitemap으로 즉시 변환. 무료 온라인 사이트맵 생성기.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
