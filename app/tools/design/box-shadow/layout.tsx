import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Box Shadow Generator",
  description: "박스 그림자 시각적 편집·다중 그림자·CSS 코드 생성. 무료 Box Shadow 생성기.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
