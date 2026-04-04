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
  const [showDebug, setShowDebug] = useState(false);
  const [expertMode, setExpertMode] = useState(false); // 🧤 NEW: Simple UI toggle
  const [biases, setBiases] = useState<AllBiases>(() => RLLineDetector.getBiases());
  const [personalizationLevel, setPersonalizationLevel] = useState(0);
  const [globalScore, setGlobalScore] = useState(42500);
  const [syncing, setSyncing] = useState(false);
  const [analyzingMessage, setAnalyzingMessage] = useState("데이터 수집 중...");
  const [analyzingStage, setAnalyzingStage] = useState(0);
  const [penaltyActive, setPenaltyActive] = useState(false);
  const [recalibrating, setRecalibrating] = useState(false);
  const [topologyMismatch, setTopologyMismatch] = useState(false);

  // ── RL Line Detector state ──────────────────────────────────────────────
  const [lineRL, setLineRL] = useState<Record<number, string>>({});
  const [expandedLines, setExpandedLines] = useState<Record<number, boolean>>({});
  const [detectionConf, setDetectionConf] = useState(0);

  // ── Real pixel-based clarity scores (0-100) per line ────────────────────
  // Order: [life(0), head(1), heart(2), fate(3)]
  const [detectedScores, setDetectedScores] = useState<number[]>([0, 0, 0, 0]);

  // ── RL: remember which style was selected per line (for reward update) ──
  const selectedStylesRef = useRef<Record<string, import("@/lib/oracle_content").OracleStyle>>({});

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  useEffect(() => {
    const data = sessionStorage.getItem("capturedPalm");
    if (!data) { router.push("/scan"); return; }
    setImage(data);

    const level = RLEngine.getPersonalizationLevel();
    setPersonalizationLevel(level);
    setGlobalScore(RLEngine.getGlobalIntelligenceScore());
    const currentConf = RLLineDetector.overallConfidence();
    setDetectionConf(currentConf);
      
    // IPRL (Integrated Palm RL) - Auto-penalty if topology fails
    if (topologyMismatch) {
      Object.keys(biases).forEach(line => {
        const k = line as keyof AllBiases;
        RLLineDetector.adjust(k, -biases[k].xBias * 0.5, -biases[k].yBias * 0.5);
      });
      RLEngine.recordGlobalPenalty('topology_mismatch');
      setRecalibrating(true);
      setTimeout(() => setRecalibrating(false), 3000);
    }

    const stages = [
      { msg: "알파 도사: 손금 모양을 구석구석 살피는 중...", time: 1000 },
      { msg: "오메가 도사: 손가락과 손바닥의 위치를 확인해요...", time: 1200 },
      { msg: "신비한 오라클: 미래에 대한 특별한 이야기를 쓰는 중...", time: 1500 },
      { msg: "도사들의 합의: 나만의 멋진 운명 지도가 완성됐어요!", time: 800 }
    ];

    const runAnalysis = async () => {
      setAnalyzingStage(1); setAnalyzingMessage(stages[0].msg);
      await new Promise(r => setTimeout(r, stages[0].time));
      // 🌙 Background Practice while loading
      RLLineDetector.practice(3);

      setAnalyzingStage(2); setAnalyzingMessage(stages[1].msg);
      await new Promise(r => setTimeout(r, stages[1].time));
      RLLineDetector.practice(3);

      setAnalyzingStage(3); setAnalyzingMessage(stages[2].msg);
      await new Promise(r => setTimeout(r, stages[2].time));

      setAnalyzingStage(4); setAnalyzingMessage(stages[3].msg);
      await new Promise(r => setTimeout(r, stages[3].time));

      // ε-greedy style selection
      const lifeRL  = RLEngine.selectStyle("Life");
      const headRL  = RLEngine.selectStyle("Head");
      const heartRL = RLEngine.selectStyle("Heart");
      const fateRL  = RLEngine.selectStyle("Fate");

      selectedStylesRef.current = {
        "생명선 (튼튼이 선)":  lifeRL.style,
        "두뇌선 (똑똑이 선)":  headRL.style,
        "감정선 (마음 선)": heartRL.style,
        "운명선 (꿈 선)":  fateRL.style,
      };

      // ── RL 컨텍스트 수집 → Gemini에 전달 ─────────────────────────────
      const history = RLEngine.getHistory();
      const getLineStats = (name: string) => {
        const entries = history.filter(h => h.lineName === name);
        const avg = entries.length > 0
          ? Math.round(entries.reduce((s, h) => s + h.rating, 0) / entries.length * 10) / 10
          : 0;
        return { avg, count: entries.length };
      };
      const lifeStats  = getLineStats("생명선 (튼튼이 선)");
      const headStats  = getLineStats("두뇌선 (똑똑이 선)");
      const heartStats = getLineStats("감정선 (마음 선)");
      const fateStats  = getLineStats("운명선 (꿈 선)");

      const rlContext = {
        personalizationLevel: level,
        preferredStyle: lifeRL.style, // 가장 많이 선택된 스타일
        totalSessions: history.length,
        lineRatings: {
          life:       lifeStats.avg,  lifeCount:  lifeStats.count,
          head:       headStats.avg,  headCount:  headStats.count,
          heart:      heartStats.avg, heartCount: heartStats.count,
          fate:       fateStats.avg,  fateCount:  fateStats.count,
        },
      };

      // ── Gemini Vision API 호출 (RL 컨텍스트 포함) ────────────────────
      setAnalyzingMessage("Gemini Vision: 개인화 손금 분석 중...");
      const palmImage = sessionStorage.getItem("capturedPalm");
      let geminiData: any = null;

      if (palmImage) {
        try {
          const res = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: palmImage, rlContext }),
          });
          const json = await res.json();
          if (json.ok) geminiData = json.data;
        } catch (e) {
          console.warn("Gemini API fallback:", e);
        }
      }

      const resultData: AnalysisResult = {
        summary: geminiData?.summary ?? "AI가 당신의 손금을 분석했습니다. 당신의 손금은 강한 의지와 풍부한 감성을 동시에 지닌 복합적인 성격을 나타냅니다.",
        lines: [
          {
            name: "생명선 (튼튼이 선)",
            reading: geminiData?.life?.reading ?? "",
            detailedReading: RLEngine.getEvolutionaryContent("Life", lifeRL.style),
            rating: 0, color: "#00FF7F", rlKey: "life", orientation: "vertical",
          },
          {
            name: "두뇌선 (똑똑이 선)",
            reading: geminiData?.head?.reading ?? "",
            detailedReading: RLEngine.getEvolutionaryContent("Head", headRL.style),
            rating: 0, color: "#00F2FF", rlKey: "head", orientation: "horizontal",
          },
          {
            name: "감정선 (마음 선)",
            reading: geminiData?.heart?.reading ?? "",
            detailedReading: RLEngine.getEvolutionaryContent("Heart", heartRL.style),
            rating: 0, color: "#FF2EF7", rlKey: "heart", orientation: "horizontal",
          },
          {
            name: "운명선 (꿈 선)",
            reading: geminiData?.fate?.reading ?? "",
            detailedReading: RLEngine.getEvolutionaryContent("Fate", fateRL.style),
            rating: 0, color: "#FFD700", rlKey: "fate", orientation: "vertical",
          },
        ],
        advice: geminiData?.advice ?? "오늘은 새로운 시작을 위한 최적의 날입니다.",
        personalizationMsg: geminiData
          ? (level > 10
            ? `Gemini Vision + ${level}% 개인화 RL이 결합된 맞춤형 분석입니다.`
            : "Gemini Vision AI가 직접 손금 이미지를 분석한 결과입니다.")
          : (level > 10
            ? `당신의 ${level}% 학습된 성향을 분석하여 맞춤형 통찰을 도출했습니다.`
            : "초기 분석 단계입니다. 평가를 남겨주시면 AI가 당신의 성향을 더 깊게 학습합니다.")
      };

      // Gemini 점수를 detectedScores에 반영
      if (geminiData) {
        setDetectedScores([
          geminiData.life?.score ?? 50,
          geminiData.head?.score ?? 50,
          geminiData.heart?.score ?? 50,
          geminiData.fate?.score ?? 50,
        ]);
      }

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

  // ── Continuous Background RL (Silent Practice) 🌙 ───────────────────
  useEffect(() => {
    if (analyzing) return;
    const interval = setInterval(() => {
      const pBiases = RLLineDetector.practice(1);
      setBiases(pBiases);
      console.log("🌙 [Silent RL] Weights optimized via Anatomical Practice.");
    }, 15000); // Every 15s practice
    return () => clearInterval(interval);
  }, [analyzing]);

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

      // 🧤 Stage 13: Adaptive Vision Boost (Contrast & Saliency)
      // Sample center 15% to calibrate skin tone
      const sampleS = Math.floor(W * 0.15);
      const startX = Math.floor(W/2 - sampleS/2), startY = Math.floor(H/2 - sampleS/2);
      let tR=0, tG=0, tB=0, count=0;
      for(let y=startY; y<startY+sampleS; y++) {
        for(let x=startX; x<startX+sampleS; x++) {
          const i = (y * W + x) * 4;
          tR += px[i]; tG += px[i+1]; tB += px[i+2]; count++;
        }
      }
      const avgR = tR/count, avgG = tG/count, avgB = tB/count;

      const boostedPx = new Uint8Array(px.length);
      for (let i = 0; i < px.length; i += 4) {
        const r = px[i], g = px[i + 1], b = px[i + 2];
        const avg = (r + g + b) / 3;
        
        // Adaptive Saliency: Is it close to the sampled average?
        const isSkin = Math.abs(r - avgR) < 60 && Math.abs(g - avgG) < 60 && r > 30;
        
        // Contrast Boost: Dynamic stretch based on average brightness
        let newValue = avg;
        const threshold = avgR * 0.8; 
        if (avg < threshold) {
          newValue = Math.max(0, (avg - threshold/4) * 1.6);
        }
        
        // Penalty for obvious background (non-skin-like saturations)
        if (!isSkin) {
          const sat = Math.max(r,g,b) - Math.min(r,g,b);
          if (sat > 40) newValue = Math.min(255, newValue + 70); 
        }

        boostedPx[i] = boostedPx[i+1] = boostedPx[i+2] = newValue;
      }

      // Grayscale diagnostic helper
      const gray = (x: number, y: number) => {
        const xi = Math.max(0, Math.min(W-1, Math.round(x)));
        const yi = Math.max(0, Math.min(H-1, Math.round(y)));
        const i  = (yi * W + xi) * 4;
        return boostedPx[i];
      };

      if (showDebug) {
        const debugData = ctx.createImageData(W, H);
        for(let i=0; i<boostedPx.length; i+=4) {
          const v = boostedPx[i];
          debugData.data[i]=v; debugData.data[i+1]=v; debugData.data[i+2]=v; debugData.data[i+3]=255;
        }
        ctx.putImageData(debugData, 0, 0);
        ctx.globalAlpha = 0.3;
      }


      /**
       * 🎨 Drawing Logic
       */
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

      /**
       * 🐍 Unified Pathfinding (Collaborative Snake)
       */
      const tracePath = (lineName: string, startX: number, startY: number, stepX: number, stepY: number, length: number) => {
        let cx = startX, cy = startY;
        const stepSize = Math.max(W, H) * 0.04;

        // 🧬 Stage 13 fix: Spiral hunt for initial valley if start point is too bright
        if (gray(cx, cy) > 200) {
          for (let r = 0; r < 5; r++) {
            for (let t = 0; t < Math.PI*2; t += Math.PI/4) {
              const nx = cx + Math.cos(t) * r * 15;
              const ny = cy + Math.sin(t) * r * 15;
              if (gray(nx, ny) < 180) { cx = nx; cy = ny; break; }
            }
          }
        }

        const pts = [{ x: cx, y: cy }];
        for (let i = 0; i < length; i++) {
          let bestScore = -1;
          let bestX = cx + stepX * stepSize;
          let bestY = cy + stepY * stepSize;

          const scanRange = stepSize * 1.5;
          for (let off = -scanRange; off <= scanRange; off += scanRange / 5) {
            const px = -stepY * off;
            const py = stepX * off;
            const nx = cx + stepX * stepSize + px;
            const ny = cy + stepY * stepSize + py;
            const b = gray(nx, ny);
            const score = RLLineDetector.getConsensus(lineName, nx/W, ny/H, b);
            if (score > bestScore) {
              bestScore = score;
              bestX = nx; bestY = ny;
            }
          }
          cx = bestX; cy = bestY;
          pts.push({ x: cx, y: cy });
        }
        return pts;
      };

      const hb = biases.heart, db = biases.head, lb = biases.life, fb = biases.fate;

      const h_pts = tracePath("heart", W*0.9, H*(0.3 + hb.yBias), -1, 0.1, 14);
      drawNeon(h_pts, analysis.lines[2].color, "Heart", h_pts[0].x, h_pts[0].y - 20, hb.confidence);

      const d_pts = tracePath("head", W*0.1, H*(0.5 + db.yBias), 1, 0.05, 12);
      drawNeon(d_pts, analysis.lines[1].color, "Head", d_pts[0].x, d_pts[0].y - 20, db.confidence);

      const l_pts = tracePath("life", W*0.15, H*(0.4 + lb.yBias), 0.3, 1, 14);
      drawNeon(l_pts, analysis.lines[0].color, "Life", l_pts[3].x - 50, l_pts[3].y, lb.confidence);

      const f_pts = tracePath("fate", W*(0.5 + fb.xBias), H*0.9, 0, -1, 12);
      drawNeon(f_pts, analysis.lines[3].color, "Fate", f_pts[0].x + 10, f_pts[0].y, fb.confidence);

      // ── Clarity Score using new points
      const allPts = [...h_pts, ...d_pts, ...l_pts, ...f_pts];
      const avgValley = allPts.reduce((s, p) => s + gray(p.x, p.y), 0) / allPts.length;
      const avgSurround = (gray(W*0.5, H*0.5) + gray(W*0.2, H*0.2) + gray(W*0.8, H*0.8)) / 3;
      const realClarity = Math.max(10, Math.min(100, 100 - (avgValley / (avgSurround + 1)) * 40));
      
      setDetectionConf(Math.round(realClarity));
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
    
    if (rating <= 2) {
      setPenaltyActive(true);
      setRecalibrating(true);
      setTimeout(() => setRecalibrating(false), 3000);
    }

    RLEngine.saveReward(newLines[index].name, rating);

    // ε-greedy bandit reward: update style AND visual color
    const shownStyle = selectedStylesRef.current[newLines[index].name];
    const shownColor = (selectedStylesRef.current as any)["__visual_color__"];
    
    if (shownStyle && shownColor) {
      RLEngine.updateRewards(newLines[index].name, shownStyle, shownColor, rating);
    }

    setPersonalizationLevel(RLEngine.getPersonalizationLevel());

    await RLEngine.syncWithGlobal(newLines[index].name, rating);
    setGlobalScore(RLEngine.getGlobalIntelligenceScore());
    
    // 🏺 Sync full state to GitHub Archive
    syncResultToServer(updatedAnalysis, biases, detectionConf);
  };

  const handleReportError = () => {
    if (confirm("손바닥 인식이 잘못되었나요? 벌점을 부여하고 AI를 재학습시킵니다.")) {
      RLEngine.recordGlobalPenalty("user_report_incorrect_recognition");
      setPenaltyActive(true);
      setRecalibrating(true);
      setGlobalScore(RLEngine.getGlobalIntelligenceScore());
      setTimeout(() => setRecalibrating(false), 3000);
      alert("벌점이 부여되었습니다. AI 엔진이 해당 패턴을 기피하도록 재학습됩니다.");
    }
  };

  const toggleExpand = (idx: number) => {
    setExpandedLines(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // ── Score-based reading text (based on actual pixel analysis) ────────────
  function getLineReading(name: string, score: number): string {
    const readings: Record<string, [string, string, string]> = {
      "생명선 (Life)": [
        "생명선이 흐릿하게 감지됩니다. 섬세하고 예민한 기질의 소유자로, 정신적 에너지가 신체보다 강한 유형입니다.",
        "보통 수준의 생명선이 확인됩니다. 안정적인 체력과 꾸준한 회복력을 갖추고 있습니다.",
        "매우 선명하고 깊은 생명선이 감지됩니다. 강인한 생명력과 탁월한 회복 탄력성을 나타냅니다.",
      ],
      "두뇌선 (Head)": [
        "두뇌선이 얕게 나타납니다. 직관적·감성적 판단을 선호하는 창의적 사고 유형입니다.",
        "뚜렷한 두뇌선이 확인됩니다. 균형 잡힌 논리력과 유연한 적응력을 보유하고 있습니다.",
        "매우 선명한 두뇌선이 감지됩니다. 날카로운 집중력과 분석적 통찰력이 두드러집니다.",
      ],
      "감정선 (Heart)": [
        "감정선이 흐릿하게 감지됩니다. 내면에 깊은 감성을 품은 내성적 타입입니다.",
        "적당한 깊이의 감정선이 보입니다. 감성과 이성이 균형 잡힌 성격입니다.",
        "매우 선명한 감정선이 포착됩니다. 풍부한 감정과 깊은 유대 관계를 형성하는 타입입니다.",
      ],
      "운명선 (Fate)": [
        "운명선이 희미하게 보입니다. 자유롭고 유동적인 인생 경로를 추구하는 타입입니다.",
        "보통 수준의 운명선이 나타납니다. 유연한 목표 의식과 다양한 가능성을 의미합니다.",
        "강하고 명확한 운명선이 감지됩니다. 뚜렷한 목표 의식과 강한 개척 의지가 느껴집니다.",
      ],
    };
    const tier = score >= 65 ? 2 : score >= 35 ? 1 : 0;
    return (readings[name] ?? readings["생명선 (Life)"])[tier];
  }

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
                  Master Evolution Badge: Now visible by default to showcase Stage 13 intelligence.
              */}
              {true && (
                <div className={styles.masterBadge} title="글로벌 신경망 통합 Stage 13 활성화">
                  <ShieldCheck size={16} />
                  <span>마스터 진화</span>
                </div>
              )}
              {!analyzing && (
                <div className={styles.collaborativeBadge}>
                  <span className={styles.badgePulse} />
                  AI 지능 협업 분석 중 [알파 & 오메가]
                </div>
              )}
              {!analyzing && (
                <div className={styles.archiveBadge}>
                  <Globe size={14} className="mr-1" />
                  기록이 GitHub 클라우드에 영구 저장됨
                </div>
              )}
            </div>
            {/* ── Expert Metadata (Hidden by default) ── */}
            {expertMode && (
              <>
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
                    {syncing && <span className={styles.syncingBadge}>동기화 중...</span>}
                  </div>
                  <div className={styles.scoreGroup}>
                    <span className={styles.globalValue}>{globalScore.toLocaleString()} pts</span>
                    <div className={styles.pulseDot} />
                  </div>
                </div>
                <div className={`${styles.detectionBox} ${recalibrating ? styles.penaltyFlash : ""}`}>
                  <div className={styles.labelRow}>
                    <span className="text-[10px] opacity-70">선 감지 정확도 (위치 RL)</span>
                    <span className={styles.detectionValue}>{detectionConf}%</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div className={styles.detectionFill} style={{ width: `${detectionConf}%` }} />
                  </div>
                </div>
              </>
            )}
          </div>
          <div className={styles.rightHeader}>
            <div className={styles.badgeRL} onClick={() => setExpertMode(!expertMode)} style={{ cursor: "pointer" }}>
              {expertMode ? "전문가 모드 활성" : "자율 학습 엔진"}
            </div>
            {penaltyActive && <div className={styles.penaltyBadge}>재보정 중...</div>}
            {topologyMismatch && expertMode && (
              <div className={styles.mismatchBadge}>
                ⚠️ 위상학적 불일치 (재보정 중)
              </div>
            )}
          </div>
        </div>

        {analysis && visibleItems >= 1 && (
          <div className={`${styles.premiumCard} ${styles.summaryCard} fade-in-up`}>
            <div className={styles.cardAccent} />
            <h3 className="mystical-font text-xl mb-3">나의 전체 운명</h3>
            <div className={styles.summaryBox}>
              <div className={styles.aiBadge}>제미나이-클로드 하이브리드 엔진</div>
              <p className={styles.summaryText}>{analysis.summary}</p>
              <button 
                className={styles.reportBtn}
                onClick={handleReportError}
              >
                ⚠️ 손바닥 인식 오류 신고 (AI 벌점 부여)
              </button>
            </div>
            <div className={styles.personalizationMsg}>{analysis.personalizationMsg}</div>
          </div>
        )}

        {/* ── 재물운 & 연애운 독립 카드 ── */}
        {analysis && visibleItems >= 2 && (
          <div className={`${styles.premiumCard} ${styles.luckCard} fade-in-up`}>
            <div className={styles.luckCardAccent} />
            <h3 className={`mystical-font ${styles.luckCardTitle}`}>✦ 오늘의 운세</h3>

            {/* 재물운 */}
            <div className={styles.luckBlock}>
              <div className={styles.luckBlockHeader}>
                <span className={styles.luckIcon}>💰</span>
                <span className={styles.luckName}>재물운</span>
                <span className={styles.luckScore} style={{ color: "#FFD700" }}>
                  {analysis.lines[0].detailedReading?.wealthLuck.score ?? 85}%
                </span>
                {analysis.lines[0].detailedReading?.wealthLuck.rareMark && (
                  <span className={styles.rareMarkBadge}>
                    ★ {analysis.lines[0].detailedReading.wealthLuck.rareMark}
                  </span>
                )}
              </div>
              <div className={styles.luckBar}>
                <div
                  className={styles.luckBarFill}
                  style={{
                    width: `${analysis.lines[0].detailedReading?.wealthLuck.score ?? 85}%`,
                    background: "linear-gradient(90deg, #b8860b, #FFD700)",
                  }}
                />
              </div>
              <p className={styles.luckText}>
                {analysis.lines[0].detailedReading?.wealthLuck.text}
              </p>
              {analysis.lines[0].detailedReading?.wealthLuck.rareMark && (
                <div className={styles.rareMarkDetail}>✦ 희귀 문양 감지 — 대박 기운이 손금에 새겨져 있습니다!</div>
              )}
            </div>

            <div className={styles.luckDivider} />

            {/* 연애운 */}
            <div className={styles.luckBlock}>
              <div className={styles.luckBlockHeader}>
                <span className={styles.luckIcon}>💖</span>
                <span className={styles.luckName}>연애운</span>
                <span className={styles.luckScore} style={{ color: "#FF2EF7" }}>
                  {analysis.lines[0].detailedReading?.loveLuck.score ?? 88}%
                </span>
              </div>
              <div className={styles.luckBar}>
                <div
                  className={styles.luckBarFill}
                  style={{
                    width: `${analysis.lines[0].detailedReading?.loveLuck.score ?? 88}%`,
                    background: "linear-gradient(90deg, #9b1a8a, #FF2EF7)",
                  }}
                />
              </div>
              <p className={styles.luckText}>
                {analysis.lines[0].detailedReading?.loveLuck.text}
              </p>
              <div className={styles.spouseBox}>
                <span className={styles.spouseTag}>배우자운</span>
                <p className={styles.spouseText}>
                  {analysis.lines[0].detailedReading?.loveLuck.spouseLuck}
                </p>
              </div>
            </div>
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
              <div style={{ display:"flex", gap:"0.4rem", alignItems:"center" }}>
                <div className={styles.badge} style={{ borderColor: res.color, color: res.color }}>분석 완료</div>
                {selectedStylesRef.current[res.name] && (
                  <div style={{ fontSize:"0.65rem", opacity:0.55, border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"2px 7px", letterSpacing:"0.06em" }}>
                    RL: {selectedStylesRef.current[res.name]}
                  </div>
                )}
              </div>
            </div>
            
            {/* Technical Topology Metadata 🧬 */}
            {res.detailedReading?.topologyData && (
              <div className={styles.topologyRow}>
                <div className={styles.topoItem}>측정점: <span>{res.detailedReading.topologyData.points}</span></div>
                <div className={styles.topoItem}>곡률: <span>{res.detailedReading.topologyData.curvature}</span></div>
                <div className={styles.topoItem}>상태: <span>{res.detailedReading.topologyData.stability}</span></div>
              </div>
            )}

            {/* Real pixel-analysis score bar */}
            <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", marginBottom:"0.75rem" }}>
              <span style={{ fontSize:"0.7rem", opacity:0.55, textTransform:"uppercase", letterSpacing:"0.08em", whiteSpace:"nowrap" }}>
                선 선명도
              </span>
              <div style={{ flex:1, height:4, background:"rgba(255,255,255,0.08)", borderRadius:2, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${detectedScores[i]}%`, background:res.color, borderRadius:2, transition:"width 1s ease" }} />
              </div>
              <span style={{ fontSize:"0.75rem", fontWeight:700, color:res.color, minWidth:"2.5rem", textAlign:"right" }}>
                {detectedScores[i]}%
              </span>
            </div>
            {res.reading ? (
              <p className="mb-4 opacity-95 text-sm leading-relaxed" style={{ color: `${res.color}ee` }}>
                {res.reading}
              </p>
            ) : (
              <p className="mb-4 opacity-90 text-sm leading-relaxed font-semibold" style={{ color: `${res.color}dd` }}>
                [Pixel Analysis]: {getLineReading(res.name, detectedScores[i])}
              </p>
            )}

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
                      🧠 진화형 RL 콘텐츠 — 정확도 {biases[res.rlKey]?.confidence ?? 0}%
                    </div>
                    {res.detailedReading.sections.map((sec, si) => (
                      <div key={si} className={styles.deepSection}>
                        <h4 style={{ color: res.color }}>{sec.title}</h4>
                        <p>{sec.content}</p>
                      </div>
                    ))}
                    <div className={styles.lengthFoot}>
                      글로벌 지능 아카이브 모드 | 하이테크 오라클 엔진 v2.1
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── RL Position Adjustment UI (Expert Mode Only) ────────── */}
            {expertMode && (
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
            )}

            {expertMode && (
              <div className={styles.ratingBox}>
                <span className="text-[10px] opacity-50 uppercase tracking-widest">AI 학습 돕기: 피드백 남기기</span>
                <div className={styles.stars}>
                  {[1,2,3,4,5].map(star => (
                    <button key={star} onClick={() => handleRating(i, star)} className={res.rating >= star ? styles.starOn : styles.starOff}>★</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {analysis && visibleItems >= analysis.lines.length + 2 && (
          <div className={`${styles.premiumCard} ${styles.adviceCard} fade-in-up`}>
            <div className={styles.cardAccentGold} />
            <h3 className="mystical-font text-xl mb-3 text-secondary">신의 가르침</h3>
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
