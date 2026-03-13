"use client";

import { useState, useCallback } from "react";
import {
  ShieldCheck, Copy, Check, RefreshCw,
  Lock, Unlock, Key, ArrowRight, ArrowLeft,
} from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import {
  encryptAES, decryptAES,
  generateRsaKeyPair, encryptRSA, decryptRSA,
} from "@/lib/utils/cryptoUtils";
import type { RsaKeyPair } from "@/lib/utils/cryptoUtils";

type CryptoTab = "aes" | "rsa";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Encode / Decode", href: "/tools/encode-decode" },
];

/* ── 공용 복사 버튼 ── */
interface CopyBtnProps {
  value: string;
  id: string;
  copied: string | null;
  onCopy: (text: string, id: string) => void;
  label?: boolean;
}

function CopyBtn({ value, id, copied, onCopy, label = true }: CopyBtnProps) {
  const isCopied = copied === id;
  return (
    <button
      type="button"
      onClick={() => onCopy(value, id)}
      disabled={!value}
      className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand disabled:opacity-30"
    >
      {isCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
      {label && (isCopied ? "복사됨" : "복사")}
    </button>
  );
}

/* ── AES 탭 — 좌: 평문 / 우: 암호문 고정 레이아웃 ── */
function AesTab() {
  const [plaintext, setPlaintext]     = useState("");
  const [ciphertext, setCiphertext]   = useState("");
  const [password, setPassword]       = useState("");
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [encryptError, setEncryptError] = useState<string | null>(null);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [copied, setCopied]           = useState<string | null>(null);

  const handleCopy = useCallback(async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  }, []);

  // 평문 → 암호화 → 암호문(우)
  const handleEncrypt = useCallback(async () => {
    if (!plaintext.trim() || !password) return;
    setIsEncrypting(true);
    setEncryptError(null);
    try {
      setCiphertext(await encryptAES(plaintext, password));
    } catch {
      setEncryptError("암호화 중 오류가 발생했습니다.");
    } finally {
      setIsEncrypting(false);
    }
  }, [plaintext, password]);

  // 암호문 → 복호화 → 평문(좌)
  const handleDecrypt = useCallback(async () => {
    if (!ciphertext.trim() || !password) return;
    setIsDecrypting(true);
    setDecryptError(null);
    try {
      setPlaintext(await decryptAES(ciphertext.trim(), password));
    } catch {
      setDecryptError("복호화 실패: 비밀번호가 틀렸거나 잘못된 암호문입니다.");
    } finally {
      setIsDecrypting(false);
    }
  }, [ciphertext, password]);

  return (
    <div className="flex flex-col gap-5">
      {/* 안내 */}
      <div className="rounded-lg border border-border bg-bg-secondary px-4 py-3 text-xs text-text-secondary">
        <strong className="text-text-primary">AES-256-GCM</strong> — PBKDF2(SHA-256, 10만 회)로 비밀번호를 키로 변환합니다.
        암호화 결과는 솔트·IV가 포함된 Base64 문자열로 출력됩니다.
      </div>

      {/* 비밀번호 */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-text-secondary">비밀번호 (키)</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="암호화/복호화에 사용할 비밀번호..."
          className="rounded-xl border border-border bg-bg-secondary px-4 py-2.5 text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
        />
      </div>

      {/* 좌(평문) / 중앙(버튼) / 우(암호문) */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_auto_1fr]">

        {/* 좌: 평문 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-text-secondary">평문 (원본 텍스트)</label>
            <CopyBtn value={plaintext} id="plain" copied={copied} onCopy={handleCopy} />
          </div>
          <textarea
            value={plaintext}
            onChange={(e) => { setPlaintext(e.target.value); setDecryptError(null); }}
            placeholder="평문을 입력하세요..."
            rows={9}
            className="resize-none rounded-xl border border-border bg-bg-secondary p-4 font-mono text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
            spellCheck={false}
          />
          {decryptError && <p className="text-xs text-red-400">{decryptError}</p>}
        </div>

        {/* 중앙: 방향 버튼 */}
        <div className="flex flex-row items-center justify-center gap-2 pt-6 lg:flex-col lg:gap-3">
          <button
            type="button"
            onClick={handleEncrypt}
            disabled={!plaintext.trim() || !password || isEncrypting}
            title="평문 → 암호화 → 암호문"
            className="flex items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-xs font-semibold text-bg-primary transition-colors hover:bg-brand-hover disabled:opacity-40"
          >
            {isEncrypting
              ? <RefreshCw size={13} className="animate-spin" />
              : <><Lock size={13} /><ArrowRight size={13} /></>
            }
            <span className="hidden lg:inline">암호화</span>
          </button>
          <button
            type="button"
            onClick={handleDecrypt}
            disabled={!ciphertext.trim() || !password || isDecrypting}
            title="암호문 → 복호화 → 평문"
            className="flex items-center gap-1.5 rounded-xl border border-brand/40 bg-brand/10 px-3 py-2 text-xs font-semibold text-brand transition-colors hover:bg-brand/20 disabled:opacity-40"
          >
            {isDecrypting
              ? <RefreshCw size={13} className="animate-spin" />
              : <><ArrowLeft size={13} /><Unlock size={13} /></>
            }
            <span className="hidden lg:inline">복호화</span>
          </button>
        </div>

        {/* 우: 암호문 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-text-secondary">암호문 (Base64)</label>
            <CopyBtn value={ciphertext} id="cipher" copied={copied} onCopy={handleCopy} />
          </div>
          <textarea
            value={ciphertext}
            onChange={(e) => { setCiphertext(e.target.value); setEncryptError(null); }}
            placeholder="암호문이 여기에 표시됩니다. 직접 붙여넣기도 가능합니다..."
            rows={9}
            className="resize-none rounded-xl border border-border bg-bg-secondary p-4 font-mono text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
            spellCheck={false}
          />
          {encryptError && <p className="text-xs text-red-400">{encryptError}</p>}
        </div>
      </div>
    </div>
  );
}

/* ── RSA 탭 — 암호화 결과와 복호화 입력 상태 분리 ── */
function RsaTab() {
  const [keyPair, setKeyPair]             = useState<RsaKeyPair | null>(null);
  const [isGenerating, setIsGenerating]   = useState(false);
  const [plaintext, setPlaintext]         = useState("");
  const [encryptedResult, setEncryptedResult] = useState(""); // 암호화 결과 (읽기 전용)
  const [decryptInput, setDecryptInput]   = useState(""); // 복호화 입력 (별도 상태)
  const [decrypted, setDecrypted]         = useState("");
  const [isEncrypting, setIsEncrypting]   = useState(false);
  const [isDecrypting, setIsDecrypting]   = useState(false);
  const [encryptError, setEncryptError]   = useState<string | null>(null);
  const [decryptError, setDecryptError]   = useState<string | null>(null);
  const [copied, setCopied]               = useState<string | null>(null);

  const handleCopy = useCallback(async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  }, []);

  const handleGenerateKeys = useCallback(async () => {
    setIsGenerating(true);
    setKeyPair(null);
    setEncryptedResult("");
    setDecryptInput("");
    setDecrypted("");
    setEncryptError(null);
    setDecryptError(null);
    try {
      setKeyPair(await generateRsaKeyPair());
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const handleEncrypt = useCallback(async () => {
    if (!keyPair || !plaintext.trim()) return;
    setIsEncrypting(true);
    setEncryptError(null);
    setEncryptedResult("");
    try {
      const result = await encryptRSA(plaintext, keyPair.publicKey);
      setEncryptedResult(result);
    } catch {
      setEncryptError("암호화 실패: 텍스트가 너무 깁니다. (RSA는 최대 약 200바이트)");
    } finally {
      setIsEncrypting(false);
    }
  }, [keyPair, plaintext]);

  // 암호화 결과를 복호화 입력으로 복사하는 편의 버튼
  const handleUseEncryptedResult = useCallback(() => {
    setDecryptInput(encryptedResult);
    setDecryptError(null);
    setDecrypted("");
  }, [encryptedResult]);

  const handleDecrypt = useCallback(async () => {
    if (!keyPair || !decryptInput.trim()) return;
    setIsDecrypting(true);
    setDecryptError(null);
    setDecrypted("");
    try {
      setDecrypted(await decryptRSA(decryptInput.trim(), keyPair.privateKey));
    } catch {
      setDecryptError("복호화 실패: 암호문 또는 키를 확인하세요.");
    } finally {
      setIsDecrypting(false);
    }
  }, [keyPair, decryptInput]);

  return (
    <div className="flex flex-col gap-6">
      {/* 안내 */}
      <div className="rounded-lg border border-border bg-bg-secondary px-4 py-3 text-xs text-text-secondary">
        <strong className="text-text-primary">RSA-2048 OAEP (SHA-256)</strong> — 공개키로 암호화, 개인키로 복호화합니다.
        RSA는 최대 약 214바이트까지 암호화 가능합니다. 키는 브라우저에서만 생성되며 서버로 전송되지 않습니다.
      </div>

      {/* 키 생성 */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-text-primary">RSA 키 쌍</h3>
          <button
            type="button"
            onClick={handleGenerateKeys}
            disabled={isGenerating}
            className="flex items-center gap-2 rounded-lg border border-brand/40 bg-brand/10 px-4 py-1.5 text-sm font-medium text-brand transition-colors hover:bg-brand/20 disabled:opacity-50"
          >
            {isGenerating ? <RefreshCw size={13} className="animate-spin" /> : <Key size={13} />}
            {isGenerating ? "생성 중..." : "2048-bit 키 생성"}
          </button>
        </div>

        {keyPair && (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {([
              { label: "공개키 (Public Key)", value: keyPair.publicKey, id: "pub" },
              { label: "개인키 (Private Key)", value: keyPair.privateKey, id: "priv" },
            ] as const).map(({ label, value, id }) => (
              <div key={id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text-secondary">{label}</label>
                  <CopyBtn value={value} id={id} copied={copied} onCopy={handleCopy} />
                </div>
                <textarea
                  readOnly
                  value={value}
                  rows={5}
                  className="resize-none rounded-xl border border-border bg-bg-primary p-3 font-mono text-xs text-text-secondary"
                  spellCheck={false}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {keyPair && (
        <>
          <div className="border-t border-border" />

          {/* 암호화 섹션 */}
          <div className="flex flex-col gap-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Lock size={14} className="text-brand" />
              공개키로 암호화
            </h3>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-text-secondary">평문 (최대 ~200 bytes)</label>
                <textarea
                  value={plaintext}
                  onChange={(e) => setPlaintext(e.target.value)}
                  placeholder="암호화할 텍스트..."
                  rows={4}
                  className="resize-none rounded-xl border border-border bg-bg-secondary p-4 font-mono text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={handleEncrypt}
                  disabled={!plaintext.trim() || isEncrypting}
                  className="self-start flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-bg-primary transition-colors hover:bg-brand-hover disabled:opacity-50"
                >
                  {isEncrypting && <RefreshCw size={13} className="animate-spin" />}
                  <Lock size={13} />
                  암호화
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text-secondary">암호문 (Base64)</label>
                  <div className="flex items-center gap-1.5">
                    {encryptedResult && (
                      <button
                        type="button"
                        onClick={handleUseEncryptedResult}
                        className="rounded border border-border px-2 py-1 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
                        title="이 암호문을 아래 복호화 입력으로 사용"
                      >
                        복호화에 사용
                      </button>
                    )}
                    <CopyBtn value={encryptedResult} id="rsa-enc" copied={copied} onCopy={handleCopy} />
                  </div>
                </div>
                <div className={`min-h-[104px] rounded-xl border p-4 font-mono text-xs ${encryptError ? "border-red-500/50 bg-bg-primary" : "border-border bg-bg-primary"}`}>
                  {encryptError
                    ? <p className="text-red-400">{encryptError}</p>
                    : <p className="break-all text-text-primary">{encryptedResult || <span className="text-text-secondary/40">암호화 결과...</span>}</p>
                  }
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* 복호화 섹션 */}
          <div className="flex flex-col gap-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Unlock size={14} className="text-brand" />
              개인키로 복호화
            </h3>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-text-secondary">암호문 (Base64)</label>
                <textarea
                  value={decryptInput}
                  onChange={(e) => { setDecryptInput(e.target.value); setDecryptError(null); }}
                  placeholder="복호화할 Base64 암호문 붙여넣기..."
                  rows={4}
                  className="resize-none rounded-xl border border-border bg-bg-secondary p-4 font-mono text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={handleDecrypt}
                  disabled={!decryptInput.trim() || isDecrypting}
                  className="self-start flex items-center gap-2 rounded-lg border border-brand/40 bg-brand/10 px-4 py-2 text-sm font-semibold text-brand transition-colors hover:bg-brand/20 disabled:opacity-50"
                >
                  {isDecrypting && <RefreshCw size={13} className="animate-spin" />}
                  <Unlock size={13} />
                  복호화
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text-secondary">복호화된 텍스트</label>
                  <CopyBtn value={decrypted} id="rsa-dec" copied={copied} onCopy={handleCopy} />
                </div>
                <div className={`min-h-[104px] rounded-xl border p-4 font-mono text-sm ${decryptError ? "border-red-500/50 bg-bg-primary" : "border-border bg-bg-primary"}`}>
                  {decryptError
                    ? <p className="text-xs text-red-400">{decryptError}</p>
                    : <p className="break-all text-text-primary">{decrypted || <span className="text-text-secondary/40">복호화 결과...</span>}</p>
                  }
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ── 메인 페이지 ── */
const TAB_CONFIG: { id: CryptoTab; label: string; icon: typeof Key }[] = [
  { id: "aes", label: "AES (대칭)",   icon: Lock },
  { id: "rsa", label: "RSA (비대칭)", icon: Key  },
];

export default function CryptoToolPage() {
  const [tab, setTab] = useState<CryptoTab>("aes");

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="암호화 / 복호화"
      description="AES-256 대칭 암호화 및 RSA-2048 비대칭 암호화를 브라우저에서 직접 테스트합니다."
      icon={ShieldCheck}
    >
      {/* 탭 바 */}
      <div className="mb-6 flex gap-1 rounded-xl border border-border bg-bg-secondary p-1 w-fit">
        {TAB_CONFIG.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150 ${
              tab === id
                ? "bg-brand text-bg-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {tab === "aes" && <AesTab />}
      {tab === "rsa" && <RsaTab />}
    </ToolPageLayout>
  );
}