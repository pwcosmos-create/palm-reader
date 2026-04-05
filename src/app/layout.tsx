import type { Metadata, Viewport } from "next";
import "./globals.css";
import GlobalEditFab from "@/components/GlobalEditFab";

export const metadata: Metadata = {
  metadataBase: new URL("https://palm-reader-drab.vercel.app/"),
  title: "AI PALMIST | Next-Gen Evolutionary Palmistry",
  description: "세계 최고의 자율 학습형 AI 손금 분석 시스템. 당신의 손금에 숨겨진 미래 데이터를 정교하게 해독하고 커뮤니티와 미래를 공유하세요.",
  manifest: "/manifest.json",
  keywords: ["AI 손금", "손금 분석", "운세", "Palmistry", "AI Palmist", "M자 손금", "재물운", "연애운"],
  openGraph: {
    title: "AI PALMIST",
    description: "내 손금에 담긴 1,200자 이상의 초정밀 운명 리포트",
    url: "https://palm-reader-drab.vercel.app/",
    siteName: "AI Palmist",
    images: ["/og-image.png"],
    locale: "ko_KR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#00f2ff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <div className="app-container">
          {children}
        </div>
        <GlobalEditFab />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    console.log('SW registered');
                  }).catch(function(err) {
                    console.log('SW registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
