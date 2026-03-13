"use client";

import { useState, useEffect, useCallback } from "react";
import { Cookie, RefreshCw, Search, Info } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Web", href: "/tools/web" },
];

type StorageTab = "cookie" | "localStorage" | "sessionStorage";

interface StorageEntry {
  key: string;
  value: string;
  size: number;
}

const TAB_LABELS: Record<StorageTab, string> = {
  cookie:         "Cookie",
  localStorage:   "localStorage",
  sessionStorage: "sessionStorage",
};

function parseCookies(): StorageEntry[] {
  if (typeof document === "undefined") return [];
  return document.cookie
    .split("; ")
    .filter(Boolean)
    .map((pair) => {
      const idx   = pair.indexOf("=");
      const key   = idx >= 0 ? pair.slice(0, idx) : pair;
      const value = idx >= 0 ? pair.slice(idx + 1) : "";
      return { key, value, size: new TextEncoder().encode(value).length };
    });
}

function parseWebStorage(storage: Storage): StorageEntry[] {
  const entries: StorageEntry[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (!key) continue;
    const value = storage.getItem(key) ?? "";
    entries.push({ key, value, size: new TextEncoder().encode(value).length });
  }
  return entries;
}

function readTab(tab: StorageTab): StorageEntry[] {
  if (typeof window === "undefined") return [];
  if (tab === "cookie")         return parseCookies();
  if (tab === "localStorage")   return parseWebStorage(localStorage);
  return parseWebStorage(sessionStorage);
}

export default function CookieViewerPage() {
  const [tab, setTab]               = useState<StorageTab>("cookie");
  const [entries, setEntries]       = useState<StorageEntry[]>([]);
  const [query, setQuery]           = useState("");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const refresh = useCallback(() => { setEntries(readTab(tab)); }, [tab]);

  useEffect(() => { refresh(); }, [refresh]);

  const filtered = entries.filter(
    (e) =>
      e.key.toLowerCase().includes(query.toLowerCase()) ||
      e.value.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="Cookie / Session Viewer"
      description="현재 페이지(tool.kit)의 Cookie, localStorage, sessionStorage 항목을 조회합니다."
      icon={Cookie}
    >
      <div className="flex flex-col gap-6">

        {/* 안내 */}
        <div className="flex items-start gap-3 rounded-xl border border-border bg-bg-secondary px-4 py-3 text-xs text-text-secondary">
          <Info size={14} className="mt-0.5 shrink-0 text-brand" />
          <span>
            보안 정책상 현재 사이트(<strong className="text-text-primary">tool.kit</strong>)의 저장소만 조회 가능합니다.
            HttpOnly 쿠키는 JavaScript에서 접근할 수 없어 표시되지 않습니다.
          </span>
        </div>

        {/* 탭 + 새로고침 */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 rounded-xl border border-border bg-bg-secondary p-1">
            {(Object.keys(TAB_LABELS) as StorageTab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTab(t); setQuery(""); setExpandedKey(null); }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  tab === t ? "bg-brand text-bg-primary" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {TAB_LABELS[t]}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={refresh}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
          >
            <RefreshCw size={12} />
            새로고침
          </button>
        </div>

        {/* 검색 */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Key 또는 Value 검색..."
            className="w-full rounded-lg border border-border bg-bg-secondary py-2 pl-9 pr-3 text-sm text-text-primary focus:border-brand focus:outline-none"
          />
        </div>

        <p className="text-xs text-text-secondary">{filtered.length}개 항목</p>

        {/* 결과 */}
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-bg-secondary py-16 text-center text-sm text-text-secondary">
            {entries.length === 0
              ? `${TAB_LABELS[tab]} 항목이 없습니다.`
              : "검색 결과가 없습니다."}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="grid grid-cols-[1fr_2fr_auto] gap-3 border-b border-border bg-bg-secondary px-4 py-2">
              <span className="text-xs font-semibold text-text-secondary">Key</span>
              <span className="text-xs font-semibold text-text-secondary">Value</span>
              <span className="text-xs font-semibold text-text-secondary">Size</span>
            </div>
            {filtered.map((entry) => {
              const isExpanded = expandedKey === entry.key;
              const truncated  = entry.value.length > 80;
              return (
                <div
                  key={entry.key}
                  className="grid grid-cols-[1fr_2fr_auto] gap-3 border-b border-border px-4 py-3 last:border-b-0"
                >
                  <span className="break-all font-mono text-xs font-medium text-text-primary">{entry.key}</span>
                  <div>
                    <span className="break-all font-mono text-xs text-text-secondary">
                      {isExpanded || !truncated ? entry.value : entry.value.slice(0, 80) + "…"}
                    </span>
                    {truncated && (
                      <button
                        type="button"
                        onClick={() => setExpandedKey(isExpanded ? null : entry.key)}
                        className="ml-2 text-xs text-brand hover:underline"
                      >
                        {isExpanded ? "접기" : "펼치기"}
                      </button>
                    )}
                  </div>
                  <span className="text-right font-mono text-xs text-text-secondary">{entry.size}B</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}