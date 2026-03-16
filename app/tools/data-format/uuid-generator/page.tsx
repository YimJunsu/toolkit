"use client";

import { useState, useCallback } from "react";
import { Fingerprint, Copy, Check, Download, RefreshCw } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { useClipboard } from "@/hooks/useClipboard";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Data / Format", href: "/tools/data-format" },
];

type UuidFormat = "standard" | "uppercase" | "no-hyphens" | "braces";

const FORMAT_OPTIONS: { value: UuidFormat; label: string; desc: string }[] = [
  { value: "standard",   label: "표준",         desc: "550e8400-e29b-41d4-a716-446655440000" },
  { value: "uppercase",  label: "대문자",        desc: "550E8400-E29B-41D4-A716-446655440000" },
  { value: "no-hyphens", label: "하이픈 없음",   desc: "550e8400e29b41d4a716446655440000" },
  { value: "braces",     label: "중괄호",        desc: "{550e8400-e29b-41d4-a716-446655440000}" },
];

function applyFormat(uuid: string, format: UuidFormat): string {
  switch (format) {
    case "standard":   return uuid;
    case "uppercase":  return uuid.toUpperCase();
    case "no-hyphens": return uuid.replace(/-/g, "");
    case "braces":     return `{${uuid}}`;
  }
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function UuidGeneratorPage() {
  const [count, setCount] = useState(1);
  const [format, setFormat] = useState<UuidFormat>("standard");
  const [uuids, setUuids] = useState<string[]>([]);
  const { copied: copiedId, copy } = useClipboard();

  const generate = useCallback(() => {
    const n = Math.min(Math.max(count, 1), 100);
    const results: string[] = [];
    for (let i = 0; i < n; i++) {
      results.push(applyFormat(crypto.randomUUID(), format));
    }
    setUuids(results);
  }, [count, format]);

  const copyItem = useCallback((text: string, id: string) => copy(text, id), [copy]);
  const copyAll = useCallback(() => { if (uuids.length) copy(uuids.join("\n"), "all"); }, [uuids, copy]);

  const downloadTxt = () => {
    if (!uuids.length) return;
    downloadFile(uuids.join("\n"), "uuids.txt", "text/plain");
  };

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="UUID 생성기"
      description="crypto.randomUUID()를 사용해 표준 UUID v4를 생성합니다. 다양한 포맷과 일괄 생성을 지원합니다."
      icon={Fingerprint}
    >
      <div className="flex flex-col gap-6">

        {/* 옵션 */}
        <div className="flex flex-wrap items-end gap-5">
          {/* 생성 개수 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">생성 개수 (1 ~ 100)</label>
            <input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(Math.min(100, Math.max(1, Number(e.target.value))))}
              className="w-28 rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          {/* 포맷 선택 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">포맷</label>
            <div className="flex overflow-hidden rounded-lg border border-border">
              {FORMAT_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormat(value)}
                  className={`px-3 py-2 text-xs font-medium transition-colors duration-150 sm:px-4 sm:text-sm ${
                    format === value
                      ? "bg-brand text-white"
                      : "text-text-secondary hover:bg-brand/10 hover:text-text-primary"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 생성 버튼 */}
          <button
            type="button"
            onClick={generate}
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
          >
            <RefreshCw size={14} />
            생성
          </button>
        </div>

        {/* 포맷 미리보기 */}
        <div className="rounded-lg border border-border bg-bg-secondary px-4 py-3">
          <p className="text-xs text-text-secondary">
            <span className="font-semibold text-text-primary mr-2">포맷 예시</span>
            <span className="font-mono">{FORMAT_OPTIONS.find((f) => f.value === format)?.desc}</span>
          </p>
        </div>

        {/* 결과 */}
        {uuids.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-text-secondary">
                생성된 UUID ({uuids.length}개)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyAll}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
                >
                  {copiedId === "all" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  전체 복사
                </button>
                <button
                  type="button"
                  onClick={downloadTxt}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
                >
                  TXT 다운로드
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-border">
              {uuids.map((uuid, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-b-0 hover:bg-bg-secondary/50"
                >
                  <span className="w-7 shrink-0 text-center text-xs text-text-secondary/50">{i + 1}</span>
                  <span className="flex-1 font-mono text-sm text-text-primary">{uuid}</span>
                  <button
                    type="button"
                    onClick={() => copyItem(uuid, `uuid-${i}`)}
                    className="flex shrink-0 items-center gap-1 rounded border border-border px-2 py-1 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
                  >
                    {copiedId === `uuid-${i}` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </ToolPageLayout>
  );
}