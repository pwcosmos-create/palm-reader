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
    "장치 수평 확인 중...",
    "손바닥 영역 감지 완료",
    "배경 노이즈 제거 및 손 모양 추출 중",
    "지문 및 주요선 추출 (Confidence: 98%)",
    "RL 모델 가중치 동기화 중...",
    "개인화 분석 톤 설정 완료",
    "운명의 연결 고리 생성 중..."
  ];

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
      }, 500);
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

  const capturePhoto = () => {
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
        
        const imageData = canvas.toDataURL("image/jpeg", 0.85); // High quality for RL
        setPreviewImage(imageData);
        setIsScanning(true);
        
        sessionStorage.setItem("capturedPalm", imageData);
        
        setTimeout(() => {
          router.push("/result");
        }, 4000); // Extended for trust & analysis feel
      }
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("File selected:", file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        setPreviewImage(imageData);
        sessionStorage.setItem("capturedPalm", imageData);
        setIsScanning(true);
        // Simulate a longer delay for "Trust" analysis
        setTimeout(() => {
          router.push("/result");
        }, 3500);
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
