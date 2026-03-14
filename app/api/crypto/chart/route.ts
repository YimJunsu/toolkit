import { NextRequest, NextResponse } from "next/server";

// 차트 데이터는 5분 캐시
export const revalidate = 300;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id   = searchParams.get("id");
  const days = searchParams.get("days") ?? "7";

  if (!id) {
    return NextResponse.json({ error: "id 파라미터 필요" }, { status: 400 });
  }

  try {
    const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=${days}`;
    const res = await fetch(url, {
      next: { revalidate: 300 },
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
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" },
    });
  } catch {
    return NextResponse.json({ error: "네트워크 오류" }, { status: 500 });
  }
}