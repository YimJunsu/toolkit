"use client";

import { useState, useCallback } from "react";
import { Clock, Copy, Check } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { useClipboard } from "@/hooks/useClipboard";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Data / Format", href: "/tools/data-format" },
];

function toKST(date: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).format(date);
}

function toUTC(date: Date): string {
  return date.toUTCString();
}

function toISO(date: Date): string {
  return date.toISOString();
}

function toLocal(date: Date): string {
  return date.toLocaleString();
}

function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const absDiff = Math.abs(diffMs);
  const suffix = diffMs >= 0 ? "전" : "후";

  const seconds = Math.floor(absDiff / 1000);
  if (seconds < 60) return `${seconds}초 ${suffix}`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 ${suffix}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 ${suffix}`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 ${suffix}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}개월 ${suffix}`;
  const years = Math.floor(months / 12);
  return `${years}년 ${suffix}`;
}

interface ConvertedResult {
  utc: string;
  kst: string;
  local: string;
  iso: string;
  relative: string;
}

function nowDatetimeLocal(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export default function TimestampConverterPage() {
  // Section A: timestamp → date
  const [tsInput, setTsInput] = useState("");
  const [tsResult, setTsResult] = useState<ConvertedResult | null>(null);
  const [tsError, setTsError] = useState("");

  // Section B: date → timestamp
  const [dtInput, setDtInput] = useState("");
  const [unixSec, setUnixSec] = useState<string>("");
  const [unixMs, setUnixMs] = useState<string>("");

  const { copied, copy } = useClipboard();

  // A: 타임스탬프 → 날짜 변환
  const convertTs = useCallback((val: string) => {
    setTsError("");
    setTsResult(null);
    if (!val.trim()) return;
    const num = Number(val.trim());
    if (isNaN(num)) {
      setTsError("숫자 형식의 Unix 타임스탬프를 입력하세요.");
      return;
    }
    // 자동 감지: 10자리 → 초, 13자리 → 밀리초
    const ms = val.trim().length <= 10 ? num * 1000 : num;
    const date = new Date(ms);
    if (isNaN(date.getTime())) {
      setTsError("유효하지 않은 타임스탬프입니다.");
      return;
    }
    setTsResult({
      utc:      toUTC(date),
      kst:      toKST(date),
      local:    toLocal(date),
      iso:      toISO(date),
      relative: relativeTime(date),
    });
  }, []);

  const handleTsNow = () => {
    const nowTs = String(Math.floor(Date.now() / 1000));
    setTsInput(nowTs);
    convertTs(nowTs);
  };

  // B: 날짜 → 타임스탬프 변환
  const convertDt = useCallback((val: string) => {
    setUnixSec("");
    setUnixMs("");
    if (!val) return;
    const d = new Date(val);
    if (isNaN(d.getTime())) return;
    const ms = d.getTime();
    setUnixMs(String(ms));
    setUnixSec(String(Math.floor(ms / 1000)));
  }, []);

  const handleDtNow = () => {
    const now = nowDatetimeLocal();
    setDtInput(now);
    convertDt(now);
  };

  const tsResultItems = tsResult
    ? [
        { label: "UTC",          value: tsResult.utc,      id: "utc" },
        { label: "KST (UTC+9)",  value: tsResult.kst,      id: "kst" },
        { label: "로컬",          value: tsResult.local,    id: "local" },
        { label: "ISO 8601",     value: tsResult.iso,      id: "iso" },
        { label: "상대 시간",     value: tsResult.relative, id: "rel" },
      ]
    : [];

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="타임스탬프 변환기"
      description="Unix 타임스탬프를 날짜로, 날짜를 Unix 타임스탬프로 즉시 변환합니다. KST, UTC, ISO 8601 등 다양한 포맷을 지원합니다."
      icon={Clock}
    >
      <div className="grid gap-6 lg:grid-cols-2">

        {/* ────────── 섹션 A: 타임스탬프 → 날짜 ────────── */}
        <div className="flex flex-col gap-4 rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-text-primary">타임스탬프 → 날짜</h2>

          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={tsInput}
              onChange={(e) => { setTsInput(e.target.value); convertTs(e.target.value); }}
              placeholder="예: 1700000000 또는 1700000000000"
              className="flex-1 rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
            <button
              type="button"
              onClick={handleTsNow}
              className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border px-3 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
            >
              현재 시각
            </button>
          </div>

          <p className="text-xs text-text-secondary/60">
            10자리 = 초(seconds) / 13자리 = 밀리초(milliseconds) 자동 감지
          </p>

          {tsError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {tsError}
            </div>
          )}

          {tsResultItems.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-border">
              {tsResultItems.map(({ label, value, id }) => (
                <div key={id} className="flex items-center gap-3 border-b border-border px-3 py-2.5 last:border-b-0">
                  <span className="w-24 shrink-0 text-xs font-semibold text-text-secondary">{label}</span>
                  <span className="flex-1 min-w-0 break-all font-mono text-xs text-text-primary">{value}</span>
                  <button
                    type="button"
                    onClick={() => copy(value, id)}
                    className="flex shrink-0 items-center rounded border border-border px-2 py-1 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
                  >
                    {copied === id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ────────── 섹션 B: 날짜 → 타임스탬프 ────────── */}
        <div className="flex flex-col gap-4 rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-text-primary">날짜 → 타임스탬프</h2>

          <div className="flex gap-2">
            <input
              type="datetime-local"
              value={dtInput}
              onChange={(e) => { setDtInput(e.target.value); convertDt(e.target.value); }}
              className="flex-1 rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
            <button
              type="button"
              onClick={handleDtNow}
              className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border px-3 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
            >
              현재 시각
            </button>
          </div>

          {(unixSec || unixMs) && (
            <div className="overflow-hidden rounded-xl border border-border">
              {[
                { label: "Unix (초)",    value: unixSec, id: "dt-sec" },
                { label: "Unix (밀리초)", value: unixMs,  id: "dt-ms" },
              ].map(({ label, value, id }) => (
                <div key={id} className="flex items-center gap-3 border-b border-border px-3 py-2.5 last:border-b-0">
                  <span className="w-28 shrink-0 text-xs font-semibold text-text-secondary">{label}</span>
                  <span className="flex-1 min-w-0 font-mono text-sm text-text-primary">{value}</span>
                  <button
                    type="button"
                    onClick={() => copy(value, id)}
                    className="flex shrink-0 items-center rounded border border-border px-2 py-1 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
                  >
                    {copied === id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 현재 시각 실시간 정보 안내 */}
          <div className="rounded-lg border border-border bg-bg-secondary px-3 py-2">
            <p className="text-xs text-text-secondary">
              브라우저 로컬 타임존 기준으로 변환됩니다.
            </p>
          </div>
        </div>

      </div>
    </ToolPageLayout>
  );
}