import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OpenGraph Preview",
  description: "Facebook·Twitter(X)·Discord 소셜 카드 미리보기. 무료 온라인 OpenGraph 미리보기.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
