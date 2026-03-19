"use client";

import { useState, useMemo } from "react";
import { Globe, Copy, Check, Search } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { useClipboard } from "@/hooks/useClipboard";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Code", href: "/tools/code" },
];

interface StatusCode {
  code: number;
  name: string;
  description: string;
  category: 1 | 2 | 3 | 4 | 5;
}

const STATUS_CODES: StatusCode[] = [
  // 1xx
  { code: 100, name: "Continue", description: "서버가 요청의 첫 번째 부분을 받았으며, 나머지를 계속 보내도 된다는 것을 알립니다.", category: 1 },
  { code: 101, name: "Switching Protocols", description: "서버가 클라이언트의 프로토콜 전환 요청을 수락하고 프로토콜을 변경합니다.", category: 1 },
  { code: 102, name: "Processing", description: "서버가 요청을 수신하고 처리 중이지만 아직 응답이 없음을 나타냅니다.", category: 1 },
  { code: 103, name: "Early Hints", description: "Link 헤더를 미리 전송하여 클라이언트가 서버의 응답을 기다리는 동안 리소스를 미리 로드할 수 있도록 합니다.", category: 1 },
  // 2xx
  { code: 200, name: "OK", description: "요청이 성공적으로 처리되었습니다. 가장 일반적인 성공 응답입니다.", category: 2 },
  { code: 201, name: "Created", description: "요청이 성공적으로 처리되어 새로운 리소스가 생성되었습니다. POST 요청에 주로 사용됩니다.", category: 2 },
  { code: 202, name: "Accepted", description: "요청이 수신되었지만 처리가 완료되지 않았습니다. 비동기 처리에 사용됩니다.", category: 2 },
  { code: 203, name: "Non-Authoritative Information", description: "요청이 성공적이지만 반환된 메타 정보가 원본 서버의 것이 아닙니다.", category: 2 },
  { code: 204, name: "No Content", description: "요청이 성공했지만 응답 본문이 없습니다. DELETE 요청에 자주 사용됩니다.", category: 2 },
  { code: 205, name: "Reset Content", description: "요청이 성공적으로 처리되었으며 클라이언트가 문서를 초기화해야 합니다.", category: 2 },
  { code: 206, name: "Partial Content", description: "서버가 요청의 일부만 반환합니다. Range 헤더와 함께 파일 다운로드 재개에 사용됩니다.", category: 2 },
  // 3xx
  { code: 301, name: "Moved Permanently", description: "요청한 리소스가 영구적으로 새 URL로 이동했습니다. 검색 엔진이 새 URL을 캐시합니다.", category: 3 },
  { code: 302, name: "Found", description: "요청한 리소스가 임시로 다른 URL에 있습니다. 검색 엔진은 원래 URL을 유지합니다.", category: 3 },
  { code: 303, name: "See Other", description: "응답을 다른 URL에서 GET 요청으로 가져와야 합니다. POST 후 리다이렉트에 사용됩니다.", category: 3 },
  { code: 304, name: "Not Modified", description: "클라이언트의 캐시된 버전이 최신입니다. 서버가 새로운 콘텐츠를 전송하지 않습니다.", category: 3 },
  { code: 307, name: "Temporary Redirect", description: "리소스가 임시로 다른 URL에 있으며 메서드와 본문을 유지하며 리다이렉트합니다.", category: 3 },
  { code: 308, name: "Permanent Redirect", description: "리소스가 영구적으로 이동했으며 메서드와 본문을 유지하며 리다이렉트합니다.", category: 3 },
  // 4xx
  { code: 400, name: "Bad Request", description: "서버가 요청을 이해할 수 없습니다. 잘못된 문법이나 유효하지 않은 요청 메시지 형식입니다.", category: 4 },
  { code: 401, name: "Unauthorized", description: "인증이 필요합니다. 요청에 유효한 인증 자격 증명이 포함되지 않았습니다.", category: 4 },
  { code: 402, name: "Payment Required", description: "결제가 필요합니다. 현재는 거의 사용되지 않지만 향후 디지털 결제를 위해 예약되어 있습니다.", category: 4 },
  { code: 403, name: "Forbidden", description: "서버가 요청을 이해했지만 권한이 없어 수행을 거부합니다. 인증과 무관하게 접근이 금지됩니다.", category: 4 },
  { code: 404, name: "Not Found", description: "서버가 요청한 리소스를 찾을 수 없습니다. URL이 잘못되었거나 리소스가 삭제되었을 수 있습니다.", category: 4 },
  { code: 405, name: "Method Not Allowed", description: "요청에 사용된 HTTP 메서드가 해당 리소스에서 허용되지 않습니다.", category: 4 },
  { code: 406, name: "Not Acceptable", description: "서버가 클라이언트의 Accept 헤더에 부합하는 콘텐츠를 생성할 수 없습니다.", category: 4 },
  { code: 408, name: "Request Timeout", description: "서버가 유휴 연결에서 기다리는 시간이 초과되었습니다.", category: 4 },
  { code: 409, name: "Conflict", description: "요청이 서버의 현재 상태와 충돌합니다. 동시 수정 시 발생할 수 있습니다.", category: 4 },
  { code: 410, name: "Gone", description: "요청한 리소스가 영구적으로 삭제되어 더 이상 사용할 수 없습니다.", category: 4 },
  { code: 411, name: "Length Required", description: "서버가 Content-Length 헤더 없이는 요청을 수락하지 않습니다.", category: 4 },
  { code: 413, name: "Content Too Large", description: "요청 본문이 서버가 허용하는 것보다 큽니다.", category: 4 },
  { code: 414, name: "URI Too Long", description: "요청 URL이 서버가 처리할 수 있는 길이보다 깁니다.", category: 4 },
  { code: 415, name: "Unsupported Media Type", description: "서버가 요청 본문의 미디어 타입을 지원하지 않습니다.", category: 4 },
  { code: 422, name: "Unprocessable Entity", description: "요청 형식은 올바르지만 내용의 의미 오류로 처리할 수 없습니다. 유효성 검사 실패 시 주로 사용됩니다.", category: 4 },
  { code: 423, name: "Locked", description: "리소스가 잠겨 있어 접근할 수 없습니다.", category: 4 },
  { code: 429, name: "Too Many Requests", description: "클라이언트가 지정된 시간 동안 너무 많은 요청을 보냈습니다. Rate limiting에 사용됩니다.", category: 4 },
  { code: 451, name: "Unavailable For Legal Reasons", description: "법적 이유로 서버가 요청한 리소스에 대한 접근을 거부합니다.", category: 4 },
  // 5xx
  { code: 500, name: "Internal Server Error", description: "서버 내부 오류로 요청을 처리할 수 없습니다. 가장 일반적인 서버 오류 응답입니다.", category: 5 },
  { code: 501, name: "Not Implemented", description: "서버가 요청을 수행하는 데 필요한 기능을 지원하지 않습니다.", category: 5 },
  { code: 502, name: "Bad Gateway", description: "게이트웨이나 프록시가 업스트림 서버로부터 유효하지 않은 응답을 받았습니다.", category: 5 },
  { code: 503, name: "Service Unavailable", description: "서버가 일시적으로 요청을 처리할 수 없습니다. 과부하나 유지보수 중일 때 발생합니다.", category: 5 },
  { code: 504, name: "Gateway Timeout", description: "게이트웨이나 프록시가 업스트림 서버로부터 제때 응답을 받지 못했습니다.", category: 5 },
  { code: 505, name: "HTTP Version Not Supported", description: "서버가 요청에 사용된 HTTP 프로토콜 버전을 지원하지 않습니다.", category: 5 },
  { code: 507, name: "Insufficient Storage", description: "서버가 요청을 완료하는 데 필요한 표현을 저장할 공간이 부족합니다.", category: 5 },
  { code: 508, name: "Loop Detected", description: "서버가 요청을 처리하는 중 무한 루프를 감지했습니다.", category: 5 },
  { code: 511, name: "Network Authentication Required", description: "네트워크에 접근하려면 인증이 필요합니다. 와이파이 로그인 페이지 등에서 사용됩니다.", category: 5 },
];

