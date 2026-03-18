"use client";

import { useState, useRef, useCallback } from "react";
import JSZip from "jszip";
import {
  ImageIcon, Upload, Download, X, ArrowLeftRight,
  RefreshCw, Check, Maximize2, Info, Eraser,
} from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";

// ── Types ──────────────────────────────────────────────────────────

type OutputFormat = "image/jpeg" | "image/webp" | "image/png" | "image/x-icon";
type ItemStatus   = "idle" | "processing" | "done" | "error";
type TabMode      = "convert" | "bg-remove";

// ── ICO Encoder ────────────────────────────────────────────────────

const ICO_SIZES = [16, 32, 48, 64, 128, 256] as const;
type IcoSize = (typeof ICO_SIZES)[number];

async function renderToPngBuffer(file: File, size: number): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) { URL.revokeObjectURL(url); reject(new Error("Canvas 실패")); return; }
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error("PNG 변환 실패")); return; }
        blob.arrayBuffer().then(resolve).catch(reject);
      }, "image/png");
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("이미지 로드 실패")); };
    img.src = url;
  });
}

async function buildIco(file: File, sizes: IcoSize[]): Promise<{ blob: Blob; dataUrl: string }> {
  const pngBuffers = await Promise.all(sizes.map((s) => renderToPngBuffer(file, s)));

  const headerSize   = 6;
  const dirEntrySize = 16;
  const count        = sizes.length;

  // Calculate offsets
  let dataOffset = headerSize + dirEntrySize * count;
  const offsets: number[] = [];
  for (const buf of pngBuffers) {
    offsets.push(dataOffset);
    dataOffset += buf.byteLength;
  }

  // ICONDIR header (6 bytes)
  const header = new ArrayBuffer(headerSize);
  const hv = new DataView(header);
  hv.setUint16(0, 0, true); // reserved
  hv.setUint16(2, 1, true); // type = ICO
  hv.setUint16(4, count, true);

  // Directory entries (16 bytes each)
  const dirBuf = new ArrayBuffer(dirEntrySize * count);
  const dv = new DataView(dirBuf);
  for (let i = 0; i < count; i++) {
    const base = i * 16;
    const s = sizes[i];
    dv.setUint8(base + 0, s === 256 ? 0 : s); // width (0 = 256)
    dv.setUint8(base + 1, s === 256 ? 0 : s); // height
    dv.setUint8(base + 2, 0);   // color count
    dv.setUint8(base + 3, 0);   // reserved
    dv.setUint16(base + 4, 1, true); // planes
    dv.setUint16(base + 6, 32, true); // bit count
    dv.setUint32(base + 8, pngBuffers[i].byteLength, true);
    dv.setUint32(base + 12, offsets[i], true);
  }

  const blob = new Blob([header, dirBuf, ...pngBuffers], { type: "image/x-icon" });
  const dataUrl = await new Promise<string>((res, rej) => {
    const reader = new FileReader();
    reader.onload = (e) => res(e.target!.result as string);
    reader.onerror = rej;
    reader.readAsDataURL(blob);
  });
  return { blob, dataUrl };
}

interface Recommendation { format: OutputFormat; quality: number; label: string; }
interface ConvertResult  { dataUrl: string; blob: Blob; size: number; }
interface ImageItem {
  id: string;
  file: File;
  preview: string;
  result?: ConvertResult;
  status: ItemStatus;
  recommendation: Recommendation;
}
interface ResizeSettings {
  enabled: boolean;
  width: string;
  height: string;
  maintainAspect: boolean;
}

// ── Constants ──────────────────────────────────────────────────────

const MAX_FILES   = 10;
const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Converter", href: "/tools/converter" },
];

// ── Utilities ──────────────────────────────────────────────────────

function makeId()  { return Math.random().toString(36).slice(2, 9); }

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function getExt(fmt: OutputFormat): string {
  if (fmt === "image/jpeg")   return "jpg";
  if (fmt === "image/x-icon") return "ico";
  return fmt.split("/")[1];
}

function isHeic(file: File): boolean {
  const t = file.type.toLowerCase(), n = file.name.toLowerCase();
  return t === "image/heic" || t === "image/heif" || n.endsWith(".heic") || n.endsWith(".heif");
}

