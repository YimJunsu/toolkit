"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { FileKey2, Copy, Check, AlertTriangle, Clock, Share2 } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { useClipboard } from "@/hooks/useClipboard";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Encode / Decode", href: "/tools/encode-decode" },
];

interface JwtParts {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
}

function base64UrlDecode(str: string): string {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4;
  const padded2 = pad ? padded + "=".repeat(4 - pad) : padded;
  return decodeURIComponent(
    atob(padded2)
      .split("")
      .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("")
  );
}

function parseJwt(token: string): JwtParts {
  const parts = token.trim().split(".");
  if (parts.length !== 3) throw new Error("유효한 JWT 형식이 아닙니다. (header.payload.signature)");
  return {
    header: JSON.parse(base64UrlDecode(parts[0])),
    payload: JSON.parse(base64UrlDecode(parts[1])),
    signature: parts[2],
  };
}

function formatTimestamp(value: unknown): string | null {
  if (typeof value !== "number") return null;
  return new Date(value * 1000).toLocaleString("ko-KR", { timeZoneName: "short" });
}

function isExpired(exp: unknown): boolean {
  if (typeof exp !== "number") return false;
  return Date.now() / 1000 > exp;
}

/** 남은 초 계산 (음수면 이미 만료) */
function remainingSeconds(exp: unknown): number | null {
  if (typeof exp !== "number") return null;
  return Math.floor(exp - Date.now() / 1000);
}

function formatDuration(secs: number): string {
  if (secs <= 0) return "만료됨";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}시간 ${m}분 ${s}초 남음`;
  if (m > 0) return `${m}분 ${s}초 남음`;
  return `${s}초 남음`;
}

/* ── JWT 파트 색상 ── */
const PART_COLORS = {
  header:    "text-cyan-400",
  payload:   "text-violet-400",
  signature: "text-orange-400",
};

/* ── JSON 출력 패널 ── */
interface JsonPanelProps {
  label: string;
  labelColor: string;
  data: Record<string, unknown>;
  copyId: string;
  copied: string | null;
  onCopy: (text: string, id: string) => void;
}

function JsonPanel({ label, labelColor, data, copyId, copied, onCopy }: JsonPanelProps) {
  const text = JSON.stringify(data, null, 2);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold ${labelColor}`}>{label}</span>
        <button
          type="button"
          onClick={() => onCopy(text, copyId)}
          className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
        >
          {copied === copyId ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          {copied === copyId ? "복사됨" : "복사"}
        </button>
      </div>
      <pre className={`overflow-x-auto rounded-xl border bg-bg-secondary p-4 font-mono text-xs leading-relaxed text-text-primary border-l-2 ${
        labelColor === PART_COLORS.header
          ? "border-cyan-400/40 border-border"
          : labelColor === PART_COLORS.payload
          ? "border-violet-400/40 border-border"
          : "border-orange-400/40 border-border"
      }`}
        style={{ borderLeftColor: "currentColor" }}
      >
        {text}
      </pre>
    </div>
  );
}

function MetaRow({ label, value, highlight }: { label: string; value: string; highlight?: "red" | "green" }) {
  return (
    <div className="flex items-start gap-3 border-b border-border py-2.5 last:border-b-0">
      <span className="w-28 shrink-0 text-xs font-semibold text-text-secondary">{label}</span>
      <span className={`font-mono text-xs ${highlight === "red" ? "text-red-400" : highlight === "green" ? "text-emerald-400" : "text-text-primary"}`}>
        {value}
      </span>
    </div>
  );
}

