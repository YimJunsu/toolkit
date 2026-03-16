"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  QrCode,
  Link2,
  Camera,
  Upload,
  Copy,
  Download,
  CheckCheck,
  ScanLine,
  KeyRound,
  X,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { useClipboard } from "@/hooks/useClipboard";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Converter", href: "/tools/converter" },
];

type Tab = "generator" | "scanner";
type ScanMode = "upload" | "camera";

interface OtpAuthParams {
  type: "totp" | "hotp";
  label: string;
  secret: string;
  issuer?: string;
  algorithm?: string;
  digits?: string;
  period?: string;
}

interface ScanResult {
  id: string;
  fileName: string;
  data: string | null;
  otp: OtpAuthParams | null;
}

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

function parseOtpAuth(uri: string): OtpAuthParams | null {
  try {
    if (!uri.startsWith("otpauth://")) return null;
    const url = new URL(uri);
    const type = url.hostname as "totp" | "hotp";
    const label = decodeURIComponent(url.pathname.slice(1));
    const params = url.searchParams;
    const secret = params.get("secret");
    if (!secret) return null;
    return {
      type,
      label,
      secret,
      issuer: params.get("issuer") ?? undefined,
      algorithm: params.get("algorithm") ?? undefined,
      digits: params.get("digits") ?? undefined,
      period: params.get("period") ?? undefined,
    };
  } catch {
    return null;
  }
}

