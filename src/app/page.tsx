"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RLEngine } from "@/lib/rl_engine";
import styles from "./page.module.css";
import { 
  Zap, 
  Brain, 
  Sparkles, 
  ChevronRight, 
  ShieldCheck, 
  Activity, 
  Globe,
  Camera,
  Layers,
  Flame
} from "lucide-react";

export default function Home() {
  const [globalScore, setGlobalScore] = useState(42500);
  const [personalization, setPersonalization] = useState(0);

  useEffect(() => {
    setGlobalScore(RLEngine.getGlobalIntelligenceScore());
    setPersonalization(RLEngine.getPersonalizationLevel());
  }, []);

  return (
    <main className={styles.container}>
      {/* 🌌 Animated Cosmic Background */}
      <div className={styles.auroraBg} />
      <div className={styles.starField} />
      
      <div className={styles.content}>
        {/* 🏛️ Hero Section */}
        <section className={`${styles.hero} fade-in-up`}>
          <div className={styles.logoWrapper}>
            <div className={styles.palmPulse} />
            <div className={styles.scannerLine} />
            <h1 className="mystical-font glow-text-secondary">AI PALMIST</h1>
          </div>
          <p className={styles.heroTagline}>
            Next-Gen Evolutionary Palmistry System — <br/>
            <span>당신의 손금에 숨겨진 미래 데이터를 정교하게 해독합니다.</span>
          </p>
          <div className={styles.statusBadges}>
            <div className={styles.statusBadge}>
              <ShieldCheck size={14} /> 
              <span>Autonomous RL v2.5 Active</span>
            </div>
            <div className={styles.statusBadgeSecondary}>
              <Activity size={14} />
              <span>Global Intelligence: {globalScore.toLocaleString()}</span>
            </div>
          </div>
        </section>

        {/* 🚀 Main CTA */}
        <div className={`${styles.ctaSection} fade-in-up`} style={{ animationDelay: '0.2s' }}>
          <Link href="/scan" className={styles.mainCta}>
            <span>미래의 봉인 해제</span>
            <ChevronRight size={20} />
          </Link>
        </div>

        {/* 🧠 Core Feature Grid */}
        <section className={styles.featureGrid}>
          <div className={`${styles.featureCard} glass-card`}>
            <div className={styles.iconBox}><Brain size={24} /></div>
            <h3>Collaborative RL</h3>
            <p>Gemini와 Claude의 지능이 상호 검증하여 전례 없는 정확도를 도출합니다.</p>
          </div>
          <div className={`${styles.featureCard} glass-card`}>
            <div className={styles.iconBox}><Zap size={24} color="#00F2FF" /></div>
            <h3>Evolutionary Oracle</h3>
            <p>당신의 피드백을 통해 매순간 진화하는 맞춤형 손금 아카이브 엔진입니다.</p>
          </div>
          <div className={`${styles.featureCard} glass-card`}>
            <div className={styles.iconBox}><Sparkles size={24} color="#FFD700" /></div>
            <h3>Rare Mark Detection</h3>
            <p>M자 손금, 삼지창 등 백만 명 중 한 명의 희귀 문양을 정밀하게 포착합니다.</p>
          </div>
        </section>

        {/* 🗺️ Process Guide */}
        <section className={styles.processSection}>
          <h2 className="mystical-font text-center mb-8 opacity-80">Evolutionary Path</h2>
          <div className={styles.processPath}>
            <div className={styles.processStep}>
              <div className={styles.stepCircle}><Camera size={20} /></div>
              <span>Scan</span>
            </div>
            <div className={styles.processLine} />
            <div className={styles.processStep}>
              <div className={styles.stepCircle}><Layers size={20} /></div>
              <span>Topology</span>
            </div>
            <div className={styles.processLine} />
            <div className={styles.processStep}>
              <div className={styles.stepCircle}><Flame size={20} /></div>
              <span>Destiny</span>
            </div>
          </div>
        </section>

        {/* 🏺 History & Globe */}
        <footer className={styles.footer}>
          <div className={styles.footerLinks}>
            <Link href="/history" className={styles.footerLink}>
              <Globe size={16} /> <span>과거 기록 탐색</span>
            </Link>
            <Link href="/community" className={styles.footerLink}>
              <Activity size={16} /> <span>글로벌 커뮤니티</span>
            </Link>
          </div>
          <p className={styles.copyright}>© 2026 AI Palmist Collective — Stage 13 Intelligence</p>
        </footer>
      </div>
    </main>
  );
}
