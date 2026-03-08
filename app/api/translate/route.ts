import { NextRequest, NextResponse } from "next/server";

interface MyMemoryResponse {
  responseData: {
    translatedText: string;
    match: number;
  };
  responseStatus: number;
  responseDetails: string;
}

export async function GET(req: NextRequest) {
  const q    = req.nextUrl.searchParams.get("q");
  const from = req.nextUrl.searchParams.get("from") ?? "en";
  const to   = req.nextUrl.searchParams.get("to")   ?? "ko";

  if (!q?.trim()) {
    return NextResponse.json({ error: "번역할 텍스트가 없습니다." }, { status: 400 });
  }

  if (q.length > 500) {
    return NextResponse.json({ error: "텍스트가 너무 깁니다. 500자 이하로 입력하세요." }, { status: 400 });
  }

  try {
    const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${from}|${to}`;
    const res    = await fetch(apiUrl, { next: { revalidate: 0 } });

    if (!res.ok) {
      return NextResponse.json({ error: "번역 서비스 응답 오류" }, { status: 502 });
    }

    const data = (await res.json()) as MyMemoryResponse;

    if (data.responseStatus !== 200) {
      return NextResponse.json({ error: data.responseDetails ?? "번역 실패" }, { status: 422 });
    }

    return NextResponse.json({ translated: data.responseData.translatedText });
  } catch {
    return NextResponse.json({ error: "번역 중 오류가 발생했습니다." }, { status: 500 });
  }
}