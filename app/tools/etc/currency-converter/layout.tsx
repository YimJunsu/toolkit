import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "환율 변환기",
  description: "160개 통화 환율 조회 및 변환·일 1회 업데이트. 무료 온라인 환율 계산기.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
