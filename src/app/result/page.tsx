"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { RLEngine } from "@/lib/rl_engine";
import styles from "./result.module.css";

interface LineAnalysis {
  name: string;
  reading: string;
  rating: number;
}

export default function ResultPage() {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(true);
  const [results, setResults] = useState<LineAnalysis[]>([]);
  const [personalizationLevel, setPersonalizationLevel] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  useEffect(() => {
    const data = sessionStorage.getItem("capturedPalm");
    if (!data) {
      router.push("/scan");
      return;
    }
    setImage(data);

    // Get current RL maturity
    setPersonalizationLevel(RLEngine.getPersonalizationLevel());

    // Simulate AI Analysis process
    const timer = setTimeout(() => {
      setResults([
        { name: "생명선 (Life)", reading: "강한 활력과 에너지가 느껴집니다. 장수와 건강한 신체 구조를 타고나셨네요.", rating: 0 },
        { name: "두뇌선 (Head)", reading: "매우 창의적이고 예술적인 사고를 하시는군요. 상상력이 풍부합니다.", rating: 0 },
        { name: "감정선 (Heart)", reading: "열정적인 사랑을 하시는 타입입니다. 감정이 풍부하고 정이 많으시네요.", rating: 0 },
        { name: "운명선 (Fate)", reading: "스스로 개척해나가는 운명입니다. 노력에 따른 성취가 뚜렷할 것입니다.", rating: 0 }
      ]);
      setAnalyzing(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    if (!analyzing && image && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        if (ctx) {
          ctx.strokeStyle = "#00F2FF";
          ctx.lineWidth = Math.min(canvas.width, canvas.height) * 0.015;
          ctx.lineCap = "round";
          ctx.shadowBlur = 20;
          ctx.shadowColor = "#00F2FF";
          
          // Life line
          ctx.beginPath();
          ctx.arc(canvas.width * 0.4, canvas.height * 0.6, canvas.width * 0.3, 0.5, 2.5);
          ctx.stroke();

          // Head line
          ctx.strokeStyle = "#FFD700";
          ctx.shadowColor = "#FFD700";
          ctx.beginPath();
          ctx.moveTo(canvas.width * 0.3, canvas.height * 0.5);
          ctx.bezierCurveTo(canvas.width * 0.5, canvas.height * 0.4, canvas.width * 0.7, canvas.height * 0.5, canvas.width * 0.8, canvas.height * 0.45);
          ctx.stroke();
        }
      };
      img.src = image;
    }
  }, [analyzing, image]);

  const handleRating = (index: number, rating: number) => {
    const newResults = [...results];
    newResults[index].rating = rating;
    setResults(newResults);
    
    // RL Reward Storage
    RLEngine.saveReward(newResults[index].name, rating);
    setPersonalizationLevel(RLEngine.getPersonalizationLevel()); // Update maturity
    console.log(`RL REWARD SAVED: ${newResults[index].name} -> ${rating}`);
  };

  return (
    <main className={styles.container}>
      <div className={styles.imageHeader}>
        <canvas ref={canvasRef} className={styles.resultCanvas} />
        {analyzing && <div className={styles.analyzingOverlay}><span>운명의 선을 연결하는 중...</span></div>}
      </div>

      <div className={styles.resultsList}>
        <div className={styles.headerRow}>
          <div className={styles.titleGroup}>
            <h2 className="mystical-font glow-text-secondary">AI 분석 리포트</h2>
            <div className={styles.maturityBox}>
              <span className="text-[10px] opacity-70">AI 학습 성숙도</span>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${personalizationLevel}%` }}
                ></div>
              </div>
              <span className="text-[10px] font-bold text-primary">{personalizationLevel}%</span>
            </div>
          </div>
          <div className={styles.badgeRL}>Autonomous RL</div>
        </div>
        
        {results.map((res, i) => (
          <div key={i} className="glass-card p-6 mb-4">
            <h3 className="glow-text-primary mb-2 font-bold">{res.name}</h3>
            <p className="mb-4 opacity-90 text-sm leading-relaxed">{res.reading}</p>
            <div className={styles.ratingBox}>
              <span className="text-xs opacity-50 uppercase tracking-widest">정밀 보상(Reward) 피드백</span>
              <div className={styles.stars}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button 
                    key={star} 
                    onClick={() => handleRating(i, star)}
                    className={res.rating >= star ? styles.starOn : styles.starOff}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}

        <div className={styles.actions}>
          <button className="btn-primary w-full" onClick={() => alert("공개 피드에 공유되었습니다!")}>커뮤니티에 공개 공유</button>
          <button className="btn-secondary w-full" onClick={() => router.push("/")}>처음으로</button>
        </div>
      </div>
    </main>
  );
}
