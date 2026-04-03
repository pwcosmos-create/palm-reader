"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./scan.module.css";

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function startCamera() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "environment" } 
        });
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } catch (err) {
        console.error("Camera access denied:", err);
        alert("카메라 권한이 필요합니다.");
      }
    }
    startCamera();

    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        setIsScanning(true);
        const imageData = canvas.toDataURL("image/jpeg", 0.7);
        
        // Save to session storage or pass via state
        sessionStorage.setItem("capturedPalm", imageData);
        
        // Simulate 'AI Scanning' delay
        setTimeout(() => {
          router.push("/result");
        }, 2000);
      }
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
        
        {/* Mystical Overlay */}
        <div className={styles.overlay}>
          <div className={styles.handGuide}>
            <div className={styles.guideLine}></div>
          </div>
          {isScanning && <div className="pulsing-line" style={{ top: '50%' }}></div>}
        </div>

        <div className={styles.controls}>
          <h2 className="mystical-font text-center mb-4">손바닥을 가이드에 맞춰주세요</h2>
          <button 
            onClick={capturePhoto} 
            className="btn-primary"
            disabled={isScanning}
          >
            {isScanning ? "AI 분석 중..." : "운명 스캔하기"}
          </button>
        </div>
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </main>
  );
}
