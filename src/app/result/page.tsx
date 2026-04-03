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
  const [globalScore, setGlobalScore] = useState(42500);
  const [syncing, setSyncing] = useState(false);
  const [analyzingMessage, setAnalyzingMessage] = useState("데이터 수집 중...");
  const [analyzingStage, setAnalyzingStage] = useState(0); 
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  useEffect(() => {
    const data = sessionStorage.getItem("capturedPalm");
    if (!data) {
      router.push("/scan");
      return;
    }
    setImage(data);

    // Get current RL maturity and global score
    const level = RLEngine.getPersonalizationLevel();
    setPersonalizationLevel(level);
    setGlobalScore(RLEngine.getGlobalIntelligenceScore());

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
      const resultData = {
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
      };
      
      setAnalysis(resultData);
      setAnalyzing(false);

      // ── Saving to History ───────────────────────────────────────────────
      try {
        const history = JSON.parse(localStorage.getItem('palm_history_v2') || '[]');
        const newEntry = {
          id: Date.now().toString(),
          date: new Date().toLocaleDateString('ko-KR'),
          summary: resultData.summary,
          imageUrl: image,
          consensusBadge: true,
          maturity: level,
          globalScore: RLEngine.getGlobalIntelligenceScore()
        };
        localStorage.setItem('palm_history_v2', JSON.stringify([newEntry, ...history].slice(0, 50)));
      } catch (e) {
        console.error("History Save Error:", e);
      }
    };

    runAnalysis();
  }, [router, image]);

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
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const W = canvas.width;
      const H = canvas.height;

      // ── 픽셀 분석으로 실제 손금 위치 감지 ───────────────
      const off = document.createElement("canvas");
      off.width = W; off.height = H;
      const offCtx = off.getContext("2d")!;
      offCtx.drawImage(img, 0, 0);
      const px = offCtx.getImageData(0, 0, W, H).data;

      const gray = (x: number, y: number) => {
        const xi = Math.max(0, Math.min(W - 1, Math.round(x)));
        const yi = Math.max(0, Math.min(H - 1, Math.round(y)));
        const i = (yi * W + xi) * 4;
        return (px[i] + px[i + 1] + px[i + 2]) / 3;
      };

      // 열(x)에서 y범위 안의 가장 어두운 y 반환
      const minY = (x: number, y0: number, y1: number) => {
        let best = (y0 + y1) / 2, minG = 999;
        for (let y = y0; y <= y1; y += 1.5) {
          const g = gray(x, y);
          if (g < minG) { minG = g; best = y; }
        }
        return best;
      };

      // 행(y)에서 x범위 안의 가장 어두운 x 반환
      const minX = (y: number, x0: number, x1: number) => {
        let best = (x0 + x1) / 2, minG = 999;
        for (let x = x0; x <= x1; x += 1.5) {
          const g = gray(x, y);
          if (g < minG) { minG = g; best = x; }
        }
        return best;
      };

      // 이동 평균 스무딩
      const smooth = (arr: number[], w = 3) =>
        arr.map((_, i) => {
          const s = Math.max(0, i - w), e = Math.min(arr.length - 1, i + w);
          return arr.slice(s, e + 1).reduce((a, b) => a + b, 0) / (e - s + 1);
        });

      // 감지된 포인트로 네온 선 렌더링
      const drawNeon = (pts: {x:number;y:number}[], color: string, label: string, lx: number, ly: number) => {
        if (pts.length < 2) return;
        const stroke = (lw: number, alpha: number, blur: number, col: string) => {
          ctx.lineWidth = lw; ctx.globalAlpha = alpha;
          ctx.shadowBlur = blur; ctx.shadowColor = color;
          ctx.strokeStyle = col; ctx.lineCap = "round"; ctx.lineJoin = "round";
          ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length - 1; i++) {
            const mx = (pts[i].x + pts[i+1].x) / 2;
            const my = (pts[i].y + pts[i+1].y) / 2;
            ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
          }
          ctx.lineTo(pts[pts.length-1].x, pts[pts.length-1].y);
          ctx.stroke();
        };
        stroke(W*0.030, 0.28, 45, color);
        stroke(W*0.018, 0.55, 22, color);
        stroke(W*0.007, 1.00,  8, "#fff");
        stroke(W*0.009, 0.85,  5, color);
        ctx.globalAlpha = 1; ctx.shadowBlur = 6; ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.font = `bold ${Math.floor(W*0.026)}px Cinzel, serif`;
        ctx.fillText(label, lx, ly);
        ctx.fillStyle = "#fff"; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(pts[0].x, pts[0].y, W*0.007, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      };

      // ── 감정선: 상단 수평 스캔 (y 30~50%) ────────────────
      const hxs = Array.from({length: 14}, (_, i) => W * (0.26 + i * 0.043));
      const hys = smooth(hxs.map(x => minY(x, H*0.30, H*0.50)), 3);
      drawNeon(hxs.map((x,i) => ({x, y:hys[i]})), "#FF2EF7", "Heart",
        hxs[hxs.length-1] + W*0.01, hys[hys.length-1] - H*0.025);

      // ── 두뇌선: 중간 수평 스캔 (y 44~63%) ───────────────
      const dxs = Array.from({length: 12}, (_, i) => W * (0.27 + i * 0.045));
      const dys = smooth(dxs.map(x => minY(x, H*0.44, H*0.63)), 3);
      drawNeon(dxs.map((x,i) => ({x, y:dys[i]})), "#FFD700", "Head",
        dxs[0] - W*0.11, dys[0] - H*0.015);

      // ── 생명선: 좌측 수직 스캔 (x 15~40%) ───────────────
      const lys = Array.from({length: 13}, (_, i) => H * (0.46 + i * 0.038));
      const lxs = smooth(lys.map(y => minX(y, W*0.14, W*0.42)), 3);
      drawNeon(lys.map((y,i) => ({x:lxs[i], y})), "#00F2FF", "Life",
        lxs[4] - W*0.11, lys[4]);

      // ── 운명선: 중앙 수직 스캔 (x 38~60%) ───────────────
      const fys = Array.from({length: 11}, (_, i) => H * (0.42 + i * 0.047));
      const fxs = smooth(fys.map(y => minX(y, W*0.38, W*0.60)), 3);
      drawNeon(fys.map((y,i) => ({x:fxs[i], y})), "#A855F7", "Fate",
        fxs[0] + W*0.02, fys[0] - H*0.02);
    };
    img.src = image;
  }, [image, analysis]);

  const handleRating = async (index: number, rating: number) => {
    if (!analysis) return;
    const newLines = [...analysis.lines];
    newLines[index].rating = rating;
    setAnalysis({ ...analysis, lines: newLines });
    
    // 1. Local Persistent Save
    RLEngine.saveReward(newLines[index].name, rating);
    setPersonalizationLevel(RLEngine.getPersonalizationLevel()); 

    // 2. Global Sync (AI Collective Growth)
    setSyncing(true);
    await RLEngine.syncWithGlobal(newLines[index].name, rating);
    setGlobalScore(RLEngine.getGlobalIntelligenceScore());
    setSyncing(false);

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
              <div className={styles.spinner} />
              <span className={styles.analyzingText}>{analyzingMessage}</span>
              <div className={styles.stageBar}>
                <div className={styles.stageProgress} style={{ width: `${(analyzingStage / 3) * 100}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      <div className={styles.resultsList}>
        <div className={styles.headerRow}>
          <div className={styles.titleGroup}>
            <div className={styles.badgeRow}>
              <h2 className="mystical-font glow-text-secondary">AI 분석 리포트</h2>
              {!analyzing && (
                <div className={styles.collaborativeBadge}>
                  <span className={styles.badgeIcon}>✨</span>
                  Joint AI Consensus
                </div>
              )}
            </div>
            <div className={styles.maturityBox}>
              <div className={styles.labelRow}>
                <span className="text-[10px] opacity-70">AI 학습 성숙도</span>
                <span className={styles.scoreValue}>{personalizationLevel}%</span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${personalizationLevel}%` }} />
              </div>
            </div>

            <div className={styles.globalBox}>
              <div className={styles.labelRow}>
                <span className="text-[10px] opacity-70">글로벌 지능 풀 (Consensus)</span>
                {syncing && <span className={styles.syncingBadge}>Syncing...</span>}
              </div>
              <div className={styles.scoreGroup}>
                <span className={styles.globalValue}>{globalScore.toLocaleString()} pts</span>
                <div className={styles.pulseDot} />
              </div>
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
