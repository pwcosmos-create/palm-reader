$HOST_IP = "ubuntu@168.107.8.134"
$SSH_KEY = "C:\dev\아린인스타그램\oracle_key.pem"
$REMOTE_PATH = "/home/ubuntu/손금/"

Write-Host "--------------------------------------------------" -ForegroundColor Cyan
Write-Host "🔮 AI 손금 프로젝트 고성능 배포 시작" -ForegroundColor Cyan
Write-Host "--------------------------------------------------" -ForegroundColor Cyan

# 1. 로컬 빌드 수행
Write-Host "🏗️ 최신 버전 빌드 중... (npm run build)" -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 빌드 실패! 배포를 중단합니다." -ForegroundColor Red
    exit
}

# 2. 서버로 전송 (SCP)
Write-Host "📤 오라클 클라우드로 파일 전송 중..." -ForegroundColor Green

# 주요 폴더 및 파일 전송 (node_modules 제외)
scp -i $SSH_KEY -o StrictHostKeyChecking=no -r .next\ public\ src\ package.json next.config.ts tsconfig.json "$($HOST_IP):$($REMOTE_PATH)"

Write-Host "✅ 서버 업로드 및 배포 완료!" -ForegroundColor Green
Write-Host "💡 서버에서 'npm install' 및 'pm2 restart palm' 처리가 필요할 수 있습니다." -ForegroundColor Gray
