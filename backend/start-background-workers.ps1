$ErrorActionPreference = 'Stop'

$backendRoot = $PSScriptRoot
$phpExe = 'C:\Users\Administrator\AppData\Local\Microsoft\WinGet\Packages\PHP.PHP.8.3_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe'
$logRoot = Join-Path $backendRoot 'storage\logs'
New-Item -ItemType Directory -Force -Path $logRoot | Out-Null

if (-not (Test-Path -LiteralPath $phpExe)) {
    Write-Error "PHP executable not found: $phpExe"
    exit 1
}

$workers = @(
    @{ Name = 'schedule:work'; Args = @('artisan', 'schedule:work'); PidFile = 'scheduler-worker.pid'; Out = 'scheduler-worker.log'; Err = 'scheduler-worker-error.log' },
    @{ Name = 'queue:work'; Args = @('artisan', 'queue:work', 'database', '--queue=fulfillment,metrics,default', '--timeout=600', '--tries=3', '--sleep=2'); PidFile = 'queue-worker.pid'; Out = 'queue-worker.log'; Err = 'queue-worker-error.log' }
)

foreach ($worker in $workers) {
    $pidPath = Join-Path $logRoot $worker.PidFile
    $recordedPid = 0
    if (Test-Path -LiteralPath $pidPath) { [int]::TryParse((Get-Content -LiteralPath $pidPath -Raw).Trim(), [ref]$recordedPid) | Out-Null }
    $alreadyRunning = if ($recordedPid -gt 0) { Get-CimInstance Win32_Process -Filter "ProcessId=$recordedPid" | Where-Object { $_.Name -eq 'php.exe' -and $_.CommandLine -match ('artisan\s+' + [regex]::Escape($worker.Name)) } }
    if ($alreadyRunning) {
        Write-Host "$($worker.Name) already running."
        continue
    }

    $process = Start-Process -PassThru -FilePath $phpExe `
        -ArgumentList $worker.Args `
        -WorkingDirectory $backendRoot `
        -WindowStyle Hidden `
        -RedirectStandardOutput (Join-Path $logRoot $worker.Out) `
        -RedirectStandardError (Join-Path $logRoot $worker.Err)
    Set-Content -LiteralPath $pidPath -Value $process.Id -NoNewline
    Write-Host "Started $($worker.Name)."
}
