"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./history.module.css";

interface SavedReading {
  id: string;
  date: string;
  summary: string;
  imageUrl: string;
  maturity?: number;
  consensusBadge?: boolean;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<SavedReading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      // 1. Load Local Storage
      const localData = JSON.parse(localStorage.getItem('palm_history_v2') || '[]');
      
      try {
        // 2. Load GitHub Global Archive 🏺
        const res = await fetch('/api/fetch?type=palm');
        const data = await res.json();
        
        if (data.records && data.records.length > 0) {
          // Merge and deduplicate by ID
          const merged = [...data.records, ...localData];
          const unique = Array.from(new Map(merged.map(item => [item.id, item])).values()) as SavedReading[];
          setHistory(unique.sort((a, b) => Number(b.id) - Number(a.id)).slice(0, 50));
        } else {
          setHistory(localData);
        }
      } catch (err) {
        console.warn("GitHub Fetch Failed, falling back to local:", err);
        setHistory(localData);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
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
              <div className={styles.thumbContainer}>
                <img src={item.imageUrl} alt="History" className={styles.thumb} />
                <div className={styles.consensusOverlay}>✨</div>
              </div>
              <div className={styles.itemInfo}>
                <div className={styles.topRow}>
                  <span className={styles.date}>{item.date}</span>
                  <div className={styles.miniBadge}>AI 공동 지능 합의</div>
                </div>
                <p className={styles.summary}>{item.summary}</p>
                <div className={styles.metaRow}>
                  <span className="text-[10px] opacity-50">분석 완성도: {item.maturity}%</span>
                </div>
              </div>
              <span className={styles.arrow}>→</span>
            </Link>
          ))
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔮</div>
            <p>아직 기록된 운명이 없습니다.</p>
            <Link href="/scan" className={styles.startBtn}>첫 스캔 시작하기</Link>
          </div>
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