function isSvg(file: File): boolean {
  return file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
}

function getRecommendation(file: File): Recommendation {
  if (file.type === "image/jpeg") return { format: "image/jpeg", quality: 80, label: "사진 → JPEG 80" };
  if (file.size > 2 * 1024 * 1024)  return { format: "image/webp", quality: 70, label: "대형 이미지 → WebP 70" };
  return { format: "image/webp", quality: 75, label: "스크린샷 → WebP 75" };
}

// ── Image Processing ───────────────────────────────────────────────

async function processImage(
  file: File,
  format: OutputFormat,
  quality: number,
  resize: ResizeSettings,
  icoSizes: IcoSize[] = [16, 32, 48, 256],
): Promise<ConvertResult> {
  // ICO: use dedicated encoder
  if (format === "image/x-icon") {
    const { blob, dataUrl } = await buildIco(file, icoSizes);
    return { dataUrl, blob, size: blob.size };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      let w = img.naturalWidth;
      let h = img.naturalHeight;

      if (resize.enabled) {
        const rw = parseInt(resize.width) || 0;
        const rh = parseInt(resize.height) || 0;
        const ratio = w / h;
        if (rw > 0 && rh > 0) { w = rw; h = rh; }
        else if (rw > 0) { w = rw; h = resize.maintainAspect ? Math.round(rw / ratio) : h; }
        else if (rh > 0) { h = rh; w = resize.maintainAspect ? Math.round(rh * ratio) : w; }
      }

      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { URL.revokeObjectURL(url); reject(new Error("Canvas 초기화 실패")); return; }

      if (format === "image/jpeg") { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h); }
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error("변환 실패")); return; }
          const reader = new FileReader();
          reader.onload = (e) =>
            resolve({ dataUrl: e.target!.result as string, blob, size: blob.size });
          reader.readAsDataURL(blob);
        },
        format,
        format !== "image/png" ? quality / 100 : undefined,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(
        isHeic(file)
          ? "HEIC는 Safari(macOS/iOS)에서만 직접 지원됩니다."
          : "이미지 로드 실패. 손상되거나 지원되지 않는 포맷입니다.",
      ));
    };

    img.src = url;
  });
}

// ── Background Removal (flood-fill from corners) ───────────────────

function removeBackground(imageData: ImageData, tolerance: number): ImageData {
  const { data, width, height } = imageData;
  const output  = new Uint8ClampedArray(data);
  const visited = new Uint8Array(width * height);

  function colorAt(pos: number): [number, number, number] {
    const i = pos * 4;
    return [data[i], data[i + 1], data[i + 2]];
  }

  function dist(a: [number, number, number], b: [number, number, number]): number {
    return Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2);
  }

  function fill(sx: number, sy: number) {
    if (sx < 0 || sx >= width || sy < 0 || sy >= height) return;
    const startPos = sy * width + sx;
    const bgColor  = colorAt(startPos);
    const stack    = [startPos];

    while (stack.length > 0) {
      const pos = stack.pop()!;
      if (visited[pos]) continue;
      if (dist(colorAt(pos), bgColor) > tolerance) continue;
      visited[pos] = 1;
      output[pos * 4 + 3] = 0; // transparent
      const x = pos % width, y = Math.floor(pos / width);
      if (x > 0)          stack.push(pos - 1);
      if (x < width - 1)  stack.push(pos + 1);
      if (y > 0)          stack.push(pos - width);
      if (y < height - 1) stack.push(pos + width);
    }
  }

  fill(0, 0); fill(width - 1, 0); fill(0, height - 1); fill(width - 1, height - 1);
  return new ImageData(output, width, height);
}

async function applyBgRemoval(file: File, tolerance: number): Promise<{ dataUrl: string; blob: Blob }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) { URL.revokeObjectURL(url); reject(new Error("Canvas 초기화 실패")); return; }

      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      ctx.putImageData(removeBackground(imgData, tolerance), 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error("처리 실패")); return; }
        const reader = new FileReader();
        reader.onload = (e) => resolve({ dataUrl: e.target!.result as string, blob });
        reader.readAsDataURL(blob);
      }, "image/png");
    };

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("이미지 로드 실패")); };
    img.src = url;
  });
}

// ── ComparisonSlider ───────────────────────────────────────────────

