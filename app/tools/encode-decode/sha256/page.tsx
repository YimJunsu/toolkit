"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Hash, Copy, Check, Upload, File as FileIcon, X } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { md5 } from "@/lib/utils/hashUtils";
import { useClipboard } from "@/hooks/useClipboard";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Encode / Decode", href: "/tools/encode-decode" },
];

type Algorithm = "MD5" | "SHA-1" | "SHA-256" | "SHA-512";
type InputMode = "text" | "file";

const ALGO_OPTIONS: { value: Algorithm; label: string; bits: string; desc: string }[] = [
  { value: "MD5",     label: "MD5",     bits: "128 bit", desc: "레거시 시스템 호환용. 보안 목적에는 사용 금지. 체크섬 등 무결성 확인에만 활용." },
  { value: "SHA-1",   label: "SHA-1",   bits: "160 bit", desc: "레거시 시스템 호환용. 보안 취약점이 발견되어 새 시스템에는 권장하지 않음." },
  { value: "SHA-256", label: "SHA-256", bits: "256 bit", desc: "현재 가장 범용적으로 사용되는 표준 해시. JWT, TLS, 코드 서명 등에 사용." },
  { value: "SHA-512", label: "SHA-512", bits: "512 bit", desc: "SHA-256보다 강력한 해시. 64비트 시스템에서 성능 우위." },
];

function hexToBase64(hex: string): string {
  const bytes = hex.match(/../g)!.map((b) => parseInt(b, 16));
  return btoa(String.fromCharCode(...bytes));
}

async function computeHashFromText(text: string, algo: Algorithm): Promise<{ hex: string; b64: string; byteLen: number }> {
  if (algo === "MD5") {
    const hex = md5(text);
    return { hex, b64: hexToBase64(hex), byteLen: 16 };
  }
  const buf = await crypto.subtle.digest(algo, new TextEncoder().encode(text));
  const arr = new Uint8Array(buf);
  const hex = Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
  const b64 = btoa(String.fromCharCode(...arr));
  return { hex, b64, byteLen: arr.length };
}

