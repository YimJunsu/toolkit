"use client";

import { useState, useRef, useCallback } from "react";
import { TableProperties, Upload, Copy, Check, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { useClipboard } from "@/hooks/useClipboard";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Data / Format", href: "/tools/data-format" },
];

type OutputFormat = "JSON" | "CSV";

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExcelConverterPage() {
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("JSON");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { copied, copy } = useClipboard();

  const loadSheet = useCallback((wb: XLSX.WorkBook, sheetName: string) => {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: "" });
    setPreviewRows(rows.slice(0, 51) as string[][]);
    setOutput("");
  }, []);

  const processFile = useCallback((file: File) => {
    setError("");
    setOutput("");
    const validExts = [".xlsx", ".xls", ".csv"];
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (!validExts.includes(ext)) {
      setError(".xlsx, .xls, .csv 파일만 지원합니다.");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: "binary" });
        setWorkbook(wb);
        const sheetNames = wb.SheetNames;
        setSheets(sheetNames);
        setSelectedSheet(sheetNames[0]);
        loadSheet(wb, sheetNames[0]);
      } catch {
        setError("파일을 읽는 중 오류가 발생했습니다.");
      }
    };
    reader.readAsBinaryString(file);
  }, [loadSheet]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    if (workbook) loadSheet(workbook, sheetName);
  };

  const handleConvert = () => {
    if (!workbook || !selectedSheet) return;
    const ws = workbook.Sheets[selectedSheet];
    if (outputFormat === "JSON") {
      const json = XLSX.utils.sheet_to_json(ws, { defval: "" });
      setOutput(JSON.stringify(json, null, 2));
    } else {
      const csv = XLSX.utils.sheet_to_csv(ws);
      setOutput(csv);
    }
  };

  const downloadOutput = () => {
    if (!output) return;
    const baseName = fileName.replace(/\.[^.]+$/, "");
    if (outputFormat === "JSON") {
      downloadFile(output, `${baseName}.json`, "application/json");
    } else {
      downloadFile(output, `${baseName}.csv`, "text/csv");
    }
  };

  const headerRow = previewRows[0] ?? [];
  const dataRows = previewRows.slice(1);

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="Excel / CSV 변환기"
      description=".xlsx, .xls, .csv 파일을 업로드하여 JSON 또는 CSV로 변환합니다. 시트 선택 및 테이블 미리보기를 지원합니다."
      icon={TableProperties}
    >
      <div className="flex flex-col gap-6">

        {/* 파일 업로드 드롭존 */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 transition-colors ${
            isDragging
              ? "border-brand bg-brand/5"
              : "border-border hover:border-brand/50 hover:bg-bg-secondary"
          }`}
        >
          <Upload size={28} className="text-text-secondary" />
          <p className="text-sm text-text-secondary">
            파일을 드래그하거나 <span className="text-brand font-medium">클릭하여 업로드</span>
          </p>
          <p className="text-xs text-text-secondary/60">.xlsx · .xls · .csv 지원</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processFile(file);
            }}
          />
        </div>

        {/* 에러 */}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* 시트 선택 + 변환 옵션 */}
        {sheets.length > 0 && (
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-text-secondary whitespace-nowrap">시트 선택</label>
              <select
                value={selectedSheet}
                onChange={(e) => handleSheetChange(e.target.value)}
                className="rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              >
                {sheets.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-text-secondary whitespace-nowrap">출력 포맷</label>
              <div className="flex overflow-hidden rounded-lg border border-border">
                {(["JSON", "CSV"] as OutputFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setOutputFormat(fmt)}
                    className={`px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                      outputFormat === fmt
                        ? "bg-brand text-white"
                        : "text-text-secondary hover:bg-brand/10 hover:text-text-primary"
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleConvert}
              className="flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
            >
              변환
            </button>
          </div>
        )}

        {/* 테이블 미리보기 */}
        {previewRows.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-text-secondary">
                미리보기 (최대 50행, 총 {previewRows.length - 1}행 표시 중)
              </label>
              {fileName && (
                <span className="text-xs text-text-secondary/60">{fileName}</span>
              )}
            </div>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary">
                    {headerRow.map((h, i) => (
                      <th
                        key={i}
                        className="px-3 py-2 text-left font-semibold text-text-secondary whitespace-nowrap"
                      >
                        {String(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataRows.map((row, ri) => (
                    <tr key={ri} className="border-b border-border last:border-b-0 hover:bg-bg-secondary/50">
                      {headerRow.map((_, ci) => (
                        <td key={ci} className="px-3 py-2 text-text-primary whitespace-nowrap">
                          {String(row[ci] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 변환 결과 */}
        {output && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-text-secondary">변환 결과 ({outputFormat})</label>
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
                  onClick={downloadOutput}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
                >
                  <Download size={12} />
                  다운로드
                </button>
              </div>
            </div>
            <pre className="overflow-auto rounded-xl border border-border bg-bg-secondary p-4 font-mono text-xs text-text-primary max-h-96">
              {output}
            </pre>
          </div>
        )}

      </div>
    </ToolPageLayout>
  );
}