function ComparisonSlider({
  before, after, beforeLabel = "원본", afterLabel = "변환",
}: { before: string; after: string; beforeLabel?: string; afterLabel?: string }) {
  const [pos, setPos]   = useState(50);
  const containerRef    = useRef<HTMLDivElement>(null);
  const dragging        = useRef(false);

  const updatePos = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setPos(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative cursor-col-resize select-none overflow-hidden rounded-xl"
      onMouseDown={() => { dragging.current = true; }}
      onMouseMove={(e) => { if (dragging.current) updatePos(e.clientX); }}
      onMouseUp={() => { dragging.current = false; }}
      onMouseLeave={() => { dragging.current = false; }}
      onTouchMove={(e) => updatePos(e.touches[0].clientX)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after} alt={afterLabel} className="block w-full" draggable={false} />
      <div className="pointer-events-none absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={before} alt={beforeLabel} className="block w-full" draggable={false} />
      </div>
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-lg" style={{ left: `${pos}%` }} />
      <div
        className="pointer-events-none absolute top-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-xl"
        style={{ left: `${pos}%` }}
      >
        <ArrowLeftRight size={14} className="text-gray-600" />
      </div>
      <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white backdrop-blur-sm">{beforeLabel}</span>
      <span className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white backdrop-blur-sm">{afterLabel}</span>
    </div>
  );
}

// ── ImageCard ──────────────────────────────────────────────────────

