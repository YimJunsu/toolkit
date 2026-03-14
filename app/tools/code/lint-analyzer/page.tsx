"use client";

import { useState, useMemo } from "react";
import { ScanText, AlertTriangle, Info, AlertCircle, CheckCircle } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Code", href: "/tools/code" },
];

type LangOption = "javascript" | "typescript" | "python" | "html" | "css";
type Severity = "error" | "warn" | "info";

interface Issue {
  line: number;
  col: number;
  severity: Severity;
  code: string;
  message: string;
}

const SAMPLE_CODE: Record<LangOption, string> = {
  javascript: `var x = 10
const unused = "hello"

function fetchData() {
  console.log("fetching...")
  var result = null
  try {
    result = fetch("https://api.example.com")
  } catch(e) {
    // silent catch
  }
  return result
}

if (x == 10) {
  console.log("equal")
  eval("dangerous()")
}`,
  typescript: `import { useState } from 'react'

const Component = (props: any) => {
  var count = 0
  const [value, setValue] = useState(null)
  console.log(props)

  const handleClick = () => {
    count++
    // TODO: implement
  }

  return <div>{count}</div>
}

export default Component`,
  python: `import os
import sys

def calculate(x,y):
    result=x+y
    print("Result: " + str(result))
    return result

class DataManager:
    def __init__(self):
        self.data = []
        self.db = None

    def process(self, input):
        try:
            result = eval(input)
        except:
            pass
        return result`,
  html: `<!DOCTYPE html>
<html>
<head>
<title>Test</title>
</head>
<body>
<img src="logo.png">
<a href="javascript:void(0)">Click</a>
<div onclick="doSomething()">
  <p style="color:red;font-size:14px">Inline styled text</p>
</div>
<input type="text">
</body>
</html>`,
  css: `* { box-sizing: border-box; }
.container {
  color: #fff;
  background-color: #fff;
  font-size: 14px;
  padding: 10px 10px 10px 10px;
  margin: 0px;
  width: 100% !important;
  z-index: 9999999;
}
a:hover { color: red }
div > p { color: #333333; }`,
};

type RuleSet = Record<LangOption, Array<{
  code: string;
  severity: Severity;
  test: (line: string, lineIdx: number, lines: string[]) => string | null;
}>>;

