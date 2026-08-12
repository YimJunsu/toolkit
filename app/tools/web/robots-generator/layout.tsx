import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Robots.txt Generator",
  description: "User-agent 규칙으로 robots.txt 즉시 생성. 무료 온라인 Robots.txt 생성기.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
