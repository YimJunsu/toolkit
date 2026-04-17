import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "샘플 데이터 생성기",
  description: "이름·이메일·전화번호 등 테스트용 샘플 데이터를 JSON·CSV·SQL로 즉시 생성. 무료 더미 데이터 생성기.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
