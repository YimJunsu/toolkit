import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Case Converter",
  description: "camelCase·snake_case·PascalCase·kebab-case 즉시 변환. 무료 온라인 대소문자 변환기.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
