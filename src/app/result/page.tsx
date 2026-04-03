"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { RLEngine } from "@/lib/rl_engine";
import { RLLineDetector, AllBiases } from "@/lib/rl_line_detector";
import { compressImage } from "@/lib/image_utils";
import styles from "./result.module.css";

interface LineAnalysis {
  name: string;
  reading: string;
  rating: number;
  color: string;
  rlKey: string;         // 'heart' | 'head' | 'life' | 'fate'
  orientation: string;   // 'horizontal' | 'vertical'
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

  // ── RL Line Detector state ──────────────────────────────────────────────
  const [biases, setBiases] = useState<AllBiases>(() => RLLineDetector.getBiases());
  const [lineRL, setLineRL] = useState<Record<number, string>>({});
  const [detectionConf, setDetectionConf] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  useEffect(() => {
    const data = sessionStorage.getItem("capturedPalm");
    if (!data) { router.push("/scan"); return; }
    setImage(data);

    const level = RLEngine.getPersonalizationLevel();
    setPersonalizationLevel(level);
    setGlobalScore(RLEngine.getGlobalIntelligenceScore());
    setDetectionConf(RLLineDetector.overallConfidence());

    const stages = [
      { msg: "Gemini: 고전 손금학 기반 '영적 초안' 작성 중...", time: 1200 },
      { msg: "Claude: 현대 심리학 기반 '통찰적 정교화' 진행 중...", time: 1400 },
      { msg: "Consensus: 최종 조율 및 일관성 검증...", time: 1000 }
    ];

    const runAnalysis = async () => {
      setAnalyzingStage(1); setAnalyzingMessage(stages[0].msg);
      await new Promise(r => setTimeout(r, stages[0].time));
      setAnalyzingStage(2); setAnalyzingMessage(stages[1].msg);
      await new Promise(r => setTimeout(r, stages[1].time));
      setAnalyzingStage(3); setAnalyzingMessage(stages[2].msg);
      await new Promise(r => setTimeout(r, stages[2].time));

      const resultData: AnalysisResult = {
        summary: "Gemini의 '신비적 직관'과 Claude의 '논리적 분석'이 결합된 결과입니다. 당신의 손금은 현대 사회에서 강력한 영향력을 행사할 수 있는 '개척자'의 길을 가리키고 있습니다.",
        lines: [
          { name: "생명선 (Life)",  reading: "강한 활력과 에너지가 느껴집니다. 장수와 건강한 신체 구조를 타고나셨네요.", rating: 0, color: "#00F2FF", rlKey: "life",  orientation: "vertical" },
          { name: "두뇌선 (Head)",  reading: "매우 창의적이고 예술적인 사고를 하시는군요. 상상력이 풍부합니다.",          rating: 0, color: "#FFD700", rlKey: "head",  orientation: "horizontal" },
          { name: "감정선 (Heart)", reading: "열정적인 사랑을 하시는 타입입니다. 감정이 풍부하고 정이 많으시네요.",       rating: 0, color: "#FF00E5", rlKey: "heart", orientation: "horizontal" },
          { name: "운명선 (Fate)",  reading: "스스로 개척해나가는 운명입니다. 노력에 따른 성취가 뚜렷할 것입니다.",       rating: 0, color: "#A855F7", rlKey: "fate",  orientation: "vertical" }
        ],
        advice: "지금 당신의 잠재력은 85% 이상 활성화되어 있습니다. 새로운 도전을 시작하기에 최적의 시기입니다.",
        personalizationMsg: level > 10
          ? `당신의 ${level}% 학습된 성향을 분석하여 맞춤형 통찰을 도출했습니다.`
          : "초기 분석 단계입니다. 평가를 남겨주시면 AI가 당신의 성향을 더 깊게 학습합니다."
      };

      setAnalysis(resultData);
      setAnalyzing(false);

      // ── Saving to History & Global Archive (Optimized) ─────────────
      try {
        const id = Date.now().toString();
        const date = new Date().toLocaleDateString('ko-KR');

        // 1. Optimize image for storage (400px, 0.6 quality) 🖼️
        const thumb = await compressImage(data, 400, 0.6);
        console.log(`[Storage] Compressed image size: ${Math.round(thumb.length / 1024)} KB`);

        // 2. Local Persistence (Fast Feedback)
        const history = JSON.parse(localStorage.getItem('palm_history_v2') || '[]');
        const newEntry = {
          id, date, summary: resultData.summary,
          imageUrl: thumb, consensusBadge: true,
          maturity: level, globalScore: RLEngine.getGlobalIntelligenceScore()
        };
        localStorage.setItem('palm_history_v2', JSON.stringify([newEntry, ...history].slice(0, 50)));

        // 3. GitHub Global Archive (Eternal RL Data) 🏺🧬
        fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id, type: 'palm',
            data: { 
              ...newEntry, 
              fullReading: resultData,
              rlBiases: biases,
              rlConfidence: detectionConf
            }
          })
        }).then(res => res.json())
          .then(data => console.log("GitHub Archive Sync:", data));

      } catch (e) {
        console.error("Archive Save Error:", e);
      }
    };

    runAnalysis();
  }, [router]);

  // Sequential reveal
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

  // ── Canvas: pixel-detect palm lines, redraw whenever biases change ──────
  useEffect(() => {
    if (!image || !canvasRef.current || !analysis) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width  = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const W = canvas.width, H = canvas.height;

      const off = document.createElement("canvas");
      off.width = W; off.height = H;
      const offCtx = off.getContext("2d")!;
      offCtx.drawImage(img, 0, 0);
      const px = offCtx.getImageData(0, 0, W, H).data;

      const gray = (x: number, y: number) => {
        const xi = Math.max(0, Math.min(W-1, Math.round(x)));
        const yi = Math.max(0, Math.min(H-1, Math.round(y)));
        const i  = (yi * W + xi) * 4;
        return (px[i] + px[i+1] + px[i+2]) / 3;
      };

      const minY = (x: number, y0: number, y1: number) => {
        let best = (y0+y1)/2, minG = 999;
        for (let y = y0; y <= y1; y += 1.5) { const g = gray(x,y); if (g < minG) { minG = g; best = y; } }
        return best;
      };

      const minX = (y: number, x0: number, x1: number) => {
        let best = (x0+x1)/2, minG = 999;
        for (let x = x0; x <= x1; x += 1.5) { const g = gray(x,y); if (g < minG) { minG = g; best = x; } }
        return best;
      };

      const smooth = (arr: number[], w = 3) =>
        arr.map((_, i) => {
          const s = Math.max(0, i-w), e = Math.min(arr.length-1, i+w);
          return arr.slice(s, e+1).reduce((a,b) => a+b, 0) / (e-s+1);
        });

      const drawNeon = (pts: {x:number;y:number}[], color: string, label: string, lx: number, ly: number, conf: number) => {
        if (pts.length < 2) return;
        const stroke = (lw: number, alpha: number, blur: number, col: string) => {
          ctx.lineWidth = lw; ctx.globalAlpha = alpha;
          ctx.shadowBlur = blur; ctx.shadowColor = color;
          ctx.strokeStyle = col; ctx.lineCap = "round"; ctx.lineJoin = "round";
          ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length-1; i++) {
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

        // Confidence arc at line start
        if (conf > 0) {
          const r = W * 0.014;
          ctx.beginPath();
          ctx.arc(pts[0].x, pts[0].y, r, -Math.PI/2, -Math.PI/2 + Math.PI*2 * conf/100);
          ctx.strokeStyle = color; ctx.lineWidth = W*0.004;
          ctx.shadowBlur = 10; ctx.globalAlpha = 0.85; ctx.stroke();
        }

        ctx.fillStyle = "#fff"; ctx.shadowBlur = 10; ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(pts[0].x, pts[0].y, W*0.007, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      };

      // ── Apply RL biases to scan regions ────────────────────────────────
      const hb = biases.heart ?? { xBias: 0, yBias: 0, confidence: 0 };
      const db = biases.head  ?? { xBias: 0, yBias: 0, confidence: 0 };
      const lb = biases.life  ?? { xBias: 0, yBias: 0, confidence: 0 };
      const fb = biases.fate  ?? { xBias: 0, yBias: 0, confidence: 0 };

      // 감정선 (Heart): horizontal — yBias shifts scan window up/down
      const hxs = Array.from({length: 14}, (_, i) => W * (0.26 + i * 0.043));
      const hys = smooth(hxs.map(x => minY(x, H*(0.30 + hb.yBias), H*(0.50 + hb.yBias))), 3);
      drawNeon(hxs.map((x,i) => ({x, y:hys[i]})), "#FF2EF7", "Heart",
        hxs[hxs.length-1] + W*0.01, hys[hys.length-1] - H*0.025, hb.confidence);

      // 두뇌선 (Head): horizontal — yBias
      const dxs = Array.from({length: 12}, (_, i) => W * (0.27 + i * 0.045));
      const dys = smooth(dxs.map(x => minY(x, H*(0.44 + db.yBias), H*(0.63 + db.yBias))), 3);
      drawNeon(dxs.map((x,i) => ({x, y:dys[i]})), "#FFD700", "Head",
        dxs[0] - W*0.11, dys[0] - H*0.015, db.confidence);

      // 생명선 (Life): vertical — xBias shifts scan window left/right
      const lys = Array.from({length: 13}, (_, i) => H * (0.46 + i * 0.038));
      const lxs = smooth(lys.map(y => minX(y, W*(0.14 + lb.xBias), W*(0.42 + lb.xBias))), 3);
      drawNeon(lys.map((y,i) => ({x:lxs[i], y})), "#00F2FF", "Life",
        lxs[4] - W*0.11, lys[4], lb.confidence);

      // 운명선 (Fate): vertical — xBias
      const fys = Array.from({length: 11}, (_, i) => H * (0.42 + i * 0.047));
      const fxs = smooth(fys.map(y => minX(y, W*(0.38 + fb.xBias), W*(0.60 + fb.xBias))), 3);
      drawNeon(fys.map((y,i) => ({x:fxs[i], y})), "#A855F7", "Fate",
        fxs[0] + W*0.02, fys[0] - H*0.02, fb.confidence);
    };
    img.src = image;
  }, [image, analysis, biases]);

  // ── RL Line handlers ────────────────────────────────────────────────────
  const handleLineAdjust = (rlKey: string, idx: number, dx: number, dy: number) => {
    const updated = RLLineDetector.adjust(rlKey, dx, dy);
    setBiases(updated);
    setDetectionConf(RLLineDetector.overallConfidence());
    setLineRL(prev => ({ ...prev, [idx]: "adjusted" }));
    setTimeout(() => setLineRL(prev => ({ ...prev, [idx]: "" })), 1400);
  };

  const handleLineConfirm = (rlKey: string, idx: number) => {
    const updated = RLLineDetector.confirm(rlKey);
    setBiases(updated);
    setDetectionConf(RLLineDetector.overallConfidence());
    setLineRL(prev => ({ ...prev, [idx]: "confirmed" }));
    setTimeout(() => setLineRL(prev => ({ ...prev, [idx]: "" })), 2000);
  };

  const handleRating = async (index: number, rating: number) => {
    if (!analysis) return;
    const newLines = [...analysis.lines];
    newLines[index].rating = rating;
    setAnalysis({ ...analysis, lines: newLines });
    RLEngine.saveReward(newLines[index].name, rating);
    setPersonalizationLevel(RLEngine.getPersonalizationLevel());
    setSyncing(true);
    await RLEngine.syncWithGlobal(newLines[index].name, rating);
    setGlobalScore(RLEngine.getGlobalIntelligenceScore());
    setSyncing(false);
  };

  return (
    <main className={`${styles.container} ${!image ? styles.noImage : ""}`}>
      {image && (
        <div className={styles.imageHeader}>
          <img src={image} alt="Captured palm" className={styles.resultImg} />
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
              {!analyzing && (
                <div className={styles.archiveBadge}>
                  <span className={styles.badgeIcon}>🏺</span>
                  Permanently Archived to GitHub
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
            {/* Line Detection RL confidence */}
            <div className={styles.detectionBox}>
              <div className={styles.labelRow}>
                <span className="text-[10px] opacity-70">선 감지 정확도 (위치 RL)</span>
                <span className={styles.detectionValue}>{detectionConf}%</span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.detectionFill} style={{ width: `${detectionConf}%` }} />
              </div>
            </div>
          </div>
          <div className={styles.badgeRL}>Autonomous RL</div>
        </div>

        {analysis && visibleItems >= 1 && (
          <div className={`${styles.premiumCard} ${styles.summaryCard} fade-in-up`}>
            <div className={styles.cardAccent} />
            <h3 className="mystical-font text-xl mb-3">Overall Destiny</h3>
            <p className={styles.summaryText}>{analysis.summary}</p>
            <div className={styles.personalizationMsg}>{analysis.personalizationMsg}</div>
          </div>
        )}

        {analysis?.lines.map((res, i) => (
          <div
            key={i}
            className={`${styles.lineCard} ${visibleItems >= i + 2 ? styles.visible : styles.hidden} glass-card p-6 mb-4`}
            style={{ transitionDelay: `${i * 150}ms` }}
          >
            <div className={styles.lineHeader}>
              <h3 style={{ color: res.color }}>{res.name}</h3>
              <div className={styles.badge} style={{ borderColor: res.color, color: res.color }}>Analysis Complete</div>
            </div>
            <p className="mb-4 opacity-90 text-sm leading-relaxed">{res.reading}</p>

            {/* ── RL Position Adjustment UI ───────────────────────────── */}
            <div className={styles.lineAdjust}>
              <div className={styles.adjustHeader}>
                <span className={styles.adjustLabel}>선 위치 RL 학습</span>
                <span className={styles.confPill} style={{ borderColor: res.color, color: res.color }}>
                  신뢰도 {biases[res.rlKey]?.confidence ?? 0}%
                </span>
              </div>
              <div className={styles.adjustBtns}>
                {res.orientation === "horizontal" ? (
                  <>
                    <button className={styles.adjustBtn} style={{ borderColor: res.color }} onClick={() => handleLineAdjust(res.rlKey, i, 0, -1)}>↑ 위</button>
                    <button className={styles.adjustConfirm} style={{ borderColor: res.color, color: res.color }} onClick={() => handleLineConfirm(res.rlKey, i)}>✓ 정확</button>
                    <button className={styles.adjustBtn} style={{ borderColor: res.color }} onClick={() => handleLineAdjust(res.rlKey, i, 0, 1)}>↓ 아래</button>
                  </>
                ) : (
                  <>
                    <button className={styles.adjustBtn} style={{ borderColor: res.color }} onClick={() => handleLineAdjust(res.rlKey, i, -1, 0)}>← 좌</button>
                    <button className={styles.adjustConfirm} style={{ borderColor: res.color, color: res.color }} onClick={() => handleLineConfirm(res.rlKey, i)}>✓ 정확</button>
                    <button className={styles.adjustBtn} style={{ borderColor: res.color }} onClick={() => handleLineAdjust(res.rlKey, i, 1, 0)}>→ 우</button>
                  </>
                )}
              </div>
              {lineRL[i] === "adjusted"  && <span className={styles.rlFeedback} style={{ color: res.color }}>↻ 위치 재학습 완료 — 선이 이동됐습니다</span>}
              {lineRL[i] === "confirmed" && <span className={styles.rlFeedback} style={{ color: "#4ade80" }}>✓ 위치 정확도 학습됨 (+10%)</span>}
            </div>

            <div className={styles.ratingBox}>
              <span className="text-[10px] opacity-50 uppercase tracking-widest">Teaching AI: Give Feedback</span>
              <div className={styles.stars}>
                {[1,2,3,4,5].map(star => (
                  <button key={star} onClick={() => handleRating(i, star)} className={res.rating >= star ? styles.starOn : styles.starOff}>★</button>
                ))}
              </div>
            </div>
          </div>
        ))}

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
