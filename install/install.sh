#!/usr/bin/env bash
# One-liner (read before run):
#   curl -fsSL https://raw.githubusercontent.com/OWNER/REPO/main/install/install.sh | bash
# Or with a private / higher rate limit:
#   curl -fsSL ... | GITHUB_TOKEN=ghp_xxx bash
#
# Env (optional):
#   GITHUB_REPO=owner/repo          default: wyt990/claude-code-haha
#   CLAUDE_CODE_INSTALL_DIR=path  default: ~/.local/share/claude-code-local (or XDG_DATA_HOME)
#   CLAUDE_CODE_BIN_DIR=path        default: ~/.local/bin
#   GITHUB_TOKEN                    optional; raises GitHub API rate limit
#   CLAUDE_CODE_SKIP_SHELL_RC=1     do not modify ~/.bashrc / ~/.zshrc
#   INSTALL_VERBOSE=1               extra debug lines ([install] debug: ...)

set -euo pipefail

GITHUB_REPO="${GITHUB_REPO:-wyt990/claude-code-haha}"

PATH_BLOCK_START='### claude-code-local PATH (install.sh) ###'
PATH_BLOCK_END='### end claude-code-local PATH ###'

_default_data_dir() {
  if [ -n "${XDG_DATA_HOME:-}" ]; then
    echo "${XDG_DATA_HOME}/claude-code-local"
  else
    echo "${HOME}/.local/share/claude-code-local"
  fi
}

INSTALL_DIR="${CLAUDE_CODE_INSTALL_DIR:-$(_default_data_dir)}"
BIN_DIR="${CLAUDE_CODE_BIN_DIR:-${HOME}/.local/bin}"
REAL_BIN_NAME="claudecode"

die() {
  echo "install.sh: $*" >&2
  exit 1
}

log() {
  printf '%s\n' "[install] $*"
}

debug() {
  if [ "${INSTALL_VERBOSE:-}" = 1 ]; then
    printf '%s\n' "[install] debug: $*" >&2
  fi
}

command -v curl >/dev/null 2>&1 || die "curl is required"

is_musl_linux() {
  if [ -f /etc/alpine-release ]; then
    return 0
  fi
  local out
  out="$(ldd /bin/ls 2>&1 || true)"
  echo "$out" | grep -q musl && return 0
  return 1
}

detect_archive_slug() {
  local os arch
  os="$(uname -s)"
  arch="$(uname -m)"
  case "$os" in
    Darwin)
      case "$arch" in
        arm64) echo darwinArm64 ;;
        x86_64) echo darwinX64 ;;
        *) die "unsupported macOS architecture: $arch (need arm64 or x86_64)" ;;
      esac
      ;;
    Linux)
      case "$arch" in
        x86_64)
          if is_musl_linux; then
            echo linuxX64-musl
          else
            echo linuxX64
          fi
          ;;
        aarch64 | arm64) echo linuxArm64 ;;
        *) die "unsupported Linux architecture: $arch" ;;
      esac
      ;;
    MINGW* | MSYS* | CYGWIN*)
      echo windowsX64
      ;;
    *)
      die "unsupported OS: $os (use install/install.ps1 on Windows, or build from source)"
      ;;
  esac
}

pick_download_url() {
  local slug="$1"
  local api="https://api.github.com/repos/${GITHUB_REPO}/releases/latest"
  local json auth=()
  if [ -n "${GITHUB_TOKEN:-}" ]; then
    auth=(-H "Authorization: Bearer ${GITHUB_TOKEN}")
  fi
  log "Fetching release metadata (latest) …"
  json="$(curl -fsSL "${auth[@]}" -H "Accept: application/vnd.github+json" "$api")" ||
    die "failed to fetch ${api} (set GITHUB_TOKEN if rate-limited)"

  if command -v jq >/dev/null 2>&1; then
    # Regex must NOT use "\\(" around $slug — jq/oniguruma "unmatched close parenthesis".
    # Require "-[0-9]" after slug so "linuxX64" does not match "linuxX64-musl" archives.
    echo "$json" |
      jq -r --arg slug "$slug" '
        [ .assets[]
          | select((.name | type) == "string" and (.name | test("^claudecode-\($slug)-[0-9].+\\.tar\\.gz$")))
        ]
        | if length == 0 then empty else max_by(.name) | .browser_download_url end'
    return 0
  fi

  if command -v python3 >/dev/null 2>&1; then
    echo "$json" | python3 -c "
import json, re, sys
slug = sys.argv[1]
pat = re.compile(r'^claudecode-' + re.escape(slug) + r'-[0-9].+\.tar\.gz\$')
data = json.load(sys.stdin)
best = None
for a in data.get('assets', []):
    name = a.get('name') or ''
    if pat.match(name):
        url = a.get('browser_download_url', '')
        if not best or name > best[0]:
            best = (name, url)
if best:
    print(best[1])
" "$slug"
    return 0
  fi

  die "need jq or python3 to parse GitHub API JSON"
}

