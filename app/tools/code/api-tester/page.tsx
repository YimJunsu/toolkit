"use client";

import { useState } from "react";
import { Send, Copy, Check, Plus, Trash2, AlertTriangle } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { useClipboard } from "@/hooks/useClipboard";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Code", href: "/tools/code" },
];

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface Header {
  key: string;
  value: string;
  enabled: boolean;
}

interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number;
  size: number;
}

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "text-emerald-400",
  POST: "text-brand",
  PUT: "text-yellow-400",
  PATCH: "text-orange-400",
  DELETE: "text-red-400",
};

export default function ApiTesterPage() {
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [url, setUrl] = useState("https://jsonplaceholder.typicode.com/posts/1");
  const [headers, setHeaders] = useState<Header[]>([
    { key: "Content-Type", value: "application/json", enabled: true },
  ]);
  const [body, setBody] = useState('{\n  "title": "test",\n  "body": "hello"\n}');
  const [activeTab, setActiveTab] = useState<"headers" | "body">("headers");
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { copied, copy } = useClipboard();
  const [responseTab, setResponseTab] = useState<"body" | "headers">("body");

  const handleSend = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResponse(null);
    const start = Date.now();

    try {
      const reqHeaders: Record<string, string> = {};
      headers.filter((h) => h.enabled && h.key).forEach((h) => {
        reqHeaders[h.key] = h.value;
      });

      const options: RequestInit = {
        method,
        headers: reqHeaders,
      };

      if (method !== "GET" && method !== "DELETE" && body.trim()) {
        options.body = body;
      }

      const res = await fetch(url, options);
      const elapsed = Date.now() - start;
      const text = await res.text();

      const resHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => { resHeaders[k] = v; });

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: resHeaders,
        body: text,
        time: elapsed,
        size: new Blob([text]).size,
      });
    } catch (e) {
      setError(
        e instanceof TypeError && e.message.includes("fetch")
          ? "네트워크 오류 또는 CORS 정책으로 요청이 차단되었습니다. 서버가 CORS를 허용하는지 확인하세요."
          : e instanceof Error ? e.message : "요청 실패"
      );
    } finally {
      setLoading(false);
    }
  };

  const addHeader = () =>
    setHeaders((prev) => [...prev, { key: "", value: "", enabled: true }]);

  const updateHeader = (idx: number, field: keyof Header, value: string | boolean) =>
    setHeaders((prev) => prev.map((h, i) => i === idx ? { ...h, [field]: value } : h));

  const removeHeader = (idx: number) =>
    setHeaders((prev) => prev.filter((_, i) => i !== idx));

  const handleCopy = () => {
    if (!response) return;
    copy(response.body);
  };

  const formattedBody = (() => {
    if (!response) return "";
    try { return JSON.stringify(JSON.parse(response.body), null, 2); }
    catch { return response.body; }
  })();

  const statusColor =
    response?.status && response.status < 300
      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/40"
      : response?.status && response.status < 400
      ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/40"
      : "text-red-400 bg-red-500/10 border-red-500/40";

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="API Request Tester"
      description="HTTP 요청을 전송하고 응답을 확인합니다. CORS 허용 API에서 동작합니다."
      icon={Send}
    >
      <div className="flex flex-col gap-5">
        {/* CORS 안내 */}
        <div className="rounded-lg border border-border bg-bg-secondary px-4 py-3 text-xs text-text-secondary">
          <strong className="text-text-primary">CORS 안내</strong> — 브라우저 보안 정책으로 CORS를 허용하지 않는 서버에는 요청이 차단될 수 있습니다.
          테스트용 API: <code className="text-brand">jsonplaceholder.typicode.com</code>
        </div>

        {/* URL 입력 */}
        <div className="flex gap-2">
          <div className="flex overflow-hidden rounded-xl border border-border">
            {(["GET", "POST", "PUT", "PATCH", "DELETE"] as HttpMethod[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`px-3 py-2.5 text-xs font-bold transition-colors ${
                  method === m
                    ? `${METHOD_COLORS[m]} bg-bg-primary`
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://api.example.com/endpoint"
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 rounded-xl border border-border bg-bg-secondary px-4 py-2.5 text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={loading || !url.trim()}
            className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Send size={14} />
            {loading ? "전송 중..." : "전송"}
          </button>
        </div>

        {/* 탭: 헤더 / 바디 */}
        <div className="flex flex-col gap-3 rounded-xl border border-border overflow-hidden">
          <div className="flex border-b border-border">
            {(["headers", "body"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-xs font-medium transition-colors ${
                  activeTab === tab
                    ? "border-b-2 border-brand text-brand"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {tab === "headers" ? `헤더 (${headers.filter((h) => h.enabled && h.key).length})` : "Body"}
              </button>
            ))}
          </div>

          <div className="px-4 pb-4">
            {activeTab === "headers" ? (
              <div className="flex flex-col gap-2">
                {headers.map((h, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={h.enabled}
                      onChange={(e) => updateHeader(idx, "enabled", e.target.checked)}
                      className="accent-brand"
                    />
                    <input
                      value={h.key}
                      onChange={(e) => updateHeader(idx, "key", e.target.value)}
                      placeholder="Header-Name"
                      className="flex-1 rounded-lg border border-border bg-bg-primary px-3 py-1.5 font-mono text-xs text-text-primary focus:border-brand focus:outline-none"
                    />
                    <input
                      value={h.value}
                      onChange={(e) => updateHeader(idx, "value", e.target.value)}
                      placeholder="value"
                      className="flex-1 rounded-lg border border-border bg-bg-primary px-3 py-1.5 font-mono text-xs text-text-primary focus:border-brand focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeHeader(idx)}
                      className="text-text-secondary transition-colors hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addHeader}
                  className="flex items-center gap-1 self-start text-xs text-brand transition-opacity hover:opacity-75"
                >
                  <Plus size={12} /> 헤더 추가
                </button>
              </div>
            ) : (
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder='{"key": "value"}'
                rows={6}
                spellCheck={false}
                disabled={method === "GET" || method === "DELETE"}
                className="w-full resize-none rounded-xl border border-border bg-bg-primary p-4 font-mono text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none disabled:opacity-40"
              />
            )}
          </div>
        </div>

        {/* 에러 */}
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-400">
            <AlertTriangle size={13} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {/* 응답 */}
        {response && (
          <div className="flex flex-col gap-3 rounded-xl border border-border overflow-hidden">
            {/* 상태바 */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusColor}`}>
                {response.status} {response.statusText}
              </span>
              <span className="text-xs text-text-secondary">{response.time}ms</span>
              <span className="text-xs text-text-secondary">{(response.size / 1024).toFixed(2)} KB</span>
              <button
                type="button"
                onClick={handleCopy}
                className="ml-auto flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                {copied ? "복사됨" : "복사"}
              </button>
            </div>

            {/* 응답 탭 */}
            <div className="flex border-b border-border">
              {(["body", "headers"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setResponseTab(tab)}
                  className={`px-4 py-2 text-xs font-medium transition-colors ${
                    responseTab === tab ? "border-b-2 border-brand text-brand" : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {tab === "body" ? "응답 Body" : "응답 헤더"}
                </button>
              ))}
            </div>

            <div className="px-4 pb-4">
              {responseTab === "body" ? (
                <pre className="max-h-96 overflow-auto rounded-xl border border-border bg-bg-secondary p-4 font-mono text-xs leading-relaxed text-text-primary">
                  {formattedBody}
                </pre>
              ) : (
                <div className="overflow-hidden rounded-xl border border-border">
                  {Object.entries(response.headers).map(([k, v]) => (
                    <div key={k} className="flex gap-3 border-b border-border px-4 py-2 last:border-b-0">
                      <span className="w-48 shrink-0 font-mono text-xs font-semibold text-brand">{k}</span>
                      <span className="font-mono text-xs text-text-primary break-all">{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}