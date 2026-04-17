import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Word Counter",
  description: "글자 수·단어 수·문장 수·읽기 시간 분석 및 키워드 빈도 통계. 무료 온라인 글자수 세기.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
