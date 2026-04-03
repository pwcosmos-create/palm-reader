"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./history.module.css";

interface SavedReading {
  id: string;
  date: string;
  summary: string;
  imageUrl: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<SavedReading[]>([]);

  useEffect(() => {
    // Mock History Data
    setHistory([
      { id: "101", date: "2026-04-01", summary: "4대 선이 모두 뚜렷한 건강한 균형미.", imageUrl: "https://via.placeholder.com/150/111231/00F2FF?text=Palm+A" },
      { id: "102", date: "2026-03-25", summary: "운명선이 강해지는 성취의 시기.", imageUrl: "https://via.placeholder.com/150/111231/FFD700?text=Palm+B" }
    ]);
  }, []);

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className="mystical-font glow-text-secondary">나의 운명 기록</h1>
        <p className="opacity-60">과거의 기록을 돌아보며 변화를 체감하세요.</p>
      </header>

      <div className={styles.list}>
        {history.length > 0 ? (
          history.map(item => (
            <Link href={`/result?id=${item.id}`} key={item.id} className={`${styles.item} glass-card`}>
              <img src={item.imageUrl} alt="History" className={styles.thumb} />
              <div className={styles.itemInfo}>
                <span className={styles.date}>{item.date}</span>
                <p className={styles.summary}>{item.summary}</p>
              </div>
              <span className={styles.arrow}>→</span>
            </Link>
          ))
        ) : (
          <div className="text-center p-10 opacity-40">아직 저장된 기록이 없습니다.</div>
        )}
      </div>

      <nav className={styles.bottomNav}>
        <Link href="/" className={styles.navItem}>홈</Link>
        <Link href="/scan" className={styles.navItem}>스캔</Link>
        <Link href="/community" className={styles.navItem}>피드</Link>
        <Link href="/history" className={`${styles.navItem} ${styles.active}`}>기록</Link>
      </nav>
    </main>
  );
}
