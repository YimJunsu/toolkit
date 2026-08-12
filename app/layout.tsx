import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header, Footer, BottomTabBar } from "@/components/layout";
import { Toast } from "@/components/ui/Toast";
import { RecentTracker } from "@/components/ui/RecentTracker";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://mytool-kit.netlify.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "tool.kit — 무료 개발자 도구 모음",
    template: "%s | tool.kit",
  },
  description:
    "개발자·디자이너를 위한 50+ 무료 온라인 도구. JSON Formatter, Base64, UUID 생성기, QR코드, 색상 변환, 정규식 테스터 등 설치 없이 바로 사용.",
  keywords: [
    "JSON formatter", "Base64 인코딩", "UUID 생성기", "QR코드 생성기",
    "개발자 도구", "무료 온라인 도구", "색상 변환기", "정규식 테스터",
    "평수 계산기", "환율 계산기", "타임스탬프 변환",
  ],
  authors: [{ name: "tool.kit" }],
  creator: "tool.kit",
  publisher: "tool.kit",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    siteName: "tool.kit",
    title: "tool.kit — 무료 개발자 도구 50+",
    description: "설치 없이 바로 쓰는 개발자·디자이너 도구 모음",
  },
  twitter: {
    card: "summary_large_image",
    title: "tool.kit — 무료 개발자 도구",
    description: "50+ 개발자 도구를 한 곳에서",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  verification: {
    // Google Search Console 인증 후 아래 값을 채워주세요
    // google: "YOUR_GOOGLE_VERIFICATION_CODE",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "tool.kit",
  url: SITE_URL,
  description: "개발자·디자이너를 위한 50+ 무료 온라인 도구",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('toolkit-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Google AdSense — pub ID 발급 후 아래 주석을 해제하고 YOUR_PUB_ID를 교체하세요 */}
        {/* <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_PUB_ID"
          crossOrigin="anonymous"
        /> */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
          <Footer />
          <BottomTabBar />
          <Toast />
          <RecentTracker />
        </div>
      </body>
    </html>
  );
}
