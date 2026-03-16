"use client";

import { useState, useMemo } from "react";
import { FileText, Copy, Check } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { summarizeText, extractKeywords, getTextStats } from "@/lib/utils/textUtils";
import { useClipboard } from "@/hooks/useClipboard";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Text", href: "/tools/text" },
];

const SENTENCE_OPTIONS = [1, 2, 3, 4, 5] as const;
const KEYWORD_OPTIONS  = [5, 10, 15, 20] as const;

export default function SummarizerPage() {
  const [input, setInput]           = useState("");
  const [numSentences, setNumSentences] = useState(3);
  const [numKeywords, setNumKeywords]   = useState(10);
  const { copied, copy } = useClipboard();

  const stats   = useMemo(() => getTextStats(input), [input]);
  const summary = useMemo(
    () => (input.trim() ? summarizeText(input, numSentences) : null),
    [input, numSentences],
  );
  const keywords = useMemo(
    () => (input.trim() ? extractKeywords(input, numKeywords) : []),
    [input, numKeywords],
  );

  const hasResult = !!summary && input.trim().length > 0;

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="문장 요약 / 키워드 추출"
      description="긴 텍스트에서 핵심 문장을 추출하고 주요 키워드를 분석합니다. (완전 오프라인 처리)"
      icon={FileText}
    >
      <div className="flex flex-col gap-6">

        {/* 입력 */}
        <div className="flex flex-col gap-2">
          <div className="flex h-7 items-center justify-between">
            <label className="text-xs font-semibold text-text-secondary">분석할 텍스트</label>
            <button
              type="button"
              onClick={() => setInput("")}
              disabled={!input}
              className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand disabled:opacity-30"
            >
              지우기
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="요약하거나 키워드를 추출할 텍스트를 붙여넣으세요..."
            rows={9}
            className="resize-none rounded-xl border border-border bg-bg-secondary p-4 text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
            spellCheck={false}
          />

          {/* 텍스트 통계 */}
          <div className="flex flex-wrap gap-4 text-xs text-text-secondary">
            <span>{stats.chars.toLocaleString()} 자</span>
            <span>{stats.words.toLocaleString()} 단어</span>
            <span>{stats.sentences.toLocaleString()} 문장</span>
            <span>읽기 {stats.readingTimeMin}분</span>
          </div>
        </div>

        {/* 설정 */}
        <div className="flex flex-wrap items-center gap-5 rounded-xl border border-border bg-bg-secondary px-4 py-3">
          {/* 요약 문장 수 */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text-secondary">요약 문장</span>
            <div className="flex overflow-hidden rounded-lg border border-border">
              {SENTENCE_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNumSentences(n)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    numSentences === n
                      ? "bg-brand text-bg-primary"
                      : "text-text-secondary hover:bg-brand/10 hover:text-text-primary"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* 키워드 수 */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text-secondary">키워드 수</span>
            <div className="flex overflow-hidden rounded-lg border border-border">
              {KEYWORD_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNumKeywords(n)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    numKeywords === n
                      ? "bg-brand text-bg-primary"
                      : "text-text-secondary hover:bg-brand/10 hover:text-text-primary"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 결과 */}
        {hasResult && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">

            {/* 요약문 */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-text-secondary">
                  핵심 요약 ({summary!.sentences.length}/{summary!.totalSentences} 문장)
                </p>
                <button
                  type="button"
                  onClick={() => copy(summary!.summary, "summary")}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
                >
                  {copied === "summary" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copied === "summary" ? "복사됨" : "복사"}
                </button>
              </div>
              <div className="rounded-xl border border-border bg-bg-primary p-4">
                {summary!.sentences.map((s, i) => (
                  <p key={i} className="mb-2 text-sm leading-relaxed text-text-primary last:mb-0">
                    <span className="mr-2 font-mono text-xs font-bold text-brand">{i + 1}.</span>
                    {s}
                  </p>
                ))}
              </div>
            </div>

            {/* 키워드 */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-text-secondary">주요 키워드</p>
                <button
                  type="button"
                  onClick={() => copy(keywords.map((k) => k.word).join(", "), "keywords")}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
                >
                  {copied === "keywords" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copied === "keywords" ? "복사됨" : "복사"}
                </button>
              </div>
              <div className="rounded-xl border border-border bg-bg-primary p-4">
                {keywords.length === 0 ? (
                  <p className="text-xs text-text-secondary">키워드를 추출할 수 없습니다.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {keywords.map(({ word, count, score }, i) => (
                      <div key={word} className="flex items-center gap-2">
                        <span className="w-5 shrink-0 font-mono text-xs text-text-secondary">{i + 1}</span>
                        <span className="flex-1 text-sm font-semibold text-text-primary">{word}</span>
                        <span className="text-xs text-text-secondary">{count}회</span>
                        <div className="w-16">
                          <div className="h-1.5 overflow-hidden rounded-full bg-bg-secondary">
                            <div
                              className="h-full rounded-full bg-brand"
                              style={{ width: `${Math.min(100, score * 5)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 미입력 안내 */}
        {!hasResult && !input && (
          <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-text-secondary">
            텍스트를 입력하면 자동으로 요약과 키워드가 추출됩니다.
          </div>
        )}

        {/* 설명 */}
        <div className="rounded-lg border border-border bg-bg-secondary px-4 py-3 text-xs text-text-secondary">
          <strong className="text-text-primary">완전 오프라인 처리</strong> — 서버 전송 없이 브라우저에서 직접 분석합니다.
          추출적 요약(Extractive Summarization) 방식으로 단어 빈도와 위치 가중치를 활용해 핵심 문장을 선별합니다.
          한국어·영어 텍스트를 지원합니다.
        </div>
      </div>
    </ToolPageLayout>
  );
}