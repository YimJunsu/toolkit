import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CSV JSON 변환기",
  description: "CSV와 JSON 형식을 양방향으로 즉시 변환. 무료 온라인 CSV JSON 변환기.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
