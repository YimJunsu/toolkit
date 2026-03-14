import { NextResponse } from "next/server";

const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/coins/markets" +
  "?vs_currency=usd&order=market_cap_desc&per_page=50&page=1" +
  "&sparkline=true&price_change_percentage=7d";

// Next.js 서버에서 60초마다 CoinGecko에 1회만 요청 → rate limit 방어
export const revalidate = 60;

export async function GET() {
  try {
    const res = await fetch(COINGECKO_URL, {
      next: { revalidate: 60 },
      headers: { "Accept": "application/json" },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `CoinGecko API 오류 (${res.status})` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" },
    });
  } catch {
    return NextResponse.json({ error: "네트워크 오류" }, { status: 500 });
  }
}