function ImageCard({ item, isSelected, onSelect, onRemove }: {
  item: ImageItem; isSelected: boolean; onSelect: () => void; onRemove: () => void;
}) {
  const savedPct = item.result
    ? Math.round((1 - item.result.size / item.file.size) * 100)
    : null;

  return (
    <div
      role="button" tabIndex={0}
      onClick={onSelect} onKeyDown={(e) => e.key === "Enter" && onSelect()}
      className={`relative flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
        isSelected ? "border-brand bg-brand/5" : "border-border hover:border-brand/40"
      }`}
    >
      <div className="size-14 shrink-0 overflow-hidden rounded-lg border border-border bg-bg-primary">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.preview} alt={item.file.name} className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-text-primary">{item.file.name}</p>
        <p className="text-xs text-text-secondary">
          {formatBytes(item.file.size)}
          {item.result && <span className="ml-1">→ {formatBytes(item.result.size)}</span>}
        </p>
        {savedPct !== null && (
          <span className={`mt-0.5 inline-block text-xs font-bold ${savedPct > 0 ? "text-emerald-400" : "text-amber-400"}`}>
            {savedPct > 0 ? `${savedPct}% 감소 ↓` : "변화 없음"}
          </span>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-center gap-1.5">
        {item.status === "processing" && <RefreshCw size={14} className="animate-spin text-brand" />}
        {item.status === "done"       && <Check size={14} className="text-emerald-400" />}
        {item.status === "error"      && <X size={14} className="text-red-400" />}
        <button type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="text-text-secondary transition-colors hover:text-red-400"
          aria-label="제거">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────

// ── Main Page ──────────────────────────────────────────────────────

export default function ImageConverterPage() {
  const [tab, setTab] = useState<TabMode>("convert");

  // ── Convert / Compress state ──────────────────────────
  const [items, setItems]           = useState<ImageItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [format, setFormat]         = useState<OutputFormat>("image/webp");
  const [quality, setQuality]       = useState(80);
  const [resize, setResize]         = useState<ResizeSettings>({
    enabled: false, width: "", height: "", maintainAspect: true,
  });
  const [icoSizes, setIcoSizes]     = useState<Set<IcoSize>>(new Set([16, 32, 48, 256]));
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress]         = useState(0);
  const [isDragOver, setIsDragOver]     = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Background Removal state ──────────────────────────
  const [bgFile, setBgFile]         = useState<File | null>(null);
  const [bgPreview, setBgPreview]   = useState<string | null>(null);
  const [bgResult, setBgResult]     = useState<{ dataUrl: string; blob: Blob } | null>(null);
  const [bgTolerance, setBgTolerance] = useState(30);
  const [bgProcessing, setBgProcessing] = useState(false);
  const [bgError, setBgError]       = useState<string | null>(null);
  const [bgDragOver, setBgDragOver] = useState(false);
  const bgFileInputRef  = useRef<HTMLInputElement>(null);
  const bgPreviewUrlRef = useRef<string | null>(null);

  // ── Derived ───────────────────────────────────────────
  const selectedItem = items.find((i) => i.id === selectedId) ?? items.find((i) => i.status === "done") ?? null;
  const doneItems    = items.filter((i) => i.status === "done");
  const totalSaved   = doneItems.reduce((s, i) => s + (i.file.size - (i.result?.size ?? i.file.size)), 0);
  const canProcess   = items.some((i) => i.status === "idle") && !isProcessing;
  const hasSvg       = items.some((i) => isSvg(i.file));
  const hasHeic      = items.some((i) => isHeic(i.file));

  // ── Handlers: Convert ────────────────────────────────
  const addFiles = useCallback((files: File[]) => {
    const valid = files.filter((f) => f.type.startsWith("image/") || isHeic(f) || isSvg(f));
    setItems((prev) => {
      const remaining = MAX_FILES - prev.length;
      if (remaining <= 0) return prev;
      const newItems: ImageItem[] = valid.slice(0, remaining).map((file) => ({
        id: makeId(), file,
        preview: URL.createObjectURL(file),
        status: "idle",
        recommendation: getRecommendation(file),
      }));
      if (newItems.length > 0 && !selectedId) setSelectedId(newItems[0].id);
      return [...prev, ...newItems];
    });
  }, [selectedId]);

  const handleRemove = useCallback((id: string) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((i) => i.id !== id);
    });
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  const handleProcess = useCallback(async () => {
    const targets = items.filter((i) => i.status === "idle");
    if (!targets.length) return;
    setIsProcessing(true); setProgress(0);
    const sortedIcoSizes = [...icoSizes].sort((a, b) => a - b) as IcoSize[];
    for (let i = 0; i < targets.length; i++) {
      const item = targets[i];
      setItems((prev) => prev.map((x) => x.id === item.id ? { ...x, status: "processing" } : x));
      try {
        const result = await processImage(item.file, format, quality, resize, sortedIcoSizes);
        setItems((prev) => prev.map((x) => x.id === item.id ? { ...x, status: "done", result } : x));
        setSelectedId(item.id);
      } catch {
        setItems((prev) => prev.map((x) => x.id === item.id ? { ...x, status: "error" } : x));
      }
      setProgress(Math.round(((i + 1) / targets.length) * 100));
    }
    setIsProcessing(false);
  }, [items, format, quality, resize, icoSizes]);

  const handleDownloadSingle = useCallback((item: ImageItem) => {
    if (!item.result) return;
    const a = document.createElement("a");
    a.href = item.result.dataUrl;
    a.download = item.file.name.replace(/\.[^.]+$/, "") + `_converted.${getExt(format)}`;
    a.click();
  }, [format]);

  const handleDownloadAll = useCallback(async () => {
    const done = doneItems.filter((i) => i.result);
    if (!done.length) return;
    const zip = new JSZip();
    const ext = getExt(format);
    done.forEach((item) => {
      zip.file(item.file.name.replace(/\.[^.]+$/, "") + `_converted.${ext}`, item.result!.blob);
    });
    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "converted_images.zip"; a.click();
    URL.revokeObjectURL(a.href);
  }, [doneItems, format]);

  const clearAll = () => {
    items.forEach((i) => URL.revokeObjectURL(i.preview));
    setItems([]); setSelectedId(null);
  };

  // ── Handlers: Background Removal ─────────────────────
  const handleBgFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) { setBgError("이미지 파일만 지원합니다."); return; }
    setBgFile(f); setBgResult(null); setBgError(null);
    if (bgPreviewUrlRef.current) URL.revokeObjectURL(bgPreviewUrlRef.current);
    bgPreviewUrlRef.current = URL.createObjectURL(f);
    setBgPreview(bgPreviewUrlRef.current);
  }, []);

  const handleBgRemove = useCallback(async () => {
    if (!bgFile) return;
    setBgProcessing(true); setBgError(null); setBgResult(null);
    try {
      setBgResult(await applyBgRemoval(bgFile, bgTolerance));
    } catch (e) {
      setBgError(e instanceof Error ? e.message : "배경 제거 중 오류가 발생했습니다.");
    } finally {
      setBgProcessing(false);
    }
  }, [bgFile, bgTolerance]);

  const handleBgDownload = () => {
    if (!bgResult || !bgFile) return;
    const a = document.createElement("a");
    a.href = bgResult.dataUrl;
    a.download = bgFile.name.replace(/\.[^.]+$/, "") + "_nobg.png";
    a.click();
  };

  const resetBg = () => {
    setBgFile(null); setBgPreview(null); setBgResult(null); setBgError(null);
    if (bgPreviewUrlRef.current) { URL.revokeObjectURL(bgPreviewUrlRef.current); bgPreviewUrlRef.current = null; }
  };

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="이미지 변환기"
      description="JPEG·PNG·WebP·SVG 포맷 변환, 압축, 리사이즈, 배경 제거. 최대 10개 일괄 처리. 완전 오프라인."
      icon={ImageIcon}
    >
      <div className="flex flex-col gap-6">

        {/* ── Tabs ── */}
        <div className="flex gap-1 rounded-xl border border-border bg-bg-secondary p-1">
          {(["convert", "bg-remove"] as TabMode[]).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ${
                tab === t ? "bg-brand text-bg-primary" : "text-text-secondary hover:text-text-primary"
              }`}>
              {t === "convert" ? "변환 / 압축" : "배경 제거"}
            </button>
          ))}
        </div>

        {/* ══════════════ 변환 / 압축 탭 ══════════════ */}
        {tab === "convert" && (
          <>
            {/* Upload */}
            <div
              onDrop={(e) => { e.preventDefault(); setIsDragOver(false); if (e.dataTransfer.files.length) addFiles(Array.from(e.dataTransfer.files)); }}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed py-12 transition-colors ${
                isDragOver ? "border-brand bg-brand/5 text-brand" : "border-border text-text-secondary hover:border-brand/50 hover:text-text-primary"
              }`}
            >
              <Upload size={32} aria-hidden="true" />
              <div className="text-center">
                <p className="text-sm font-medium">이미지를 드래그하거나 클릭하여 업로드</p>
                <p className="mt-1 text-xs text-text-secondary">
                  JPEG, PNG, WebP, GIF, SVG 지원 · HEIC는 Safari에서만 가능 · 최대 {MAX_FILES}개
                  {items.length > 0 && ` · 현재 ${items.length}개`}
                </p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*,.heic,.heif,.svg"
                multiple className="sr-only"
                onChange={(e) => { if (e.target.files?.length) addFiles(Array.from(e.target.files)); }}
              />
            </div>

            {/* File list */}
            {items.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-text-secondary">
                    파일 목록 ({items.length}/{MAX_FILES})
                  </p>
                  <button type="button" onClick={clearAll}
                    className="text-xs text-text-secondary transition-colors hover:text-red-400">
                    전체 제거
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
                    <ImageCard key={item.id} item={item}
                      isSelected={selectedId === item.id}
                      onSelect={() => setSelectedId(item.id)}
                      onRemove={() => handleRemove(item.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Settings */}
            {items.length > 0 && (
              <div className="flex flex-col gap-5 rounded-xl border border-border bg-bg-secondary p-5">
                <p className="text-sm font-semibold text-text-primary">변환 설정</p>

                {/* Recommendation */}
                {items[0] && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-text-secondary">추천:</span>
                    <button type="button"
                      onClick={() => { setFormat(items[0].recommendation.format); setQuality(items[0].recommendation.quality); }}
                      className="flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand/10 px-3 py-1 text-xs font-medium text-brand transition-colors hover:bg-brand/20">
                      <Check size={11} />{items[0].recommendation.label}
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* Output format */}
                  <div>
                    <p className="mb-2 text-xs font-medium text-text-secondary">출력 포맷</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {([
                        { fmt: "image/jpeg",   label: "JPEG" },
                        { fmt: "image/webp",   label: "WebP" },
                        { fmt: "image/png",    label: "PNG"  },
                        { fmt: "image/x-icon", label: "ICO"  },
                      ] as { fmt: OutputFormat; label: string }[]).map(({ fmt: f, label }) => (
                        <button key={f} type="button" onClick={() => setFormat(f)}
                          className={`flex-1 min-w-[52px] rounded-lg py-2 text-xs font-semibold uppercase transition-colors ${
                            format === f
                              ? "bg-brand text-bg-primary"
                              : "border border-border text-text-secondary hover:border-brand/50 hover:text-text-primary"
                          }`}>
                          {label}
                        </button>
                      ))}
                    </div>
                    {hasSvg  && <p className="mt-1.5 text-xs text-brand">SVG는 선택한 포맷의 래스터 이미지로 렌더링됩니다.</p>}
                    {hasHeic && <p className="mt-1.5 text-xs text-amber-400">HEIC는 Safari(macOS/iOS)에서만 변환 가능합니다.</p>}
                    {format === "image/png" && (
                      <p className="mt-1.5 text-xs text-text-secondary">PNG는 무손실 포맷으로 품질 설정이 적용되지 않습니다.</p>
                    )}
                    {format === "image/x-icon" && (
                      <p className="mt-1.5 text-xs text-brand">ICO는 복수 크기를 하나의 파일에 포함합니다. 품질·리사이즈 설정은 적용되지 않습니다.</p>
                    )}
                  </div>

                  {/* Quality — ICO일 때 숨김 */}
                  {format !== "image/x-icon" ? (
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-medium text-text-secondary">품질</p>
                        <span className="font-mono text-xs font-semibold text-text-primary">{quality}%</span>
                      </div>
                      <input type="range" min={10} max={100} value={quality}
                        onChange={(e) => setQuality(parseInt(e.target.value))}
                        disabled={format === "image/png"}
                        className="w-full accent-brand" />
                      <div className="mt-1 flex justify-between text-xs text-text-secondary">
                        <span>10 (최소)</span><span>100 (최고)</span>
                      </div>
                    </div>
                  ) : (
                    /* ICO 크기 선택 */
                    <div>
                      <p className="mb-2 text-xs font-medium text-text-secondary">포함할 크기 (복수 선택)</p>
                      <div className="flex flex-wrap gap-1.5">
                        {ICO_SIZES.map((s) => {
                          const active = icoSizes.has(s);
                          return (
                            <button key={s} type="button"
                              onClick={() => setIcoSizes((prev) => {
                                const next = new Set(prev);
                                if (next.has(s)) { if (next.size > 1) next.delete(s); }
                                else next.add(s);
                                return next;
                              })}
                              className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                                active
                                  ? "border-brand bg-brand/10 text-brand"
                                  : "border-border text-text-secondary hover:border-brand/40 hover:text-brand"
                              }`}>
                              {active && <Check size={10} />}
                              {s}px
                            </button>
                          );
                        })}
                      </div>
                      <p className="mt-1.5 text-[11px] text-text-secondary">
                        선택: {[...icoSizes].sort((a, b) => a - b).join(", ")}px
                      </p>
                    </div>
                  )}
                </div>

                {/* Resize — ICO일 때 숨김 */}
                {format !== "image/x-icon" && (
                  <div>
                    <button type="button"
                      onClick={() => setResize((r) => ({ ...r, enabled: !r.enabled }))}
                      className="flex items-center gap-2 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary">
                      <Maximize2 size={13} />
                      리사이즈 {resize.enabled ? "▲ 숨기기" : "▼ 설정"}
                    </button>
                    {resize.enabled && (
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        {(["width", "height"] as const).map((key, idx) => (
                          <div key={key} className="flex items-center gap-2">
                            {idx === 1 && <span className="text-xs text-text-secondary">×</span>}
                            <span className="text-xs text-text-secondary">{key === "width" ? "W" : "H"}</span>
                            <input type="number" min={1} placeholder="px"
                              value={resize[key]}
                              onChange={(e) => setResize((r) => ({ ...r, [key]: e.target.value }))}
                              className="w-20 rounded-lg border border-border bg-bg-primary px-2 py-1.5 text-xs text-text-primary focus:border-brand focus:outline-none"
                            />
                          </div>
                        ))}
                        <button type="button"
                          onClick={() => setResize((r) => ({ ...r, maintainAspect: !r.maintainAspect }))}
                          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                            resize.maintainAspect
                              ? "border-brand/40 bg-brand/10 text-brand"
                              : "border-border text-text-secondary hover:border-brand/50"
                          }`}>
                          {resize.maintainAspect && <Check size={11} />}비율 유지
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Process button + progress */}
            {items.length > 0 && (
              <div className="flex flex-col gap-2">
                <button type="button" onClick={handleProcess} disabled={!canProcess}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-50">
                  {isProcessing
                    ? <><RefreshCw size={15} className="animate-spin" />변환 중…</>
                    : "변환 시작"}
                </button>
                {isProcessing && (
                  <div className="flex flex-col gap-1">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-secondary">
                      <div className="h-full rounded-full bg-brand transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-right text-xs text-text-secondary">{progress}%</p>
                  </div>
                )}
              </div>
            )}

            {/* Results */}
            {doneItems.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-emerald-400">{doneItems.length}개 변환 완료</p>
                    {totalSaved > 0 && (
                      <p className="text-xs text-emerald-400/80">총 {formatBytes(totalSaved)} 절감</p>
                    )}
                  </div>
                  {doneItems.length > 1 && (
                    <button type="button" onClick={handleDownloadAll}
                      className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20">
                      <Download size={13} />ZIP 다운로드 ({doneItems.length}개)
                    </button>
                  )}
                </div>

                {selectedItem?.result && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-text-secondary">
                        비교 미리보기 — {selectedItem.file.name}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {formatBytes(selectedItem.file.size)} → {formatBytes(selectedItem.result.size)}
                        {" "}({Math.round((1 - selectedItem.result.size / selectedItem.file.size) * 100)}% 감소)
                      </p>
                    </div>
                    <ComparisonSlider before={selectedItem.preview} after={selectedItem.result.dataUrl} />
                    <p className="text-center text-xs text-text-secondary">← 슬라이더를 드래그하여 원본과 비교</p>
                    <button type="button" onClick={() => handleDownloadSingle(selectedItem)}
                      className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-brand/50 text-sm font-semibold text-brand transition-colors hover:bg-brand/10">
                      <Download size={15} />이 이미지 다운로드
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Info */}
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-bg-secondary p-5">
              <div className="flex items-center gap-2">
                <Info size={15} className="text-brand" aria-hidden="true" />
                <h2 className="text-sm font-semibold text-text-primary">지원 포맷 및 안내</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-text-primary">입력 포맷</p>
                  <ul className="space-y-1 text-xs text-text-secondary">
                    <li>JPEG, PNG, WebP, GIF(첫 프레임)</li>
                    <li><strong className="text-text-primary">SVG</strong> — 래스터 이미지로 렌더링</li>
                    <li><strong className="text-text-primary">HEIC/HEIF</strong> — Safari(macOS/iOS) 전용</li>
                    <li>최대 {MAX_FILES}개 일괄 변환</li>
                  </ul>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-text-primary">출력 포맷 비교</p>
                  <ul className="space-y-1 text-xs text-text-secondary">
                    <li><strong className="text-text-primary">JPEG</strong> — 사진·배경 흰색 처리, 손실 압축</li>
                    <li><strong className="text-text-primary">WebP</strong> — 투명도+높은 압축률, 최신 웹 표준</li>
                    <li><strong className="text-text-primary">PNG</strong> — 무손실, 투명 배경 유지</li>
                    <li><strong className="text-text-primary">ICO</strong> — 복수 크기 포함 아이콘 파일</li>
                  </ul>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-text-primary">권장 품질 (JPEG/WebP)</p>
                  <ul className="space-y-1 text-xs text-text-secondary">
                    <li>웹 이미지: 70 ~ 85 적합</li>
                    <li>고화질 보존: 90 이상 권장</li>
                    <li>PNG는 무손실로 품질 설정 무관</li>
                    <li>브라우저 로컬 처리 (서버 미전송)</li>
                  </ul>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-text-primary">ICO 권장 크기</p>
                  <ul className="space-y-1 text-xs text-text-secondary">
                    <li><strong className="text-text-primary">16×16</strong> — 브라우저 파비콘</li>
                    <li><strong className="text-text-primary">32×32</strong> — 탭·바탕화면 아이콘</li>
                    <li><strong className="text-text-primary">48×48</strong> — Windows 시스템 아이콘</li>
                    <li><strong className="text-text-primary">256×256</strong> — 고해상도 디스플레이</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === "bg-remove" && (
          <div className="flex flex-col gap-5">
            {/* Upload */}
            {!bgFile ? (
              <div
                onDrop={(e) => { e.preventDefault(); setBgDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleBgFile(f); }}
                onDragOver={(e) => { e.preventDefault(); setBgDragOver(true); }}
                onDragLeave={() => setBgDragOver(false)}
                onClick={() => bgFileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed py-12 transition-colors ${
                  bgDragOver ? "border-brand bg-brand/5 text-brand" : "border-border text-text-secondary hover:border-brand/50 hover:text-text-primary"
                }`}
              >
                <Eraser size={32} />
                <div className="text-center">
                  <p className="text-sm font-medium">배경을 제거할 이미지 업로드</p>
                  <p className="mt-1 text-xs text-text-secondary">
                    JPEG, PNG, WebP 지원 · 단색·그라데이션 배경에 최적화
                  </p>
                </div>
                <input ref={bgFileInputRef} type="file" accept="image/*" className="sr-only"
                  onChange={(e) => { if (e.target.files?.[0]) handleBgFile(e.target.files[0]); }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-xl border border-border bg-bg-secondary px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{bgFile.name}</p>
                  <p className="text-xs text-text-secondary">{formatBytes(bgFile.size)}</p>
                </div>
                <button type="button" onClick={resetBg} aria-label="초기화"
                  className="text-text-secondary transition-colors hover:text-text-primary">
                  <X size={18} />
                </button>
              </div>
            )}

            {bgFile && (
              <>
                {/* Tolerance slider */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-text-secondary">색상 허용 범위 (Tolerance)</p>
                    <span className="font-mono text-xs font-semibold text-text-primary">{bgTolerance}</span>
                  </div>
                  <input type="range" min={5} max={120} step={5} value={bgTolerance}
                    onChange={(e) => setBgTolerance(parseInt(e.target.value))}
                    className="w-full accent-brand" />
                  <div className="mt-1 flex justify-between text-xs text-text-secondary">
                    <span>5 (정밀)</span><span>120 (광범위)</span>
                  </div>
                </div>

                {bgError && <p className="text-xs text-red-400">{bgError}</p>}

                <button type="button" onClick={handleBgRemove} disabled={bgProcessing}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-50">
                  {bgProcessing
                    ? <><RefreshCw size={15} className="animate-spin" />처리 중…</>
                    : <><Eraser size={15} />배경 제거</>}
                </button>

                {/* Result preview */}
                {bgResult && bgPreview && (
                  <div className="flex flex-col gap-4">
                    <p className="text-xs font-semibold text-text-secondary">결과 미리보기</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="mb-1.5 text-center text-xs text-text-secondary">원본</p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={bgPreview} alt="원본" className="w-full rounded-xl border border-border object-contain" />
                      </div>
                      <div>
                        <p className="mb-1.5 text-center text-xs text-text-secondary">배경 제거</p>
                        {/* checkered pattern for transparency */}
                        <div
                          className="overflow-hidden rounded-xl border border-border"
                          style={{
                            backgroundImage: "linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%)",
                            backgroundSize: "16px 16px",
                            backgroundPosition: "0 0,0 8px,8px -8px,-8px 0",
                            backgroundColor: "#fff",
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={bgResult.dataUrl} alt="배경 제거 결과" className="block w-full object-contain" />
                        </div>
                      </div>
                    </div>
                    <button type="button" onClick={handleBgDownload}
                      className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-brand/50 text-sm font-semibold text-brand transition-colors hover:bg-brand/10">
                      <Download size={15} />PNG로 다운로드 (투명 배경)
                    </button>
                  </div>
                )}
              </>
            )}

            <div className="rounded-lg border border-border bg-bg-secondary px-4 py-3 text-xs text-text-secondary">
              <strong className="text-text-primary">배경 제거 방식</strong>: 이미지 4개 모서리에서 색상을 샘플링하여
              flood-fill 알고리즘으로 배경을 투명하게 처리합니다. 단색 또는 균일한 배경에 효과적입니다.
              허용 범위를 낮게 설정할수록 정밀하게, 높게 설정할수록 넓게 제거합니다.
              출력은 PNG(투명 채널 지원) 포맷으로 저장됩니다.
            </div>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}