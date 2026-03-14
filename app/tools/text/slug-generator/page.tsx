"use client";

import { useState, useMemo } from "react";
import { Link2, Copy, Check } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Text", href: "/tools/text" },
];

/* ── 한글 → 영어 음역 맵 (기본 자모) ── */
const KO_ROMANIZATION: Record<string, string> = {
  가: "ga", 나: "na", 다: "da", 라: "ra", 마: "ma", 바: "ba", 사: "sa", 아: "a",
  자: "ja", 차: "cha", 카: "ka", 타: "ta", 파: "pa", 하: "ha",
  각: "gak", 난: "nan", 달: "dal", 람: "ram", 만: "man", 반: "ban", 산: "san",
  안: "an", 장: "jang", 찬: "chan", 칸: "kan", 탄: "tan", 판: "pan", 한: "han",
  개: "gae", 내: "nae", 대: "dae", 래: "rae", 매: "mae", 배: "bae", 새: "sae",
  애: "ae", 재: "jae", 채: "chae", 카이: "kai", 태: "tae", 패: "pae", 해: "hae",
  고: "go", 노: "no", 도: "do", 로: "ro", 모: "mo", 보: "bo", 소: "so",
  오: "o", 조: "jo", 초: "cho", 코: "ko", 토: "to", 포: "po", 호: "ho",
  구: "gu", 누: "nu", 두: "du", 루: "ru", 무: "mu", 부: "bu", 수: "su",
  우: "u", 주: "ju", 추: "chu", 쿠: "ku", 투: "tu", 푸: "pu", 후: "hu",
  기: "gi", 니: "ni", 디: "di", 리: "ri", 미: "mi", 비: "bi", 시: "si",
  이: "i", 지: "ji", 치: "chi", 키: "ki", 티: "ti", 피: "pi", 히: "hi",
  게: "ge", 네: "ne", 데: "de", 레: "re", 메: "me", 베: "be", 세: "se",
  에: "e", 제: "je", 체: "che", 케: "ke", 테: "te", 페: "pe", 헤: "he",
};

function romanizeKorean(text: string): string {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (KO_ROMANIZATION[ch]) {
      result += KO_ROMANIZATION[ch];
    } else if (/[가-힣]/.test(ch)) {
      // 미등록 한글은 코드포인트로 간단 처리
      const code = ch.charCodeAt(0) - 0xAC00;
      const cho = Math.floor(code / 28 / 21);
      const CHOSUNG = ["g","kk","n","d","tt","r","m","b","pp","s","ss","","j","jj","ch","k","t","p","h"];
      result += CHOSUNG[cho] || "";
    } else {
      result += ch;
    }
  }
  return result;
}

interface SlugOptions {
  separator: "-" | "_" | ".";
  lowercase: boolean;
  removeNumbers: boolean;
  maxLength: number | null;
}

function generateSlug(text: string, opts: SlugOptions): string {
  let slug = text;

  // 한글 음역
  slug = romanizeKorean(slug);

  // 특수문자를 separator로
  slug = slug
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // 분음 기호 제거
    .replace(/[&+]/g, " and ")
    .replace(/[^\w\s-]/g, " ")
    .trim();

  if (opts.removeNumbers) slug = slug.replace(/\d/g, " ");
  if (opts.lowercase) slug = slug.toLowerCase();

  slug = slug
    .replace(/[\s_\-.]+/g, opts.separator)
    .replace(new RegExp(`^\\${opts.separator}+|\\${opts.separator}+$`, "g"), "");

  if (opts.maxLength) slug = slug.slice(0, opts.maxLength).replace(new RegExp(`\\${opts.separator}+$`), "");

  return slug;
}

const SAMPLES = [
  "Hello World! This is a Test",
  "My Blog Post Title — 2025",
  "개발자를 위한 도구 모음",
  "React 19 + TypeScript 설정 가이드",
];

