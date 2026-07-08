# run_kg_pipeline.ps1
# 自动 KG pipeline 入口包装脚本 (Windows Task Scheduler 调用此脚本)
#
# 设计:
#   - 切到 E: 盘 (避免 UNC/相对路径问题)
#   - 锁定 Python 路径 (优先用 workbuddy managed 3.13)
#   - 输出重定向到 logs/ 目录 (便于排错)
#   - 任何错误不抛 (让 task scheduler 不卡死)

$ErrorActionPreference = "Continue"

$ProjectDir = "E:\OH-workspace\antenna-tracker"
$PythonExe = "C:\Users\Administrator\.workbuddy\binaries\python\versions\3.13.12\python.exe"
$LogDir = Join-Path $ProjectDir "logs"
$DateStr = Get-Date -Format "yyyy-MM-dd"
$LogFile = Join-Path $LogDir "scheduled_run-$DateStr.log"

# 确保 logs 目录存在
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"[scheduled $Timestamp] ============================================" | Out-File -Append -FilePath $LogFile -Encoding utf8

try {
    Set-Location $ProjectDir

    # 调用 pipeline 脚本
    & $PythonExe "scripts/auto_kg_pipeline.py" 2>&1 |
        ForEach-Object { $_ ; $_ | Out-File -Append -FilePath $LogFile -Encoding utf8 }

    $ExitCode = $LASTEXITCODE
    "[scheduled] exit_code=$ExitCode" | Out-File -Append -FilePath $LogFile -Encoding utf8
    exit $ExitCode
} catch {
    $ErrMsg = $_.Exception.Message
    "[scheduled ERROR] $ErrMsg" | Out-File -Append -FilePath $LogFile -Encoding utf8
    exit 1
}
