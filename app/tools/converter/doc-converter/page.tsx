"use client";

import { useState, useRef, useCallback } from "react";
import { FileOutput, Upload, Download, X, ImageIcon, FileText, RefreshCw } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Converter", href: "/tools/converter" },
];

type Mode = "images-to-pdf" | "pdf-to-images";

// ── Helpers ───────────────────────────────────────────────────────

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload  = () => res(reader.result as string);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

function getImageSize(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((res, rej) => {
    const img    = new Image();
    img.onload  = () => res({ w: img.width, h: img.height });
    img.onerror = rej;
    img.src     = dataUrl;
  });
}

function triggerDownload(url: string, filename: string) {
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Images → PDF ──────────────────────────────────────────────────

async function imagesToPdf(files: File[]): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  let pdf: InstanceType<typeof jsPDF> | null = null;

  for (let i = 0; i < files.length; i++) {
    const dataUrl = await fileToDataUrl(files[i]);
    const { w, h } = await getImageSize(dataUrl);
    const orient = w >= h ? "landscape" : "portrait";
    if (i === 0) {
      pdf = new jsPDF({ orientation: orient, unit: "px", format: [w, h], hotfixes: ["px_scaling"] });
    } else {
      pdf!.addPage([w, h], orient);
    }
    const fmt = files[i].type === "image/png" ? "PNG" : "JPEG";
    pdf!.addImage(dataUrl, fmt, 0, 0, w, h);
  }

  if (!pdf) throw new Error("이미지가 없습니다.");
  return pdf.output("blob");
}

// ── PDF → Images ──────────────────────────────────────────────────

async function pdfToImages(
  buffer: ArrayBuffer,
  scale: number,
  onProgress: (cur: number, total: number) => void,
): Promise<{ name: string; dataUrl: string }[]> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  const pdf    = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
  const total  = pdf.numPages;
  const result: { name: string; dataUrl: string }[] = [];

  for (let i = 1; i <= total; i++) {
    onProgress(i, total);
    const page     = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas   = document.createElement("canvas");
    canvas.width   = viewport.width;
    canvas.height  = viewport.height;
    const ctx      = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    result.push({
      name:   `page_${String(i).padStart(3, "0")}.png`,
      dataUrl: canvas.toDataURL("image/png"),
    });
  }
  return result;
}

async function downloadAsZip(images: { name: string; dataUrl: string }[], baseName: string) {
  const JSZip = (await import("jszip")).default;
  const zip   = new JSZip();
  for (const { name, dataUrl } of images) {
    zip.file(name, dataUrl.split(",")[1], { base64: true });
  }
  const blob = await zip.generateAsync({ type: "blob" });
  triggerDownload(URL.createObjectURL(blob), `${baseName}_pages.zip`);
}

// ── Main component ────────────────────────────────────────────────

