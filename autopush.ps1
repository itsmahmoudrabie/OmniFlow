# autopush.ps1
# This script monitors your folder for changes, automatically pulls remote updates to avoid conflicts,
# commits your local work, and pushes it to GitHub.

$delaySeconds = 15
Write-Host "==========================================" -ForegroundColor Green
Write-Host "   OmniFlow GitHub Auto-Sync Service      " -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Watching for changes every $delaySeconds seconds. Press Ctrl+C to stop.`n" -ForegroundColor Cyan

# Configure git to avoid warning about pull rebase behavior
git config pull.rebase true

while ($true) {
    # 1. Fetch remote updates first to check if we are out of sync
    # This keeps your local workspace updated with GitHub (like bot merges)
    $status = git status --porcelain
    
    if ($status) {
        Write-Host "[( $(Get-Date -Format 'HH:mm:ss') )] Changes detected:" -ForegroundColor Yellow
        Write-Host $status
        
        Write-Host "1. Staging changes..." -ForegroundColor Gray
        git add .
        
        Write-Host "2. Committing changes..." -ForegroundColor Gray
        $commitMessage = "auto-commit: local updates ($(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))"
        git commit -m $commitMessage
        
        Write-Host "3. Pulling remote changes (rebase) to prevent conflicts..." -ForegroundColor Gray
        git pull --rebase origin main
        
        Write-Host "4. Pushing to GitHub..." -ForegroundColor Gray
        git push origin main
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Successfully pushed to GitHub!`n" -ForegroundColor Green
        } else {
            Write-Host "❌ Push failed. Will retry in next cycle.`n" -ForegroundColor Red
        }
    } else {
        # If no local changes, just do a pull every few cycles to stay updated with remote
        # We can pull silently
        git pull --rebase origin main > $null 2>&1
    }
    
    Start-Sleep -Seconds $delaySeconds
}
