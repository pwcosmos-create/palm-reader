"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./scan.module.css";
import { compressImage } from "@/lib/image_utils";

// ── Palm skin-tone & texture validation ───────────────────────────────────
function isSkinPixel(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  const sat = max === 0 ? 0 : diff / max;

  // Wide skin range: covers light to dark skin tones, various lighting conditions
  return (
    r > 60 && g > 35 && b > 20 &&
    r > b && r > g &&
    diff >= 10 &&
    sat >= 0.06 && sat <= 0.80 &&
    r - g >= 2 && r - g <= 70
  );
}

/**
 * Palm validation via 3×3 grid skin distribution AND Edge Density (Sobel).
 * A real palm has distinct line textures — smooth skin/objects fail.
 *
 * Returned result: { ok: boolean, reason?: string }
 */
async function validatePalmStrict(dataUrl: string): Promise<{ ok: boolean; reason?: "NO_SKIN" | "NO_TEXTURE" | "LOW_COVERAGE" }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const SIZE = 90;
      const GRID = 3;
      const CELL = SIZE / GRID;
      const c = document.createElement("canvas");
      c.width = SIZE; c.height = SIZE;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      const { data } = ctx.getImageData(0, 0, SIZE, SIZE);

      const cellSkin = new Array(GRID * GRID).fill(0);
      const totalSkinPixels = new Array(SIZE * SIZE).fill(false);
      let skinCount = 0;

      // 1. Skin & Coverage analysis
      for (let py = 0; py < SIZE; py++) {
        for (let px = 0; px < SIZE; px++) {
          const i = (py * SIZE + px) * 4;
          if (data[i + 3] < 128) continue;
          const ci = Math.floor(py / CELL) * GRID + Math.floor(px / CELL);
          if (isSkinPixel(data[i], data[i + 1], data[i + 2])) {
            cellSkin[ci]++;
            totalSkinPixels[py * SIZE + px] = true;
            skinCount++;
          }
        }
      }

      const overallRatio = skinCount / (SIZE * SIZE);
      if (overallRatio < 0.18) return resolve({ ok: false, reason: "NO_SKIN" });

      const ratios = cellSkin.map((s) => s / (CELL * CELL));

      // 1.1 Skin Uniformity Check (Anti-Face)
      const meanRatio = ratios.reduce((a, b) => a + b, 0) / 9;
      const variance = ratios.reduce((a, b) => a + Math.pow(b - meanRatio, 2), 0) / 9;
      const stdDev = Math.sqrt(variance);

      if (stdDev > 0.40) return resolve({ ok: false, reason: "LOW_COVERAGE" });

      const highCells = ratios.filter((r) => r >= 0.20).length;
      if (highCells < 4 || ratios[4] < 0.28) return resolve({ ok: false, reason: "LOW_COVERAGE" });

      // 2. Texture/Edge density analysis (Sobel)
      // Only check edges ON skin area to avoid background noise
      let edgeEnergy = 0;
      const cellEdges = new Array(GRID * GRID).fill(0);
      
      for (let y = 1; y < SIZE - 1; y++) {
        for (let x = 1; x < SIZE - 1; x++) {
          if (!totalSkinPixels[y * SIZE + x]) continue;
          
          const getG = (ox: number, oy: number) => {
            const i = ((y + oy) * SIZE + (x + ox)) * 4;
            return (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114); // Gray scale
          };

          const gx = -1 * getG(-1, -1) + 1 * getG(1, -1)
                   - 2 * getG(-1, 0)  + 2 * getG(1, 0)
                   - 1 * getG(-1, 1)  + 1 * getG(1, 1);
          
          const gy = -1 * getG(-1, -1) - 2 * getG(0, -1) - 1 * getG(1, -1)
                   + 1 * getG(-1, 1)  + 2 * getG(0, 1)  + 1 * getG(1, 1);
          
          const mag = Math.sqrt(gx * gx + gy * gy);
          if (mag > 30) { // Tuned sensitivity (30) to capture fine lines in dim light
            edgeEnergy++;
            const ci = Math.floor(y / CELL) * GRID + Math.floor(x / CELL);
            cellEdges[ci]++;
          }
        }
      }

      // 2.1 Distributed Texture Check
      const edgyCells = cellEdges.filter((e, idx) => e > (cellSkin[idx] * 0.05)).length;
      if (edgyCells < 2) return resolve({ ok: false, reason: "NO_TEXTURE" });

      // Density threshold - lenient for dim lighting
      const density = edgeEnergy / skinCount;
      if (density < 0.05) return resolve({ ok: false, reason: "NO_TEXTURE" });

      resolve({ ok: true });
    };
    img.onerror = () => resolve({ ok: false });
    img.src = dataUrl;
  });
}

