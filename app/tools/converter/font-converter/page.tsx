"use client";

import { useState, useRef, useCallback } from "react";
import { Baseline, Upload, Download, X, Copy, Check } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Converter", href: "/tools/converter" },
];

const PREVIEW_SAMPLES = [
  "The quick brown fox jumps over the lazy dog",
  "가나다라마바사아자차카타파하",
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789",
];

// ── WOFF1 encoder ─────────────────────────────────────────────────

async function compressTable(data: Uint8Array<ArrayBuffer>): Promise<Uint8Array> {
  const cs = new CompressionStream("deflate"); // zlib/RFC1950 — required by WOFF1
  const writer = cs.writable.getWriter();
  writer.write(data);
  writer.close();
  const chunks: Uint8Array[] = [];
  const reader = cs.readable.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const total = chunks.reduce((s, c) => s + c.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
}

async function convertToWoff(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  const view = new DataView(buffer);
  const sfVersion = view.getUint32(0);
  const numTables = view.getUint16(4);

  type TableEntry = { tag: string; checksum: number; offset: number; length: number };
  const entries: TableEntry[] = [];
  for (let i = 0; i < numTables; i++) {
    const b = 12 + i * 16;
    const tag = String.fromCharCode(
      view.getUint8(b), view.getUint8(b + 1), view.getUint8(b + 2), view.getUint8(b + 3),
    );
    entries.push({
      tag,
      checksum: view.getUint32(b + 4),
      offset:   view.getUint32(b + 8),
      length:   view.getUint32(b + 12),
    });
  }

  type ProcessedTable = TableEntry & { origData: Uint8Array; compData: Uint8Array };
  const tables: ProcessedTable[] = [];
  for (const e of entries) {
    const paddedLen = (e.length + 3) & ~3;
    const origData = new Uint8Array(paddedLen);
    origData.set(
      new Uint8Array(buffer, e.offset, Math.min(e.length, buffer.byteLength - e.offset)),
    );
    const compressed = await compressTable(origData);
    const compData = compressed.length < origData.length ? compressed : origData;
    tables.push({ ...e, origData, compData });
  }

  const HEADER_SIZE    = 44;
  const DIR_ENTRY_SIZE = 20;
  let dataOff = HEADER_SIZE + numTables * DIR_ENTRY_SIZE;
  const tableOffsets: number[] = tables.map((t) => {
    const off = dataOff;
    dataOff += (t.compData.length + 3) & ~3; // pad to 4-byte boundary
    return off;
  });
  const totalLen = dataOff;

  const woff   = new ArrayBuffer(totalLen);
  const wv     = new DataView(woff);
  const wBytes = new Uint8Array(woff);

  // WOFF header (44 bytes)
  wv.setUint32(0,  0x774F4646);      // 'wOFF'
  wv.setUint32(4,  sfVersion);
  wv.setUint32(8,  totalLen);
  wv.setUint16(12, numTables);
  wv.setUint16(14, 0);               // reserved
  wv.setUint32(16, buffer.byteLength); // totalSfntSize
  wv.setUint16(20, 1);               // majorVersion
  wv.setUint16(22, 0);               // minorVersion
  wv.setUint32(24, 0); wv.setUint32(28, 0); wv.setUint32(32, 0); // metaOffset/Len/OrigLen
  wv.setUint32(36, 0); wv.setUint32(40, 0);                       // privOffset/Len

  // Table directory
  for (let i = 0; i < tables.length; i++) {
    const t = tables[i];
    const b = HEADER_SIZE + i * DIR_ENTRY_SIZE;
    for (let j = 0; j < 4; j++) wv.setUint8(b + j, t.tag.charCodeAt(j));
    wv.setUint32(b + 4,  tableOffsets[i]);
    wv.setUint32(b + 8,  t.compData.length); // compLength
    wv.setUint32(b + 12, t.length);          // origLength (unpadded)
    wv.setUint32(b + 16, t.checksum);
  }

  for (let i = 0; i < tables.length; i++) {
    wBytes.set(tables[i].compData, tableOffsets[i]);
  }

  return woff;
}

// ── Main component ────────────────────────────────────────────────

export default function FontConverterPage() {
  const [file, setFile]               = useState<File | null>(null);
  const [isDragOver, setIsDragOver]   = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [previewText, setPreviewText] = useState(PREVIEW_SAMPLES[0]);
  const [fontSize, setFontSize]       = useState(24);
  const [fontLoaded, setFontLoaded]   = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [copied, setCopied]           = useState(false);

  const bufferRef    = useRef<ArrayBuffer | null>(null);
  const fontNameRef  = useRef<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef   = useRef<HTMLParagraphElement>(null);

  const baseName = file ? file.name.replace(/\.[^.]+$/, "") : "";
  const cssCode  = file
    ? `@font-face {\n  font-family: '${baseName}';\n  src: url('${baseName}.woff') format('woff');\n  font-weight: normal;\n  font-style: normal;\n}`
    : "";

  const handleFile = useCallback(async (f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (ext !== "ttf" && ext !== "otf") {
      setError("TTF 또는 OTF 파일만 지원합니다."); return;
    }
    setFile(f);
    setError(null);
    setFontLoaded(false);
    try {
      const buf = await f.arrayBuffer();
      bufferRef.current = buf;
      const name = `PreviewFont_${Date.now()}`;
      fontNameRef.current = name;
      const face = new FontFace(name, buf);
      await face.load();
      document.fonts.add(face);
      if (previewRef.current) previewRef.current.style.fontFamily = `'${name}', sans-serif`;
      setFontLoaded(true);
    } catch {
      setError("폰트 파일을 불러오지 못했습니다.");
    }
  }, []);

  const handleConvert = useCallback(async () => {
    if (!file || !bufferRef.current) return;
    setIsConverting(true);
    setError(null);
    try {
      const woff    = await convertToWoff(bufferRef.current);
      const blob    = new Blob([woff], { type: "font/woff" });
      const outName = baseName + ".woff";
      const a       = document.createElement("a");
      a.href        = URL.createObjectURL(blob);
      a.download    = outName;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      setError("변환 중 오류가 발생했습니다.");
    } finally {
      setIsConverting(false);
    }
  }, [file, baseName]);

  const handleCopyCss = async () => {
    await navigator.clipboard.writeText(cssCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setFile(null);
    setFontLoaded(false);
    setError(null);
    bufferRef.current = null;
    if (previewRef.current) previewRef.current.style.fontFamily = "";
  };

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="폰트 변환기"
      description="TTF·OTF 폰트를 WOFF로 변환하고 CSS @font-face 코드를 생성합니다. (완전 오프라인)"
      icon={Baseline}
    >
      <div className="flex flex-col gap-6">
        {/* Upload */}
        {!file && (
          <div
            onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed py-16 transition-colors ${
              isDragOver ? "border-brand bg-brand/5 text-brand" : "border-border text-text-secondary hover:border-brand/50"
            }`}
          >
            <Upload size={32} />
            <div className="text-center">
              <p className="text-sm font-medium">TTF 또는 OTF 파일을 드래그하거나 클릭하여 업로드</p>
              <p className="mt-1 text-xs text-text-secondary">TrueType (.ttf) · OpenType (.otf) 지원</p>
            </div>
            <input ref={fileInputRef} type="file" accept=".ttf,.otf" className="sr-only"
              onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
            />
          </div>
        )}

        {file && (
          <div className="flex flex-col gap-5">
            {/* File info */}
            <div className="flex items-center justify-between rounded-xl border border-border bg-bg-secondary px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-text-primary">{file.name}</p>
                <p className="text-xs text-text-secondary">
                  {(file.size / 1024).toFixed(1)} KB · {file.name.split(".").pop()?.toUpperCase()} → WOFF
                </p>
              </div>
              <button type="button" onClick={handleReset} aria-label="초기화"
                className="text-text-secondary transition-colors hover:text-text-primary">
                <X size={18} />
              </button>
            </div>

            {/* Font preview */}
            <div className="rounded-xl border border-border bg-bg-secondary p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold text-text-secondary">폰트 미리보기</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-secondary">{fontSize}px</span>
                  <input type="range" min={12} max={72} step={4} value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="w-24 accent-brand" />
                </div>
              </div>
              <div className="mb-3 flex flex-wrap gap-2">
                {PREVIEW_SAMPLES.map((s) => (
                  <button key={s} type="button" onClick={() => setPreviewText(s)}
                    className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                      previewText === s
                        ? "border-brand bg-brand/10 text-brand"
                        : "border-border text-text-secondary hover:border-brand/40"
                    }`}>
                    {s.slice(0, 12)}…
                  </button>
                ))}
              </div>
              <div className="min-h-[60px] rounded-lg border border-border bg-bg-primary px-4 py-3">
                <p
                  ref={previewRef}
                  style={{ fontSize: `${fontSize}px`, lineHeight: 1.5 }}
                  className={`text-text-primary transition-opacity ${fontLoaded ? "opacity-100" : "opacity-30"}`}
                >
                  {previewText}
                </p>
              </div>
              {!fontLoaded && (
                <p className="mt-1.5 text-xs text-text-secondary">폰트 로딩 중…</p>
              )}
            </div>

            {/* CSS @font-face */}
            <div className="rounded-xl border border-border bg-bg-secondary p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-text-secondary">CSS @font-face 코드</p>
                <button type="button" onClick={handleCopyCss}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand">
                  {copied ? <><Check size={12} />복사됨</> : <><Copy size={12} />복사</>}
                </button>
              </div>
              <pre className="overflow-x-auto rounded-lg bg-bg-primary p-3 text-xs text-text-secondary">
                <code>{cssCode}</code>
              </pre>
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button type="button" onClick={handleConvert} disabled={isConverting}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-50">
              {isConverting
                ? "변환 중…"
                : <><Download size={15} />WOFF로 변환 및 다운로드</>}
            </button>
          </div>
        )}

        <div className="rounded-lg border border-border bg-bg-secondary px-4 py-3 text-xs text-text-secondary">
          <strong className="text-text-primary">순수 브라우저 처리</strong>:
          SFNT 테이블 파싱 + zlib DEFLATE(CompressionStream API) 압축 → WOFF1 포맷 출력.
          서버 전송 없이 완전 오프라인으로 동작합니다.
        </div>
      </div>
    </ToolPageLayout>
  );
}