// 다단계 스케일로 QR 코드 자동 감지 — 원본 → 1024px → 512px → 256px 순서로 시도
async function scanQRFromFile(file: File): Promise<string | null> {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<string | null>((resolve) => {
      const img = new Image();

      img.onload = () => {
        const tryDecode = (w: number, h: number): string | null => {
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) return null;
          ctx.drawImage(img, 0, 0, w, h);
          const imageData = ctx.getImageData(0, 0, w, h);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          return code ? code.data : null;
        };

        const origW = img.naturalWidth;
        const origH = img.naturalHeight;
        const ratio = origH / origW;

        // 원본 시도
        let result = tryDecode(origW, origH);
        if (result) { resolve(result); return; }

        // 1024px 너비로 축소 시도 (대형 사진에 효과적)
        if (origW > 1024) {
          result = tryDecode(1024, Math.round(1024 * ratio));
          if (result) { resolve(result); return; }
        }

        // 512px 너비로 축소 시도 (QR 코드 비율 강조)
        if (origW > 512) {
          result = tryDecode(512, Math.round(512 * ratio));
          if (result) { resolve(result); return; }
        }

        // 256px 너비로 축소 시도 (최소 크기)
        if (origW > 256) {
          result = tryDecode(256, Math.round(256 * ratio));
          if (result) { resolve(result); return; }
        }

        resolve(null);
      };

      img.onerror = () => resolve(null);
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ── OTP 결과 카드 ─────────────────────────────────────────────────

function OtpCard({
  otp,
  resultId,
  copiedField,
  onCopy,
}: {
  otp: OtpAuthParams;
  resultId: string;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
}) {
  const secretKey = `${resultId}-secret`;
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2 text-brand">
        <KeyRound size={14} />
        <span className="text-xs font-semibold">OTP 인증 QR 감지됨</span>
      </div>
      <div className="rounded-lg border border-brand/40 bg-brand/5 p-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand">Secret Key</span>
          <button
            onClick={() => onCopy(otp.secret, secretKey)}
            className="flex items-center gap-1 rounded-md border border-brand/30 px-2.5 py-1 text-xs text-brand transition-colors hover:bg-brand/10"
          >
            {copiedField === secretKey ? <CheckCheck size={11} /> : <Copy size={11} />}
            {copiedField === secretKey ? "복사됨" : "복사"}
          </button>
        </div>
        <p className="break-all font-mono text-sm font-medium text-text-primary">{otp.secret}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {otp.issuer && (
          <div className="rounded-md bg-bg-primary p-2">
            <span className="block text-text-secondary">서비스 (Issuer)</span>
            <span className="font-medium text-text-primary">{otp.issuer}</span>
          </div>
        )}
        {otp.label && (
          <div className="rounded-md bg-bg-primary p-2">
            <span className="block text-text-secondary">계정 (Label)</span>
            <span className="break-all font-medium text-text-primary">{otp.label}</span>
          </div>
        )}
        <div className="rounded-md bg-bg-primary p-2">
          <span className="block text-text-secondary">타입</span>
          <span className="font-medium uppercase text-text-primary">{otp.type}</span>
        </div>
        {otp.algorithm && (
          <div className="rounded-md bg-bg-primary p-2">
            <span className="block text-text-secondary">알고리즘</span>
            <span className="font-medium text-text-primary">{otp.algorithm}</span>
          </div>
        )}
        {otp.digits && (
          <div className="rounded-md bg-bg-primary p-2">
            <span className="block text-text-secondary">자릿수</span>
            <span className="font-medium text-text-primary">{otp.digits}</span>
          </div>
        )}
        {otp.period && (
          <div className="rounded-md bg-bg-primary p-2">
            <span className="block text-text-secondary">갱신 주기</span>
            <span className="font-medium text-text-primary">{otp.period}초</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 결과 아이템 카드 ──────────────────────────────────────────────

function ResultCard({
  result,
  copiedField,
  onCopy,
  onRemove,
}: {
  result: ScanResult;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
  onRemove: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const dataKey = `${result.id}-data`;

  if (!result.data) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
        <X size={14} className="shrink-0 text-red-400" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-text-secondary">{result.fileName}</p>
          <p className="text-xs text-red-400">QR 코드를 찾을 수 없습니다</p>
        </div>
        <button
          onClick={() => onRemove(result.id)}
          className="shrink-0 text-text-secondary transition-colors hover:text-text-primary"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-bg-secondary">
      {/* Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => e.key === "Enter" && setExpanded((v) => !v)}
        className="flex cursor-pointer items-center gap-3 px-4 py-3"
      >
        <QrCode size={14} className="shrink-0 text-brand" />
        <p className="min-w-0 flex-1 truncate text-xs font-medium text-text-primary">
          {result.fileName}
        </p>
        <div className="flex items-center gap-2">
          {result.otp && (
            <span className="rounded-full border border-brand/30 bg-brand/10 px-2 py-0.5 text-xs text-brand">
              OTP
            </span>
          )}
          <button
            onClick={() => onRemove(result.id)}
            className="text-text-secondary transition-colors hover:text-text-primary"
            aria-label="제거"
            tabIndex={-1}
          >
            <X size={13} />
          </button>
          {expanded ? (
            <ChevronUp size={14} className="text-text-secondary" />
          ) : (
            <ChevronDown size={14} className="text-text-secondary" />
          )}
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          {result.otp ? (
            <OtpCard
              otp={result.otp}
              resultId={result.id}
              copiedField={copiedField}
              onCopy={onCopy}
            />
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">스캔 결과</span>
                <button
                  onClick={() => onCopy(result.data!, dataKey)}
                  className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-text-secondary transition-colors hover:text-text-primary"
                >
                  {copiedField === dataKey ? <CheckCheck size={11} /> : <Copy size={11} />}
                  {copiedField === dataKey ? "복사됨" : "복사"}
                </button>
              </div>
              <p className="break-all text-sm text-text-primary">{result.data}</p>
              {result.data.startsWith("http") && (
                <a
                  href={result.data}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-brand hover:underline"
                >
                  링크 열기 →
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────────

export default function QrToolPage() {
  const [activeTab, setActiveTab] = useState<Tab>("generator");

  // Generator state
  const [inputText, setInputText] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrSize, setQrSize] = useState(256);
  const [isGenerating, setIsGenerating] = useState(false);

  // Scanner state
  const [scanMode, setScanMode] = useState<ScanMode>("upload");
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isScanningRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    isScanningRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  const scanFrame = useCallback(() => {
    if (!isScanningRef.current || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
          const data = code.data;
          setScanResults((prev) => [
            {
              id: makeId(),
              fileName: "카메라 스캔",
              data,
              otp: parseOtpAuth(data),
            },
            ...prev,
          ]);
          stopCamera();
          return;
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(scanFrame);
  }, [stopCamera]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        isScanningRef.current = true;
        setIsCameraActive(true);
        animFrameRef.current = requestAnimationFrame(scanFrame);
      }
    } catch {
      setCameraError(
        "카메라 접근 권한이 필요합니다. 브라우저 설정에서 카메라 접근을 허용해 주세요.",
      );
    }
  };

  // 다중 파일 스캔 처리
  const processFiles = useCallback(async (files: File[]) => {
    const imageFiles = files.filter(
      (f) => f.type.startsWith("image/") || /\.(png|jpg|jpeg|webp|gif|bmp)$/i.test(f.name),
    );
    if (imageFiles.length === 0) return;

    setIsScanning(true);
    const newResults: ScanResult[] = await Promise.all(
      imageFiles.map(async (file) => {
        const data = await scanQRFromFile(file);
        return {
          id: makeId(),
          fileName: file.name,
          data,
          otp: data ? parseOtpAuth(data) : null,
        };
      }),
    );
    setScanResults((prev) => [...newResults, ...prev]);
    setIsScanning(false);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      processFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    setIsGenerating(true);
    try {
      const dataUrl = await QRCode.toDataURL(inputText.trim(), {
        width: qrSize,
        margin: 2,
        color: { dark: "#292A47", light: "#ffffff" },
      });
      setQrDataUrl(dataUrl);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = "qrcode.png";
    a.click();
  };

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRemoveResult = (id: string) => {
    setScanResults((prev) => prev.filter((r) => r.id !== id));
  };

  const clearResults = () => setScanResults([]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const hasResults = scanResults.length > 0;

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      icon={QrCode as LucideIcon}
      title="QR 코드 도구"
      description="링크를 QR 코드로 생성하거나, QR 코드에서 정보를 추출합니다"
    >
      {/* Tabs */}
      <div className="mb-6 flex gap-0 border-b border-border">
        <button
          onClick={() => {
            setActiveTab("generator");
            stopCamera();
          }}
          className={`flex items-center gap-2 border-b-2 px-5 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "generator"
              ? "border-brand text-brand"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <Link2 size={15} />
          QR 생성기
        </button>
        <button
          onClick={() => {
            setActiveTab("scanner");
            stopCamera();
          }}
          className={`flex items-center gap-2 border-b-2 px-5 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "scanner"
              ? "border-brand text-brand"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <ScanLine size={15} />
          QR 스캐너
        </button>
      </div>

      {/* ── Generator Tab ── */}
      {activeTab === "generator" && (
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Input panel */}
          <div className="flex flex-1 flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">
                URL 또는 텍스트
              </label>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                placeholder="https://example.com"
                className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">크기</label>
              <select
                value={qrSize}
                onChange={(e) => setQrSize(Number(e.target.value))}
                className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value={128}>128px</option>
                <option value={256}>256px (기본)</option>
                <option value={512}>512px</option>
                <option value={1024}>1024px (고해상도)</option>
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!inputText.trim() || isGenerating}
              className="flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              <QrCode size={15} />
              {isGenerating ? "생성 중..." : "QR 코드 생성"}
            </button>
          </div>

          {/* Preview panel */}
          <div className="flex min-h-[280px] flex-1 flex-col items-center justify-center rounded-xl border border-border bg-bg-secondary p-8">
            {qrDataUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="생성된 QR 코드" className="rounded-lg" />
                <button
                  onClick={handleDownload}
                  className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-bg-primary px-4 py-2 text-sm text-text-primary transition-colors hover:border-brand hover:text-brand"
                >
                  <Download size={15} />
                  PNG 다운로드
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 text-text-secondary">
                <QrCode size={52} strokeWidth={1} />
                <p className="text-sm">URL을 입력하고 생성 버튼을 누르세요</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Scanner Tab ── */}
      {activeTab === "scanner" && (
        <div className="flex flex-col gap-5">
          {/* Mode selector */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setScanMode("upload");
                stopCamera();
              }}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                scanMode === "upload"
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-border text-text-secondary hover:border-brand hover:text-brand"
              }`}
            >
              <Upload size={15} />
              이미지 업로드
            </button>
            <button
              onClick={() => setScanMode("camera")}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                scanMode === "camera"
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-border text-text-secondary hover:border-brand hover:text-brand"
              }`}
            >
              <Camera size={15} />
              카메라로 촬영
            </button>
          </div>

          {/* ── Upload mode ── */}
          {scanMode === "upload" && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-8 py-12 transition-colors ${
                isDragOver
                  ? "border-brand bg-brand/5 text-brand"
                  : "border-border text-text-secondary hover:border-brand/60 hover:text-text-primary"
              }`}
            >
              {isScanning ? (
                <>
                  <RefreshCw size={32} className="animate-spin text-brand" />
                  <span className="text-sm font-medium text-brand">QR 코드 스캔 중...</span>
                </>
              ) : (
                <>
                  <Upload size={32} />
                  <div className="text-center">
                    <p className="text-sm font-medium text-text-primary">
                      QR 코드 이미지를 드래그하거나 클릭하여 업로드
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">
                      PNG · JPG · WebP 지원 · 여러 파일 한 번에 가능
                    </p>
                  </div>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileInputChange}
              />
            </div>
          )}

          {/* ── Camera mode ── */}
          {scanMode === "camera" && (
            <div className="flex flex-col items-center gap-4">
              <div className="relative flex aspect-video w-full max-w-sm items-center justify-center overflow-hidden rounded-xl border border-border bg-bg-secondary">
                <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
                <canvas ref={canvasRef} className="hidden" />
                {!isCameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg-secondary text-text-secondary">
                    <Camera size={40} strokeWidth={1} />
                    <p className="text-sm">카메라를 시작해 QR 코드를 스캔하세요</p>
                  </div>
                )}
                {isCameraActive && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="size-48 rounded-xl border-2 border-brand opacity-70" />
                  </div>
                )}
              </div>

              {cameraError && (
                <p className="text-xs text-red-400">{cameraError}</p>
              )}

              {!isCameraActive ? (
                <button
                  onClick={startCamera}
                  className="flex h-10 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
                >
                  <Camera size={15} />
                  카메라 시작
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="flex h-10 items-center gap-2 rounded-lg border border-border px-5 text-sm font-medium text-text-primary transition-colors hover:border-brand hover:text-brand"
                >
                  <X size={15} />
                  카메라 중지
                </button>
              )}
            </div>
          )}

          {/* ── Results ── */}
          {hasResults && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-text-secondary">
                  스캔 결과 ({scanResults.length}개)
                </p>
                <button
                  onClick={clearResults}
                  className="text-xs text-text-secondary transition-colors hover:text-red-400"
                >
                  전체 지우기
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {scanResults.map((result) => (
                  <ResultCard
                    key={result.id}
                    result={result}
                    copiedField={copiedField}
                    onCopy={handleCopy}
                    onRemove={handleRemoveResult}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </ToolPageLayout>
  );
}