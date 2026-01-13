Write-Host "🔍 MONITORING GitHub Actions for Agaslez/cerber-core (main)" -ForegroundColor Cyan
Write-Host "   Dashboard: https://github.com/Agaslez/cerber-core/actions" -ForegroundColor Gray
Write-Host "   Polling every 15 seconds..." -ForegroundColor Gray
Write-Host ""

$repo = "Agaslez/cerber-core"
$branch = "main"
$maxWait = 3600  # 1 hour
$pollInterval = 15
$startTime = Get-Date
$lastStatus = ""

while ($true) {
    $elapsed = ((Get-Date) - $startTime).TotalSeconds
    
    if ($elapsed -gt $maxWait) {
        Write-Host "❌ Timeout after ${maxWait}s - checks did not complete" -ForegroundColor Red
        Write-Host "   Check manually: https://github.com/$repo/actions" -ForegroundColor Yellow
        break
    }
    
    # Check if push is allowed
    $pushTest = git push origin main --dry-run 2>&1
    
    if ($pushTest -notmatch "error|rejected") {
        Write-Host "✅ $(Get-Date -Format 'HH:mm:ss') - Status checks PASSED!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🚀 Ready to push! Running: git push origin main" -ForegroundColor Green
        git push origin main
        Write-Host ""
        Write-Host "✅ Push successful!" -ForegroundColor Green
        break
    } else {
        $currentStatus = ($pushTest | Select-String -Pattern "error|rejected" | Select-Object -First 1).ToString().Trim()
        
        if ($currentStatus -ne $lastStatus) {
            Write-Host "⏳ $(Get-Date -Format 'HH:mm:ss') - Waiting for checks..." -ForegroundColor Yellow
            Write-Host "   $currentStatus" -ForegroundColor Gray
            $lastStatus = $currentStatus
        } else {
            # Progress indicator
            Write-Host -NoNewline "." -ForegroundColor Cyan
        }
    }
    
    Start-Sleep -Seconds $pollInterval
}
