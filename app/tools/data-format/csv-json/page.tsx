"use client";

import { useState, useCallback, useRef } from "react";
import { FileJson, Copy, Check, Download, Upload } from "lucide-react";
import Papa from "papaparse";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Data / Format", href: "/tools/data-format" },
];

type Tab = "csv-to-json" | "json-to-csv";

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = useCallback(async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  }, []);
  return { copied, copy };
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

export default function CsvJsonPage() {
  const [tab, setTab] = useState<Tab>("csv-to-json");

  // CSV → JSON
  const [csvInput, setCsvInput] = useState("");
  const [jsonOutput, setJsonOutput] = useState("");
  const [csvError, setCsvError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // JSON → CSV
  const [jsonInput, setJsonInput] = useState("");
  const [csvOutput, setCsvOutput] = useState("");
  const [jsonError, setJsonError] = useState("");

  const { copied, copy } = useCopy();

  // CSV → JSON 변환
  const convertCsvToJson = useCallback((csvText: string) => {
    setCsvError("");
    if (!csvText.trim()) {
      setJsonOutput("");
      return;
    }
    const result = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });
    if (result.errors.length > 0) {
      setCsvError(result.errors[0].message);
      setJsonOutput("");
      return;
    }
    setJsonOutput(JSON.stringify(result.data, null, 2));
  }, []);

  const handleCsvInputChange = (value: string) => {
    setCsvInput(value);
    convertCsvToJson(value);
  };

  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      setCsvError("CSV 파일만 업로드 가능합니다.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvInput(text);
      convertCsvToJson(text);
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  // JSON → CSV 변환
  const convertJsonToCsv = useCallback((jsonText: string) => {
    setJsonError("");
    if (!jsonText.trim()) {
      setCsvOutput("");
      return;
    }
    try {
      const parsed: unknown = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        setJsonError("JSON 배열([ ])만 변환 가능합니다.");
        setCsvOutput("");
        return;
      }
      const csv = Papa.unparse(parsed as object[]);
      setCsvOutput(csv);
    } catch {
      setJsonError("유효하지 않은 JSON 형식입니다.");
      setCsvOutput("");
    }
  }, []);

  const handleJsonInputChange = (value: string) => {
    setJsonInput(value);
    convertJsonToCsv(value);
  };

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="CSV ↔ JSON 변환기"
      description="CSV를 JSON으로, JSON을 CSV로 즉시 변환합니다. 파일 업로드 및 드래그 앤 드롭을 지원합니다."
      icon={FileJson}
    >
      <div className="flex flex-col gap-6">

        {/* 탭 */}
        <div className="flex overflow-hidden rounded-lg border border-border w-fit">
          {(["csv-to-json", "json-to-csv"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-5 py-2 text-sm font-medium transition-colors duration-150 ${
                tab === t
                  ? "bg-brand text-white"
                  : "text-text-secondary hover:bg-brand/10 hover:text-text-primary"
              }`}
            >
              {t === "csv-to-json" ? "CSV → JSON" : "JSON → CSV"}
            </button>
          ))}
        </div>

        {/* CSV → JSON */}
        {tab === "csv-to-json" && (
          <div className="flex flex-col gap-5">
            {/* 파일 업로드 드롭존 */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 transition-colors ${
                isDragging
                  ? "border-brand bg-brand/5"
                  : "border-border hover:border-brand/50 hover:bg-bg-secondary"
              }`}
            >
              <Upload size={24} className="text-text-secondary" />
              <p className="text-sm text-text-secondary">
                CSV 파일을 드래그하거나 <span className="text-brand font-medium">클릭하여 업로드</span>
              </p>
              <p className="text-xs text-text-secondary/60">.csv 파일 지원</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
            </div>

            {/* 텍스트 입력 */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-text-secondary">CSV 입력</label>
                <button
                  type="button"
                  onClick={() => { setCsvInput(""); setJsonOutput(""); setCsvError(""); }}
                  disabled={!csvInput}
                  className="text-xs text-text-secondary transition-colors hover:text-text-primary disabled:opacity-30"
                >
                  지우기
                </button>
              </div>
              <textarea
                value={csvInput}
                onChange={(e) => handleCsvInputChange(e.target.value)}
                placeholder={"name,age,city\n홍길동,30,서울\n김철수,25,부산"}
                rows={8}
                className="w-full resize-none rounded-xl border border-border bg-bg-secondary p-4 font-mono text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none transition-colors"
                spellCheck={false}
              />
            </div>

            {/* 에러 */}
            {csvError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {csvError}
              </div>
            )}

            {/* 결과 */}
            {jsonOutput && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text-secondary">JSON 결과</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => copy(jsonOutput, "json-out")}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
                    >
                      {copied === "json-out" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      복사
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadFile(jsonOutput, "output.json", "application/json")}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
                    >
                      <Download size={12} />
                      .json 저장
                    </button>
                  </div>
                </div>
                <pre className="overflow-auto rounded-xl border border-border bg-bg-secondary p-4 font-mono text-xs text-text-primary max-h-96">
                  {jsonOutput}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* JSON → CSV */}
        {tab === "json-to-csv" && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-text-secondary">JSON 입력 (배열 형식)</label>
                <button
                  type="button"
                  onClick={() => { setJsonInput(""); setCsvOutput(""); setJsonError(""); }}
                  disabled={!jsonInput}
                  className="text-xs text-text-secondary transition-colors hover:text-text-primary disabled:opacity-30"
                >
                  지우기
                </button>
              </div>
              <textarea
                value={jsonInput}
                onChange={(e) => handleJsonInputChange(e.target.value)}
                placeholder={'[\n  {"name":"홍길동","age":30,"city":"서울"},\n  {"name":"김철수","age":25,"city":"부산"}\n]'}
                rows={10}
                className="w-full resize-none rounded-xl border border-border bg-bg-secondary p-4 font-mono text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none transition-colors"
                spellCheck={false}
              />
            </div>

            {/* 에러 */}
            {jsonError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {jsonError}
              </div>
            )}

            {/* 결과 */}
            {csvOutput && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text-secondary">CSV 결과</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => copy(csvOutput, "csv-out")}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
                    >
                      {copied === "csv-out" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      복사
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadFile(csvOutput, "output.csv", "text/csv")}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
                    >
                      <Download size={12} />
                      .csv 저장
                    </button>
                  </div>
                </div>
                <pre className="overflow-auto rounded-xl border border-border bg-bg-secondary p-4 font-mono text-xs text-text-primary max-h-96">
                  {csvOutput}
                </pre>
              </div>
            )}
          </div>
        )}

      </div>
    </ToolPageLayout>
  );
}