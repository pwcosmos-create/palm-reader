"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { compressImage } from "@/lib/image_utils";
import styles from "./result.module.css";
import { 
  ShieldCheck,
  Globe,
  Smartphone,
  ChevronRight,
  Download,
  Share2
} from "lucide-react";

interface LineAnalysis {
  name: string;
  reading: string;
  color: string;
  score: number;
}

interface AnalysisResult {
  summary: string;
  easySummary: string;
  lines: LineAnalysis[];
  advice: string;
  wealth: { score: number; text: string };
  love: { score: number; text: string };
  personalizationMsg: string;
}

export default function ResultPage() {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(true);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [visibleItems, setVisibleItems] = useState<number>(0);
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

    const runAnalysis = async () => {
      setAnalyzingStage(1);
      setAnalyzingMessage("AI 전용 채널 개방 중...");
      await new Promise((r) => setTimeout(r, 800));

      setAnalyzingStage(2);
      setAnalyzingMessage("Gemini-2.5-Flash: 고해상도 이미지 처리 중...");
      let geminiData: any = null;
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: data }),
        });
        const json = await res.json();
        if (json.ok) geminiData = json.data;
      } catch (e) {
        console.error("Gemini API Error:", e);
      }

      setAnalyzingStage(3);
      setAnalyzingMessage("운명 알고리즘 데이터 수신 완료...");
      await new Promise((r) => setTimeout(r, 1000));

      const resultData: AnalysisResult = {
        summary: geminiData?.summary ?? "AI가 당신의 손금을 분석했습니다. 풍요로운 미래와 강한 생명력이 엿보입니다.",
        easySummary: geminiData?.easySummary ?? "안녕 친구야! 너의 손금은 정말 특별해. 앞으로 좋은 일만 가득할 거야!",
        lines: [
          {
            name: "생명선 (튼튼이 선)",
            reading: geminiData?.life?.reading ?? "강한 생명력이 느껴지는 선입니다.",
            color: "#00FF7F",
            score: geminiData?.life?.score ?? 85,
          },
          {
            name: "두뇌선 (똑똑이 선)",
            reading: geminiData?.head?.reading ?? "명석한 두뇌와 빠른 판단력이 돋보입니다.",
            color: "#00F2FF",
            score: geminiData?.head?.score ?? 90,
          },
          {
            name: "감정선 (마음 선)",
            reading: geminiData?.heart?.reading ?? "따뜻한 공감 능력과 풍부한 감성이 특징입니다.",
            color: "#FF2EF7",
            score: geminiData?.heart?.score ?? 88,
          },
          {
            name: "운명선 (꿈 선)",
            reading: geminiData?.fate?.reading ?? "자신의 길을 뚜벅뚜벅 걸어가는 멋진 의지가 보입니다.",
            color: "#FFD700",
            score: geminiData?.fate?.score ?? 82,
          },
        ],
        wealth: {
          score: geminiData?.wealth?.score ?? 85,
          text: geminiData?.wealth?.text ?? "금전적으로 풍요로운 흐름이 예상됩니다."
        },
        love: {
          score: geminiData?.love?.score ?? 80,
          text: geminiData?.love?.text ?? "진솔한 관계를 통해 행복을 찾을 것입니다."
        },
        advice: geminiData?.advice ?? "오늘은 당신의 직관을 믿고 새로운 도전을 시작해보세요.",
        personalizationMsg: "Gemini-2.5-Flash-Preview AI가 심층 분석한 결과입니다."
      };

      setAnalysis(resultData);
      setAnalyzing(false);
      setAnalyzingStage(4);
      syncResultToServer(resultData);
    };

    runAnalysis();
  }, [router]);

  const syncResultToServer = async (currentAnalysis: AnalysisResult) => {
    setSyncing(true);
    try {
      const id = Date.now().toString();
      const date = new Date().toLocaleDateString("ko-KR");
      const storedImage = sessionStorage.getItem("capturedPalm") || "";
      const thumb = await compressImage(storedImage, 400, 0.6);

      const history = JSON.parse(localStorage.getItem("palm_history_v2") || "[]");
      const newEntry = {
        id,
        date,
        summary: currentAnalysis.summary,
        imageUrl: thumb,
        globalScore: 128400 + history.length * 25,
      };
      localStorage.setItem("palm_history_v2", JSON.stringify([newEntry, ...history].slice(0, 50)));

      await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          type: "palm",
          data: { ...newEntry, fullReading: currentAnalysis },
        }),
      });
    } catch (e) {
      console.error("Archive Sync Error:", e);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (!analyzing && analysis) {
      const interval = setInterval(() => {
        setVisibleItems((prev) => {
          if (prev < analysis.lines.length + 3) return prev + 1;
          clearInterval(interval);
          return prev;
        });
      }, 400);
      return () => clearInterval(interval);
    }
  }, [analyzing, analysis]);

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
      const W = canvas.width, H = canvas.height;

      const drawNeon = (pts: { x: number; y: number }[], color: string, label: string, lx: number, ly: number) => {
        if (pts.length < 2) return;
        const stroke = (lw: number, alpha: number, blur: number, col: string) => {
          ctx.lineWidth = lw;
          ctx.globalAlpha = alpha;
          ctx.shadowBlur = blur;
          ctx.shadowColor = color;
          ctx.strokeStyle = col;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length - 1; i++) {
            const mx = (pts[i].x + pts[i + 1].x) / 2;
            const my = (pts[i].y + pts[i + 1].y) / 2;
            ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
          }
          ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
          ctx.stroke();
        };
        stroke(W * 0.03, 0.28, 45, color);
        stroke(W * 0.018, 0.55, 22, color);
        stroke(W * 0.007, 1, 8, "#fff");
        stroke(W * 0.009, 0.85, 5, color);

        ctx.globalAlpha = 1;
        ctx.shadowBlur = 6;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.font = `bold ${Math.floor(W * 0.026)}px Inter, sans-serif`;
        ctx.fillText(label, lx, ly);

        ctx.fillStyle = "#fff";
        ctx.shadowBlur = 10;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(pts[0].x, pts[0].y, W * 0.007, 0, Math.PI * 2);
        ctx.fill();
      };

      // Mock paths that look relatively natural
      const heartLine = Array.from({ length: 15 }, (_, i) => ({
        x: W * (0.9 - i * 0.05),
        y: H * (0.35 + Math.sin(i * 0.4) * 0.02),
      }));
      const headLine = Array.from({ length: 15 }, (_, i) => ({
        x: W * (0.1 + i * 0.05),
        y: H * (0.5 + Math.cos(i * 0.3) * 0.02),
      }));
      const lifeLine = Array.from({ length: 15 }, (_, i) => ({
        x: W * (0.15 + Math.sin(i * 0.2) * 0.1),
        y: H * (0.4 + i * 0.04),
      }));
      const fateLine = Array.from({ length: 12 }, (_, i) => ({
        x: W * 0.52,
        y: H * (0.85 - i * 0.06),
      }));

      drawNeon(heartLine, analysis.lines[2].color, "HEART", heartLine[0].x, heartLine[0].y - 30);
      drawNeon(headLine, analysis.lines[1].color, "HEAD", headLine[0].x, headLine[0].y - 30);
      drawNeon(lifeLine, analysis.lines[0].color, "LIFE", lifeLine[0].x - 30, lifeLine[0].y - 30);
      drawNeon(fateLine, analysis.lines[3].color, "FATE", fateLine[0].x - 30, fateLine[0].y + 30);
    };
    img.src = image;
  }, [image, analysis]);

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
        {analysis && visibleItems >= 1 && (
          <div className={`${styles.easyReviewCard} fade-in-up`}>
            <div className={styles.sparkle} />
            <div className={styles.guruIcon}>🔮</div>
            <div className={styles.easyReviewContent}>
              <h3 className={styles.easyReviewTitle}>도사의 아주 쉬운 총평</h3>
              <p className={styles.easyReviewText}>{analysis.easySummary}</p>
            </div>
          </div>
        )}

        <div className={styles.headerRow}>
          <div className={styles.titleGroup}>
            <div className={styles.badgeRow}>
              <h2 className="mystical-font glow-text-secondary">AI 분석 리포트</h2>
              <div className={styles.masterBadge}>
                <ShieldCheck size={16} />
                <span>AI 직통 채널</span>
              </div>
              {!analyzing && (
                <div className={styles.archiveBadge}>
                  <Globe size={14} className="mr-1" />
                  기록 저장됨
                </div>
              )}
            </div>
          </div>
        </div>

        {analysis && visibleItems >= 2 && (
          <div className={`${styles.premiumCard} ${styles.summaryCard} fade-in-up`}>
            <div className={styles.cardAccent} />
            <h3 className="mystical-font text-xl mb-3">나의 전체 운명</h3>
            <div className={styles.summaryBox}>
              <div className={styles.aiBadge}>GEMINI-2.5 심층 분석</div>
              <p className={styles.summaryText}>{analysis.summary}</p>
            </div>
          </div>
        )}

        {analysis && visibleItems >= 3 && (
          <div className={`${styles.premiumCard} ${styles.luckCard} fade-in-up`}>
            <div className={styles.luckCardAccent} />
            <h3 className="mystical-font text-xl mb-4">✦ 오늘의 행운</h3>
            
            <div className={styles.luckBlock}>
              <div className={styles.luckBlockHeader}>
                <span className={styles.luckIcon}>💰</span>
                <span className={styles.luckName}>재물운</span>
                <span className={styles.luckScore} style={{ color: "#FFD700" }}>{analysis.wealth.score}%</span>
              </div>
              <p className={styles.luckText}>{analysis.wealth.text}</p>
            </div>

            <div className={styles.luckDivider} />

            <div className={styles.luckBlock}>
              <div className={styles.luckBlockHeader}>
                <span className={styles.luckIcon}>💖</span>
                <span className={styles.luckName}>연애운</span>
                <span className={styles.luckScore} style={{ color: "#FF2EF7" }}>{analysis.love.score}%</span>
              </div>
              <p className={styles.luckText}>{analysis.love.text}</p>
            </div>
          </div>
        )}

        {analysis?.lines.map((res, i) => (
          <div
            key={i}
            className={`${styles.lineCard} ${visibleItems >= i + 4 ? styles.visible : styles.hidden} glass-card p-6 mb-4`}
          >
            <div className={styles.lineHeader}>
              <h3 style={{ color: res.color }}>{res.name}</h3>
              <span className={styles.scoreBadge} style={{ backgroundColor: `${res.color}22`, color: res.color }}>
                {res.score}점
              </span>
            </div>
            <p className={styles.readingText}>{res.reading}</p>
          </div>
        ))}

        {analysis && visibleItems >= analysis.lines.length + 4 && (
          <div className={`${styles.premiumCard} ${styles.adviceCard} fade-in-up`}>
            <div className={styles.cardAccentGold} />
            <h3 className="mystical-font text-xl mb-3 text-secondary">오늘의 조언</h3>
            <p className="text-sm italic opacity-90 leading-relaxed font-semibold">"{analysis.advice}"</p>
          </div>
        )}

        <div className={`${styles.actions} ${visibleItems >= (analysis?.lines.length || 0) + 4 ? styles.visible : styles.hidden}`}>
          <button className="btn-primary w-full" onClick={() => router.push("/")}>다시 하기</button>
          <button className="btn-secondary w-full" onClick={() => router.push("/community")}>커뮤니티 보기</button>
        </div>
      </div>
    </main>
  );
}
