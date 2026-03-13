"use client";

import { useState, useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import { Wifi, Copy, Check, RefreshCw, MapPin, Globe, Server } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "기타", href: "/tools/etc" },
];

interface IpInfo {
  ip: string;
  city: string;
  region: string;
  country_name: string;
  org: string;
  timezone: string;
  latitude: number;
  longitude: number;
}

function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-bg-secondary px-4 py-3">
      {Icon && <Icon size={15} className="mt-0.5 shrink-0 text-brand" />}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-text-secondary">{label}</p>
        <p className="mt-0.5 truncate font-mono text-sm text-text-primary">{value}</p>
      </div>
    </div>
  );
}

export default function IpLookupPage() {
  const [ipInfo, setIpInfo] = useState<IpInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchIpInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("https://ipapi.co/json/");
      if (!res.ok) throw new Error("조회 실패");
      const data: IpInfo = await res.json();
      setIpInfo(data);
    } catch {
      setError("IP 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIpInfo();
  }, []);

  const handleCopy = async () => {
    if (!ipInfo?.ip) return;
    await navigator.clipboard.writeText(ipInfo.ip);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="공인 IP 조회"
      description="현재 접속 중인 공인 IP 주소 및 위치 정보를 즉시 확인합니다."
      icon={Wifi}
    >
      <div className="flex flex-col gap-6">

        {/* IP 주소 강조 카드 */}
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-bg-secondary py-10">
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <RefreshCw size={24} className="animate-spin text-brand" />
              <p className="text-sm text-text-secondary">IP 정보를 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm text-red-400">{error}</p>
              <button
                onClick={fetchIpInfo}
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-muted"
              >
                <RefreshCw size={14} />
                다시 시도
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
                내 공인 IP 주소
              </p>
              <p className="font-mono text-4xl font-bold tabular-nums text-text-primary">
                {ipInfo?.ip}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-muted"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  {copied ? "복사됨" : "복사"}
                </button>
                <button
                  onClick={fetchIpInfo}
                  className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-muted"
                >
                  <RefreshCw size={14} />
                  새로고침
                </button>
              </div>
            </>
          )}
        </div>

        {/* 상세 정보 */}
        {!loading && !error && ipInfo && (
          <>
            <h2 className="text-sm font-semibold text-text-primary">상세 정보</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoRow label="도시" value={ipInfo.city || "알 수 없음"} icon={MapPin} />
              <InfoRow label="지역" value={ipInfo.region || "알 수 없음"} icon={MapPin} />
              <InfoRow label="국가" value={ipInfo.country_name || "알 수 없음"} icon={Globe} />
              <InfoRow label="ISP / 조직" value={ipInfo.org || "알 수 없음"} icon={Server} />
              <InfoRow label="시간대" value={ipInfo.timezone || "알 수 없음"} icon={Globe} />
              <InfoRow
                label="좌표"
                value={`${ipInfo.latitude}, ${ipInfo.longitude}`}
                icon={MapPin}
              />
            </div>

            <div className="rounded-xl border border-border bg-bg-secondary px-4 py-3 text-xs text-text-secondary">
              이 정보는 <strong className="text-text-primary">ipapi.co</strong> 공개 API를 통해 조회됩니다.
              실제 위치와 다소 차이가 있을 수 있으며, VPN 사용 시 VPN 서버의 IP가 표시됩니다.
            </div>
          </>
        )}
      </div>
    </ToolPageLayout>
  );
}