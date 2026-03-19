"use client";

import { useState, useEffect } from "react";
import { Globe2 } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Web", href: "/tools/web" },
];

const CORS_HEADERS = [
  { name: "Access-Control-Allow-Origin", description: "허용된 요청 출처(Origin)를 지정합니다. * 또는 특정 URL." },
  { name: "Access-Control-Allow-Methods", description: "허용된 HTTP 메서드 목록 (GET, POST, OPTIONS 등)." },
  { name: "Access-Control-Allow-Headers", description: "허용된 요청 헤더 목록을 지정합니다." },
  { name: "Access-Control-Allow-Credentials", description: "쿠키/인증 정보 포함 요청 허용 여부 (true/false)." },
  { name: "Access-Control-Max-Age", description: "Preflight 결과를 브라우저가 캐시할 수 있는 시간(초)." },
  { name: "Access-Control-Expose-Headers", description: "브라우저가 접근할 수 있도록 노출할 헤더 목록." },
];

type Method = "GET" | "POST" | "OPTIONS";

interface TestResult {
  ok: boolean;
  status?: number;
  headers: Record<string, string>;
  corsAllowed: boolean;
  allowOrigin: string | null;
  error?: string;
}

export default function CorsTesterPage() {
  const [url, setUrl] = useState("https://api.github.com");
  const [origin, setOrigin] = useState("");
  const [method, setMethod] = useState<Method>("GET");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  async function runTest() {
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(url.trim(), {
        method,
        mode: "cors",
        headers: {
          Origin: origin,
        },
      });
      const headers: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        headers[key] = value;
      });
      const allowOrigin = headers["access-control-allow-origin"] ?? null;
      const corsAllowed = allowOrigin === "*" || allowOrigin === origin;
      setResult({ ok: res.ok, status: res.status, headers, corsAllowed, allowOrigin });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const isCorsError =
        message.toLowerCase().includes("cors") ||
        message.toLowerCase().includes("failed to fetch") ||
        message.toLowerCase().includes("network");
      setResult({
        ok: false,
        headers: {},
        corsAllowed: false,
        allowOrigin: null,
        error: isCorsError
          ? "CORS 정책에 의해 요청이 차단되었습니다. 서버가 Access-Control-Allow-Origin 헤더를 반환하지 않거나 출처가 허용되지 않은 것 같습니다."
          : message,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="CORS Header Tester"
      description="특정 URL에 CORS 요청을 보내고 Access-Control 응답 헤더를 분석합니다."
      icon={Globe2}
    >
      {/* 입력 */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-bg-secondary p-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-text-secondary">테스트 URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/api"
            className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-text-secondary">Origin</label>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="https://your-site.com"
              className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-text-secondary">Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as Method)}
              className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary focus:border-brand focus:outline-none"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="OPTIONS">OPTIONS (Preflight)</option>
            </select>
          </div>
        </div>
        <button
          type="button"
          onClick={runTest}
          disabled={loading || !url.trim()}
          className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "요청 중..." : "테스트"}
        </button>
      </div>

      {/* 결과 */}
      {result && (
        <div className="mt-6 flex flex-col gap-4">
          {/* CORS 판단 */}
          <div
            className="flex items-start gap-3 rounded-xl border p-4"
            style={
              result.error
                ? { borderColor: "rgb(239,68,68)", background: "rgba(239,68,68,0.06)" }
                : result.corsAllowed
                ? { borderColor: "rgb(34,197,94)", background: "rgba(34,197,94,0.06)" }
                : { borderColor: "rgb(239,68,68)", background: "rgba(239,68,68,0.06)" }
            }
          >
            <span
              className="mt-0.5 text-xl"
              style={{ color: result.corsAllowed && !result.error ? "rgb(34,197,94)" : "rgb(239,68,68)" }}
            >
              {result.corsAllowed && !result.error ? "✓" : "✗"}
            </span>
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {result.error
                  ? "요청 실패"
                  : result.corsAllowed
                  ? "CORS 허용됨"
                  : "CORS 차단됨"}
              </p>
              {result.status && (
                <p className="text-xs text-text-secondary">HTTP {result.status}</p>
              )}
              {result.error && (
                <p className="mt-1 text-xs text-text-secondary">{result.error}</p>
              )}
              {result.allowOrigin && (
                <p className="mt-1 text-xs text-text-secondary">
                  Access-Control-Allow-Origin: <span className="font-mono text-brand">{result.allowOrigin}</span>
                </p>
              )}
            </div>
          </div>

          {/* CORS 헤더 목록 */}
          {Object.keys(result.headers).length > 0 && (
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="border-b border-border bg-bg-secondary px-4 py-3 text-xs font-semibold text-text-primary">
                CORS 관련 헤더
              </div>
              <div className="divide-y divide-border">
                {CORS_HEADERS.map((h) => {
                  const key = h.name.toLowerCase();
                  const val = result.headers[key];
                  return (
                    <div key={h.name} className="flex flex-col gap-0.5 px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-brand">{h.name}</span>
                        <span className="font-mono text-xs text-text-primary">
                          {val ?? <span className="text-text-secondary/50">없음</span>}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 전체 응답 헤더 */}
          {Object.keys(result.headers).length > 0 && (
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="border-b border-border bg-bg-secondary px-4 py-3 text-xs font-semibold text-text-primary">
                전체 응답 헤더
              </div>
              <div className="divide-y divide-border">
                {Object.entries(result.headers).map(([key, val]) => (
                  <div key={key} className="flex items-start justify-between gap-4 px-4 py-2">
                    <span className="font-mono text-xs text-text-secondary">{key}</span>
                    <span className="break-all text-right font-mono text-xs text-text-primary">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CORS 헤더 설명 표 */}
      <div className="mt-8 overflow-hidden rounded-xl border border-border">
        <div className="border-b border-border bg-bg-secondary px-4 py-3 text-xs font-semibold text-text-primary">
          CORS 헤더 참조
        </div>
        <div className="divide-y divide-border">
          {CORS_HEADERS.map((h) => (
            <div key={h.name} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-6">
              <span className="w-full font-mono text-xs text-brand sm:w-72 sm:shrink-0">{h.name}</span>
              <span className="text-xs text-text-secondary">{h.description}</span>
            </div>
          ))}
        </div>
      </div>
    </ToolPageLayout>
  );
}
