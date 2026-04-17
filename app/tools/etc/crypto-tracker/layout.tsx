import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "암호화폐 시세",
  description: "Binance WebSocket 실시간 암호화폐 시세·캔들스틱 차트·검색. BTC·ETH 등 45개 코인 무료 조회.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
