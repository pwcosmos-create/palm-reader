"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./community.module.css";

interface SharedReading {
  id: string;
  userName: string;
  imageUrl: string;
  summary: string;
  accuracy: number;
}

export default function CommunityPage() {
  const [readings, setReadings] = useState<SharedReading[]>([]);

  useEffect(() => {
    // Mock Community Data
    setReadings([
      { id: "1", userName: "행복한 미래", imageUrl: "https://via.placeholder.com/400x300/111231/00F2FF?text=Palm+Analysis+1", summary: "생명선이 매우 길고 뚜렷하여 장수하실 운명입니다. 활발한 에너지가 돋보입니다.", accuracy: 4.8 },
      { id: "2", userName: "꿈꾸는 모험가", imageUrl: "https://via.placeholder.com/400x300/111231/FFD700?text=Palm+Analysis+2", summary: "두뇌선이 창의적인 방향으로 굽어 있어 예술가적인 기질이 다분하십니다.", accuracy: 4.5 },
      { id: "3", userName: "따뜻한 가슴", imageUrl: "https://via.placeholder.com/400x300/111231/8A2BE2?text=Palm+Analysis+3", summary: "감정선이 위쪽으로 솟아 있어 타인에게 자상하고 배려심이 깊은 타입입니다.", accuracy: 4.9 }
    ]);
  }, []);

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className="mystical-font glow-text-secondary">운명 커뮤니티</h1>
        <p className="opacity-60">다른 사람들의 손금 이야기를 만나보세요.</p>
      </header>

      <div className={styles.feed}>
        {readings.map(post => (
          <div key={post.id} className="glass-card mb-6 overflow-hidden">
            <div className={styles.cardImage}>
              <img src={post.imageUrl} alt="Shared Palm" className={styles.palmImg} />
              <div className={styles.overlayText}>
                <span>Accuracy: ⭐ {post.accuracy}</span>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="glow-text-primary text-sm">@{post.userName}</span>
              </div>
              <p className="text-sm opacity-80 leading-relaxed">{post.summary}</p>
              
              <footer className={styles.cardFooter}>
                <button className={styles.likeBtn}>✨ 경이로워요</button>
                <button className={styles.shareBtn}>🔗 공유</button>
              </footer>
            </div>
          </div>
        ))}
      </div>

      <nav className={styles.bottomNav}>
        <Link href="/" className={styles.navItem}>홈</Link>
        <Link href="/scan" className={styles.navItem}>스캔</Link>
        <Link href="/community" className={`${styles.navItem} ${styles.active}`}>피드</Link>
        <Link href="/history" className={styles.navItem}>기록</Link>
      </nav>
    </main>
  );
}
