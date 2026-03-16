"use client";

import { useState, useCallback, useEffect } from "react";
import { Link2, Copy, Check, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { useClipboard } from "@/hooks/useClipboard";

interface HistoryItem {
  original: string;
  shortened: string;
  createdAt: string;
}

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Encode / Decode", href: "/tools/encode-decode" },
];

const STORAGE_KEY = "toolkit:url-shortener:history";
const MAX_HISTORY = 20;

function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function UrlShortenerPage() {
  const [inputUrl, setInputUrl] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { copied, copy: handleCopy } = useClipboard();
  const [history, setHistory] = useState<HistoryItem[]>([]);

  /* localStorage 히스토리 로드 */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setHistory(JSON.parse(stored) as HistoryItem[]);
    } catch {
      // 무시
    }
  }, []);

  const saveHistory = useCallback((items: HistoryItem[]) => {
    setHistory(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // 무시
    }
  }, []);

  const handleShorten = useCallback(async () => {
    const trimmed = inputUrl.trim();
    if (!trimmed) return;

    if (!isValidUrl(trimmed)) {
      setError("http:// 또는 https://로 시작하는 올바른 URL을 입력하세요.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/shorten?url=${encodeURIComponent(trimmed)}`);
      const data = (await res.json()) as { shortUrl?: string; error?: string };

      if (!res.ok || data.error) {
        setError(data.error ?? "URL 단축 실패");
        return;
      }

      const shortUrl = data.shortUrl!;
      setResult(shortUrl);

      // 히스토리 앞에 추가 (중복 제거)
      setHistory((prev) => {
        const filtered = prev.filter((h) => h.original !== trimmed);
        const next: HistoryItem[] = [
          {
            original: trimmed,
            shortened: shortUrl,
            createdAt: new Date().toLocaleString("ko-KR"),
          },
          ...filtered,
        ].slice(0, MAX_HISTORY);
        saveHistory(next);
        return next;
      });
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도하세요.");
    } finally {
      setIsLoading(false);
    }
  }, [inputUrl, saveHistory]);

  const handleClearHistory = useCallback(() => {
    saveHistory([]);
  }, [saveHistory]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleShorten();
  };

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="URL 단축기"
      description="긴 URL을 짧고 공유하기 쉬운 링크로 즉시 변환합니다. (is.gd 서비스 사용)"
      icon={Link2}
    >
      <div className="flex flex-col gap-8">

        {/* 입력 영역 */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-text-primary">
            단축할 URL
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => { setInputUrl(e.target.value); setError(null); }}
              onKeyDown={handleKeyDown}
              placeholder="https://example.com/very/long/path?query=value&more=stuff"
              className="flex-1 rounded-xl border border-border bg-bg-secondary px-4 py-3 text-sm text-text-primary placeholder-text-secondary/50 transition-colors focus:border-brand focus:outline-none"
            />
            <button
              type="button"
              onClick={handleShorten}
              disabled={!inputUrl.trim() || isLoading}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-bg-primary transition-colors hover:bg-brand-hover disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Link2 size={15} />
              )}
              {isLoading ? "단축 중..." : "단축하기"}
            </button>
          </div>
          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
        </div>

        {/* 결과 */}
        {result && (
          <div className="flex flex-col gap-2 rounded-xl border border-brand/30 bg-brand/5 p-5">
            <p className="text-xs font-semibold text-text-secondary">단축 URL</p>
            <div className="flex items-center gap-3">
              <a
                href={result}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 font-mono text-lg font-bold text-brand transition-colors hover:text-brand-hover"
              >
                {result}
              </a>
              <a
                href={result}
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
                aria-label="새 탭으로 열기"
              >
                <ExternalLink size={15} />
              </a>
              <button
                type="button"
                onClick={() => handleCopy(result, "result")}
                className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
                aria-label="복사"
              >
                {copied === "result" ? (
                  <Check size={15} className="text-emerald-400" />
                ) : (
                  <Copy size={15} />
                )}
              </button>
            </div>
            <p className="mt-1 truncate text-xs text-text-secondary">
              원본: {inputUrl}
            </p>
          </div>
        )}

        {/* 히스토리 */}
        {history.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">
                최근 단축 내역
                <span className="ml-2 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                  {history.length}
                </span>
              </h2>
              <button
                type="button"
                onClick={handleClearHistory}
                className="flex items-center gap-1.5 text-xs text-text-secondary transition-colors hover:text-red-400"
              >
                <Trash2 size={12} />
                전체 삭제
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-border">
              <div className="divide-y divide-border">
                {history.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-brand/5"
                  >
                    <div className="min-w-0 flex-1">
                      <a
                        href={item.shortened}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-sm font-semibold text-brand transition-colors hover:text-brand-hover"
                      >
                        {item.shortened}
                      </a>
                      <p className="mt-0.5 truncate text-xs text-text-secondary">
                        {item.original}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-text-secondary">
                      {item.createdAt}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.shortened, `hist-${idx}`)}
                      className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
                      aria-label="복사"
                    >
                      {copied === `hist-${idx}` ? (
                        <Check size={12} className="text-emerald-400" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 안내 */}
        <div className="rounded-lg border border-border bg-bg-secondary px-4 py-3 text-xs text-text-secondary">
          <strong className="text-text-primary">is.gd</strong> 서비스를 통해 URL을 단축합니다.
          단축 링크는 영구적으로 유지되며 별도 계정이 필요 없습니다.
          히스토리는 이 기기의 브라우저에만 저장됩니다.
        </div>
      </div>
    </ToolPageLayout>
  );
}
