import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 손금 분석 - 당신의 운명을 읽어보세요",
  description: "프리미엄 AI 손금 분석 서비스를 통해 당신의 미래를 확인하고 커뮤니티와 공유하세요.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        {children}
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