/* ── 만료 카운트다운 ── */
function ExpiryCountdown({ exp }: { exp: number }) {
  const [remaining, setRemaining] = useState(() => remainingSeconds(exp) ?? 0);

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(Math.floor(exp - Date.now() / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [exp]);

  const expired = remaining <= 0;
  const totalLife = exp - (Date.now() / 1000 - (exp - remaining));

  /* 비율 계산 (iat 없으면 전체 대비 남은 비율로 추정) */
  const pct = expired ? 0 : Math.min(100, (remaining / Math.max(remaining, 3600)) * 100);

  return (
    <div className={`flex flex-col gap-2 rounded-lg border p-3 ${
      expired
        ? "border-red-500/40 bg-red-500/10"
        : remaining < 300
        ? "border-yellow-500/40 bg-yellow-500/10"
        : "border-emerald-500/40 bg-emerald-500/10"
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={13} className={expired ? "text-red-400" : remaining < 300 ? "text-yellow-400" : "text-emerald-400"} />
          <span className={`text-xs font-semibold ${expired ? "text-red-400" : remaining < 300 ? "text-yellow-400" : "text-emerald-400"}`}>
            {expired ? "토큰이 만료되었습니다" : "토큰 유효"}
          </span>
        </div>
        <span className={`font-mono text-xs font-bold ${expired ? "text-red-400" : remaining < 300 ? "text-yellow-400" : "text-emerald-400"}`}>
          {formatDuration(remaining)}
        </span>
      </div>
      {/* 프로그레스 바 */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-primary/50">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            expired ? "bg-red-400" : remaining < 300 ? "bg-yellow-400" : "bg-emerald-400"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ── 색상 구분 토큰 표시 ── */
function ColoredToken({ token }: { token: string }) {
  const parts = token.trim().split(".");
  if (parts.length !== 3) return <span className="break-all font-mono text-xs text-text-secondary">{token}</span>;
  return (
    <span className="break-all font-mono text-xs leading-relaxed">
      <span className={PART_COLORS.header}>{parts[0]}</span>
      <span className="text-text-secondary/40">.</span>
      <span className={PART_COLORS.payload}>{parts[1]}</span>
      <span className="text-text-secondary/40">.</span>
      <span className={PART_COLORS.signature}>{parts[2]}</span>
    </span>
  );
}

export default function JwtDecoderPage() {
  const [token, setToken] = useState("");
  const { copied, copy: handleCopy } = useClipboard();

  const result = useMemo<{ data: JwtParts | null; error: string | null }>(() => {
    if (!token.trim()) return { data: null, error: null };
    try {
      return { data: parseJwt(token), error: null };
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : "파싱 중 오류가 발생했습니다." };
    }
  }, [token]);

  const { data, error } = result;
  const exp = data?.payload?.exp;
  const iat = data?.payload?.iat;
  const nbf = data?.payload?.nbf;

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="JWT 디코더"
      description="JWT 토큰의 Header · Payload · Signature를 브라우저에서 즉시 디코딩합니다. 서버 전송 없이 로컬 처리."
      icon={FileKey2}
    >
      <div className="flex flex-col gap-6">

        {/* 안내 */}
        <div className="rounded-lg border border-border bg-bg-secondary px-4 py-3 text-xs text-text-secondary">
          <strong className="text-text-primary">JWT (JSON Web Token)</strong> —
          <span className={`font-semibold ${PART_COLORS.header}`}> header</span>
          <span className="text-text-secondary/50">.</span>
          <span className={`font-semibold ${PART_COLORS.payload}`}>payload</span>
          <span className="text-text-secondary/50">.</span>
          <span className={`font-semibold ${PART_COLORS.signature}`}>signature</span>
          {" "}세 부분으로 구성된 Base64URL 인코딩 토큰입니다.
        </div>

        {/* 토큰 입력 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-text-secondary">JWT 토큰</label>
            <button
              type="button"
              onClick={() => setToken("")}
              disabled={!token}
              className="text-xs text-text-secondary transition-colors hover:text-text-primary disabled:opacity-30"
            >
              지우기
            </button>
          </div>
          <textarea
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0..."
            rows={4}
            className={`w-full resize-none rounded-xl border p-4 font-mono text-sm text-text-primary placeholder-text-secondary/50 focus:outline-none transition-colors ${
              error ? "border-red-500/50 bg-bg-secondary focus:border-red-500" : "border-border bg-bg-secondary focus:border-brand"
            }`}
            spellCheck={false}
          />
          {error && (
            <p className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertTriangle size={12} />
              {error}
            </p>
          )}
        </div>

        {/* 결과 */}
        {data && (
          <>
            {/* 색상 구분 토큰 */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-text-secondary">파트 구분</span>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`flex items-center gap-1 ${PART_COLORS.header}`}>● Header</span>
                  <span className={`flex items-center gap-1 ${PART_COLORS.payload}`}>● Payload</span>
                  <span className={`flex items-center gap-1 ${PART_COLORS.signature}`}>● Signature</span>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-bg-secondary p-4 leading-loose">
                <ColoredToken token={token} />
              </div>
            </div>

            {/* 만료 카운트다운 */}
            {typeof exp === "number" && <ExpiryCountdown exp={exp} />}

            {/* Header / Payload */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <JsonPanel label="Header" labelColor={PART_COLORS.header}
                data={data.header} copyId="header" copied={copied} onCopy={handleCopy} />
              <JsonPanel label="Payload" labelColor={PART_COLORS.payload}
                data={data.payload} copyId="payload" copied={copied} onCopy={handleCopy} />
            </div>

            {/* Signature */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${PART_COLORS.signature}`}>Signature (원본 Base64URL)</span>
                <button type="button" onClick={() => handleCopy(data.signature, "sig")}
                  className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand">
                  {copied === "sig" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copied === "sig" ? "복사됨" : "복사"}
                </button>
              </div>
              <div className="rounded-xl border border-border bg-bg-secondary px-4 py-3 font-mono text-xs break-all"
                style={{ borderLeftColor: "rgb(251 146 60 / 0.6)", borderLeftWidth: 2 }}>
                <span className={PART_COLORS.signature}>{data.signature}</span>
              </div>
            </div>

            {/* 시간 메타 */}
            {(iat ?? exp ?? nbf) !== undefined && (
              <div className="flex flex-col gap-1">
                <h3 className="text-xs font-semibold text-text-secondary mb-1">시간 정보</h3>
                <div className="rounded-xl border border-border overflow-hidden">
                  {typeof iat === "number" && (
                    <MetaRow label="발급 (iat)" value={`${iat}  →  ${formatTimestamp(iat)}`} />
                  )}
                  {typeof nbf === "number" && (
                    <MetaRow label="유효 시작 (nbf)" value={`${nbf}  →  ${formatTimestamp(nbf)}`} />
                  )}
                  {typeof exp === "number" && (
                    <MetaRow
                      label="만료 (exp)"
                      value={`${exp}  →  ${formatTimestamp(exp)}`}
                      highlight={isExpired(exp) ? "red" : "green"}
                    />
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ToolPageLayout>
  );
}
