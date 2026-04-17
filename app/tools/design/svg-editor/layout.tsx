import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SVG Path Editor",
  description: "SVG 코드 최적화·미니파이·포매팅·미리보기. 무료 온라인 SVG 에디터.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