const ANALYSIS_STEPS = [
  { label: "손바닥 형상 인식", detail: "Palm geometry mapped" },
  { label: "주요 선 추출 중", detail: "Extracting major lines" },
  { label: "신경망 특징 분석", detail: "Neural feature extraction" },
  { label: "운명선 패턴 해석", detail: "Fate line pattern decoded" },
  { label: "생명력 지수 측정", detail: "Vitality index calibrated" },
  { label: "최종 운명 보고서 생성", detail: "Destiny report compiled" },
];

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [torch, setTorch] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  // scanning state
  const [phase, setPhase] = useState<"idle" | "scanning" | "done">("idle");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  const router = useRouter();

  // ── Camera ────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    async function startCamera() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
        });
        if (!mounted) { s.getTracks().forEach(t => t.stop()); return; }
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.onloadedmetadata = () => setCameraReady(true);
        }
      } catch {
        alert("카메라 권한이 필요합니다. 설정에서 허용해주세요.");
      }
    }
    startCamera();
    return () => { mounted = false; stream?.getTracks().forEach(t => t.stop()); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Torch ─────────────────────────────────────────────────
  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    const cap = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean };
    if (cap.torch) {
      await track.applyConstraints({ advanced: [{ torch: !torch } as MediaTrackConstraintSet] });
      setTorch(t => !t);
    } else {
      alert("이 기기에서는 플래시를 지원하지 않습니다.");
    }
  };

  // ── Image processing ──────────────────────────────────────
  const processImage = useCallback((raw: string): Promise<string> => {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const S = 480; // reduced from 600 — saves ~35% file size
        const canvas = document.createElement("canvas");
        canvas.width = S; canvas.height = S;
        const ctx = canvas.getContext("2d")!;

        const crop = Math.min(img.width, img.height) * 0.65;
        const sx = (img.width - crop) / 2;
        const sy = (img.height - crop) / 2;

        // 1. Dark base + high-contrast grayscale
        ctx.fillStyle = "#020205";
        ctx.fillRect(0, 0, S, S);
        ctx.filter = "contrast(1.65) brightness(1.05) grayscale(1.0)";
        ctx.drawImage(img, sx, sy, crop, crop, 0, 0, S, S);
        ctx.filter = "none";

        // 2. Sobel edge detection on the grayscale pixels
        const id = ctx.getImageData(0, 0, S, S);
        const px = id.data;
        const gray = new Float32Array(S * S);
        for (let i = 0; i < gray.length; i++) gray[i] = px[i * 4]; // R = G = B (grayscale)

        const edges = new Float32Array(S * S);
        let maxE = 1;
        for (let y = 1; y < S - 1; y++) {
          for (let x = 1; x < S - 1; x++) {
            const gx =
              -gray[(y-1)*S+(x-1)] - 2*gray[y*S+(x-1)] - gray[(y+1)*S+(x-1)]
              +gray[(y-1)*S+(x+1)] + 2*gray[y*S+(x+1)] + gray[(y+1)*S+(x+1)];
            const gy =
              -gray[(y-1)*S+(x-1)] - 2*gray[(y-1)*S+x] - gray[(y-1)*S+(x+1)]
              +gray[(y+1)*S+(x-1)] + 2*gray[(y+1)*S+x] + gray[(y+1)*S+(x+1)];
            const m = Math.sqrt(gx * gx + gy * gy);
            edges[y * S + x] = m;
            if (m > maxE) maxE = m;
          }
        }

        // 3. Build neon edge image (cyan #00F2FF)
        const ec = document.createElement("canvas");
        ec.width = S; ec.height = S;
        const eCtx = ec.getContext("2d")!;
        const eId = eCtx.createImageData(S, S);
        const thr = maxE * 0.18; // keep stronger edges
        for (let i = 0; i < edges.length; i++) {
          const e = edges[i];
          if (e > thr) {
            const a = Math.round(Math.min(255, ((e - thr) / (maxE - thr)) * 255));
            eId.data[i*4]   = 0;
            eId.data[i*4+1] = 242; // neon cyan
            eId.data[i*4+2] = 255;
            eId.data[i*4+3] = a;
          }
        }
        eCtx.putImageData(eId, 0, 0);

        // 4. Composite neon glow (3 layers: wide→mid→crisp)
        ctx.globalCompositeOperation = "source-over";
        ctx.filter = "blur(6px)";  ctx.globalAlpha = 0.45; ctx.drawImage(ec, 0, 0);
        ctx.filter = "blur(2px)";  ctx.globalAlpha = 0.60; ctx.drawImage(ec, 0, 0);
        ctx.filter = "none";       ctx.globalAlpha = 0.88; ctx.drawImage(ec, 0, 0);
        ctx.globalAlpha = 1;

        // 5. Border
        ctx.strokeStyle = "rgba(0, 242, 255, 0.35)";
        ctx.lineWidth = 2;
        ctx.strokeRect(3, 3, S - 6, S - 6);

        // 6. Export — optimized via utility (~320px, 0.5 quality)
        (async () => {
          const compressed = await compressImage(canvas.toDataURL("image/jpeg", 0.9), 320, 0.5);
          resolve(compressed);
        })();
      };
      img.src = raw;
    });
  }, []);

  // ── Start scan sequence ───────────────────────────────────
  const beginScan = useCallback(async (rawData: string) => {
    const processed = await processImage(rawData);
    setPreviewImage(processed);
    sessionStorage.setItem("capturedPalm", processed);

    setPhase("scanning");
    setStepIndex(0);
    setProgress(0);

    const totalDuration = 6000;
    const stepInterval = totalDuration / ANALYSIS_STEPS.length;

    let step = 0;
    const stepTimer = setInterval(() => {
      step++;
      setStepIndex(step);
      if (step >= ANALYSIS_STEPS.length) clearInterval(stepTimer);
    }, stepInterval);

    const progTimer = setInterval(() => {
      setProgress(p => {
        const next = p + 100 / (totalDuration / 50);
        if (next >= 100) { clearInterval(progTimer); return 100; }
        return next;
      });
    }, 50);

    setTimeout(() => {
      setPhase("done");
      router.push("/result");
    }, totalDuration + 400);
  }, [processImage, router]);

  // ── Capture from camera ───────────────────────────────────
  const capturePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    const validation = await validatePalmStrict(dataUrl);
    if (!validation.ok) {
      if (validation.reason === "NO_TEXTURE") {
        setValidationError("손바닥의 선이 선명하게 보이지 않습니다. 밝은 곳에서 다시 촬영해주세요.");
      } else if (validation.reason === "NO_SKIN") {
        setValidationError("손바닥이 감지되지 않았습니다. 손을 가이드에 맞춰주세요.");
      } else {
        setValidationError("손바닥을 카메라에 바르게 대고 다시 촬영해주세요.");
      }
      return;
    }
    setValidationError(null);
    ctx.filter = "contrast(1.1) brightness(1.05)";
    ctx.drawImage(video, 0, 0);
    beginScan(canvas.toDataURL("image/jpeg", 0.85));
  };

  // ── Upload from gallery ───────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      const validation = await validatePalmStrict(dataUrl);
      if (!validation.ok) {
        if (validation.reason === "NO_TEXTURE") {
          setValidationError("손금의 질감이 감지되지 않습니다. 손바닥을 펼친 선명한 사진을 사용해주세요.");
        } else if (validation.reason === "NO_SKIN") {
          setValidationError("손바닥이 감지되지 않습니다. 손바닥 사진만 업로드할 수 있습니다.");
        } else {
          setValidationError("손바닥을 화면 가득 채운 사진을 사용해주세요.");
        }
        return;
      }
      setValidationError(null);
      beginScan(dataUrl);
    };
    reader.onerror = () => alert("사진을 읽어오는데 실패했습니다.");
    reader.readAsDataURL(file);
  };

  const isScanning = phase === "scanning" || phase === "done";
  const circumference = 2 * Math.PI * 54; // r=54

  return (
    <main className={styles.container}>

      {/* ── Camera area ── */}
      <div className={styles.cameraArea}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`${styles.video} ${isScanning ? styles.hidden : ""}`}
        />

        {/* Captured preview */}
        {isScanning && previewImage && (
          <img src={previewImage} alt="Palm preview" className={styles.preview} />
        )}

        {/* Hand guide overlay (only when idle) */}
        {!isScanning && (
          <div className={styles.guideOverlay}>
            <div className={styles.handGuide}>
              <svg className={styles.guideSvg} viewBox="0 0 280 360" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Hand silhouette outline */}
                <path
                  d="M90,340 C60,340 40,315 40,280 L40,180 C40,165 50,155 65,155 C65,155 65,120 65,105 C65,93 74,84 86,84 C98,84 107,93 107,105 L107,130 L107,95 C107,83 116,74 128,74 C140,74 149,83 149,95 L149,130 L149,100 C149,88 158,79 170,79 C182,79 191,88 191,100 L191,130 L191,115 C191,103 200,94 212,94 C224,94 233,103 233,115 L233,200 C233,200 250,195 250,215 C250,235 230,250 220,265 L195,310 C185,330 170,340 145,340 Z"
                  stroke="var(--primary)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="6 4"
                  className={styles.handPath}
                />
                {/* Palm lines hint */}
                <path d="M80,220 Q140,200 200,225" stroke="rgba(0,242,255,0.25)" strokeWidth="1" strokeLinecap="round"/>
                <path d="M75,260 Q140,240 210,260" stroke="rgba(0,242,255,0.2)" strokeWidth="1" strokeLinecap="round"/>
                <path d="M120,180 Q135,260 130,320" stroke="rgba(0,242,255,0.2)" strokeWidth="1" strokeLinecap="round"/>
              </svg>
              <div className={styles.cornerTL} />
              <div className={styles.cornerTR} />
              <div className={styles.cornerBL} />
              <div className={styles.cornerBR} />
            </div>
            <p className={styles.guideHint}>손바닥을 가이드 안에 맞춰주세요</p>
          </div>
        )}

        {/* Scan progress overlay */}
        {isScanning && (
          <div className={styles.scanOverlay}>
            {/* Circular progress ring */}
            <div className={styles.progressRingWrap}>
              <svg className={styles.progressRing} viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" stroke="rgba(0,242,255,0.1)" strokeWidth="3" fill="none"/>
                <circle
                  cx="60" cy="60" r="54"
                  stroke="var(--primary)"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progress / 100)}
                  transform="rotate(-90 60 60)"
                  style={{ transition: "stroke-dashoffset 0.05s linear", filter: "drop-shadow(0 0 6px var(--primary))" }}
                />
              </svg>
              <div className={styles.progressCenter}>
                <span className={styles.progressPct}>{Math.round(progress)}%</span>
                <span className={styles.progressLabel}>분석 중</span>
              </div>
            </div>

            {/* Step list */}
            <div className={styles.stepList}>
              {ANALYSIS_STEPS.map((s, i) => (
                <div
                  key={i}
                  className={`${styles.stepItem} ${i < stepIndex ? styles.done : ""} ${i === stepIndex ? styles.active : ""}`}
                >
                  <div className={styles.stepDot} />
                  <div className={styles.stepText}>
                    <span className={styles.stepLabel}>{s.label}</span>
                    <span className={styles.stepDetail}>{s.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scanner sweep line */}
        {isScanning && <div className={styles.scanLine} />}

        {/* Top controls */}
        <div className={styles.topBar}>
          <button onClick={() => router.back()} className={styles.iconBtn} aria-label="뒤로">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 4L6 9L11 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <span className={styles.topTitle}>손금 스캔</span>
          {!isScanning && (
            <button onClick={toggleTorch} className={`${styles.iconBtn} ${torch ? styles.torchOn : ""}`} aria-label="플래시">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M10 2L4 10H9L8 16L14 8H9L10 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          {isScanning && <div style={{ width: 44 }} />}
        </div>
      </div>

      {/* ── Bottom overlay ── */}
      <div className={styles.bottomOverlay}>
        {!isScanning ? (
          <>
            {validationError ? (
              <p className={styles.validationError}>{validationError}</p>
            ) : (
              <p className={styles.hint}>손바닥을 펴고 카메라에 가까이 대세요</p>
            )}

            <div className={styles.actionRow}>
              {/* Upload button */}
              <button className={styles.sideBtn} onClick={() => fileInputRef.current?.click()} aria-label="갤러리">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <rect x="2" y="2" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.8"/>
                  <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor"/>
                  <path d="M2 14L7 9L11 13L14 10L20 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>갤러리</span>
              </button>

              {/* Main shutter button */}
              <button
                className={styles.shutterBtn}
                onClick={capturePhoto}
                disabled={!cameraReady}
                aria-label="스캔"
              >
                <div className={styles.shutterInner}>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path d="M14 6C9.58 6 6 9.58 6 14s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" fill="white"/>
                    <circle cx="14" cy="14" r="4" fill="white"/>
                  </svg>
                </div>
              </button>

              {/* Spacer mirror of sideBtn */}
              <div className={styles.sideBtnPlaceholder} />
            </div>
          </>
        ) : (
          <div className={styles.scanningStatus}>
            <div className={styles.scanningDot} />
            <span>AI 운명 엔진 분석 중...</span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        style={{ display: "none" }}
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </main>
  );
}
