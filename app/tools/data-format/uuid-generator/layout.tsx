import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "UUID 생성기",
  description: "UUID v4 단일·대량 생성 및 다양한 포맷 변환. 무료 온라인 UUID 생성기.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
