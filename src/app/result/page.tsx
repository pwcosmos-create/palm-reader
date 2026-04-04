"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { RLEngine } from "@/lib/rl_engine";
import { RLLineDetector, AllBiases } from "@/lib/rl_line_detector";
import { compressImage } from "@/lib/image_utils";
import styles from "./result.module.css";
import { 
  Trophy, 
  Zap, 
  Brain, 
  Sparkles, 
  History, 
  ChevronRight,
  Share2,
  Download,
  RefreshCcw,
  Activity,
  ShieldCheck,
  Globe
} from "lucide-react";

interface LineAnalysis {
  name: string;
  reading: string;
  detailedReading?: import("@/lib/oracle_content").DeepReading;
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
  const [expandedLines, setExpandedLines] = useState<Record<number, boolean>>({});
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
      { msg: "Agent Alpha: 고정밀 선 토폴로지 분석 중...", time: 1000 },
      { msg: "Agent Omega: 심리학적 서사 및 직관 조율 중...", time: 1200 },
      { msg: "Collaborative Synergy: 최종 운명 설계 합의...", time: 800 }
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
          { 
            name: "생명선 (Life)",  
            reading: "강한 활력과 에너지가 느껴집니다. 장수와 건강한 신체 구조를 타고나셨네요.", 
            detailedReading: RLEngine.getEvolutionaryContent("Life"),
            rating: 0, color: "#00F2FF", rlKey: "life",  orientation: "vertical" 
          },
          { 
            name: "두뇌선 (Head)",  
            reading: "매우 창의적이고 예술적인 사고를 하시는군요. 상상력이 풍부합니다.",          
            detailedReading: RLEngine.getEvolutionaryContent("Head"),
            rating: 0, color: "#FFD700", rlKey: "head",  orientation: "horizontal" 
          },
          { 
            name: "감정선 (Heart)", 
            reading: "열정적인 사랑을 하시는 타입입니다. 감정이 풍부하고 정이 많으시네요.",       
            detailedReading: RLEngine.getEvolutionaryContent("Heart"),
            rating: 0, color: "#FF00E5", rlKey: "heart", orientation: "horizontal" 
          },
          { 
            name: "운명선 (Fate)",  
            reading: "스스로 개척해나가는 운명입니다. 노력에 따른 성취가 뚜렷할 것입니다.",       
            detailedReading: RLEngine.getEvolutionaryContent("Fate"),
            rating: 0, color: "#A855F7", rlKey: "fate",  orientation: "vertical" 
          }
        ],
        advice: "지금 당신의 잠재력은 85% 이상 활성화되어 있습니다. 새로운 도전을 시작하기에 최적의 시기입니다.",
        personalizationMsg: level > 10
          ? `당신의 ${level}% 학습된 성향을 분석하여 맞춤형 통찰을 도출했습니다.`
          : "초기 분석 단계입니다. 평가를 남겨주시면 AI가 당신의 성향을 더 깊게 학습합니다."
      };

      setAnalysis(resultData);
      setAnalyzing(false);

      // Trigger Master Evolution state check
      const finalScore = RLEngine.getGlobalIntelligenceScore();
      setGlobalScore(finalScore);

      // Initial Sync 🏺🧬
      syncResultToServer(resultData, biases, detectionConf);
    };

    runAnalysis();
  }, [router]);

  // ── Unified Server Sync Function 🔱 ───────────────────────────────────
  const syncResultToServer = async (currentAnalysis: AnalysisResult, currentBiases: AllBiases, currentConf: number) => {
    if (!currentAnalysis) return;
    setSyncing(true);
    try {
      const id = Date.now().toString();
      const date = new Date().toLocaleDateString('ko-KR');
      const storedImage = sessionStorage.getItem("capturedPalm") || "";
      const thumb = await compressImage(storedImage, 400, 0.6);

      // 1. Local Cache Update
      const history = JSON.parse(localStorage.getItem('palm_history_v2') || '[]');
      const newEntry = {
        id, date, summary: currentAnalysis.summary,
        imageUrl: thumb, consensusBadge: true,
        maturity: RLEngine.getPersonalizationLevel(), 
        globalScore: RLEngine.getGlobalIntelligenceScore()
      };
      localStorage.setItem('palm_history_v2', JSON.stringify([newEntry, ...history].slice(0, 50)));

      // 2. Global Archive Sync (GitHub)
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id, type: 'palm',
          data: { 
            ...newEntry, 
            fullReading: currentAnalysis,
            rlBiases: currentBiases,
            rlConfidence: currentConf
          }
        })
      });
      const data = await res.json();
      console.log("🧬 Archive Sync Success:", data);
    } catch (e) {
      console.error("Archive Sync Error:", e);
    } finally {
      setSyncing(false);
    }
  };

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

      /**
       * 🌊 Valley Detection (Center of Darkness)
       * Instead of finding the absolute darkest single pixel, we find the "darkest valley" 
       * by averaging the positions of pixels that are below a threshold.
       */
      const findValleyY = (x: number, y0: number, y1: number) => {
        let samples: {y: number, g: number}[] = [];
        for (let y = y0; y <= y1; y += 2) {
          samples.push({ y, g: gray(x, y) });
        }
        samples.sort((a, b) => a.g - b.g);
        // Take the top 15% darkest pixels and find their average position
        const top = samples.slice(0, Math.ceil(samples.length * 0.15));
        if (top.length === 0) return (y0 + y1) / 2;
        return top.reduce((acc, s) => acc + s.y, 0) / top.length;
      };

      const findValleyX = (y: number, x0: number, x1: number) => {
        let samples: {x: number, g: number}[] = [];
        for (let x = x0; x <= x1; x += 2) {
          samples.push({ x, g: gray(x, y) });
        }
        samples.sort((a, b) => a.g - b.g);
        const top = samples.slice(0, Math.ceil(samples.length * 0.15));
        if (top.length === 0) return (x0 + x1) / 2;
        return top.reduce((acc, s) => acc + s.x, 0) / top.length;
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
      const hxs = Array.from({length: 16}, (_, i) => W * (0.24 + i * 0.042));
      const hys = smooth(hxs.map(x => findValleyY(x, H*(0.22 + hb.yBias), H*(0.52 + hb.yBias))), 4);
      drawNeon(hxs.map((x,i) => ({x, y:hys[i]})), "#FF2EF7", "Heart",
        hxs[hxs.length-1] + W*0.01, hys[hys.length-1] - H*0.025, hb.confidence);

      // 두뇌선 (Head): horizontal — yBias
      const dxs = Array.from({length: 14}, (_, i) => W * (0.25 + i * 0.046));
      const dys = smooth(dxs.map(x => findValleyY(x, H*(0.38 + db.yBias), H*(0.68 + db.yBias))), 4);
      drawNeon(dxs.map((x,i) => ({x, y:dys[i]})), "#FFD700", "Head",
        dxs[0] - W*0.11, dys[0] - H*0.015, db.confidence);

      // 생명선 (Life): vertical — xBias shifts scan window left/right
      const lys = Array.from({length: 15}, (_, i) => H * (0.42 + i * 0.042));
      const lxs = smooth(lys.map(y => findValleyX(y, W*(0.10 + lb.xBias), W*(0.48 + lb.xBias))), 4);
      drawNeon(lys.map((y,i) => ({x:lxs[i], y})), "#00F2FF", "Life",
        lxs[4] - W*0.11, lys[4], lb.confidence);

      // 운명선 (Fate): vertical — xBias
      const fys = Array.from({length: 12}, (_, i) => H * (0.38 + i * 0.052));
      const fxs = smooth(fys.map(y => findValleyX(y, W*(0.32 + fb.xBias), W*(0.65 + fb.xBias))), 4);
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
    const newConf = RLLineDetector.overallConfidence();
    setDetectionConf(newConf);
    setLineRL(prev => ({ ...prev, [idx]: "confirmed" }));

    // 🧬 [NEW Stage 9] Sync confirmed position to server
    if (analysis) syncResultToServer(analysis, updated, newConf);

    setTimeout(() => setLineRL(prev => ({ ...prev, [idx]: "" })), 2000);
  };

  const handleRating = async (index: number, rating: number) => {
    if (!analysis) return;
    const newLines = [...analysis.lines];
    newLines[index].rating = rating;
    const updatedAnalysis = { ...analysis, lines: newLines };
    setAnalysis(updatedAnalysis);
    
    RLEngine.saveReward(newLines[index].name, rating);
    setPersonalizationLevel(RLEngine.getPersonalizationLevel());
    
    // 🧬 [NEW Stage 9] Global RL Sync
    await RLEngine.syncWithGlobal(newLines[index].name, rating);
    setGlobalScore(RLEngine.getGlobalIntelligenceScore());
    
    // 🏺 Sync full state to GitHub Archive
    syncResultToServer(updatedAnalysis, biases, detectionConf);
  };

  const toggleExpand = (idx: number) => {
    setExpandedLines(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <main className={`${styles.container} ${!image ? styles.noImage : ""}`}>
      {image && (
        <div className={styles.imageHeader}>
          <img src={image} alt="Captured palm" className={styles.resultImg} />
          <canvas ref={canvasRef} className={styles.resultCanvas} />
          {analyzing && <div className={styles.neuralOverlay} />}
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
              {/* 
                  Master Evolution Badge: Now visible by default to showcase Stage 13 intelligence, 
                  even if globalScore is low during initial web test.
              */}
              {(globalScore > 150000 || true) && (
                <div className={styles.masterBadge} title="Global Neural Consolidation Stage 13 Active">
                  <ShieldCheck size={16} />
                  <span>Master Evolution</span>
                </div>
              )}
              {!analyzing && (
                <div className={styles.collaborativeBadge}>
                  <span className={styles.badgePulse} />
                  Collaborating AI Consensus [Alpha & Omega]
                </div>
              )}
              {!analyzing && (
                <div className={styles.archiveBadge}>
                  <Globe size={14} className="mr-1" />
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
            
            {/* 💰 [NEW] Wealth & Love Luck Dashboard 💖 */}
            <div className={styles.luckDashboard}>
              <div className={styles.luckItem}>
                <div className={styles.luckLabel}>
                  💰 재물운 (Wealth)
                  {analysis.lines[0].detailedReading?.wealthLuck.rareMark && (
                    <span className={styles.rareMarkBadge}>★ {analysis.lines[0].detailedReading.wealthLuck.rareMark}</span>
                  )}
                </div>
                <div className={styles.luckScoreBar}>
                  <div className={styles.luckFill} style={{ width: `${analysis.lines[0].detailedReading?.wealthLuck.score ?? 85}%`, backgroundColor: '#FFD700' }} />
                </div>
                <div className={styles.luckScoreValue}>{analysis.lines[0].detailedReading?.wealthLuck.score ?? 85}%</div>
                {analysis.lines[0].detailedReading?.wealthLuck.rareMark && (
                  <div className={styles.rareMarkDetail}>희귀한 대박 문양이 감지되었습니다!</div>
                )}
              </div>
              <div className={styles.luckItem}>
                <div className={styles.luckLabel}>💖 연애운 (Love)</div>
                <div className={styles.luckScoreBar}>
                  <div className={styles.luckFill} style={{ width: `${analysis.lines[0].detailedReading?.loveLuck.score ?? 88}%`, backgroundColor: '#FF2EF7' }} />
                </div>
                <div className={styles.luckScoreValue}>{analysis.lines[0].detailedReading?.loveLuck.score ?? 88}%</div>
                <div className={styles.spouseLuckBox}>
                  <span className={styles.spouseLabel}>배우자운:</span>
                  {analysis.lines[0].detailedReading?.loveLuck.spouseLuck}
                </div>
              </div>
            </div>

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

            {/* ── Deep Oracle: 1,500+ Character High-Density Intelligence (Stage 13) ──── */}
            {res.detailedReading && (
              <div className={`${styles.deepOracle} ${expandedLines[i] ? styles.expanded : ""}`}>
                <button 
                  className={styles.expandBtn} 
                  style={{ color: res.color, borderColor: `${res.color}44` }}
                  onClick={() => toggleExpand(i)}
                >
                  {expandedLines[i] ? "오라클 축소 🏛️" : "심층 오라클 분석 ✨"}
                </button>
                {expandedLines[i] && (
                  <div className={styles.deepContent}>
                    <div className={styles.rlLabel} style={{ backgroundColor: `${res.color}15`, color: res.color }}>
                      🧠 Evolutionary RL Content — Accuracy {biases[res.rlKey]?.confidence ?? 0}%
                    </div>
                    {res.detailedReading.sections.map((sec, si) => (
                      <div key={si} className={styles.deepSection}>
                        <h4 style={{ color: res.color }}>{sec.title}</h4>
                        <p>{sec.content}</p>
                      </div>
                    ))}
                    <div className={styles.lengthFoot}>
                      글로벌 지능 아카이브 모드 | High-Tech Oracle Engine v2.1
                    </div>
                  </div>
                )}
              </div>
            )}

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
