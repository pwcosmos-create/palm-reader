import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI PALMIST | Next-Gen Evolutionary Palmistry",
  description: "세계 최고의 자율 학습형 AI 손금 분석 시스템. 당신의 손금에 숨겨진 미래 데이터를 정교하게 해독하고 커뮤니티와 미래를 공유하세요.",
  manifest: "/manifest.json",
  themeColor: "#00f2ff",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  keywords: ["AI 손금", "손금 분석", "운세", "Palmistry", "AI Palmist", "M자 손금", "재물운", "연애운"],
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
