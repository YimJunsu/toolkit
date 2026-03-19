"use client";

import { useState, useEffect, useCallback } from "react";
import { Send, Copy, Check, Plus, Trash2, AlertTriangle, History, Save, BookOpen, X, ChevronDown } from "lucide-react";
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

interface SavedRequest {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers: Header[];
  body: string;
  savedAt: number;
}

interface EnvVar {
  key: string;
  value: string;
}

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "text-emerald-400",
  POST: "text-brand",
  PUT: "text-yellow-400",
  PATCH: "text-orange-400",
  DELETE: "text-red-400",
};

const STORAGE_KEY_HISTORY    = "api-tester-history";
const STORAGE_KEY_COLLECTIONS = "api-tester-collections";
const STORAGE_KEY_ENV         = "api-tester-env";

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/** {{KEY}} → value 치환 */
function resolveEnvVars(text: string, envVars: EnvVar[]): string {
  return envVars.reduce(
    (s, { key, value }) => s.replaceAll(`{{${key}}}`, value),
    text
  );
}

export default function ApiTesterPage() {
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [url, setUrl] = useState("https://jsonplaceholder.typicode.com/posts/1");
  const [headers, setHeaders] = useState<Header[]>([
    { key: "Content-Type", value: "application/json", enabled: true },
  ]);
  const [body, setBody] = useState('{\n  "title": "test",\n  "body": "hello"\n}');
  const [activeTab, setActiveTab] = useState<"headers" | "body" | "env">("headers");
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { copied, copy } = useClipboard();
  const [responseTab, setResponseTab] = useState<"body" | "headers">("body");

  /* ── 환경 변수 ── */
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);

  /* ── 히스토리 & 컬렉션 패널 ── */
  const [showHistory,     setShowHistory]     = useState(false);
  const [showCollections, setShowCollections] = useState(false);
  const [saveName,        setSaveName]        = useState("");
  const [showSaveForm,    setShowSaveForm]     = useState(false);

  const [history,     setHistory]     = useState<SavedRequest[]>([]);
  const [collections, setCollections] = useState<SavedRequest[]>([]);

  /* 초기 로드 */
  useEffect(() => {
    setHistory(loadFromStorage<SavedRequest[]>(STORAGE_KEY_HISTORY, []));
    setCollections(loadFromStorage<SavedRequest[]>(STORAGE_KEY_COLLECTIONS, []));
    setEnvVars(loadFromStorage<EnvVar[]>(STORAGE_KEY_ENV, []));
  }, []);

  /* 현재 요청 스냅샷 */
  const currentRequest = useCallback(
    (name = ""): SavedRequest => ({
      id: Date.now().toString(),
      name,
      method,
      url,
      headers,
      body,
      savedAt: Date.now(),
    }),
    [method, url, headers, body]
  );

  const handleSend = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResponse(null);
    const start = Date.now();

    try {
      const resolvedUrl = resolveEnvVars(url, envVars);
      const reqHeaders: Record<string, string> = {};
      headers.filter((h) => h.enabled && h.key).forEach((h) => {
        reqHeaders[resolveEnvVars(h.key, envVars)] = resolveEnvVars(h.value, envVars);
      });

      const options: RequestInit = { method, headers: reqHeaders };
      if (method !== "GET" && method !== "DELETE" && body.trim()) {
        options.body = resolveEnvVars(body, envVars);
      }

      const res = await fetch(resolvedUrl, options);
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

      /* 히스토리 저장 (최근 20개) */
      setHistory((prev) => {
        const next = [currentRequest(`${method} ${resolvedUrl}`), ...prev].slice(0, 20);
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(next));
        return next;
      });
    } catch (e) {
      setError(
        e instanceof TypeError && e.message.includes("fetch")
          ? "네트워크 오류 또는 CORS 정책으로 요청이 차단되었습니다."
          : e instanceof Error ? e.message : "요청 실패"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadRequest = (req: SavedRequest) => {
    setMethod(req.method);
    setUrl(req.url);
    setHeaders(req.headers);
    setBody(req.body);
    setShowHistory(false);
    setShowCollections(false);
  };

  const saveToCollection = () => {
    if (!saveName.trim()) return;
    const req = currentRequest(saveName.trim());
    const next = [req, ...collections];
    setCollections(next);
    localStorage.setItem(STORAGE_KEY_COLLECTIONS, JSON.stringify(next));
    setSaveName("");
    setShowSaveForm(false);
  };

  const deleteFromCollections = (id: string) => {
    const next = collections.filter((c) => c.id !== id);
    setCollections(next);
    localStorage.setItem(STORAGE_KEY_COLLECTIONS, JSON.stringify(next));
  };

  const addHeader = () =>
    setHeaders((prev) => [...prev, { key: "", value: "", enabled: true }]);

  const updateHeader = (idx: number, field: keyof Header, value: string | boolean) =>
    setHeaders((prev) => prev.map((h, i) => i === idx ? { ...h, [field]: value } : h));

  const removeHeader = (idx: number) =>
    setHeaders((prev) => prev.filter((_, i) => i !== idx));

  /* 환경 변수 */
  const addEnvVar = () =>
    setEnvVars((prev) => { const next = [...prev, { key: "", value: "" }]; localStorage.setItem(STORAGE_KEY_ENV, JSON.stringify(next)); return next; });

  const updateEnvVar = (idx: number, field: keyof EnvVar, value: string) =>
    setEnvVars((prev) => {
      const next = prev.map((v, i) => i === idx ? { ...v, [field]: value } : v);
      localStorage.setItem(STORAGE_KEY_ENV, JSON.stringify(next));
      return next;
    });

  const removeEnvVar = (idx: number) =>
    setEnvVars((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      localStorage.setItem(STORAGE_KEY_ENV, JSON.stringify(next));
      return next;
    });

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
      description="HTTP 요청을 전송하고 응답을 확인합니다. 환경변수·히스토리·컬렉션 지원."
      icon={Send}
    >
      <div className="flex flex-col gap-5">
        {/* CORS 안내 */}
        <div className="rounded-lg border border-border bg-bg-secondary px-4 py-3 text-xs text-text-secondary">
          <strong className="text-text-primary">CORS 안내</strong> — 브라우저 보안 정책으로 CORS를 허용하지 않는 서버에는 요청이 차단됩니다.
          테스트 API: <code className="text-brand">jsonplaceholder.typicode.com</code>&nbsp;&nbsp;
          <span className="text-text-secondary/60">환경변수 예: <code>{"{{BASE_URL}}"}</code></span>
        </div>

        {/* URL 입력 + 액션 버튼 */}
        <div className="flex gap-2 flex-wrap">
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
            placeholder="https://api.example.com/endpoint  또는  {{BASE_URL}}/path"
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 min-w-0 rounded-xl border border-border bg-bg-secondary px-4 py-2.5 text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
          />
          <div className="flex gap-2">
            {/* 히스토리 */}
            <button
              type="button"
              onClick={() => { setShowHistory((p) => !p); setShowCollections(false); }}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition-colors ${
                showHistory ? "border-brand text-brand bg-brand/5" : "border-border text-text-secondary hover:text-text-primary"
              }`}
              title="요청 히스토리"
            >
              <History size={13} />
              <span className="hidden sm:inline">기록</span>
              {history.length > 0 && (
                <span className="rounded-full bg-brand/15 px-1.5 py-px text-[10px] font-bold text-brand">{history.length}</span>
              )}
            </button>
            {/* 컬렉션 */}
            <button
              type="button"
              onClick={() => { setShowCollections((p) => !p); setShowHistory(false); }}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition-colors ${
                showCollections ? "border-brand text-brand bg-brand/5" : "border-border text-text-secondary hover:text-text-primary"
              }`}
              title="컬렉션"
            >
              <BookOpen size={13} />
              <span className="hidden sm:inline">컬렉션</span>
              {collections.length > 0 && (
                <span className="rounded-full bg-brand/15 px-1.5 py-px text-[10px] font-bold text-brand">{collections.length}</span>
              )}
            </button>
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
        </div>

        {/* 히스토리 패널 */}
        {showHistory && (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between border-b border-border bg-bg-secondary px-4 py-2.5">
              <span className="text-xs font-semibold text-text-primary">요청 히스토리</span>
              <button type="button" onClick={() => { setHistory([]); localStorage.removeItem(STORAGE_KEY_HISTORY); }}
                className="text-xs text-red-400/70 hover:text-red-400">전체 삭제</button>
            </div>
            {history.length === 0 ? (
              <p className="px-4 py-4 text-xs text-text-secondary">기록이 없습니다</p>
            ) : (
              <ul className="max-h-48 overflow-y-auto divide-y divide-border">
                {history.map((req) => (
                  <li key={req.id}>
                    <button type="button" onClick={() => loadRequest(req)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-xs hover:bg-bg-secondary transition-colors">
                      <span className={`w-14 shrink-0 font-bold ${METHOD_COLORS[req.method]}`}>{req.method}</span>
                      <span className="flex-1 truncate font-mono text-text-primary">{req.url}</span>
                      <span className="shrink-0 text-text-secondary/50">{new Date(req.savedAt).toLocaleTimeString()}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* 컬렉션 패널 */}
        {showCollections && (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between border-b border-border bg-bg-secondary px-4 py-2.5">
              <span className="text-xs font-semibold text-text-primary">컬렉션</span>
              <button type="button" onClick={() => setShowSaveForm((p) => !p)}
                className="flex items-center gap-1 text-xs text-brand hover:opacity-80">
                <Save size={11} /> 현재 요청 저장
              </button>
            </div>
            {showSaveForm && (
              <div className="flex gap-2 border-b border-border px-4 py-2.5">
                <input value={saveName} onChange={(e) => setSaveName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveToCollection()}
                  placeholder="컬렉션 이름"
                  className="flex-1 rounded-lg border border-border bg-bg-primary px-3 py-1.5 text-xs text-text-primary focus:border-brand focus:outline-none" />
                <button type="button" onClick={saveToCollection}
                  className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white">저장</button>
              </div>
            )}
            {collections.length === 0 ? (
              <p className="px-4 py-4 text-xs text-text-secondary">저장된 요청이 없습니다</p>
            ) : (
              <ul className="max-h-48 overflow-y-auto divide-y divide-border">
                {collections.map((req) => (
                  <li key={req.id}>
                    <div className="flex items-center gap-2 px-4 py-2.5 hover:bg-bg-secondary transition-colors">
                      <button type="button" onClick={() => loadRequest(req)}
                        className="flex flex-1 items-center gap-3 text-left text-xs min-w-0">
                        <span className={`w-14 shrink-0 font-bold ${METHOD_COLORS[req.method]}`}>{req.method}</span>
                        <span className="font-medium text-text-primary truncate">{req.name}</span>
                        <span className="shrink-0 truncate font-mono text-text-secondary/50">{req.url}</span>
                      </button>
                      <button type="button" onClick={() => deleteFromCollections(req.id)}
                        className="shrink-0 text-text-secondary/40 hover:text-red-400">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* 탭: 헤더 / 바디 / 환경변수 */}
        <div className="flex flex-col gap-3 rounded-xl border border-border overflow-hidden">
          <div className="flex border-b border-border">
            {(["headers", "body", "env"] as const).map((tab) => (
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
                {tab === "headers"
                  ? `헤더 (${headers.filter((h) => h.enabled && h.key).length})`
                  : tab === "body"
                  ? "Body"
                  : `환경변수 (${envVars.length})`}
              </button>
            ))}
          </div>

          <div className="px-4 pb-4">
            {activeTab === "headers" ? (
              <div className="flex flex-col gap-2">
                {headers.map((h, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input type="checkbox" checked={h.enabled}
                      onChange={(e) => updateHeader(idx, "enabled", e.target.checked)}
                      className="accent-brand" />
                    <input value={h.key} onChange={(e) => updateHeader(idx, "key", e.target.value)}
                      placeholder="Header-Name"
                      className="flex-1 rounded-lg border border-border bg-bg-primary px-3 py-1.5 font-mono text-xs text-text-primary focus:border-brand focus:outline-none" />
                    <input value={h.value} onChange={(e) => updateHeader(idx, "value", e.target.value)}
                      placeholder="value"
                      className="flex-1 rounded-lg border border-border bg-bg-primary px-3 py-1.5 font-mono text-xs text-text-primary focus:border-brand focus:outline-none" />
                    <button type="button" onClick={() => removeHeader(idx)}
                      className="text-text-secondary transition-colors hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addHeader}
                  className="flex items-center gap-1 self-start text-xs text-brand transition-opacity hover:opacity-75">
                  <Plus size={12} /> 헤더 추가
                </button>
              </div>
            ) : activeTab === "body" ? (
              <textarea value={body} onChange={(e) => setBody(e.target.value)}
                placeholder='{"key": "value"}' rows={6} spellCheck={false}
                disabled={method === "GET" || method === "DELETE"}
                className="w-full resize-none rounded-xl border border-border bg-bg-primary p-4 font-mono text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none disabled:opacity-40" />
            ) : (
              /* 환경 변수 */
              <div className="flex flex-col gap-2">
                <p className="text-xs text-text-secondary">
                  URL, 헤더, 바디에서 <code className="text-brand">{"{{KEY}}"}</code> 형식으로 사용합니다.
                </p>
                {envVars.map((v, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input value={v.key} onChange={(e) => updateEnvVar(idx, "key", e.target.value)}
                      placeholder="KEY"
                      className="w-36 rounded-lg border border-border bg-bg-primary px-3 py-1.5 font-mono text-xs text-brand focus:border-brand focus:outline-none" />
                    <span className="text-text-secondary/50 text-xs">=</span>
                    <input value={v.value} onChange={(e) => updateEnvVar(idx, "value", e.target.value)}
                      placeholder="value"
                      className="flex-1 rounded-lg border border-border bg-bg-primary px-3 py-1.5 font-mono text-xs text-text-primary focus:border-brand focus:outline-none" />
                    <button type="button" onClick={() => removeEnvVar(idx)}
                      className="text-text-secondary transition-colors hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addEnvVar}
                  className="flex items-center gap-1 self-start text-xs text-brand transition-opacity hover:opacity-75">
                  <Plus size={12} /> 변수 추가
                </button>
              </div>
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
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusColor}`}>
                {response.status} {response.statusText}
              </span>
              <span className="text-xs text-text-secondary">{response.time}ms</span>
              <span className="text-xs text-text-secondary">{(response.size / 1024).toFixed(2)} KB</span>
              <button type="button" onClick={() => copy(response.body)}
                className="ml-auto flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand">
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                {copied ? "복사됨" : "복사"}
              </button>
            </div>

            <div className="flex border-b border-border">
              {(["body", "headers"] as const).map((tab) => (
                <button key={tab} type="button" onClick={() => setResponseTab(tab)}
                  className={`px-4 py-2 text-xs font-medium transition-colors ${
                    responseTab === tab ? "border-b-2 border-brand text-brand" : "text-text-secondary hover:text-text-primary"
                  }`}>
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
