import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "폰트 변환기",
  description: "TTF·OTF에서 WOFF 변환 및 CSS @font-face 코드 생성. 무료 온라인 폰트 변환기.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