path_has_bin_dir() {
  case ":${PATH}:" in
    *:"${BIN_DIR}":*) return 0 ;;
    *) return 1 ;;
  esac
}

append_path_block_to_rc() {
  local rc="$1"
  [ -n "$rc" ] || return 0
  if [ ! -f "$rc" ]; then
    log "Shell rc not found, creating: $rc"
    touch "$rc" || {
      log "WARN: cannot create $rc — add PATH yourself (see below)"
      return 1
    }
  fi
  if grep -qF "$PATH_BLOCK_START" "$rc" 2>/dev/null; then
    log "PATH block already in $rc — skip"
    return 0
  fi
  {
    echo ""
    echo "$PATH_BLOCK_START"
    echo "# $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
    printf 'export PATH="%s:$PATH"\n' "$BIN_DIR"
    echo "$PATH_BLOCK_END"
  } >>"$rc" || {
    log "WARN: cannot append to $rc"
    return 1
  }
  log "Appended PATH export to $rc"
}

verify_extracted_bundle() {
  local root="$1"
  debug "extract root listing:"
  (cd "$root" && ls -la) 2>/dev/null | while IFS= read -r line; do debug "  $line"; done || true
  [ -d "$root" ] || die "extract directory missing: $root"
  local count
  count="$(find "$root" -mindepth 1 -maxdepth 1 2>/dev/null | wc -l | tr -d ' ')"
  log "Extract verify: $count top-level item(s) under temp extract dir"
  [ "${count:-0}" -gt 0 ] || die "archive appears empty after extract"
}

verify_installed_files() {
  local inner_bin="$1"
  local wrapper="$2"
  log "Post-install verify:"
  for f in "$inner_bin" "$wrapper"; do
    if [ ! -e "$f" ]; then
      die "missing after install: $f"
    fi
    if [ ! -x "$f" ]; then
      die "not executable after install: $f"
    fi
    log "  OK exists+executable: $f"
  done
}

smoke_test_launcher() {
  local wrapper="$1"
  log "Smoke test: $wrapper -v …"
  set +e
  local out ec
  out="$("$wrapper" -v 2>&1)"
  ec=$?
  set -e
  if [ "$ec" -eq 0 ]; then
    log "  launcher -v exit=0 (first line): $(printf '%s' "$out" | head -n1)"
  else
    log "  WARN launcher -v exit=$ec — binary may still work in TUI; output:"
    printf '%s\n' "$out" | head -n5 | while IFS= read -r line; do log "    $line"; done
  fi
}

