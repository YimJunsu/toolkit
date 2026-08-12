import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "커피내기 컬렉션",
  description: "팀원과 커피 내기를 할 수 있는 다양한 미니 게임 모음. 무료 온라인 팀 게임 도구.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
