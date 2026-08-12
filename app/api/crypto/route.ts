import { NextResponse } from "next/server";

const TOP_SYMBOLS = [
  "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT",
  "ADAUSDT", "AVAXUSDT", "DOGEUSDT", "TRXUSDT", "TONUSDT",
  "DOTUSDT", "SHIBUSDT", "LTCUSDT", "LINKUSDT", "BCHUSDT",
  "XLMUSDT", "NEARUSDT", "ATOMUSDT", "ETCUSDT", "FILUSDT",
  "APTUSDT", "ARBUSDT", "OPUSDT",   "INJUSDT", "SUIUSDT",
  "RUNEUSDT","AAVEUSDT","MKRUSDT",  "UNIUSDT", "PEPEUSDT",
  "LDOUSDT", "STXUSDT", "SANDUSDT", "MANAUSDT","AXSUSDT",
  "VETUSDT", "HBARUSDT","GRTUSDT",  "XTZUSDT", "EGLDUSDT",
  "COMPUSDT","GALAUSDT","CHZUSDT",  "ALGOUSDT","ICPUSDT",
];

// Next.js 서버에서 30초마다 갱신
export const revalidate = 30;

export async function GET() {
  try {
    const symbolsJson = JSON.stringify(TOP_SYMBOLS);
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbolsJson)}`;

    const res = await fetch(url, {
      next: { revalidate: 30 },
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
      headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=10" },
    });
  } catch {
    return NextResponse.json({ error: "네트워크 오류" }, { status: 500 });
  }
}