main() {
  # tmp must NOT be local: EXIT trap runs after main returns; with set -u, local tmp is gone
  local slug url tar_path inner env_example wrapper
  log "HOME=${HOME}"
  mkdir -p "$INSTALL_DIR" "$BIN_DIR" || die "cannot create install directories"
  BIN_DIR="$(cd "$BIN_DIR" && pwd)"
  INSTALL_DIR="$(cd "$INSTALL_DIR" && pwd)"
  log "Resolved BIN_DIR=${BIN_DIR}"
  log "Resolved INSTALL_DIR=${INSTALL_DIR}"
  debug "PATH(before)=${PATH}"

  slug="$(detect_archive_slug)"
  log "GitHub repo: ${GITHUB_REPO}"
  log "Detected archive platform: ${slug}"

  url="$(pick_download_url "$slug")"
  [ -n "$url" ] || die "no matching asset claudecode-${slug}-*.tar.gz in latest release (build & upload release first)"

  log "Selected download URL:"
  log "  $url"

  tmp="$(mktemp -d "${TMPDIR:-/tmp}/claudecode-install.XXXXXX")"
  trap 'rm -rf "$tmp"' EXIT
  debug "temp dir: $tmp"

  tar_path="${tmp}/bundle.tar.gz"
  log "Downloading archive (progress on stderr) …"
  if [ -n "${GITHUB_TOKEN:-}" ]; then
    curl -fL --progress-bar -H "Authorization: Bearer ${GITHUB_TOKEN}" -o "$tar_path" "$url"
  else
    curl -fL --progress-bar -o "$tar_path" "$url"
  fi
  [ -s "$tar_path" ] || die "downloaded file is empty: $tar_path"
  log "Download verify: $(wc -c <"$tar_path" | tr -d ' ') bytes -> $tar_path"

  mkdir -p "$tmp/extract"
  log "Extracting tar.gz …"
  tar -xzf "$tar_path" -C "$tmp/extract"
  verify_extracted_bundle "$tmp/extract"

  if [ "$slug" = "windowsX64" ]; then
    REAL_BIN_NAME="claudecode.exe"
  fi

  inner="${tmp}/extract/${REAL_BIN_NAME}"
  if [ ! -f "$inner" ]; then
    log "ERROR: expected payload not at ${inner}"
    log "Top of archive (for debugging):"
    (cd "$tmp/extract" && find . -maxdepth 3 -type f 2>/dev/null) | head -n40 | while IFS= read -r p; do log "  $p"; done
    die "expected ${REAL_BIN_NAME} inside archive (wrong layout or platform bundle?)"
  fi
  log "Extract verify: found payload $inner"

  log "Installing binary -> ${INSTALL_DIR}/${REAL_BIN_NAME}"
  install -m 0755 "$inner" "${INSTALL_DIR}/${REAL_BIN_NAME}"

  env_example="${tmp}/extract/.env.example"
  if [ -f "$env_example" ] && [ ! -f "${INSTALL_DIR}/.env" ]; then
    install -m 0600 "$env_example" "${INSTALL_DIR}/.env"
    log "Created ${INSTALL_DIR}/.env from .env.example — edit API keys before use."
  elif [ ! -f "${INSTALL_DIR}/.env" ]; then
    log "No .env.example in archive; create ${INSTALL_DIR}/.env yourself (see README)."
  fi

  wrapper="${BIN_DIR}/claudecode"
  log "Writing launcher: $wrapper"
  cat >"$wrapper" <<EOF
#!/usr/bin/env bash
set -euo pipefail
export CLAUDE_CODE_INSTALL_PREFIX="${INSTALL_DIR}"
exec "${INSTALL_DIR}/${REAL_BIN_NAME}" "\$@"
EOF
  chmod 0755 "$wrapper"

  verify_installed_files "${INSTALL_DIR}/${REAL_BIN_NAME}" "$wrapper"
  smoke_test_launcher "$wrapper"

  echo
  log "Installed binary:  ${INSTALL_DIR}/${REAL_BIN_NAME}"
  log "Launcher script:   ${wrapper}"
  log "Config (.env):     ${INSTALL_DIR}/.env"
  echo
  log "Run launcher by absolute path (always works):"
  log "  ${wrapper} -v"
  log "Do NOT use ./root/.local/... — use leading slash: /root/.local/bin/..."

  if path_has_bin_dir; then
    log "${BIN_DIR} is already on PATH in this shell — try: claudecode -v"
  else
    log "${BIN_DIR} is NOT on PATH in this shell."
    if [ "${CLAUDE_CODE_SKIP_SHELL_RC:-}" = 1 ]; then
      log "CLAUDE_CODE_SKIP_SHELL_RC=1 — not modifying shell rc files."
    else
      append_path_block_to_rc "${HOME}/.bashrc"
      if [ -f "${HOME}/.zshrc" ]; then
        append_path_block_to_rc "${HOME}/.zshrc"
      fi
    fi
    log "For this terminal only, run:"
    log "  export PATH=\"${BIN_DIR}:\$PATH\""
    log "Then: claudecode -v"
    log "New terminals: open a new tab/window, or run: source ~/.bashrc   (or ~/.zshrc for zsh)"
    log "Note: curl ... | bash runs a non-interactive shell; it cannot change your already-open terminal PATH."
  fi
}

main "$@"
