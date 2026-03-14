"use client";

import { useState, useMemo } from "react";
import { Hash } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Text", href: "/tools/text" },
];

const SAMPLE = `도구(tool)란 어떤 목적을 달성하기 위해 사용되는 수단이나 장치를 말합니다.
개발자에게 좋은 도구는 생산성을 크게 향상시킵니다. tool.kit은 개발자와 디자이너를 위한 종합 도구 모음입니다.

빠르고 편리한 도구를 제공하는 것이 우리의 목표입니다.`;

interface Stats {
  chars: number;
  charsNoSpace: number;
  words: number;
  sentences: number;
  lines: number;
  paragraphs: number;
  readingTime: number; // seconds
  topKeywords: Array<{ word: string; count: number }>;
}

function analyze(text: string): Stats {
  const chars = text.length;
  const charsNoSpace = text.replace(/\s/g, "").length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const sentences = text.trim() ? (text.match(/[.!?。]+/g) ?? []).length || 1 : 0;
  const lines = text ? text.split("\n").length : 0;
  const paragraphs = text.trim() ? text.split(/\n\s*\n/).filter((p) => p.trim()).length : 0;
  const readingTime = Math.ceil(words / 238); // avg 238 WPM

  // 키워드 빈도 (2자 이상 단어)
  const wordList = text.toLowerCase().match(/[a-z가-힣]{2,}/g) ?? [];
  const freq: Record<string, number> = {};
  for (const w of wordList) freq[w] = (freq[w] ?? 0) + 1;
  const topKeywords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));

  return { chars, charsNoSpace, words, sentences, lines, paragraphs, readingTime, topKeywords };
}

const STAT_ITEMS = [
  { key: "chars", label: "전체 글자", unit: "자" },
  { key: "charsNoSpace", label: "공백 제외", unit: "자" },
  { key: "words", label: "단어 수", unit: "개" },
  { key: "sentences", label: "문장 수", unit: "개" },
  { key: "lines", label: "줄 수", unit: "줄" },
  { key: "paragraphs", label: "문단 수", unit: "개" },
] as const;

export default function WordCounterPage() {
  const [text, setText] = useState(SAMPLE);

  const stats = useMemo(() => analyze(text), [text]);

  const readingLabel =
    stats.readingTime < 1
      ? "1분 미만"
      : stats.readingTime === 1
      ? "약 1분"
      : `약 ${stats.readingTime}분`;

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="Word Counter"
      description="글자 수·단어 수·문장 수·읽기 시간을 실시간으로 분석하고 키워드 빈도를 통계로 보여줍니다."
      icon={Hash}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* 텍스트 입력 — 3/5 */}
        <div className="flex flex-col gap-2 lg:col-span-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">텍스트 입력</span>
            <button
              type="button"
              onClick={() => setText("")}
              disabled={!text}
              className="text-xs text-text-secondary transition-colors hover:text-text-primary disabled:opacity-30"
            >
              지우기
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="분석할 텍스트를 입력하세요..."
            rows={20}
            className="w-full resize-none rounded-xl border border-border bg-bg-secondary p-4 text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
          />
        </div>

        {/* 통계 패널 — 2/5 */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* 기본 통계 */}
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="border-b border-border bg-bg-secondary px-4 py-3 text-xs font-semibold text-text-primary">
              통계
            </div>
            <div className="divide-y divide-border">
              {STAT_ITEMS.map(({ key, label, unit }) => (
                <div key={key} className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-text-secondary">{label}</span>
                  <span className="font-mono text-sm font-bold text-text-primary">
                    {stats[key].toLocaleString()}
                    <span className="ml-1 text-xs font-normal text-text-secondary">{unit}</span>
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs text-text-secondary">읽기 시간</span>
                <span className="text-sm font-bold text-brand">{readingLabel}</span>
              </div>
            </div>
          </div>

          {/* 키워드 빈도 */}
          {stats.topKeywords.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="border-b border-border bg-bg-secondary px-4 py-3 text-xs font-semibold text-text-primary">
                상위 키워드
              </div>
              <div className="divide-y divide-border">
                {stats.topKeywords.map(({ word, count }, i) => {
                  const max = stats.topKeywords[0].count;
                  const pct = Math.round((count / max) * 100);
                  return (
                    <div key={word} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="w-4 shrink-0 text-xs text-text-secondary/60">{i + 1}</span>
                      <span className="flex-1 text-sm text-text-primary">{word}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-bg-primary">
                          <div
                            className="h-full rounded-full bg-brand"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-4 text-right font-mono text-xs text-text-secondary">
                          {count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </ToolPageLayout>
  );
}