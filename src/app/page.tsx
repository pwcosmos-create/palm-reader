import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.container}>
      <div className={styles.starField}></div>
      <div className={styles.content}>
        <div className={styles.logoContainer}>
          <div className={styles.palmPulse}></div>
          <h1 className="mystical-font glow-text-secondary">AI PALMIST</h1>
        </div>
        
        <p className={styles.tagline}>
          모바일로 손금을 촬영하고 당신의 미래를 AI와 함께 탐구하세요.
        </p>

        <div className={styles.featureGrid}>
          <div className="glass-card p-4">
            <h3 className="glow-text-primary">4대 선 분석</h3>
            <p>생명선, 두뇌선, 감정선, 운명선 정밀 분석</p>
          </div>
          <div className="glass-card p-4">
            <h3 className="glow-text-primary">강화학습 피드백</h3>
            <p>당신의 피드백으로 더 정확해지는 AI</p>
          </div>
        </div>

        <Link href="/scan" className="btn-primary" style={{ marginTop: '2rem' }}>
          미래 확인하기
        </Link>
        
        <footer className={styles.footer}>
          <Link href="/community" className="glow-text-primary">커뮤니티 구경하기</Link>
          <Link href="/history" className="glow-text-primary">기존 기록 보기</Link>
        </footer>
      </div>
    </main>
  );
}
