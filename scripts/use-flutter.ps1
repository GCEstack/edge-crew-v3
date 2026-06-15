# Convenience helper to put the project-local Flutter + Android SDKs on PATH.
# Run from PowerShell: . .\scripts\use-flutter.ps1
$repoRoot = Split-Path -Parent $PSScriptRoot
$flutterBin = Join-Path $repoRoot '.flutter' 'bin'
$androidSdk = (Get-Item (Join-Path $repoRoot '.android-sdk')).FullName
$cmdlineTools = Join-Path $androidSdk 'cmdline-tools' 'latest' 'bin'
$platformTools = Join-Path $androidSdk 'platform-tools'

$env:ANDROID_HOME = $androidSdk
$env:PATH = "$env:PATH;$flutterBin;$cmdlineTools;$platformTools"
Write-Host "Flutter + Android SDK added to PATH" -ForegroundColor Green
Write-Host "ANDROID_HOME = $androidSdk" -ForegroundColor DarkGray
