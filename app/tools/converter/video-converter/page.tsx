"use client";

import { useState, useRef, useCallback } from "react";
import { Film, Upload, Download, X, RefreshCw } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Converter", href: "/tools/converter" },
];

type ScalePreset = "original" | "720p" | "480p" | "360p";

const SCALE_MAP: Record<ScalePreset, number | null> = {
  original: null,
  "720p":   720,
  "480p":   480,
  "360p":   360,
};

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDuration(s: number): string {
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

export default function VideoConverterPage() {
  const [file, setFile]           = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [scale, setScale]         = useState<ScalePreset>("720p");
  const [bitrate, setBitrate]     = useState(2500); // kbps
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [error, setError]         = useState<string | null>(null);

  const fileInputRef  = useRef<HTMLInputElement>(null);
  const videoRef      = useRef<HTMLVideoElement>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("video/")) { setError("비디오 파일만 지원합니다."); return; }
    setFile(f);
    setError(null);
    setProgress(0);
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = URL.createObjectURL(f);
    if (videoRef.current) videoRef.current.src = previewUrlRef.current;
  }, []);

  const handleConvert = useCallback(async () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!file || !video || !canvas) return;

    setIsConverting(true);
    setProgress(0);
    setError(null);

    try {
      await new Promise<void>((res) => {
        if (video.readyState >= 1) { res(); return; }
        video.onloadedmetadata = () => res();
      });

      const targetH = SCALE_MAP[scale];
      const vW      = video.videoWidth;
      const vH      = video.videoHeight;
      const outH    = targetH && vH > targetH ? targetH : vH;
      const outW    = targetH && vH > targetH ? Math.round(vW * (targetH / vH)) : vW;

      canvas.width  = outW;
      canvas.height = outH;
      const ctx     = canvas.getContext("2d")!;

      // MediaRecorder — WebM VP8
      const stream     = canvas.captureStream(30);
      const mimeType   = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";
      const recorder   = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: bitrate * 1000,
      });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

      const done = new Promise<void>((res) => { recorder.onstop = () => res(); });
      recorder.start(100);

      // 비디오를 실시간으로 캔버스에 그리며 진행
      video.currentTime = 0;
      await new Promise<void>((res) => { video.onseeked = () => res(); });
      video.muted = true;
      video.playbackRate = 8; // 최대 배속으로 처리
      video.play();

      const duration = video.duration;
      await new Promise<void>((res, rej) => {
        const draw = () => {
          if (video.ended || video.currentTime >= duration) { res(); return; }
          ctx.drawImage(video, 0, 0, outW, outH);
          setProgress(Math.round((video.currentTime / duration) * 100));
          requestAnimationFrame(draw);
        };
        video.onended = () => res();
        video.onerror = () => rej(new Error("비디오 처리 오류"));
        requestAnimationFrame(draw);
      });

      recorder.stop();
      await done;

      const blob    = new Blob(chunks, { type: "video/webm" });
      const outName = file.name.replace(/\.[^.]+$/, "") + `_${scale}.webm`;
      const a       = document.createElement("a");
      a.href        = URL.createObjectURL(blob);
      a.download    = outName;
      a.click();
      URL.revokeObjectURL(a.href);
      setProgress(100);
    } catch (e) {
      setError(e instanceof Error ? e.message : "변환 중 오류가 발생했습니다.");
    } finally {
      setIsConverting(false);
      if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0; }
    }
  }, [file, scale, bitrate]);

  const handleReset = () => {
    setFile(null); setProgress(0); setError(null);
    if (videoRef.current) { videoRef.current.src = ""; videoRef.current.pause(); }
    if (previewUrlRef.current) { URL.revokeObjectURL(previewUrlRef.current); previewUrlRef.current = null; }
  };

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="비디오 압축기"
      description="MP4·WebM 등 비디오를 해상도·비트레이트 조정하여 WebM으로 압축합니다. (Canvas + MediaRecorder)"
      icon={Film}
    >
      <div className="flex flex-col gap-6">
        {/* 숨김 요소 */}
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video ref={videoRef} className="hidden" playsInline />
        <canvas ref={canvasRef} className="hidden" />

        {/* 업로드 */}
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
              <p className="text-sm font-medium">비디오 파일을 드래그하거나 클릭하여 업로드</p>
              <p className="mt-1 text-xs text-text-secondary">MP4, WebM, MOV 지원 · 권장 5분 이하</p>
            </div>
            <input ref={fileInputRef} type="file" accept="video/*" className="sr-only"
              onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
            />
          </div>
        )}

        {/* 파일 정보 + 설정 */}
        {file && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between rounded-xl border border-border bg-bg-secondary px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-text-primary">{file.name}</p>
                <p className="text-xs text-text-secondary">
                  {formatBytes(file.size)}
                  {videoRef.current?.duration ? ` · ${formatDuration(videoRef.current.duration)}` : ""}
                </p>
              </div>
              <button type="button" onClick={handleReset} aria-label="초기화"
                className="text-text-secondary transition-colors hover:text-text-primary">
                <X size={18} />
              </button>
            </div>

            {/* 설정 */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold text-text-secondary">출력 해상도</p>
                <div className="flex flex-wrap gap-2">
                  {(["original", "720p", "480p", "360p"] as ScalePreset[]).map((s) => (
                    <button key={s} type="button" onClick={() => setScale(s)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        scale === s ? "border-brand bg-brand/10 text-brand" : "border-border text-text-secondary hover:border-brand/40 hover:text-text-primary"
                      }`}>
                      {s === "original" ? "원본 유지" : s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-text-secondary">비트레이트</p>
                  <span className="font-mono text-xs font-semibold text-text-primary">{bitrate} kbps</span>
                </div>
                <input type="range" min={500} max={8000} step={500} value={bitrate}
                  onChange={(e) => setBitrate(parseInt(e.target.value))}
                  className="w-full accent-brand" />
                <div className="mt-1 flex justify-between text-xs text-text-secondary">
                  <span>500 (작은 용량)</span><span>8000 (고화질)</span>
                </div>
              </div>
            </div>

            {/* 경고 */}
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-400">
              변환은 실제 재생 시간만큼 소요됩니다. 출력 포맷은 WebM(VP8/VP9)입니다.
            </div>

            {/* 프로그레스 */}
            {isConverting && (
              <div className="flex flex-col gap-1">
                <div className="h-2 w-full overflow-hidden rounded-full bg-bg-secondary">
                  <div className="h-full rounded-full bg-brand transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-right text-xs text-text-secondary">{progress}%</p>
              </div>
            )}

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button type="button" onClick={handleConvert} disabled={isConverting}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-50">
              {isConverting
                ? <><RefreshCw size={15} className="animate-spin" />변환 중 ({progress}%)...</>
                : <><Download size={15} />WebM으로 압축 변환</>}
            </button>
          </div>
        )}

        <div className="rounded-lg border border-border bg-bg-secondary px-4 py-3 text-xs text-text-secondary">
          <strong className="text-text-primary">Canvas + MediaRecorder API</strong> 기반 브라우저 처리.
          출력은 WebM 컨테이너(VP8/VP9 코덱)입니다. 긴 영상은 처리 시간이 오래 걸릴 수 있습니다.
        </div>
      </div>
    </ToolPageLayout>
  );
}