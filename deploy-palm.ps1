$HOST_IP = "ubuntu@168.107.8.134"
$SSH_KEY = ".\oracle_key.pem"
$REMOTE_PATH = "/home/ubuntu/손금/"

Write-Host "--------------------------------------------------" -ForegroundColor Cyan
Write-Host "🔮 AI 손금 프로젝트 고성능 배포 (ZIP 모드)" -ForegroundColor Cyan
Write-Host "--------------------------------------------------" -ForegroundColor Cyan

# 1. 로컬 빌드 수행
Write-Host "🏗️ 최신 버전 빌드 중... (npm run build)" -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 빌드 실패! 배포를 중단합니다." -ForegroundColor Red
    exit
}

# 2. 파일 압축
Write-Host "📦 배포 파일 압축 중..." -ForegroundColor Yellow
$ZIP_FILE = "deploy.zip"
if (Test-Path $ZIP_FILE) { Remove-Item $ZIP_FILE }
Compress-Archive -Path .next, public, src, package.json, next.config.ts, tsconfig.json -DestinationPath $ZIP_FILE

# 3. 서버로 전송 (SCP)
Write-Host "📤 오라클 클라우드로 압축 파일 전송 중..." -ForegroundColor Green
scp -i $SSH_KEY -o StrictHostKeyChecking=no $ZIP_FILE "$($HOST_IP):/home/ubuntu/"

# 4. 서버에서 압축 해제 (SSH)
Write-Host "🔓 서버에서 압축 해제 및 배포 중..." -ForegroundColor Green
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $HOST_IP "mkdir -p $REMOTE_PATH; unzip -o /home/ubuntu/$ZIP_FILE -d $REMOTE_PATH; rm /home/ubuntu/$ZIP_FILE"

Write-Host "✅ 서버 업로드 및 배포 완료!" -ForegroundColor Green
Write-Host "💡 서버에서 'pm2 restart palm' 처리가 필요할 수 있습니다." -ForegroundColor Gray
