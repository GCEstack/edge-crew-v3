# Build the Flutter APK using the project-local Flutter + Android SDKs.
# Run from PowerShell: .\scripts\build-mobile.ps1
param(
  [string]$ApiBaseUrl = "https://api.edgecrew.io",
  [Parameter(Mandatory=$true)]
  [string]$SupabaseUrl,
  [Parameter(Mandatory=$true)]
  [string]$SupabaseAnonKey
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$flutterBin = Join-Path $repoRoot '.flutter' 'bin'
$androidSdk = (Get-Item (Join-Path $repoRoot '.android-sdk')).FullName
$cmdlineTools = Join-Path $androidSdk 'cmdline-tools' 'latest' 'bin'
$platformTools = Join-Path $androidSdk 'platform-tools'

$env:ANDROID_HOME = $androidSdk
$env:PATH = "$env:PATH;$flutterBin;$cmdlineTools;$platformTools"

Set-Location (Join-Path $repoRoot 'mobile')

flutter build apk `
  --dart-define=API_BASE_URL=$ApiBaseUrl `
  --dart-define=SUPABASE_URL=$SupabaseUrl `
  --dart-define=SUPABASE_ANON_KEY=$SupabaseAnonKey
