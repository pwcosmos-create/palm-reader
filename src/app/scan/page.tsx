"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./scan.module.css";

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [torch, setTorch] = useState(false);
  const router = useRouter();

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
        
        setIsScanning(true);
        const imageData = canvas.toDataURL("image/jpeg", 0.85); // High quality for RL
        
        sessionStorage.setItem("capturedPalm", imageData);
        
        setTimeout(() => {
          router.push("/result");
        }, 2500); // Mystical scanning delay
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        sessionStorage.setItem("capturedPalm", imageData);
        setIsScanning(true);
        setTimeout(() => {
          router.push("/result");
        }, 2000);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.cameraWrapper}>
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className={styles.video}
        />
        
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
          <button onClick={toggleTorch} className={`${styles.iconBtn} ${torch ? styles.active : ""}`}>
            {torch ? "🔦" : "💡"}
          </button>
        </div>

        <div className={styles.bottomControls}>
          <h2 className="mystical-font text-center mb-4">손바닥을 가이드에 맞춰 촬영하거나 사진을 업로드하세요</h2>
          
          <div className={styles.btnGroup}>
            <button 
              onClick={capturePhoto} 
              className="btn-primary"
              disabled={isScanning}
            >
              {isScanning ? "AI 분석 중..." : "운명 스캔하기"}
            </button>

            <label className={styles.uploadBtn}>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload} 
                style={{ display: 'none' }} 
              />
              🖼️ 사진 불러오기
            </label>
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </main>
  );
}
