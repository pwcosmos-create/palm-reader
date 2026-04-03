"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { RLEngine } from "@/lib/rl_engine";
import styles from "./result.module.css";

interface LineAnalysis {
  name: string;
  reading: string;
  rating: number;
  color: string;
}

interface AnalysisResult {
  summary: string;
  lines: LineAnalysis[];
  advice: string;
  personalizationMsg: string;
}

export default function ResultPage() {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(true);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [visibleItems, setVisibleItems] = useState<number>(0);
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
    const level = RLEngine.getPersonalizationLevel();
    setPersonalizationLevel(level);

    // Simulate AI Analysis process
    const timer = setTimeout(() => {
      setAnalysis({
        summary: "고전적 지혜와 현대적 통찰이 결합된 당신의 운명은 '개척자'의 길을 가리키고 있습니다. 매우 강한 주관과 창의적 에너지가 손금 전체에서 관찰됩니다.",
        lines: [
          { name: "생명선 (Life)", reading: "강한 활력과 에너지가 느껴집니다. 장수와 건강한 신체 구조를 타고나셨네요.", rating: 0, color: "#00F2FF" },
          { name: "두뇌선 (Head)", reading: "매우 창의적이고 예술적인 사고를 하시는군요. 상상력이 풍부합니다.", rating: 0, color: "#FFD700" },
          { name: "감정선 (Heart)", reading: "열정적인 사랑을 하시는 타입입니다. 감정이 풍부하고 정이 많으시네요.", rating: 0, color: "#FF00E5" },
          { name: "운명선 (Fate)", reading: "스스로 개척해나가는 운명입니다. 노력에 따른 성취가 뚜렷할 것입니다.", rating: 0, color: "#7000FF" }
        ],
        advice: "지금 당신의 잠재력은 85% 이상 활성화되어 있습니다. 새로운 도전을 시작하기에 최적의 시기입니다.",
        personalizationMsg: level > 10 
          ? `당신의 ${level}% 학습된 성향을 분석하여 맞춤형 통찰을 도출했습니다.`
          : "초기 분석 단계입니다. 평가를 남겨주시면 AI가 당신의 성향을 더 깊게 학습합니다."
      });
      setAnalyzing(false);
    }, 2800);

    return () => clearTimeout(timer);
  }, [router]);

  // Effect for sequential reveal animation
  useEffect(() => {
    if (!analyzing && analysis) {
      const interval = setInterval(() => {
        setVisibleItems(prev => {
          if (prev < analysis.lines.length + 2) return prev + 1;
          clearInterval(interval);
          return prev;
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [analyzing, analysis]);

  // Draw glow lines over the image once analysis is ready
  useEffect(() => {
    if (!image || !canvasRef.current || !analysis) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Match canvas internal resolution to image
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const drawGlowLine = (points: {x: number, y: number}[], color: string, name: string) => {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Outer glow
        ctx.shadowBlur = 50;
        ctx.shadowColor = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = canvas.width * 0.03;
        ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();

        // White core
        ctx.shadowBlur = 15;
        ctx.globalAlpha = 1.0;
        ctx.lineWidth = canvas.width * 0.012;
        ctx.strokeStyle = "#FFFFFF";
        ctx.stroke();

        // Colored edge
        ctx.globalAlpha = 0.85;
        ctx.lineWidth = canvas.width * 0.016;
        ctx.strokeStyle = color;
        ctx.stroke();

        // Label
        ctx.globalAlpha = 1;
        ctx.fillStyle = color;
        ctx.shadowBlur = 5;
        ctx.font = `bold ${Math.floor(canvas.width * 0.032)}px Cinzel, serif`;
        ctx.fillText(name.split(" ")[0], points[0].x + 10, points[0].y - 14);

        // Node dot
        ctx.beginPath();
        ctx.arc(points[0].x, points[0].y, 5, 0, Math.PI * 2);
        ctx.fill();
      };

      drawGlowLine([
        {x: canvas.width * 0.45, y: canvas.height * 0.55},
        {x: canvas.width * 0.4,  y: canvas.height * 0.75},
        {x: canvas.width * 0.5,  y: canvas.height * 0.9}
      ], "#00F2FF", "Life");

      drawGlowLine([
        {x: canvas.width * 0.45, y: canvas.height * 0.55},
        {x: canvas.width * 0.75, y: canvas.height * 0.65}
      ], "#FFD700", "Head");

      drawGlowLine([
        {x: canvas.width * 0.8,  y: canvas.height * 0.45},
        {x: canvas.width * 0.5,  y: canvas.height * 0.45},
        {x: canvas.width * 0.3,  y: canvas.height * 0.5}
      ], "#FF00E5", "Heart");
    };
    img.src = image;
  }, [image, analysis]);

  const handleRating = (index: number, rating: number) => {
    if (!analysis) return;
    const newLines = [...analysis.lines];
    newLines[index].rating = rating;
    setAnalysis({ ...analysis, lines: newLines });
    
    // RL Reward Storage
    RLEngine.saveReward(newLines[index].name, rating);
    setPersonalizationLevel(RLEngine.getPersonalizationLevel()); // Update maturity
    console.log(`RL REWARD SAVED: ${newLines[index].name} -> ${rating}`);
  };

  return (
    <main className={`${styles.container} ${!image ? styles.noImage : ""}`}>
      {image && (
        <div className={styles.imageHeader}>
          {/* Base image — always visible immediately */}
          <img src={image} alt="Captured palm" className={styles.resultImg} />
          {/* Line overlay canvas — drawn after analysis */}
          <canvas ref={canvasRef} className={styles.resultCanvas} />
          {analyzing && (
            <div className={styles.analyzingOverlay}>
              <span>운명의 선을 연결하는 중...</span>
            </div>
          )}
        </div>
      )}

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
        
        {/* Summary Card - First to appear */}
        {analysis && visibleItems >= 1 && (
          <div className={`${styles.premiumCard} ${styles.summaryCard} fade-in-up`}>
            <div className={styles.cardAccent} />
            <h3 className="mystical-font text-xl mb-3">Overall Destiny</h3>
            <p className={styles.summaryText}>{analysis.summary}</p>
            <div className={styles.personalizationMsg}>{analysis.personalizationMsg}</div>
          </div>
        )}

        {/* Individual Lines - Staggered reveal */}
        {analysis?.lines.map((res, i) => (
          <div 
            key={i} 
            className={`${styles.lineCard} ${visibleItems >= i + 2 ? styles.visible : styles.hidden} glass-card p-6 mb-4`}
            style={{ transitionDelay: `${i * 150}ms` }}
          >
            <div className={styles.lineHeader}>
              <h3 className="glow-text-primary text-lg font-bold" style={{ color: res.color }}>{res.name}</h3>
              <div className={styles.badge} style={{ borderColor: res.color, color: res.color }}>Analysis Complete</div>
            </div>
            <p className="mb-4 opacity-90 text-sm leading-relaxed">{res.reading}</p>
            <div className={styles.ratingBox}>
              <span className="text-[10px] opacity-50 uppercase tracking-widest">Teaching AI: Give Feedback</span>
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

        {/* Final Advice Card */}
        {analysis && visibleItems >= analysis.lines.length + 2 && (
          <div className={`${styles.premiumCard} ${styles.adviceCard} fade-in-up`}>
             <div className={styles.cardAccentGold} />
             <h3 className="mystical-font text-xl mb-3 text-secondary">Divine Insight</h3>
             <p className="text-sm italic opacity-90 leading-relaxed">"{analysis.advice}"</p>
          </div>
        )}

        <div className={`${styles.actions} ${visibleItems >= (analysis?.lines.length || 0) + 2 ? styles.visible : styles.hidden}`}>
          <button className="btn-primary w-full" onClick={() => alert("공개 피드에 공유되었습니다!")}>커뮤니티에 공개 공유</button>
          <button className="btn-secondary w-full" onClick={() => router.push("/")}>처음으로</button>
        </div>
      </div>
    </main>
  );
}