export default function DocConverterPage() {
  const [mode, setMode]             = useState<Mode>("images-to-pdf");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [pdfFile, setPdfFile]       = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress]     = useState({ cur: 0, total: 0 });
  const [pdfScale, setPdfScale]     = useState(2.0);
  const [error, setError]           = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFiles = useCallback((files: File[]) => {
    const valid = files.filter((f) => f.type.startsWith("image/"));
    if (valid.length === 0) { setError("이미지 파일만 지원합니다."); return; }
    setImageFiles((prev) => [...prev, ...valid].slice(0, 20));
    setError(null);
  }, []);

  const handlePdfFile = useCallback((f: File) => {
    if (!f.name.toLowerCase().endsWith(".pdf") && f.type !== "application/pdf") {
      setError("PDF 파일만 지원합니다."); return;
    }
    setPdfFile(f);
    setError(null);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (mode === "images-to-pdf") handleImageFiles(files);
    else if (files[0]) handlePdfFile(files[0]);
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setImageFiles([]); setPdfFile(null); setError(null); setProgress({ cur: 0, total: 0 });
  };

  const handleConvertImagesToPdf = async () => {
    if (imageFiles.length === 0) return;
    setIsProcessing(true); setError(null);
    try {
      const blob    = await imagesToPdf(imageFiles);
      const outName = imageFiles[0].name.replace(/\.[^.]+$/, "") + "_converted.pdf";
      triggerDownload(URL.createObjectURL(blob), outName);
    } catch {
      setError("PDF 변환 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConvertPdfToImages = async () => {
    if (!pdfFile) return;
    setIsProcessing(true); setError(null); setProgress({ cur: 0, total: 0 });
    try {
      const buf    = await pdfFile.arrayBuffer();
      const images = await pdfToImages(buf, pdfScale, (cur, total) => setProgress({ cur, total }));
      const base   = pdfFile.name.replace(/\.pdf$/i, "");
      await downloadAsZip(images, base);
    } catch (e) {
      setError(e instanceof Error ? e.message : "변환 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="문서 변환기"
      description="이미지를 PDF로 합치거나, PDF 각 페이지를 이미지로 추출합니다."
      icon={FileOutput}
    >
      <div className="flex flex-col gap-6">
        {/* Mode toggle */}
        <div className="flex gap-1 rounded-xl border border-border bg-bg-secondary p-1">
          {(["images-to-pdf", "pdf-to-images"] as Mode[]).map((m) => (
            <button key={m} type="button" onClick={() => switchMode(m)}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ${
                mode === m ? "bg-brand text-bg-primary" : "text-text-secondary hover:text-text-primary"
              }`}>
              {m === "images-to-pdf" ? "이미지 → PDF" : "PDF → 이미지"}
            </button>
          ))}
        </div>

        {/* ── Images → PDF ── */}
        {mode === "images-to-pdf" && (
          <div className="flex flex-col gap-4">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-10 transition-colors ${
                isDragOver ? "border-brand bg-brand/5 text-brand" : "border-border text-text-secondary hover:border-brand/50"
              }`}
            >
              <ImageIcon size={28} />
              <div className="text-center">
                <p className="text-sm font-medium">이미지 파일 추가 (최대 20장)</p>
                <p className="mt-1 text-xs text-text-secondary">JPG, PNG, WebP, GIF 지원 · 각 이미지가 1페이지로 변환됩니다</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="sr-only"
                onChange={(e) => { if (e.target.files) handleImageFiles(Array.from(e.target.files)); }}
              />
            </div>

            {imageFiles.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-text-secondary">
                    {imageFiles.length}개 이미지 → PDF {imageFiles.length}페이지
                  </p>
                  <button type="button" onClick={() => setImageFiles([])}
                    className="text-xs text-text-secondary hover:text-text-primary">
                    전체 삭제
                  </button>
                </div>
                <ul className="max-h-48 divide-y divide-border overflow-y-auto rounded-xl border border-border">
                  {imageFiles.map((f, i) => (
                    <li key={i} className="flex items-center justify-between px-3 py-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="w-5 shrink-0 text-xs text-text-secondary">{i + 1}.</span>
                        <span className="truncate text-xs text-text-primary">{f.name}</span>
                        <span className="shrink-0 text-xs text-text-secondary">{(f.size / 1024).toFixed(0)} KB</span>
                      </div>
                      <button type="button"
                        onClick={() => setImageFiles((p) => p.filter((_, j) => j !== i))}
                        className="ml-2 shrink-0 text-text-secondary hover:text-text-primary">
                        <X size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button type="button" onClick={handleConvertImagesToPdf}
              disabled={isProcessing || imageFiles.length === 0}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-50">
              {isProcessing
                ? <><RefreshCw size={15} className="animate-spin" />변환 중…</>
                : <><Download size={15} />PDF로 변환 및 다운로드</>}
            </button>
          </div>
        )}

        {/* ── PDF → Images ── */}
        {mode === "pdf-to-images" && (
          <div className="flex flex-col gap-4">
            {!pdfFile ? (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-10 transition-colors ${
                  isDragOver ? "border-brand bg-brand/5 text-brand" : "border-border text-text-secondary hover:border-brand/50"
                }`}
              >
                <FileText size={28} />
                <div className="text-center">
                  <p className="text-sm font-medium">PDF 파일을 드래그하거나 클릭하여 업로드</p>
                  <p className="mt-1 text-xs text-text-secondary">각 페이지를 PNG 이미지로 추출하여 ZIP으로 다운로드합니다</p>
                </div>
                <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" className="sr-only"
                  onChange={(e) => { if (e.target.files?.[0]) handlePdfFile(e.target.files[0]); }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-xl border border-border bg-bg-secondary px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{pdfFile.name}</p>
                  <p className="text-xs text-text-secondary">{(pdfFile.size / 1024).toFixed(1)} KB · PDF</p>
                </div>
                <button type="button" onClick={() => { setPdfFile(null); setError(null); setProgress({ cur: 0, total: 0 }); }}
                  aria-label="초기화" className="text-text-secondary hover:text-text-primary">
                  <X size={18} />
                </button>
              </div>
            )}

            {pdfFile && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-text-secondary">출력 해상도 배율</p>
                  <span className="font-mono text-xs font-semibold text-text-primary">×{pdfScale.toFixed(1)}</span>
                </div>
                <input type="range" min={1} max={4} step={0.5} value={pdfScale}
                  onChange={(e) => setPdfScale(parseFloat(e.target.value))}
                  className="w-full accent-brand" />
                <div className="mt-1 flex justify-between text-xs text-text-secondary">
                  <span>×1.0 (저해상도)</span><span>×4.0 (고해상도)</span>
                </div>
              </div>
            )}

            {isProcessing && progress.total > 0 && (
              <div className="flex flex-col gap-1">
                <div className="h-2 w-full overflow-hidden rounded-full bg-bg-secondary">
                  <div
                    className="h-full rounded-full bg-brand transition-all duration-300"
                    style={{ width: `${(progress.cur / progress.total) * 100}%` }}
                  />
                </div>
                <p className="text-right text-xs text-text-secondary">{progress.cur} / {progress.total} 페이지</p>
              </div>
            )}

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button type="button" onClick={handleConvertPdfToImages}
              disabled={isProcessing || !pdfFile}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-50">
              {isProcessing
                ? <><RefreshCw size={15} className="animate-spin" />처리 중…</>
                : <><Download size={15} />이미지 추출 및 ZIP 다운로드</>}
            </button>
          </div>
        )}

        <div className="rounded-lg border border-border bg-bg-secondary px-4 py-3 text-xs text-text-secondary">
          <strong className="text-text-primary">이미지→PDF</strong>: jsPDF 기반, 각 이미지가 1페이지로 변환됩니다.
          &nbsp;·&nbsp;
          <strong className="text-text-primary">PDF→이미지</strong>: PDF.js(Mozilla) 기반 렌더링, 각 페이지를 PNG로 추출하여 ZIP 다운로드.
        </div>
      </div>
    </ToolPageLayout>
  );
}