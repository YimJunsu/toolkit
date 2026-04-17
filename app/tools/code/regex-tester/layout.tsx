import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Regex Tester",
  description: "정규식 패턴 테스트·매치 그룹 시각화·플래그 옵션 지원. 무료 온라인 정규표현식 테스터.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
