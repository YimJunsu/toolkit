import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "타임스탬프 변환기",
  description: "Unix 타임스탬프와 날짜/시간 양방향 변환 및 KST·UTC 동시 표시. 무료 온라인 타임스탬프 변환기.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
