"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./scan.module.css";

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [torch, setTorch] = useState(false);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const router = useRouter();

  const analysisSteps = [
    "장치 수평 확인 및 조도 보정 중...",
    "손바닥 중심부(Palm Center) 탐색 및 정렬",
    "스마트 자동 줌(Auto-Zoom) 실행 중...",
    "배경 노이즈 제거 및 실루엣(Silhouette) 추출",
    "강화학습 기반 블루프린트(Blueprint) 필터 적용",
    "뉴럴 네트워크 지문 및 주요선 정밀 매핑",
    "RL 모듈 가중치 동기화 및 해석 스타일 로드",
    "최종 운명 데이터 리포트 암호화 생성 완료"
  ];

  // Helper to process image (Auto-zoom & Styling)
  const processHandImage = (rawData: string) => {
    return new Promise<string>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(rawData);

        // 1. Auto-Zoom (Crop toward center)
        const size = Math.min(img.width, img.height);
        const zoomFactor = 0.65; // Focus on center 65%
        const sourceSize = size * zoomFactor;
        const sourceX = (img.width - sourceSize) / 2;
        const sourceY = (img.height - sourceSize) / 2;

        canvas.width = 600; // Output normalized size
        canvas.height = 600;

        // 2. Blueprint Stylization
        ctx.fillStyle = "#020205"; // Deep background
        ctx.fillRect(0, 0, 600, 600);
        
        // Draw centered and zoomed with high contrast
        ctx.filter = "contrast(1.5) brightness(1.1) grayscale(1)"; 
        ctx.drawImage(
          img,
          sourceX, sourceY, sourceSize, sourceSize,
          0, 0, 600, 600
        );

        // Add a "Blueprint Tint" (Cyan glow overlay)
        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = "rgba(0, 242, 255, 0.2)"; 
        ctx.fillRect(0, 0, 600, 600);
        
        // Add subtle edge glow effect
        ctx.strokeStyle = "rgba(0, 242, 255, 0.5)";
        ctx.lineWidth = 2;
        ctx.strokeRect(5, 5, 590, 590);

        resolve(canvas.toDataURL("image/jpeg", 0.9));
      };
      img.src = rawData;
    });
  };

  useEffect(() => {
    async function startCamera() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          } 
        });
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } catch (err) {
        console.error("Camera access denied:", err);
        alert("카메라 권한이 필요합니다. 설정에서 허용해주세요.");
      }
    }
    startCamera();

    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  useEffect(() => {
    if (isScanning) {
      let step = 0;
      const logInterval = setInterval(() => {
        if (step < analysisSteps.length) {
          setScanLogs(prev => [...prev.slice(-2), analysisSteps[step]]);
          step++;
        } else {
          clearInterval(logInterval);
        }
      }, 800); // More deliberate pace for trust
      return () => clearInterval(logInterval);
    } else {
      setScanLogs([]);
    }
  }, [isScanning]);

  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    const capabilities = track.getCapabilities() as any;
    
    if (capabilities.torch) {
      try {
        await track.applyConstraints({
          advanced: [{ torch: !torch }] as any
        });
        setTorch(!torch);
      } catch (e) {
        console.error("Torch error:", e);
      }
    } else {
      alert("이 기기에서는 플래시를 지원하지 않습니다.");
    }
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Apply slight contrast enhancement for better line detection
        context.filter = "contrast(1.1) brightness(1.05)";
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const rawData = canvas.toDataURL("image/jpeg", 0.85);
        const processed = await processHandImage(rawData);
        
        setPreviewImage(processed);
        setIsScanning(true);
        sessionStorage.setItem("capturedPalm", processed);
        
        setTimeout(() => {
          router.push("/result");
        }, 6500); 
      }
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("File selected:", file.name);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const rawData = event.target?.result as string;
        const processed = await processHandImage(rawData);
        
        setPreviewImage(processed);
        sessionStorage.setItem("capturedPalm", processed);
        setIsScanning(true);
        
        setTimeout(() => {
          router.push("/result");
        }, 6500); // Optimized for "Labor Illusion" trust (6.5s)
      };
      reader.onerror = (err) => {
        console.error("FileReader error:", err);
        alert("사진을 읽어오는데 실패했습니다.");
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <main className={styles.container}>
      <div className={styles.cameraWrapper}>
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className={`${styles.video} ${isScanning ? styles.hidden : ""}`}
        />
        
        {isScanning && previewImage && (
          <>
            <img src={previewImage} alt="Scan Preview" className={styles.preview} />
            <div className={styles.handHighlightMask}></div>
            <div className={styles.dataPointsOverlay}>
              {[...Array(6)].map((_, i) => (
                <div 
                  key={i} 
                  className={styles.dataPoint} 
                  style={{ 
                    top: `${30 + Math.random() * 40}%`, 
                    left: `${25 + Math.random() * 50}%`,
                    animationDelay: `${i * 0.4}s`
                  }} 
                />
              ))}
            </div>
            <div className={styles.logOverlay}>
              {scanLogs.map((log, i) => (
                <div key={i} className={styles.logLine}>{log}</div>
              ))}
            </div>
          </>
        )}
        
        <div className={styles.overlay}>
          <div className={styles.handGuide}>
            <div className={styles.cornerTopLeft}></div>
            <div className={styles.cornerTopRight}></div>
            <div className={styles.cornerBottomLeft}></div>
            <div className={styles.cornerBottomRight}></div>
          </div>
          {isScanning && <div className={styles.scannerLine}></div>}
        </div>

        <div className={styles.topControls}>
          <button onClick={() => router.back()} className={styles.iconBtn}>✕</button>
          {!isScanning && (
            <button onClick={toggleTorch} className={`${styles.iconBtn} ${torch ? styles.active : ""}`}>
              {torch ? "🔦" : "💡"}
            </button>
          )}
        </div>

        <div className={styles.bottomControls}>
          <h2 className="mystical-font text-center mb-4">
            {isScanning ? "AI 운명 엔진 정밀 분석 중..." : "운명을 스캔하거나 사진을 불러오세요"}
          </h2>
          
          <div className={styles.btnGroup}>
            {!isScanning && (
              <>
                <button 
                  onClick={capturePhoto} 
                  className="btn-primary"
                >
                  운명 스캔하기
                </button>

                <button 
                  onClick={triggerUpload} 
                  className={styles.uploadBtn}
                >
                  🖼️ 갤러리에서 사진 선택
                </button>
              </>
            )}
            
            {isScanning && (
              <div className={styles.scanningBadge}>RL Self-Learning Active</div>
            )}

            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              onChange={handleFileUpload} 
              style={{ display: 'none' }} 
            />
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </main>
  );
}