const RULES: RuleSet = {
  javascript: [
    { code: "no-var", severity: "warn", test: (l) => /\bvar\b/.test(l) ? "var 대신 const/let 사용을 권장합니다" : null },
    { code: "no-console", severity: "warn", test: (l) => /console\.(log|warn|error|debug)/.test(l) ? "console 문이 남아있습니다" : null },
    { code: "eqeqeq", severity: "error", test: (l) => /[^!=]==[^=]/.test(l) ? "=== 대신 == 사용됨 (엄격 비교 권장)" : null },
    { code: "no-eval", severity: "error", test: (l) => /\beval\s*\(/.test(l) ? "eval() 사용은 보안 위험입니다" : null },
    { code: "no-empty-catch", severity: "warn", test: (l, i, lines) => /catch\s*\(/.test(l) && lines[i + 1]?.trim().startsWith("//") ? "빈 catch 블록에 오류 처리가 필요합니다" : null },
    { code: "line-length", severity: "info", test: (l) => l.length > 100 ? `라인이 너무 깁니다 (${l.length}자, 권장 100자 이하)` : null },
  ],
  typescript: [
    { code: "no-any", severity: "error", test: (l) => /:\s*any\b/.test(l) ? "any 타입 사용 금지 — unknown 또는 구체적인 타입을 사용하세요" : null },
    { code: "no-var", severity: "warn", test: (l) => /\bvar\b/.test(l) ? "var 대신 const/let 사용을 권장합니다" : null },
    { code: "no-console", severity: "warn", test: (l) => /console\.(log|warn|error|debug)/.test(l) ? "console 문이 남아있습니다" : null },
    { code: "todo-comment", severity: "info", test: (l) => /\/\/\s*(TODO|FIXME|HACK|XXX)/i.test(l) ? `미완성 주석: ${l.trim()}` : null },
    { code: "no-null-init", severity: "info", test: (l) => /useState\(null\)/.test(l) ? "useState(null) — 타입 파라미터를 명시하세요 (useState<T | null>(null))" : null },
    { code: "line-length", severity: "info", test: (l) => l.length > 100 ? `라인이 너무 깁니다 (${l.length}자, 권장 100자 이하)` : null },
  ],
  python: [
    { code: "no-eval", severity: "error", test: (l) => /\beval\s*\(/.test(l) ? "eval() 사용은 보안 위험입니다" : null },
    { code: "bare-except", severity: "warn", test: (l) => /^\s*except\s*:/.test(l) ? "bare except: 예외 타입을 명시하세요 (e.g. except Exception)" : null },
    { code: "missing-spaces", severity: "info", test: (l) => /\w=\w/.test(l) && !/['"]=/.test(l) && !l.trim().startsWith("#") ? "연산자 주변에 공백을 추가하세요" : null },
    { code: "print-statement", severity: "info", test: (l) => /^\s*print\s*\(/.test(l) ? "print() 문이 남아있습니다" : null },
    { code: "line-length", severity: "info", test: (l) => l.length > 79 ? `PEP8: 라인이 너무 깁니다 (${l.length}자, 권장 79자 이하)` : null },
    { code: "builtin-shadow", severity: "warn", test: (l) => /\b(input|list|dict|type|id|filter|map)\s*=/.test(l) ? "내장 함수 이름을 변수명으로 사용하고 있습니다" : null },
  ],
  html: [
    { code: "missing-alt", severity: "error", test: (l) => /<img(?![^>]*\balt=)[^>]*>/.test(l) ? "<img>에 alt 속성이 없습니다 (접근성 필수)" : null },
    { code: "inline-style", severity: "warn", test: (l) => /\bstyle\s*=/.test(l) ? "인라인 스타일 사용 — CSS 클래스 사용을 권장합니다" : null },
    { code: "inline-event", severity: "warn", test: (l) => /\bon\w+\s*=/.test(l) ? "인라인 이벤트 핸들러 사용 — addEventListener 권장합니다" : null },
    { code: "javascript-href", severity: "error", test: (l) => /href\s*=\s*["']javascript:/.test(l) ? "href=\"javascript:...\" 사용은 보안 위험입니다" : null },
    { code: "missing-input-label", severity: "warn", test: (l) => /<input(?![^>]*\bid=)[^>]*>/.test(l) ? "<input>에 id가 없습니다 (label과 연결 불가)" : null },
    { code: "unclosed-tag", severity: "info", test: (l) => /<(img|input|br|hr)[^/](?:[^>]*[^/])?>/.test(l) ? "셀프 클로징 태그에 /가 없습니다 (권장: <img />" : null },
  ],
  css: [
    { code: "important", severity: "warn", test: (l) => /!important/.test(l) ? "!important 사용 — 특이도 문제를 유발할 수 있습니다" : null },
    { code: "high-zindex", severity: "info", test: (l) => /z-index\s*:\s*(\d+)/.test(l) && parseInt(l.match(/z-index\s*:\s*(\d+)/)?.[1] ?? "0") > 1000 ? "z-index 값이 매우 큽니다" : null },
    { code: "duplicate-value", severity: "info", test: (l) => /padding\s*:\s*(\w+)\s+\1\s+\1\s+\1/.test(l) ? "동일한 4방향 값 — 단일 값으로 줄일 수 있습니다 (padding: X)" : null },
    { code: "zero-unit", severity: "info", test: (l) => /:\s*0px/.test(l) ? "0px → 단위 없이 0만 사용하세요 (margin: 0)" : null },
    { code: "hex-shorthand", severity: "info", test: (l) => /#([0-9a-fA-F])\1([0-9a-fA-F])\2([0-9a-fA-F])\3/.test(l) ? "6자리 HEX를 3자리 축약형으로 줄일 수 있습니다" : null },
    { code: "missing-semicolon", severity: "error", test: (l) => /^\s*[\w-]+\s*:\s*[^{};]+$/.test(l.trimEnd()) && !l.includes("{") && !l.includes("}") ? "세미콜론이 없습니다" : null },
    { code: "same-color", severity: "warn", test: (l, i, lines) => {
      if (!/color\s*:/.test(l) || !/background(-color)?\s*:/.test(l)) {
        // check if same color appears in same block — simplified
        return null;
      }
      return null;
    }},
  ],
};

const SEVERITY_CONFIG = {
  error: { label: "오류", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", icon: AlertCircle },
  warn: { label: "경고", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30", icon: AlertTriangle },
  info: { label: "정보", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", icon: Info },
};

function analyzeCode(code: string, lang: LangOption): Issue[] {
  const lines = code.split("\n");
  const issues: Issue[] = [];

  for (const rule of RULES[lang]) {
    lines.forEach((line, idx) => {
      const msg = rule.test(line, idx, lines);
      if (msg) {
        issues.push({
          line: idx + 1,
          col: line.search(/\S/) + 1,
          severity: rule.severity,
          code: rule.code,
          message: msg,
        });
      }
    });
  }

  return issues.sort((a, b) => {
    const order = { error: 0, warn: 1, info: 2 };
    return order[a.severity] - order[b.severity] || a.line - b.line;
  });
}

export default function LintAnalyzerPage() {
  const [lang, setLang] = useState<LangOption>("typescript");
  const [code, setCode] = useState(SAMPLE_CODE["typescript"]);
  const [analyzed, setAnalyzed] = useState(false);

  const handleLangChange = (l: LangOption) => {
    setLang(l);
    setCode(SAMPLE_CODE[l]);
    setAnalyzed(false);
  };

  const issues = useMemo(() => analyzed ? analyzeCode(code, lang) : [], [code, lang, analyzed]);

  const counts = useMemo(() => ({
    error: issues.filter((i) => i.severity === "error").length,
    warn: issues.filter((i) => i.severity === "warn").length,
    info: issues.filter((i) => i.severity === "info").length,
  }), [issues]);

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="Lint / Static Analyzer"
      description="JS·TS·Python·HTML·CSS 코드의 기본 품질 이슈를 감지합니다."
      icon={ScanText}
    >
      <div className="flex flex-col gap-5">
        {/* 언어 선택 */}
        <div className="flex flex-wrap gap-2">
          {(["javascript", "typescript", "python", "html", "css"] as LangOption[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => handleLangChange(l)}
              className={`rounded-lg border px-4 py-2 text-xs font-medium transition-colors ${
                lang === l
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-border text-text-secondary hover:border-brand/40"
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        {/* 코드 입력 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">코드 입력</span>
            <span className="text-xs text-text-secondary">{code.split("\n").length} 줄</span>
          </div>
          <textarea
            value={code}
            onChange={(e) => { setCode(e.target.value); setAnalyzed(false); }}
            rows={16}
            spellCheck={false}
            className="w-full resize-none rounded-xl border border-border bg-bg-secondary p-4 font-mono text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
          />
        </div>

        {/* 분석 버튼 */}
        <button
          type="button"
          onClick={() => setAnalyzed(true)}
          className="self-start rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <ScanText size={14} className="inline mr-2" />
          분석 실행
        </button>

        {/* 결과 */}
        {analyzed && (
          <>
            {/* 요약 */}
            <div className="flex flex-wrap gap-3">
              {(["error", "warn", "info"] as Severity[]).map((s) => {
                const { label, color, bg, icon: Icon } = SEVERITY_CONFIG[s];
                return (
                  <div key={s} className={`flex items-center gap-2 rounded-xl border px-4 py-3 ${bg}`}>
                    <Icon size={14} className={color} />
                    <span className={`text-sm font-bold ${color}`}>{counts[s]}</span>
                    <span className="text-xs text-text-secondary">{label}</span>
                  </div>
                );
              })}
              {issues.length === 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                  <CheckCircle size={14} className="text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-400">이슈 없음</span>
                  <span className="text-xs text-text-secondary">코드가 깔끔합니다!</span>
                </div>
              )}
            </div>

            {/* 이슈 목록 */}
            {issues.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-text-secondary">이슈 목록 ({issues.length})</span>
                <div className="flex flex-col gap-2">
                  {issues.map((issue, idx) => {
                    const { color, bg, icon: Icon } = SEVERITY_CONFIG[issue.severity];
                    return (
                      <div
                        key={idx}
                        className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${bg}`}
                      >
                        <Icon size={14} className={`mt-0.5 shrink-0 ${color}`} />
                        <div className="flex-1">
                          <p className="text-sm text-text-primary">{issue.message}</p>
                          <div className="mt-1 flex gap-3 text-xs text-text-secondary">
                            <span>줄 {issue.line}, 열 {issue.col}</span>
                            <code className="font-mono">{issue.code}</code>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ToolPageLayout>
  );
}