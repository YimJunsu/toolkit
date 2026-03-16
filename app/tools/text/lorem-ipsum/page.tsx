"use client";

import { useState, useMemo, useCallback } from "react";
import { FileText, Copy, Check, RefreshCw } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { useClipboard } from "@/hooks/useClipboard";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Text", href: "/tools/text" },
];

/* ── Lorem Ipsum 단어 풀 ── */
const WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
  "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud",
  "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo",
  "consequat", "duis", "aute", "irure", "reprehenderit", "in", "voluptate",
  "velit", "esse", "cillum", "eu", "fugiat", "nulla", "pariatur", "excepteur",
  "sint", "occaecat", "cupidatat", "non", "proident", "sunt", "culpa", "qui",
  "officia", "deserunt", "mollit", "anim", "id", "est", "laborum", "perspiciatis",
  "unde", "omnis", "iste", "natus", "error", "voluptatem", "accusantium",
  "doloremque", "laudantium", "totam", "rem", "aperiam", "eaque", "ipsa", "quae",
  "ab", "inventore", "veritatis", "quasi", "architecto", "beatae", "vitae",
  "dicta", "explicabo", "nemo", "ipsam", "quia", "voluptas", "aspernatur", "odit",
  "fugit", "consequuntur", "magni", "dolores", "ratione", "sequi", "nesciunt",
  "neque", "porro", "quisquam", "dolorem", "adipisci", "numquam", "eius", "modi",
  "tempora", "incidunt", "quaerat", "soluta", "nobis", "eligendi", "optio",
  "cumque", "nihil", "impedit", "quo", "minus", "maxime", "placeat", "facere",
  "possimus", "omnis", "assumenda", "repellendus",
];

/* ── 시드 기반 의사 난수 ── */
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function generateSentence(rand: () => number, minWords = 8, maxWords = 18): string {
  const count = minWords + Math.floor(rand() * (maxWords - minWords + 1));
  const words = Array.from({ length: count }, () => pick(WORDS, rand));
  // 중간에 쉼표 삽입
  const commaAt = Math.floor(count * 0.4) + Math.floor(rand() * 3);
  if (commaAt < count - 1) words[commaAt] += ",";
  return capitalize(words.join(" ")) + ".";
}

function generateParagraph(rand: () => number, minSents = 3, maxSents = 6): string {
  const count = minSents + Math.floor(rand() * (maxSents - minSents + 1));
  return Array.from({ length: count }, () => generateSentence(rand)).join(" ");
}

type UnitType = "paragraphs" | "sentences" | "words";

const CLASSIC_OPENER =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

export default function LoremIpsumPage() {
  const [unit, setUnit] = useState<UnitType>("paragraphs");
  const [count, setCount] = useState(3);
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 100000));
  const { copied, copy } = useClipboard();

  const output = useMemo(() => {
    const rand = mulberry32(seed);

    if (unit === "paragraphs") {
      const paras = Array.from({ length: count }, (_, i) => {
        if (i === 0 && startWithLorem) return CLASSIC_OPENER + " " + generateParagraph(rand, 2, 4);
        return generateParagraph(rand);
      });
      return paras.join("\n\n");
    }

    if (unit === "sentences") {
      const sents = Array.from({ length: count }, (_, i) => {
        if (i === 0 && startWithLorem) return CLASSIC_OPENER;
        return generateSentence(rand);
      });
      return sents.join(" ");
    }

    // words
    const words: string[] = [];
    if (startWithLorem) {
      const starter = ["Lorem", "ipsum", "dolor", "sit", "amet"].slice(0, Math.min(5, count));
      words.push(...starter);
    }
    while (words.length < count) words.push(pick(WORDS, rand));
    return words.slice(0, count).join(" ") + ".";
  }, [unit, count, startWithLorem, seed]);

  const refresh = useCallback(() => setSeed(Math.floor(Math.random() * 100000)), []);

  const handleCopy = () => {
    copy(output);
  };

  const MAX: Record<UnitType, number> = { paragraphs: 20, sentences: 50, words: 500 };

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="Lorem Ipsum Generator"
      description="단락·문장·단어 단위로 Lorem Ipsum 더미 텍스트를 즉시 생성합니다."
      icon={FileText}
    >
      <div className="flex flex-col gap-6">
        {/* 옵션 */}
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-bg-secondary p-5 sm:grid-cols-3">
          {/* 단위 선택 */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-text-secondary">단위</span>
            <div className="flex gap-2">
              {(["paragraphs", "sentences", "words"] as UnitType[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => { setUnit(u); setCount(u === "words" ? 50 : u === "sentences" ? 5 : 3); }}
                  className={`flex-1 rounded-lg border py-2 text-xs transition-colors ${
                    unit === u
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-border text-text-secondary hover:border-brand/40"
                  }`}
                >
                  {u === "paragraphs" ? "단락" : u === "sentences" ? "문장" : "단어"}
                </button>
              ))}
            </div>
          </div>

          {/* 수량 */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-text-secondary">
              수량 (최대 {MAX[unit]})
            </span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={MAX[unit]}
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
                className="flex-1 accent-brand"
              />
              <input
                type="number"
                min={1}
                max={MAX[unit]}
                value={count}
                onChange={(e) => {
                  const n = Math.min(MAX[unit], Math.max(1, parseInt(e.target.value) || 1));
                  setCount(n);
                }}
                className="w-16 rounded-lg border border-border bg-bg-primary px-2 py-1.5 text-center text-sm text-text-primary focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          {/* 클래식 시작 */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-text-secondary">Lorem ipsum으로 시작</span>
            <button
              type="button"
              onClick={() => setStartWithLorem((v) => !v)}
              className={`rounded-lg border px-4 py-2 text-xs transition-colors ${
                startWithLorem ? "border-brand bg-brand/10 text-brand" : "border-border text-text-secondary"
              }`}
            >
              {startWithLorem ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={refresh}
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
          >
            <RefreshCw size={14} />
            다시 생성
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "복사됨" : "복사"}
          </button>
          <span className="ml-auto text-xs text-text-secondary">
            {unit === "paragraphs"
              ? `${count}개 단락`
              : unit === "sentences"
              ? `${count}개 문장`
              : `${count}개 단어`}
            {" · "}
            {output.length.toLocaleString()}자
          </span>
        </div>

        {/* 출력 */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-text-secondary">생성 결과</span>
          <div className="min-h-40 rounded-xl border border-border bg-bg-secondary p-5 text-sm leading-relaxed text-text-primary whitespace-pre-wrap">
            {output}
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}