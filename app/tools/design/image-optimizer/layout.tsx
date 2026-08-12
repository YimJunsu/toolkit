import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이미지 최적화",
  description: "이미지 최적화 및 압축 도구. 무료 온라인 이미지 최적화.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
