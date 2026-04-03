"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./community.module.css";

interface SharedReading {
  id: string;
  date: string;
  summary: string;
  imageUrl?: string;
  consensusBadge?: boolean;
  maturity?: number;
  globalScore?: number;
}

// Deterministic avatar emoji from record id
function avatarFor(id: string) {
  const emojis = ["🌙", "⭐", "🔮", "✨", "🌟", "💫", "🌠", "🪐", "🌌", "🌀"];
  const idx = id.charCodeAt(id.length - 1) % emojis.length;
  return emojis[idx];
}

export default function CommunityPage() {
  const [readings, setReadings] = useState<SharedReading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCommunity() {
      try {
        const res = await fetch('/api/fetch?type=palm');
        const json = await res.json();
        if (json.records && json.records.length > 0) {
          setReadings(json.records);
        }
      } catch (err) {
        console.warn("GitHub Fetch Failed for Community:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCommunity();
  }, []);

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className="mystical-font glow-text-secondary">운명 커뮤니티</h1>
        <p className={styles.subtitle}>다른 사람들의 손금 이야기를 만나보세요.</p>
      </header>

      <div className={styles.feed}>
        {loading && (
          <div className={styles.emptyState}>
            <div className={styles.spinner} />
            <p>아카이브 불러오는 중...</p>
          </div>
        )}

        {!loading && readings.length === 0 && (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🔮</span>
            <p>아직 공유된 손금이 없습니다.</p>
            <p className={styles.emptyHint}>첫 번째 손금을 스캔하고 커뮤니티에 공유해보세요.</p>
          </div>
        )}

        {readings.map((post, i) => (
          <div
            key={post.id}
            className={`${styles.oracleCard} glass-card fade-in-up`}
            style={{ animationDelay: `${i * 150}ms` }}
          >
            <div className={styles.cardHeader}>
              <div className={styles.userBadge}>
                <span className={styles.avatar}>{avatarFor(post.id)}</span>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>운명인 #{post.id.slice(-4)}</span>
                  <span className={styles.userDate}>{post.date}</span>
                </div>
              </div>
              {post.consensusBadge && (
                <div className={styles.consensusBadge}>Joint AI Verified</div>
              )}
            </div>

            {/* Palm image thumbnail */}
            {post.imageUrl && (
              <div className={styles.thumbWrap}>
                <img src={post.imageUrl} alt="손금 사진" className={styles.thumb} />
                <div className={styles.thumbOverlay} />
              </div>
            )}

            <p className={styles.content}>{post.summary}</p>

            <footer className={styles.cardFooter}>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>AI 성숙도</span>
                <span className={styles.statValue}>{post.maturity ?? 0}%</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>Global Pool</span>
                <span className={styles.statValue}>{(post.globalScore ?? 42500).toLocaleString()} pts</span>
              </div>
              <div className={styles.actionGroup}>
                <button className={styles.actionBtn}>🔮</button>
                <button className={styles.actionBtn}>✨</button>
              </div>
            </footer>
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
