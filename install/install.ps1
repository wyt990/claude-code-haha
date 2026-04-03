#Requires -Version 5.1
<#
.SYNOPSIS
  Install latest claudecode release from GitHub (Windows x64).

.EXAMPLE
  irm https://raw.githubusercontent.com/OWNER/REPO/main/install/install.ps1 | iex

  $env:GITHUB_TOKEN = 'ghp_xxx'   # optional, higher API limit
  irm ... | iex

  $env:GITHUB_REPO = 'owner/repo'
  irm ... | iex
#>

$ErrorActionPreference = 'Stop'

$GithubRepo = if ($env:GITHUB_REPO) { $env:GITHUB_REPO } else { 'wyt990/claude-code-haha' }
$DataDir = if ($env:CLAUDE_CODE_INSTALL_DIR) {
  $env:CLAUDE_CODE_INSTALL_DIR
} else {
  Join-Path $env:LOCALAPPDATA 'claude-code-local'
}

$BinDir = if ($env:CLAUDE_CODE_BIN_DIR) {
  $env:CLAUDE_CODE_BIN_DIR
} else {
  Join-Path $env:USERPROFILE '.local\bin'
}

function Get-LatestAssetUrl {
  param([string]$Slug)
  $uri = "https://api.github.com/repos/$GithubRepo/releases/latest"
  $hdr = @{ Accept = 'application/vnd.github+json' }
  if ($env:GITHUB_TOKEN) {
    $hdr['Authorization'] = "Bearer $($env:GITHUB_TOKEN)"
  }
  $rel = Invoke-RestMethod -Uri $uri -Headers $hdr
  $pat = "^claudecode-$([regex]::Escape($Slug))-.+\.tar\.gz$"
  foreach ($a in $rel.assets) {
    if ($a.name -match $pat) {
      return $a.browser_download_url
    }
  }
  throw "No asset matching claudecode-$Slug-*.tar.gz in latest release."
}

Write-Host "[install] GitHub repo: $GithubRepo"
Write-Host "[install] Platform: windowsX64"

$url = Get-LatestAssetUrl -Slug 'windowsX64'
Write-Host "[install] Downloading:`n          $url"

$tmp = Join-Path ([System.IO.Path]::GetTempPath()) ("claudecode-install-" + [Guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $tmp | Out-Null
try {
  $tarGz = Join-Path $tmp 'bundle.tar.gz'
  $hdr = @{}
  if ($env:GITHUB_TOKEN) {
    $hdr['Authorization'] = "Bearer $($env:GITHUB_TOKEN)"
  }
  Invoke-WebRequest -Uri $url -OutFile $tarGz -Headers $hdr

  $extract = Join-Path $tmp 'extract'
  New-Item -ItemType Directory -Path $extract | Out-Null
  tar -xzf $tarGz -C $extract
  if ($LASTEXITCODE -ne 0) { throw 'tar extraction failed (Windows 10+ built-in tar required)' }

  $exe = Join-Path $extract 'claudecode.exe'
  if (-not (Test-Path $exe)) { throw 'claudecode.exe not found inside archive' }

  New-Item -ItemType Directory -Force -Path $DataDir | Out-Null
  Copy-Item -Force $exe (Join-Path $DataDir 'claudecode.exe')

  $envExample = Join-Path $extract '.env.example'
  $envFile = Join-Path $DataDir '.env'
  if ((Test-Path $envExample) -and -not (Test-Path $envFile)) {
    Copy-Item $envExample $envFile
    Write-Host "[install] Created $envFile from .env.example — edit API keys."
  }
  elseif (-not (Test-Path $envFile)) {
    Write-Host "[install] Create $envFile manually (see README)."
  }

  New-Item -ItemType Directory -Force -Path $BinDir | Out-Null
  $launcher = Join-Path $BinDir 'claudecode.cmd'
  @"
@echo off
set "CLAUDE_CODE_INSTALL_PREFIX=$DataDir"
"$DataDir\claudecode.exe" %*
"@ | Set-Content -Path $launcher -Encoding ASCII

  Write-Host ""
  Write-Host "[install] Binary:    $(Join-Path $DataDir 'claudecode.exe')"
  Write-Host "[install] Launcher:  $launcher"
  Write-Host "[install] Config:    $envFile"
  Write-Host ""
  Write-Host "[install] Add '$BinDir' to your user PATH if needed (Settings → Environment), then run: claudecode"
}
finally {
  Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
}
