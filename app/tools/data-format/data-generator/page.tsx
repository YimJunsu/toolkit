"use client";

import { useState, useCallback } from "react";
import { Database, Copy, Check, Download, RefreshCw } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { useClipboard } from "@/hooks/useClipboard";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Data / Format", href: "/tools/data-format" },
];

type OutputFormat = "JSON" | "CSV" | "SQL";

const FIELD_OPTIONS = [
  { key: "id",         label: "id" },
  { key: "name",       label: "name" },
  { key: "email",      label: "email" },
  { key: "phone",      label: "phone" },
  { key: "age",        label: "age" },
  { key: "gender",     label: "gender" },
  { key: "company",    label: "company" },
  { key: "country",    label: "country" },
  { key: "created_at", label: "created_at" },
] as const;

type FieldKey = typeof FIELD_OPTIONS[number]["key"];

const NAMES = [
  "김민준", "이서연", "박지후", "최예린", "정우진",
  "강수아", "조민서", "윤하은", "임도윤", "한지아",
  "오준혁", "신유나", "홍태양", "문채원", "배시우",
  "남은우", "양지원", "권나은", "류성민", "송아름",
  "전지민", "노예준", "황수빈", "경민재", "안서현",
];

const COMPANIES = [
  "삼성전자", "카카오", "네이버", "현대자동차", "LG전자",
  "SK하이닉스", "쿠팡", "배달의민족", "토스", "라인",
  "크래프톤", "넥슨", "넷마블", "엔씨소프트", "카카오뱅크",
  "하이브", "셀트리온", "포스코", "두산에너빌리티", "한화솔루션",
  "GS칼텍스", "롯데쇼핑", "신세계", "CJ제일제당", "아모레퍼시픽",
];

const COUNTRIES = ["대한민국", "미국", "일본", "중국", "독일", "영국", "프랑스", "캐나다", "호주", "싱가포르"];

const EMAIL_DOMAINS = ["gmail.com", "naver.com", "kakao.com", "daum.net", "hanmail.net", "outlook.com"];

const GENDERS = ["남", "여"];

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date): string {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().replace("T", " ").slice(0, 19);
}

function generateRow(index: number, fields: FieldKey[]): Record<string, string | number> {
  const name = pick(NAMES);
  const emailName = name.normalize("NFD").replace(/[^\w]/g, "") || `user${index}`;
  const row: Record<string, string | number> = {};

  if (fields.includes("id"))         row.id = index;
  if (fields.includes("name"))       row.name = name;
  if (fields.includes("email"))      row.email = `${emailName.toLowerCase()}${rand(1, 999)}@${pick(EMAIL_DOMAINS)}`;
  if (fields.includes("phone"))      row.phone = `010-${String(rand(1000, 9999))}-${String(rand(1000, 9999))}`;
  if (fields.includes("age"))        row.age = rand(18, 65);
  if (fields.includes("gender"))     row.gender = pick(GENDERS);
  if (fields.includes("company"))    row.company = pick(COMPANIES);
  if (fields.includes("country"))    row.country = pick(COUNTRIES);
  if (fields.includes("created_at")) row.created_at = randomDate(new Date("2020-01-01"), new Date());

  return row;
}

function toCSV(rows: Record<string, string | number>[], fields: FieldKey[]): string {
  const header = fields.join(",");
  const body = rows.map((r) =>
    fields.map((f) => {
      const v = String(r[f] ?? "");
      return v.includes(",") ? `"${v}"` : v;
    }).join(",")
  ).join("\n");
  return `${header}\n${body}`;
}

function toSQL(rows: Record<string, string | number>[], fields: FieldKey[], tableName = "sample_data"): string {
  return rows.map((r) => {
    const cols = fields.join(", ");
    const vals = fields.map((f) => {
      const v = r[f];
      return typeof v === "number" ? v : `'${String(v).replace(/'/g, "''")}'`;
    }).join(", ");
    return `INSERT INTO ${tableName} (${cols}) VALUES (${vals});`;
  }).join("\n");
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

export default function DataGeneratorPage() {
  const [selectedFields, setSelectedFields] = useState<FieldKey[]>(["id", "name", "email", "age"]);
  const [count, setCount] = useState(10);
  const [format, setFormat] = useState<OutputFormat>("JSON");
  const [output, setOutput] = useState("");
  const { copied, copy } = useClipboard();

  const toggleField = (key: FieldKey) => {
    setSelectedFields((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const generate = useCallback(() => {
    if (selectedFields.length === 0) return;
    const n = Math.min(Math.max(count, 1), 100);
    const rows = Array.from({ length: n }, (_, i) => generateRow(i + 1, selectedFields));

    if (format === "JSON") {
      setOutput(JSON.stringify(rows, null, 2));
    } else if (format === "CSV") {
      setOutput(toCSV(rows, selectedFields));
    } else {
      setOutput(toSQL(rows, selectedFields));
    }
  }, [selectedFields, count, format]);


  const handleDownload = () => {
    if (!output) return;
    const ext = format === "JSON" ? "json" : format === "CSV" ? "csv" : "sql";
    const mime = format === "JSON" ? "application/json" : "text/plain";
    downloadFile(output, `sample_data.${ext}`, mime);
  };

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="샘플 데이터 생성기"
      description="테스트용 더미 데이터를 JSON, CSV, SQL INSERT 형식으로 즉시 생성합니다."
      icon={Database}
    >
      <div className="flex flex-col gap-6">

        {/* 필드 선택 */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-text-secondary">생성할 필드 선택</label>
          <div className="flex flex-wrap gap-2">
            {FIELD_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleField(key)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedFields.includes(key)
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-border text-text-secondary hover:border-brand/40 hover:text-text-primary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {selectedFields.length === 0 && (
            <p className="text-xs text-red-400">최소 1개 이상의 필드를 선택하세요.</p>
          )}
        </div>

        {/* 생성 옵션 */}
        <div className="flex flex-wrap items-end gap-5">
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

          {/* 출력 포맷 탭 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">출력 포맷</label>
            <div className="flex overflow-hidden rounded-lg border border-border">
              {(["JSON", "CSV", "SQL"] as OutputFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setFormat(fmt)}
                  className={`px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                    format === fmt
                      ? "bg-brand text-white"
                      : "text-text-secondary hover:bg-brand/10 hover:text-text-primary"
                  }`}
                >
                  {fmt === "SQL" ? "SQL INSERT" : fmt}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={generate}
            disabled={selectedFields.length === 0}
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
          >
            <RefreshCw size={14} />
            생성
          </button>
        </div>

        {/* 결과 */}
        {output && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-text-secondary">결과</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copy(output, "output")}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
                >
                  {copied === "output" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  복사
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
                >
                  <Download size={12} />
                  다운로드
                </button>
              </div>
            </div>
            <pre className="overflow-auto rounded-xl border border-border bg-bg-secondary p-4 font-mono text-xs text-text-primary max-h-[480px]">
              {output}
            </pre>
            <p className="text-xs">
              ※ 참고: 출력된 이름, 이메일, 회사 등 모든 데이터는 테스트를 위해 랜덤으로 생성된 예시 데이터이며 실제 정보와 무관합니다.
            </p>
          </div>
        )}

      </div>
    </ToolPageLayout>
  );
}