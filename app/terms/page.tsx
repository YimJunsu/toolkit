import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "이용약관",
  description: "tool.kit 서비스 이용약관을 안내합니다.",
};

const LAST_UPDATED = "2026년 3월 8일";

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold text-text-primary">이용약관</h1>
          <p className="mt-2 text-sm text-text-secondary">
            최종 업데이트: {LAST_UPDATED}
          </p>
        </div>

        {/* 본문 */}
        <div className="flex flex-col gap-10">

          <TermsSection title="제1조 (목적)">
            <p>
              이 약관은 tool.kit(이하 &quot;서비스&quot;)이 제공하는 웹 서비스의 이용 조건 및
              절차, 이용자와 서비스 간의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.
            </p>
          </TermsSection>

          <TermsSection title="제2조 (용어의 정의)">
            <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed text-text-secondary">
              <li>&quot;서비스&quot;란 tool.kit이 운영하는 웹사이트 및 관련 제반 서비스를 의미합니다.</li>
              <li>&quot;이용자&quot;란 이 약관에 따라 서비스를 이용하는 모든 사람을 의미합니다.</li>
              <li>&quot;콘텐츠&quot;란 서비스 내에서 제공되는 도구, 텍스트, 이미지 등 모든 정보를 의미합니다.</li>
            </ol>
          </TermsSection>

          <TermsSection title="제3조 (약관의 효력 및 변경)">
            <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed text-text-secondary">
              <li>이 약관은 서비스 화면에 게시하거나 기타 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</li>
              <li>
                서비스는 필요한 경우 관련 법령을 위반하지 않는 범위 내에서 약관을 변경할 수 있으며,
                변경된 약관은 공지사항을 통해 사전 안내합니다.
              </li>
              <li>이용자가 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단할 수 있습니다.</li>
            </ol>
          </TermsSection>

          <TermsSection title="제4조 (서비스 이용)">
            <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed text-text-secondary">
              <li>서비스는 별도의 회원가입 없이 무료로 이용할 수 있습니다.</li>
              <li>
                서비스는 시스템 점검, 장애, 기타 운영상 합리적인 이유가 있는 경우 서비스 제공을
                일시적으로 중단할 수 있습니다.
              </li>
              <li>서비스는 이용자에게 사전 통지 없이 서비스의 내용을 변경할 수 있습니다.</li>
            </ol>
          </TermsSection>

          <TermsSection title="제5조 (이용자의 의무)">
            <p className="mb-3">이용자는 다음 행위를 해서는 안 됩니다.</p>
            <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed text-text-secondary">
              <li>서비스 운영을 방해하거나 서버에 과부하를 주는 행위</li>
              <li>타인의 개인정보를 무단으로 수집하거나 이용하는 행위</li>
              <li>서비스에서 얻은 정보를 무단으로 복제, 배포, 상업적으로 이용하는 행위</li>
              <li>기타 관련 법령을 위반하는 행위</li>
            </ul>
          </TermsSection>

          <TermsSection title="제6조 (면책 조항)">
            <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed text-text-secondary">
              <li>
                서비스는 천재지변, 전쟁, 기타 불가항력적인 사유로 서비스를 제공할 수 없는 경우
                서비스 제공에 대한 책임이 면제됩니다.
              </li>
              <li>
                서비스 내 도구의 결과물에 대해 서비스는 정확성이나 완전성을 보장하지 않으며,
                이용자가 이를 활용함으로써 발생하는 손해에 대해 책임을 지지 않습니다.
              </li>
            </ol>
          </TermsSection>

          <TermsSection title="제7조 (준거법 및 관할)">
            <p>
              이 약관은 대한민국 법률에 따라 해석되며, 서비스와 이용자 간 분쟁이 발생할 경우
              관할 법원은 민사소송법에 따릅니다.
            </p>
          </TermsSection>

        </div>

        {/* 하단 법적 링크 */}
        <div className="mt-12 flex items-center gap-4 border-t border-border pt-6">
          <Link
            href="/privacy"
            className="text-sm text-brand transition-colors hover:opacity-80"
          >
            개인정보 처리방침 →
          </Link>
        </div>

      </div>
    </div>
  );
}

/* ── 섹션 컴포넌트 ── */

interface TermsSectionProps {
  title: string;
  children: React.ReactNode;
}

function TermsSection({ title, children }: TermsSectionProps) {
  return (
    <section>
      <h2 className="mb-3 text-base font-semibold text-text-primary">{title}</h2>
      <div className="text-sm leading-relaxed text-text-secondary">{children}</div>
    </section>
  );
}