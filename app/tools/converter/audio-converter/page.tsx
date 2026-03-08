"use client";

import { useState, useRef, useCallback } from "react";
import { Music, Upload, Download, X, Play, Pause, RefreshCw } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Converter", href: "/tools/converter" },
];

type SampleRate = 44100 | 48000 | 22050 | 16000;
type Channels   = 1 | 2;

interface AudioInfo {
  name: string;
  size: string;
  duration: string;
  sampleRate: number;
  channels: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ── 순수 JS WAV 인코더 ────────────────────────────────────────────

function encodeWAV(
  audioBuffer: AudioBuffer,
  targetSampleRate: SampleRate,
  targetChannels: Channels,
): ArrayBuffer {
  const numChannels = Math.min(audioBuffer.numberOfChannels, targetChannels);
  const srcRate     = audioBuffer.sampleRate;
  const ratio       = srcRate / targetSampleRate;
  const srcLength   = audioBuffer.length;
  const dstLength   = Math.round(srcLength / ratio);
  const bitsPerSample  = 16;
  const bytesPerSample = 2;
  const dataSize    = numChannels * dstLength * bytesPerSample;

  const ab   = new ArrayBuffer(44 + dataSize);
  const view = new DataView(ab);

  const write4 = (off: number, s: string) => {
    for (let i = 0; i < 4; i++) view.setUint8(off + i, s.charCodeAt(i));
  };

  write4(0,  "RIFF"); view.setUint32(4,  36 + dataSize, true);
  write4(8,  "WAVE"); write4(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);                                              // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, targetSampleRate, true);
  view.setUint32(28, targetSampleRate * numChannels * bytesPerSample, true);
  view.setUint16(32, numChannels * bytesPerSample, true);
  view.setUint16(34, bitsPerSample, true);
  write4(36, "data"); view.setUint32(40, dataSize, true);

  // 선형 리샘플링 + 인터리브
  let offset = 44;
  for (let i = 0; i < dstLength; i++) {
    const srcIdx = Math.min(Math.round(i * ratio), srcLength - 1);
    for (let ch = 0; ch < numChannels; ch++) {
      const s = Math.max(-1, Math.min(1, audioBuffer.getChannelData(ch)[srcIdx]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }

  return ab;
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────

export default function AudioConverterPage() {
  const [file, setFile]           = useState<File | null>(null);
  const [audioInfo, setAudioInfo] = useState<AudioInfo | null>(null);
  const [isDecoding, setIsDecoding] = useState(false);
  const [isEncoding, setIsEncoding] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isPlaying, setIsPlaying]   = useState(false);
  const [targetSampleRate, setTargetSampleRate] = useState<SampleRate>(44100);
  const [targetChannels, setTargetChannels]     = useState<Channels>(2);

  const audioRef    = useRef<HTMLAudioElement | null>(null);
  const previewUrl  = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (f: File) => {
    if (!f.type.startsWith("audio/")) {
      setError("오디오 파일만 지원합니다 (MP3, WAV, OGG, AAC, FLAC 등)");
      return;
    }
    setFile(f);
    setError(null);
    setAudioInfo(null);
    setIsDecoding(true);

    // 미리보기 URL
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = URL.createObjectURL(f);
    if (audioRef.current) {
      audioRef.current.src = previewUrl.current;
      audioRef.current.onloadedmetadata = () => {
        const a = audioRef.current!;
        setAudioInfo({
          name: f.name,
          size: formatBytes(f.size),
          duration: formatDuration(a.duration),
          sampleRate: 0,
          channels: 0,
        });
      };
    }

    // AudioContext로 상세 정보 추출
    try {
      const arrBuf  = await f.arrayBuffer();
      const ctx     = new AudioContext();
      const decoded = await ctx.decodeAudioData(arrBuf);
      setAudioInfo({
        name: f.name,
        size: formatBytes(f.size),
        duration: formatDuration(decoded.duration),
        sampleRate: decoded.sampleRate,
        channels: decoded.numberOfChannels,
      });
      await ctx.close();
    } catch {
      setError("오디오 파일 분석 실패. 지원하지 않는 포맷일 수 있습니다.");
    } finally {
      setIsDecoding(false);
    }
  }, []);

  const handleConvert = useCallback(async () => {
    if (!file) return;
    setIsEncoding(true);
    setError(null);
    try {
      const arrBuf  = await file.arrayBuffer();
      const ctx     = new AudioContext();
      const decoded = await ctx.decodeAudioData(arrBuf);
      await ctx.close();

      const wavBuf  = encodeWAV(decoded, targetSampleRate, targetChannels);
      const blob    = new Blob([wavBuf], { type: "audio/wav" });
      const outName = file.name.replace(/\.[^.]+$/, "") + `_${targetSampleRate}hz.wav`;
      const a       = document.createElement("a");
      a.href        = URL.createObjectURL(blob);
      a.download    = outName;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      setError("변환 중 오류가 발생했습니다.");
    } finally {
      setIsEncoding(false);
    }
  }, [file, targetSampleRate, targetChannels]);

  const handleReset = () => {
    setFile(null);
    setAudioInfo(null);
    setError(null);
    setIsPlaying(false);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
    if (previewUrl.current) { URL.revokeObjectURL(previewUrl.current); previewUrl.current = null; }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else           { audioRef.current.play();  setIsPlaying(true);  }
  };

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="오디오 변환기"
      description="MP3·WAV·OGG·AAC 등 브라우저가 지원하는 오디오를 WAV로 변환합니다. (완전 오프라인)"
      icon={Music}
    >
      <div className="flex flex-col gap-6">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <audio
          ref={audioRef}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />

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
            <Upload size={32} aria-hidden="true" />
            <div className="text-center">
              <p className="text-sm font-medium">오디오 파일을 드래그하거나 클릭하여 업로드</p>
              <p className="mt-1 text-xs text-text-secondary">MP3, WAV, OGG, AAC, FLAC, M4A 지원</p>
            </div>
            <input ref={fileInputRef} type="file" accept="audio/*" className="sr-only"
              onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
            />
          </div>
        )}

        {/* 파일 정보 */}
        {file && (
          <div className="flex flex-col gap-5">
            <div className="flex items-start justify-between rounded-xl border border-border bg-bg-secondary p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-brand/10">
                  <Music size={18} className="text-brand" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{audioInfo?.name ?? file.name}</p>
                  <p className="text-xs text-text-secondary">
                    {isDecoding ? "분석 중..." : audioInfo
                      ? `${audioInfo.size} · ${audioInfo.duration} · ${audioInfo.sampleRate > 0 ? `${audioInfo.sampleRate}Hz · ${audioInfo.channels}ch` : ""}`
                      : file.name
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {previewUrl.current && (
                  <button type="button" onClick={togglePlay}
                    className="flex size-8 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
                    aria-label={isPlaying ? "일시정지" : "재생"}>
                    {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                )}
                <button type="button" onClick={handleReset}
                  className="text-text-secondary transition-colors hover:text-text-primary" aria-label="초기화">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* 변환 설정 */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold text-text-secondary">샘플레이트 (Hz)</p>
                <div className="flex flex-wrap gap-2">
                  {([44100, 48000, 22050, 16000] as SampleRate[]).map((r) => (
                    <button key={r} type="button" onClick={() => setTargetSampleRate(r)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        targetSampleRate === r ? "border-brand bg-brand/10 text-brand" : "border-border text-text-secondary hover:border-brand/40 hover:text-text-primary"
                      }`}>
                      {r.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-text-secondary">채널</p>
                <div className="flex gap-2">
                  {([1, 2] as Channels[]).map((ch) => (
                    <button key={ch} type="button" onClick={() => setTargetChannels(ch)}
                      className={`rounded-lg border px-4 py-1.5 text-xs font-medium transition-colors ${
                        targetChannels === ch ? "border-brand bg-brand/10 text-brand" : "border-border text-text-secondary hover:border-brand/40 hover:text-text-primary"
                      }`}>
                      {ch === 1 ? "Mono (1ch)" : "Stereo (2ch)"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button type="button" onClick={handleConvert} disabled={isEncoding || isDecoding}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-50">
              {isEncoding ? <><RefreshCw size={15} className="animate-spin" />변환 중...</> : <><Download size={15} />WAV로 변환 및 다운로드</>}
            </button>
          </div>
        )}

        {/* 안내 */}
        <div className="rounded-lg border border-border bg-bg-secondary px-4 py-3 text-xs text-text-secondary">
          <strong className="text-text-primary">Web Audio API</strong> 기반 순수 브라우저 처리.
          WAV(16-bit PCM) 출력, 선형 리샘플링 적용. 서버 전송 없이 완전 오프라인으로 동작합니다.
        </div>
      </div>
    </ToolPageLayout>
  );
}