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

.NOTES
  - Adds BIN_DIR to system PATH (permanent, requires new terminal)
  - Also sets PATH in current session (immediate use)
  - Requires Windows 10+ built-in tar command
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

function Test-Command {
  param([string]$Command)
  $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

function Invoke-GitHubApi {
  param([string]$Uri, [hashtable]$Headers)

  $maxRetries = 3
  $retryDelay = 2

  for ($i = 0; $i -lt $maxRetries; $i++) {
    try {
      $response = Invoke-RestMethod -Uri $Uri -Headers $Headers -TimeoutSec 30
      return $response
    }
    catch {
      $statusCode = 0
      if ($_.Exception.Response) {
        $statusCode = [int]$_.Exception.Response.StatusCode
      }

      # Rate limited
      if ($statusCode -eq 403) {
        $rateLimitRemaining = $_.Exception.Response.Headers['X-RateLimit-Remaining']
        if ($rateLimitRemaining -eq '0') {
          throw "GitHub API rate limit exceeded. Set GITHUB_TOKEN environment variable for higher limits."
        }
      }

      # Not found
      if ($statusCode -eq 404) {
        throw "GitHub repository or release not found: $Uri"
      }

      # Network error or timeout - retry
      if ($i -lt $maxRetries - 1) {
        Write-Host "[install] Request failed, retrying in ${retryDelay}s... ($($_.Exception.Message))"
        Start-Sleep -Seconds $retryDelay
        $retryDelay *= 2
        continue
      }

      throw "Failed to fetch from GitHub API: $($_.Exception.Message)"
    }
  }
}

function Get-LatestAssetUrl {
  param([string]$Slug)
  $uri = "https://api.github.com/repos/$GithubRepo/releases/latest"
  $hdr = @{ Accept = 'application/vnd.github+json' }
  if ($env:GITHUB_TOKEN) {
    $hdr['Authorization'] = "Bearer $($env:GITHUB_TOKEN)"
  }

  $rel = Invoke-GitHubApi -Uri $uri -Headers $hdr
  $pat = "^claudecode-$([regex]::Escape($Slug))-.+\.tar\.gz$"
  foreach ($a in $rel.assets) {
    if ($a.name -match $pat) {
      return $a.browser_download_url
    }
  }
  throw "No asset matching claudecode-$Slug-*.tar.gz in latest release."
}

function Add-ToSystemPath {
  param([string]$PathToAdd)

  # Get current system PATH
  $systemPath = [Environment]::GetEnvironmentVariable('Path', 'Machine')

  # Check if already in system PATH
  $pathParts = $systemPath -split ';' | Where-Object { $_ -ne '' }
  $normalizedPath = $PathToAdd.TrimEnd('\')

  foreach ($part in $pathParts) {
    if ($part.TrimEnd('\') -eq $normalizedPath) {
      Write-Host "[install] $PathToAdd already in system PATH."
      return $false
    }
  }

  # Add to system PATH
  $newPath = if ($systemPath.EndsWith(';')) {
    $systemPath + $PathToAdd
  } else {
    $systemPath + ';' + $PathToAdd
  }

  try {
    [Environment]::SetEnvironmentVariable('Path', $newPath, 'Machine')
    Write-Host "[install] Added $PathToAdd to system PATH (permanent)."
    return $true
  }
  catch {
    Write-Host "[install] WARN: Failed to add to system PATH: $($_.Exception.Message)"
    Write-Host "[install] You may need to run as Administrator, or add manually."
    return $false
  }
}

function Add-ToCurrentSessionPath {
  param([string]$PathToAdd)

  $normalizedPath = $PathToAdd.TrimEnd('\')
  $currentPath = $env:PATH

  # Check if already in current session PATH
  $pathParts = $currentPath -split ';' | Where-Object { $_ -ne '' }
  foreach ($part in $pathParts) {
    if ($part.TrimEnd('\') -eq $normalizedPath) {
      return
    }
  }

  $env:PATH = $PathToAdd + ';' + $currentPath
  Write-Host "[install] Added $PathToAdd to PATH in current session (temporary)."
}

# Pre-flight checks
Write-Host "[install] GitHub repo: $GithubRepo"
Write-Host "[install] Platform: windowsX64"

if (-not (Test-Command 'tar')) {
  throw "tar command not found. Windows 10+ (1803+) is required for built-in tar support."
}

$url = Get-LatestAssetUrl -Slug 'windowsX64'
Write-Host "[install] Downloading:`n          $url"

$tmp = Join-Path ([System.IO.Path]::GetTempPath()) ("claudecode-install-" + [Guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $tmp | Out-Null
$tmpCleaned = $false

try {
  $tarGz = Join-Path $tmp 'bundle.tar.gz'
  $hdr = @{}
  if ($env:GITHUB_TOKEN) {
    $hdr['Authorization'] = "Bearer $($env:GITHUB_TOKEN)"
  }

  Write-Host "[install] Downloading archive..."
  Invoke-WebRequest -Uri $url -OutFile $tarGz -Headers $hdr -TimeoutSec 300

  # Verify download
  if (-not (Test-Path $tarGz) -or (Get-Item $tarGz).Length -eq 0) {
    throw "Download failed or file is empty"
  }
  Write-Host "[install] Download verify: $((Get-Item $tarGz).Length) bytes"

  $extract = Join-Path $tmp 'extract'
  New-Item -ItemType Directory -Path $extract | Out-Null

  Write-Host "[install] Extracting archive..."
  tar -xzf $tarGz -C $extract 2>&1
  if ($LASTEXITCODE -ne 0) { throw 'tar extraction failed' }

  $exe = Join-Path $extract 'claudecode.exe'
  if (-not (Test-Path $exe)) {
    # Debug: list archive contents
    Write-Host "[install] Archive contents:"
    Get-ChildItem -Path $extract -Recurse | ForEach-Object { Write-Host "  $($_.FullName)" }
    throw 'claudecode.exe not found inside archive'
  }

  # Create directories
  New-Item -ItemType Directory -Force -Path $DataDir | Out-Null
  New-Item -ItemType Directory -Force -Path $BinDir | Out-Null

  # Install binary
  $targetExe = Join-Path $DataDir 'claudecode.exe'
  Copy-Item -Force $exe $targetExe
  Write-Host "[install] Installed binary: $targetExe"

  # Copy .env.example if exists
  $envExample = Join-Path $extract '.env.example'
  $envFile = Join-Path $DataDir '.env'
  if ((Test-Path $envExample) -and -not (Test-Path $envFile)) {
    Copy-Item $envExample $envFile
    Write-Host "[install] Created $envFile from .env.example — edit API keys."
  }
  elseif (-not (Test-Path $envFile)) {
    Write-Host "[install] Create $envFile manually (see README)."
  }

  # Create launcher script with proper escaping
  $launcher = Join-Path $BinDir 'claudecode.cmd'
  $escapedDataDir = $DataDir -replace '"', '""'
  @"
@echo off
set "CLAUDE_CODE_INSTALL_PREFIX=$escapedDataDir"
"$escapedDataDir\claudecode.exe" %*
"@ | Set-Content -Path $launcher -Encoding ASCII

  # Verify installation
  if (-not (Test-Path $targetExe)) {
    throw "Binary installation failed: $targetExe not found"
  }
  if (-not (Test-Path $launcher)) {
    throw "Launcher creation failed: $launcher not found"
  }

  Write-Host ""
  Write-Host "[install] Binary:    $targetExe"
  Write-Host "[install] Launcher:  $launcher"
  Write-Host "[install] Config:    $envFile"
  Write-Host ""

  # Add to PATH
  Add-ToSystemPath -PathToAdd $BinDir
  Add-ToCurrentSessionPath -PathToAdd $BinDir

  Write-Host ""
  Write-Host "[install] Installation complete!"
  Write-Host "[install] - Current terminal: run 'claudecode' now"
  Write-Host "[install] - New terminals: will have claudecode in PATH automatically"
  Write-Host ""

  # Smoke test
  Write-Host "[install] Smoke test: claudecode -v"
  $smokeOutput = & "$launcher" -v 2>&1
  if ($LASTEXITCODE -eq 0) {
    Write-Host "[install]   OK: $smokeOutput"
  } else {
    Write-Host "[install]   WARN: exit code $LASTEXITCODE (may still work in TUI mode)"
  }

  # Cleanup
  Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
  $tmpCleaned = $true
}
finally {
  if (-not $tmpCleaned -and (Test-Path $tmp)) {
    Write-Host "[install] WARN: Temp directory not cleaned: $tmp"
    Write-Host "[install] You may delete it manually if needed."
  }
}
