import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "개인정보 처리방침",
  description: "tool.kit 개인정보 처리방침을 안내합니다.",
};

const LAST_UPDATED = "2026년 3월 8일";

export default function PrivacyPage() {
  return (
    <div className="w-full px-4 py-12 md:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">

        {/* 헤더 */}
        <div className="mb-10">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            ← 홈으로
          </Link>
          <h1 className="text-3xl font-bold text-text-primary">개인정보 처리방침</h1>
          <p className="mt-2 text-sm text-text-secondary">
            최종 업데이트: {LAST_UPDATED}
          </p>
        </div>

        {/* 개요 */}
        <div className="mb-10 rounded-xl border border-border bg-bg-secondary p-5 text-sm leading-relaxed text-text-secondary">
          tool.kit(이하 &quot;서비스&quot;)은 이용자의 개인정보를 소중히 여기며,
          「개인정보 보호법」 등 관련 법령을 준수합니다. 본 방침을 통해 서비스가 어떤
          개인정보를 수집하고 어떻게 이용하는지 안내합니다.
        </div>

        {/* 본문 */}
        <div className="flex flex-col gap-10">

          <PrivacySection title="1. 수집하는 개인정보 항목">
            <p className="mb-3">
              서비스는 기본적으로 별도의 회원가입 없이 이용 가능하며, 아래 최소한의 정보가
              자동으로 수집될 수 있습니다.
            </p>
            <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed text-text-secondary">
              <li>접속 IP 주소, 브라우저 종류 및 버전</li>
              <li>방문 일시 및 서비스 이용 기록</li>
              <li>쿠키 (브라우저 설정으로 거부 가능)</li>
            </ul>
          </PrivacySection>

          <PrivacySection title="2. 개인정보 수집 및 이용 목적">
            <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed text-text-secondary">
              <li>서비스 운영 및 품질 개선</li>
              <li>부정 이용 방지 및 보안 유지</li>
              <li>통계 분석을 통한 서비스 개선</li>
            </ul>
          </PrivacySection>

          <PrivacySection title="3. 개인정보 보유 및 이용 기간">
            <p>
              서비스는 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이
              파기합니다. 단, 관련 법령에 따라 보존할 필요가 있는 경우 해당 기간 동안
              보관합니다.
            </p>
            <table className="mt-4 w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pr-4 text-left font-semibold text-text-primary">항목</th>
                  <th className="py-2 text-left font-semibold text-text-primary">보유 기간</th>
                </tr>
              </thead>
              <tbody className="text-text-secondary">
                <tr className="border-b border-border">
                  <td className="py-2 pr-4">서비스 이용 기록</td>
                  <td className="py-2">3개월</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 pr-4">접속 로그</td>
                  <td className="py-2">3개월 (통신비밀보호법)</td>
                </tr>
              </tbody>
            </table>
          </PrivacySection>

          <PrivacySection title="4. 개인정보의 제3자 제공">
            <p>
              서비스는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.
              다만, 다음의 경우에는 예외로 합니다.
            </p>
            <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed text-text-secondary">
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령의 규정에 의거하거나 수사 목적으로 법령에 정해진 절차와 방법에 따라 요청한 경우</li>
            </ul>
          </PrivacySection>

          <PrivacySection title="5. 쿠키(Cookie) 운영">
            <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed text-text-secondary">
              <li>
                서비스는 이용자에게 개인화된 서비스를 제공하기 위해 쿠키를 사용할 수 있습니다.
              </li>
              <li>
                이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 이 경우 일부
                서비스 이용이 제한될 수 있습니다.
              </li>
            </ol>
          </PrivacySection>

          <PrivacySection title="6. 개인정보의 안전성 확보 조치">
            <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed text-text-secondary">
              <li>데이터 전송 시 HTTPS 암호화 통신 적용</li>
              <li>개인정보 접근 권한 최소화</li>
              <li>정기적인 보안 점검 및 취약점 관리</li>
            </ul>
          </PrivacySection>

          <PrivacySection title="7. 개인정보 처리방침 변경">
            <p>
              본 개인정보 처리방침은 법령 또는 서비스 변경에 따라 내용이 추가, 삭제 또는
              수정될 수 있습니다. 변경 시에는 서비스 공지사항을 통해 사전 안내합니다.
            </p>
          </PrivacySection>

          <PrivacySection title="8. 문의">
            <p>
              개인정보 처리와 관련한 문의 사항이 있으시면 아래로 연락해 주시기 바랍니다.
            </p>
            <div className="mt-3 rounded-lg border border-border bg-bg-secondary p-4 text-sm text-text-secondary">
              <p className="font-medium text-text-primary">tool.kit 운영팀</p>
              <p className="mt-1">이메일: contact@toolkit.example.com</p>
            </div>
          </PrivacySection>

        </div>

        {/* 하단 법적 링크 */}
        <div className="mt-12 flex items-center gap-4 border-t border-border pt-6">
          <Link
            href="/terms"
            className="text-sm text-brand transition-colors hover:opacity-80"
          >
            이용약관 →
          </Link>
        </div>

      </div>
    </div>
  );
}

/* ── 섹션 컴포넌트 ── */

interface PrivacySectionProps {
  title: string;
  children: React.ReactNode;
}

function PrivacySection({ title, children }: PrivacySectionProps) {
  return (
    <section>
      <h2 className="mb-3 text-base font-semibold text-text-primary">{title}</h2>
      <div className="text-sm leading-relaxed text-text-secondary">{children}</div>
    </section>
  );
}