export default function SlugGeneratorPage() {
  const [input, setInput] = useState(SAMPLES[0]);
  const [opts, setOpts] = useState<SlugOptions>({
    separator: "-",
    lowercase: true,
    removeNumbers: false,
    maxLength: null,
  });
  const [copied, setCopied] = useState(false);
  const [maxLenInput, setMaxLenInput] = useState("");

  const slug = useMemo(() => generateSlug(input, opts), [input, opts]);

  const handleCopy = async () => {
    if (!slug) return;
    await navigator.clipboard.writeText(slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleMaxLen = (v: string) => {
    setMaxLenInput(v);
    const n = parseInt(v);
    setOpts((o) => ({ ...o, maxLength: Number.isFinite(n) && n > 0 ? n : null }));
  };

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="Slug Generator"
      description="제목이나 문장을 URL 친화적인 slug로 즉시 변환합니다. 한글 음역도 지원합니다."
      icon={Link2}
    >
      <div className="flex flex-col gap-6">
        {/* 샘플 */}
        <div className="flex flex-wrap gap-2">
          {SAMPLES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setInput(s)}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                input === s
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-border text-text-secondary hover:border-brand/40"
              }`}
            >
              {s.length > 28 ? s.slice(0, 28) + "…" : s}
            </button>
          ))}
        </div>

        {/* 입력 */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-text-secondary">원본 텍스트</label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="슬러그로 변환할 텍스트..."
            className="w-full rounded-xl border border-border bg-bg-secondary px-4 py-3 text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
          />
        </div>

        {/* 옵션 */}
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-bg-secondary p-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* 구분자 */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-text-secondary">구분자</span>
            <div className="flex gap-2">
              {(["-", "_", "."] as const).map((sep) => (
                <button
                  key={sep}
                  type="button"
                  onClick={() => setOpts((o) => ({ ...o, separator: sep }))}
                  className={`flex-1 rounded-lg border py-2 font-mono text-sm transition-colors ${
                    opts.separator === sep
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-border text-text-secondary hover:border-brand/40"
                  }`}
                >
                  {sep}
                </button>
              ))}
            </div>
          </div>

          {/* 소문자 */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-text-secondary">소문자 변환</span>
            <button
              type="button"
              onClick={() => setOpts((o) => ({ ...o, lowercase: !o.lowercase }))}
              className={`rounded-lg border px-4 py-2 text-xs transition-colors ${
                opts.lowercase ? "border-brand bg-brand/10 text-brand" : "border-border text-text-secondary"
              }`}
            >
              {opts.lowercase ? "ON" : "OFF"}
            </button>
          </div>

          {/* 숫자 제거 */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-text-secondary">숫자 제거</span>
            <button
              type="button"
              onClick={() => setOpts((o) => ({ ...o, removeNumbers: !o.removeNumbers }))}
              className={`rounded-lg border px-4 py-2 text-xs transition-colors ${
                opts.removeNumbers ? "border-brand bg-brand/10 text-brand" : "border-border text-text-secondary"
              }`}
            >
              {opts.removeNumbers ? "ON" : "OFF"}
            </button>
          </div>

          {/* 최대 길이 */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-text-secondary">최대 길이</span>
            <input
              type="number"
              value={maxLenInput}
              onChange={(e) => handleMaxLen(e.target.value)}
              placeholder="무제한"
              min={1}
              className="rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder-text-secondary/40 focus:border-brand focus:outline-none"
            />
          </div>
        </div>

        {/* 결과 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">슬러그</span>
            <span className="text-xs text-text-secondary">{slug.length}자</span>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-bg-secondary px-4 py-3">
            <code className="flex-1 break-all font-mono text-sm text-brand">
              {slug || <span className="text-text-secondary/50">텍스트를 입력하세요</span>}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!slug}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-brand/50 hover:text-brand disabled:opacity-30"
              aria-label="복사"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* URL 미리보기 */}
        {slug && (
          <div className="rounded-xl border border-border bg-bg-secondary px-4 py-3">
            <p className="mb-1 text-xs font-semibold text-text-secondary">URL 미리보기</p>
            <p className="break-all font-mono text-sm text-text-secondary">
              https://example.com/blog/<span className="text-brand">{slug}</span>
            </p>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}