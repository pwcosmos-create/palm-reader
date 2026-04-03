"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./scan.module.css";

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
        const canvas = document.createElement("canvas");
        canvas.width = 600;
        canvas.height = 600;
        const ctx = canvas.getContext("2d")!;

        const size = Math.min(img.width, img.height) * 0.65;
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;

        ctx.fillStyle = "#020205";
        ctx.fillRect(0, 0, 600, 600);
        ctx.filter = "contrast(1.5) brightness(1.1) grayscale(1)";
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 600, 600);

        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = "rgba(0, 242, 255, 0.18)";
        ctx.fillRect(0, 0, 600, 600);

        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = "rgba(0, 242, 255, 0.4)";
        ctx.lineWidth = 2;
        ctx.strokeRect(4, 4, 592, 592);

        resolve(canvas.toDataURL("image/jpeg", 0.9));
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
  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.filter = "contrast(1.1) brightness(1.05)";
    ctx.drawImage(video, 0, 0);
    beginScan(canvas.toDataURL("image/jpeg", 0.85));
  };

  // ── Upload from gallery ───────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => beginScan(ev.target?.result as string);
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

      {/* ── Bottom panel ── */}
      <div className={styles.bottomPanel}>
        {!isScanning ? (
          <>
            <p className={styles.hint}>손바닥을 펴고 카메라에 가까이 대세요</p>

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
