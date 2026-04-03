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
  const [analyzingMessage, setAnalyzingMessage] = useState("데이터 수집 중...");
  const [analyzingStage, setAnalyzingStage] = useState(0); 

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

    // ── Phase: AI Joint Reflection Loop ───────────────────────────────────
    const stages = [
      { msg: "Gemini: 고전 손금학 기반 '영적 초안' 작성 중...", time: 1200 },
      { msg: "Claude: 현대 심리학 기반 '통찰적 정교화' 진행 중...", time: 1400 },
      { msg: "Consensus: 최종 조율 및 일관성 검증...", time: 1000 }
    ];

    const runAnalysis = async () => {
      // Stage 1 (Gemini)
      setAnalyzingStage(1);
      setAnalyzingMessage(stages[0].msg);
      await new Promise(r => setTimeout(r, stages[0].time));

      // Stage 2 (Claude)
      setAnalyzingStage(2);
      setAnalyzingMessage(stages[1].msg);
      await new Promise(r => setTimeout(r, stages[1].time));

      // Stage 3 (Finalizing)
      setAnalyzingStage(3);
      setAnalyzingMessage(stages[2].msg);
      await new Promise(r => setTimeout(r, stages[2].time));

      // All set!
      setAnalysis({
        summary: "Gemini의 '신비적 직관'과 Claude의 '논리적 분석'이 결합된 결과입니다. 당신의 손금은 현대 사회에서 강력한 영향력을 행사할 수 있는 '개척자'의 길을 가리키고 있습니다.",
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
    };

    runAnalysis();
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

      const W = canvas.width;
      const H = canvas.height;

      // Helper: draw a bezier curve with neon glow effect
      const drawNeonCurve = (
        path: (ctx: CanvasRenderingContext2D) => void,
        color: string,
        labelText: string,
        labelX: number,
        labelY: number
      ) => {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowColor = color;

        // Wide outer glow
        ctx.globalAlpha = 0.35;
        ctx.shadowBlur = 40;
        ctx.lineWidth = W * 0.028;
        ctx.strokeStyle = color;
        ctx.beginPath(); path(ctx); ctx.stroke();

        // Mid glow
        ctx.globalAlpha = 0.6;
        ctx.shadowBlur = 20;
        ctx.lineWidth = W * 0.016;
        ctx.beginPath(); path(ctx); ctx.stroke();

        // Bright white core
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 8;
        ctx.lineWidth = W * 0.007;
        ctx.strokeStyle = "#ffffff";
        ctx.beginPath(); path(ctx); ctx.stroke();

        // Colored thin top layer
        ctx.globalAlpha = 0.9;
        ctx.lineWidth = W * 0.009;
        ctx.strokeStyle = color;
        ctx.beginPath(); path(ctx); ctx.stroke();

        // Label
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 6;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.font = `bold ${Math.floor(W * 0.028)}px Cinzel, serif`;
        ctx.fillText(labelText, labelX, labelY);

        // Start dot
        ctx.shadowBlur = 10;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(labelX - W * 0.01, labelY + W * 0.012, W * 0.008, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      };

      // ─────────────────────────────────────────────────────
      // 손금 해부학 기준 좌표 (오른손 기준, 엄지 왼쪽)
      // 이미지 600×600 → 비율 좌표 사용
      // ─────────────────────────────────────────────────────

      // ── 감정선 Heart Line ──────────────────────────────────
      // 새끼-약지 아래(우)에서 검지 아래(좌)로 완만한 호
      // 실제 위치: 손바닥 상단 1/3 지점 (y ≈ 40~48%)
      drawNeonCurve(
        c => {
          c.moveTo(W * 0.76, H * 0.43);
          c.bezierCurveTo(
            W * 0.62, H * 0.38,   // CP1: 중지 아래서 위로 솟음
            W * 0.45, H * 0.39,   // CP2: 검지 방향으로 꺾임
            W * 0.28, H * 0.46    // 끝: 검지-엄지 경계 부근
          );
        },
        "#FF2EF7",
        "Heart",
        W * 0.77, H * 0.40
      );

      // ── 두뇌선 Head Line ──────────────────────────────────
      // 생명선과 동일 기원(엄지-검지 사이)에서 출발, 새끼 방향으로 사선
      // 실제 위치: 손바닥 중앙 (y ≈ 51~60%)
      drawNeonCurve(
        c => {
          c.moveTo(W * 0.30, H * 0.53);
          c.bezierCurveTo(
            W * 0.46, H * 0.52,   // CP1
            W * 0.60, H * 0.55,   // CP2
            W * 0.74, H * 0.60    // 끝: 약지 아래 방향
          );
        },
        "#FFD700",
        "Head",
        W * 0.27, H * 0.50
      );

      // ── 생명선 Life Line ──────────────────────────────────
      // 두뇌선과 동일 기원, 엄지 두덩(Thenar)을 감싸며 손목 쪽으로 큰 호
      // 실제 위치: 엄지 볼록 부위 감싸는 곡선 (x ≈ 18~35%)
      drawNeonCurve(
        c => {
          c.moveTo(W * 0.30, H * 0.53);
          c.bezierCurveTo(
            W * 0.20, H * 0.63,   // CP1: 엄지 두덩 상단
            W * 0.18, H * 0.76,   // CP2: 엄지 두덩 하단
            W * 0.30, H * 0.88    // 끝: 손목 엄지 쪽
          );
        },
        "#00F2FF",
        "Life",
        W * 0.10, H * 0.68
      );

      // ── 운명선 Fate Line ──────────────────────────────────
      // 손목 중앙에서 중지 방향으로 수직에 가깝게 상승
      // 실제 위치: 손바닥 중앙 세로선 (x ≈ 48~50%)
      drawNeonCurve(
        c => {
          c.moveTo(W * 0.49, H * 0.87);
          c.bezierCurveTo(
            W * 0.49, H * 0.72,   // CP1
            W * 0.48, H * 0.58,   // CP2
            W * 0.47, H * 0.44    // 끝: 중지 기저부
          );
        },
        "#A855F7",
        "Fate",
        W * 0.51, H * 0.42
      );
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