const CATEGORY_STYLES: Record<number, { badge: string; label: string }> = {
  1: { badge: "bg-gray-500/15 text-gray-400 border-gray-500/30", label: "1xx 정보" },
  2: { badge: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30", label: "2xx 성공" },
  3: { badge: "bg-blue-500/15 text-blue-400 border-blue-500/30", label: "3xx 리다이렉션" },
  4: { badge: "bg-amber-500/15 text-amber-500 border-amber-500/30", label: "4xx 클라이언트 오류" },
  5: { badge: "bg-red-500/15 text-red-400 border-red-500/30", label: "5xx 서버 오류" },
};

type CategoryFilter = "all" | 1 | 2 | 3 | 4 | 5;

export default function HttpStatusPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const { copied, copy } = useClipboard();

  const filtered = useMemo(() => {
    return STATUS_CODES.filter((s) => {
      const matchCat = filter === "all" || s.category === filter;
      const q = query.trim().toLowerCase();
      const matchQuery = !q || String(s.code).includes(q) || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [query, filter]);

  const tabs: { label: string; value: CategoryFilter }[] = [
    { label: "전체", value: "all" },
    { label: "1xx", value: 1 },
    { label: "2xx", value: 2 },
    { label: "3xx", value: 3 },
    { label: "4xx", value: 4 },
    { label: "5xx", value: 5 },
  ];

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="HTTP Status Code Reference"
      description="HTTP 상태 코드의 의미와 사용 사례를 한국어로 빠르게 조회합니다."
      icon={Globe}
    >
      <div className="flex flex-col gap-5">
        {/* 검색 */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="코드 번호 또는 이름으로 검색..."
            className="w-full rounded-xl border border-border bg-bg-secondary py-2.5 pl-9 pr-4 text-sm text-text-primary placeholder-text-secondary/60 transition-colors focus:border-brand focus:outline-none"
          />
        </div>

        {/* 카테고리 탭 */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilter(tab.value)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === tab.value
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-border text-text-secondary hover:border-brand/40 hover:text-text-primary"
              }`}
            >
              {tab.label}
              <span className="ml-1.5 rounded-full bg-bg-primary px-1.5 py-0.5 text-xs">
                {tab.value === "all"
                  ? STATUS_CODES.length
                  : STATUS_CODES.filter((s) => s.category === tab.value).length}
              </span>
            </button>
          ))}
        </div>

        {/* 결과 수 */}
        <p className="text-xs text-text-secondary">
          {filtered.length}개 결과
        </p>

        {/* 코드 목록 */}
        <div className="flex flex-col gap-3">
          {filtered.map((s) => {
            const style = CATEGORY_STYLES[s.category];
            return (
              <div
                key={s.code}
                className="flex items-start gap-4 rounded-xl border border-border bg-bg-secondary p-4 transition-colors hover:border-border/80"
              >
                <button
                  type="button"
                  onClick={() => copy(String(s.code), String(s.code))}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-sm font-bold transition-opacity hover:opacity-80 ${style.badge}`}
                  title="코드 복사"
                >
                  {s.code}
                  {copied === String(s.code) ? (
                    <Check size={11} className="text-emerald-400" />
                  ) : (
                    <Copy size={11} className="opacity-60" />
                  )}
                </button>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-text-primary">{s.name}</span>
                  <span className="text-xs leading-relaxed text-text-secondary">{s.description}</span>
                  <span className={`mt-1 w-fit rounded-full border px-2 py-0.5 text-xs ${style.badge}`}>
                    {style.label}
                  </span>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="rounded-xl border border-border bg-bg-secondary py-12 text-center">
              <p className="text-text-secondary">검색 결과가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </ToolPageLayout>
  );
}
