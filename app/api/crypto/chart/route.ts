import { NextRequest, NextResponse } from "next/server";

// 캔들 데이터: 인터벌별 캐시 시간
export const revalidate = 60;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const symbol   = searchParams.get("symbol");
  const interval = searchParams.get("interval") ?? "1h";
  const limit    = searchParams.get("limit")    ?? "168";

  if (!symbol) {
    return NextResponse.json({ error: "symbol 파라미터 필요" }, { status: 400 });
  }

  try {
    const url =
      `https://api.binance.com/api/v3/klines` +
      `?symbol=${encodeURIComponent(symbol)}` +
      `&interval=${interval}` +
      `&limit=${limit}`;

    const res = await fetch(url, {
      next: { revalidate: 60 },
      headers: { "Accept": "application/json" },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Binance API 오류 (${res.status})` },
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