async function computeHashFromBuffer(buffer: ArrayBuffer, algo: Algorithm): Promise<{ hex: string; b64: string; byteLen: number }> {
  if (algo === "MD5") {
    const bytes = new Uint8Array(buffer);
    const text = String.fromCharCode(...bytes);
    const hex = md5(text);
    return { hex, b64: hexToBase64(hex), byteLen: 16 };
  }
  const arr = new Uint8Array(await crypto.subtle.digest(algo, buffer));
  const hex = Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
  const b64 = btoa(String.fromCharCode(...arr));
  return { hex, b64, byteLen: arr.length };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function HashGeneratorPage() {
  const [input, setInput]       = useState("");
  const [algo, setAlgo]         = useState<Algorithm>("SHA-256");
  const [mode, setMode]         = useState<InputMode>("text");
  const [hex, setHex]           = useState("");
  const [b64, setB64]           = useState("");
  const [byteLen, setByteLen]   = useState(0);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [computing, setComputing]   = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { copied, copy } = useClipboard();

  /* 텍스트 모드 */
  useEffect(() => {
    if (mode !== "text") return;
    if (!input) { setHex(""); setB64(""); setByteLen(0); return; }
    let cancelled = false;
    computeHashFromText(input, algo).then((result) => {
      if (cancelled) return;
      setHex(result.hex);
      setB64(result.b64);
      setByteLen(result.byteLen);
    });
    return () => { cancelled = true; };
  }, [input, algo, mode]);

  const processFile = useCallback(async (file: File) => {
    setComputing(true);
    setFileInfo({ name: file.name, size: file.size });
    try {
      const buffer = await file.arrayBuffer();
      const result = await computeHashFromBuffer(buffer, algo);
      setHex(result.hex);
      setB64(result.b64);
      setByteLen(result.byteLen);
    } finally {
      setComputing(false);
    }
  }, [algo]);

  /* 알고리즘 변경 시 파일 재계산 */
  useEffect(() => {
    if (mode !== "file" || !fileInputRef.current?.files?.[0]) return;
    processFile(fileInputRef.current.files[0]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [algo]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const clearFile = () => {
    setFileInfo(null);
    setHex(""); setB64(""); setByteLen(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    copy(text, id);
  };

  const inputBytes = new TextEncoder().encode(input).length;

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="Hash 생성기"
      description="텍스트 또는 파일의 MD5 · SHA-1 · SHA-256 · SHA-512 해시를 즉시 계산합니다."
      icon={Hash}
    >
      <div className="flex flex-col gap-6">

        {/* 안내 */}
        <div className="rounded-lg border border-border bg-bg-secondary px-4 py-3 text-xs text-text-secondary">
          <strong className="text-text-primary">단방향 해시 함수</strong> — 동일한 입력은 항상 동일한 해시를 출력합니다.
          파일 해시는 브라우저에서 직접 계산되며 서버로 전송되지 않습니다.
        </div>

        {/* 입력 모드 + 알고리즘 */}
        <div className="flex flex-wrap items-center gap-3">
          {/* 입력 모드 */}
          <div className="flex overflow-hidden rounded-lg border border-border">
            {(["text", "file"] as InputMode[]).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className={`px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                  mode === m ? "bg-brand text-bg-primary" : "text-text-secondary hover:bg-brand/10 hover:text-text-primary"
                }`}
              >
                {m === "text" ? "텍스트" : "파일"}
              </button>
            ))}
          </div>

          {/* 알고리즘 */}
          <div className="flex overflow-hidden rounded-lg border border-border">
            {ALGO_OPTIONS.map(({ value, label }) => (
              <button key={value} type="button" onClick={() => setAlgo(value)}
                className={`px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                  algo === value ? "bg-brand text-bg-primary" : "text-text-secondary hover:bg-brand/10 hover:text-text-primary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 텍스트 입력 */}
        {mode === "text" && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-text-secondary">입력 텍스트</label>
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-secondary">{inputBytes} bytes</span>
                <button type="button" onClick={() => setInput("")} disabled={!input}
                  className="text-xs text-text-secondary transition-colors hover:text-text-primary disabled:opacity-30">
                  지우기
                </button>
              </div>
            </div>
            <textarea value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="해시를 계산할 텍스트를 입력하세요..." rows={6}
              className="w-full resize-none rounded-xl border border-border bg-bg-secondary p-4 font-mono text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none transition-colors"
              spellCheck={false} />
          </div>
        )}

        {/* 파일 입력 */}
        {mode === "file" && (
          <div className="flex flex-col gap-3">
            <input ref={fileInputRef} type="file" onChange={handleFileChange}
              className="hidden" id="file-hash-input" />

            {fileInfo ? (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-bg-secondary px-4 py-3">
                <FileIcon size={18} className="shrink-0 text-brand" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-text-primary">{fileInfo.name}</p>
                  <p className="text-xs text-text-secondary">{formatBytes(fileInfo.size)}</p>
                </div>
                <button type="button" onClick={clearFile}
                  className="text-text-secondary hover:text-red-400">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed py-10 transition-colors ${
                  isDragging
                    ? "border-brand bg-brand/5"
                    : "border-border hover:border-brand/50 hover:bg-bg-secondary"
                }`}
              >
                <div className="flex size-12 items-center justify-center rounded-xl bg-brand/10">
                  <Upload size={22} className="text-brand" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-text-primary">파일을 드래그하거나 클릭하여 선택</p>
                  <p className="mt-0.5 text-xs text-text-secondary">모든 파일 형식 지원 · 브라우저 내 처리</p>
                </div>
              </div>
            )}

            {computing && (
              <p className="text-center text-xs text-brand animate-pulse">해시 계산 중…</p>
            )}
          </div>
        )}

        {/* 해시 결과 */}
        {(hex || (mode === "file" && computing)) && (
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-text-primary">
              {ALGO_OPTIONS.find((a) => a.value === algo)?.label} 해시 결과
            </h3>

            <div className="overflow-hidden rounded-xl border border-border">
              {[
                { label: "HEX (16진수)", value: hex, id: "hex" },
                { label: "Base64",       value: b64, id: "b64" },
              ].map(({ label, value, id }) => (
                <div key={id} className="flex items-center gap-3 border-b border-border last:border-b-0 px-4 py-3">
                  <span className="w-24 shrink-0 text-xs font-semibold text-text-secondary">{label}</span>
                  <span className="flex-1 break-all font-mono text-xs text-text-primary min-w-0">
                    {value || <span className="text-text-secondary/40">—</span>}
                  </span>
                  <button type="button" onClick={() => handleCopy(value, id)} disabled={!value}
                    className="flex shrink-0 items-center gap-1 rounded border border-border px-2 py-1 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand disabled:opacity-30">
                    {copied === id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  </button>
                </div>
              ))}
            </div>

            {/* 메타 */}
            {hex && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "알고리즘",    value: algo },
                  { label: "출력 길이",   value: `${byteLen * 8} bit / ${byteLen} byte` },
                  { label: "HEX 길이",   value: `${hex.length} 자` },
                  { label: "Base64 길이", value: `${b64.length} 자` },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-center">
                    <p className="text-xs text-text-secondary">{label}</p>
                    <p className="mt-0.5 font-mono text-xs font-semibold text-text-primary">{value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 알고리즘 설명 */}
        <div className="overflow-hidden rounded-xl border border-border">
          {ALGO_OPTIONS.map(({ value, label, bits, desc }) => (
            <div key={value}
              className={`flex items-start gap-3 border-b border-border px-4 py-3 last:border-b-0 ${algo === value ? "bg-brand/5" : ""}`}
            >
              <span className={`w-20 shrink-0 font-mono text-xs font-semibold ${algo === value ? "text-brand" : "text-text-secondary"}`}>
                {label}
              </span>
              <span className="text-xs text-text-secondary">
                <span className="text-text-primary font-medium">{bits}</span> — {desc}
              </span>
            </div>
          ))}
        </div>

      </div>
    </ToolPageLayout>
  );
}
