import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Border Radius Visualizer",
  description: "모서리 둥글기 시각적 편집·각 코너 개별 조절. CSS와 Tailwind 코드 생성.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
