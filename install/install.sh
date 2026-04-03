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

set -euo pipefail

GITHUB_REPO="${GITHUB_REPO:-wyt990/claude-code-haha}"

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
  local json hdr auth=()
  if [ -n "${GITHUB_TOKEN:-}" ]; then
    auth=(-H "Authorization: Bearer ${GITHUB_TOKEN}")
  fi
  json="$(curl -fsSL "${auth[@]}" -H "Accept: application/vnd.github+json" "$api")" ||
    die "failed to fetch ${api} (set GITHUB_TOKEN if rate-limited)"

  if command -v jq >/dev/null 2>&1; then
    # Regex must NOT use "\\(" around $slug — that makes a literal "(" then ")" tries to
    # close a regex group → jq: "Regex failure: unmatched close parenthesis".
    # Require "-[0-9]" after slug so "linuxX64" does not match "linuxX64-musl" archives.
    # max_by(.name): same release may list 100.0.1 + 100.0.2 — pick lexicographically newest name.
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

main() {
  # tmp must NOT be local: EXIT trap runs after main returns; with set -u, local tmp is gone → "tmp: unbound variable"
  local slug url tar_path inner env_example
  slug="$(detect_archive_slug)"
  echo "[install] GitHub repo: ${GITHUB_REPO}"
  echo "[install] Detected archive platform: ${slug}"

  url="$(pick_download_url "$slug")"
  [ -n "$url" ] || die "no matching asset claudecode-${slug}-*.tar.gz in latest release (build & upload release first)"

  echo "[install] Downloading:"
  echo "          $url"

  tmp="$(mktemp -d "${TMPDIR:-/tmp}/claudecode-install.XXXXXX")"
  trap 'rm -rf "$tmp"' EXIT

  tar_path="${tmp}/bundle.tar.gz"
  if [ -n "${GITHUB_TOKEN:-}" ]; then
    curl -fsSL -H "Authorization: Bearer ${GITHUB_TOKEN}" -o "$tar_path" "$url"
  else
    curl -fsSL -o "$tar_path" "$url"
  fi

  mkdir -p "$tmp/extract"
  tar -xzf "$tar_path" -C "$tmp/extract"

  mkdir -p "$INSTALL_DIR" "$BIN_DIR"

  if [ "$slug" = "windowsX64" ]; then
    REAL_BIN_NAME="claudecode.exe"
  fi

  inner="${tmp}/extract/${REAL_BIN_NAME}"
  [ -f "$inner" ] || die "expected ${REAL_BIN_NAME} inside archive"

  install -m 0755 "$inner" "${INSTALL_DIR}/${REAL_BIN_NAME}"

  env_example="${tmp}/extract/.env.example"
  if [ -f "$env_example" ] && [ ! -f "${INSTALL_DIR}/.env" ]; then
    install -m 0600 "$env_example" "${INSTALL_DIR}/.env"
    echo "[install] Created ${INSTALL_DIR}/.env from .env.example — edit API keys before use."
  elif [ ! -f "${INSTALL_DIR}/.env" ]; then
    echo "[install] No .env.example in archive; create ${INSTALL_DIR}/.env yourself (see README)."
  fi

  # Wrapper: keeps user's cwd as project root; loads config from INSTALL_DIR via env.
  local wrapper="${BIN_DIR}/claudecode"
  cat >"$wrapper" <<EOF
#!/usr/bin/env bash
set -euo pipefail
export CLAUDE_CODE_INSTALL_PREFIX="${INSTALL_DIR}"
exec "${INSTALL_DIR}/${REAL_BIN_NAME}" "\$@"
EOF
  chmod 0755 "$wrapper"

  echo
  echo "[install] Installed binary:  ${INSTALL_DIR}/${REAL_BIN_NAME}"
  echo "[install] Launcher script:   ${wrapper}"
  echo "[install] Config (.env):     ${INSTALL_DIR}/.env"
  echo
  if echo ":${PATH}:" | grep -q ":${BIN_DIR}:"; then
    echo "[install] ${BIN_DIR} is already on PATH — run: claudecode"
  else
    echo "[install] Add to PATH, then run claudecode, e.g.:"
    echo "          export PATH=\"${BIN_DIR}:\$PATH\""
    echo "          # add the same line to ~/.bashrc or ~/.zshrc for persistence"
  fi
}

main "$@"
