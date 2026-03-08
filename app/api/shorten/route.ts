import { NextRequest, NextResponse } from "next/server";

interface IsGdResponse {
  shorturl?: string;
  errormessage?: string;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "url 파라미터가 필요합니다." }, { status: 400 });
  }

  try {
    new URL(url); // URL 유효성 검사
  } catch {
    return NextResponse.json({ error: "유효하지 않은 URL 형식입니다." }, { status: 400 });
  }

  try {
    const apiUrl = `https://is.gd/create.php?format=json&url=${encodeURIComponent(url)}`;
    const res = await fetch(apiUrl, { next: { revalidate: 0 } });

    if (!res.ok) {
      return NextResponse.json({ error: "단축 서비스 응답 오류" }, { status: 502 });
    }

    const data = (await res.json()) as IsGdResponse;

    if (data.errormessage) {
      return NextResponse.json({ error: data.errormessage }, { status: 422 });
    }

    return NextResponse.json({ shortUrl: data.shorturl });
  } catch {
    return NextResponse.json({ error: "URL 단축 중 오류가 발생했습니다." }, { status: 500 });
  }
}