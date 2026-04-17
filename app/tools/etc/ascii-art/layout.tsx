import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ASCII Art Generator",
  description: "텍스트를 ASCII 아트로 변환·다양한 폰트 스타일 선택. 무료 온라인 ASCII 아트 생성기.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
