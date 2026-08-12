import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cron Expression Builder",
  description: "크론 표현식 시각적 빌더·다음 실행 시간 미리보기. 무료 온라인 Cron 빌더.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
