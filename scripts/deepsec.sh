#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEEPSEC_DIR="${ROOT_DIR}/.deepsec"
CONCURRENCY="${DEEPSEC_CONCURRENCY:-5}"
FINDINGS_DIR="${DEEPSEC_FINDINGS_DIR:-./findings}"

usage() {
  cat <<'EOF'
Usage: npm run deepsec -- <command> [deepsec options]

Commands:
  install      Install deepsec dependencies in .deepsec/
  scan         Regex scan (free, no AI)
  process      AI investigation (--concurrency defaults to DEEPSEC_CONCURRENCY or 5)
  revalidate   Re-check findings for false positives
  triage       Classify findings by priority (P0/P1/P2)
  export       Export findings (default: md-dir to ./findings)
  status       Show scan / investigation state
  metrics      Aggregate findings metrics
  full         scan → process → revalidate → export

Environment:
  DEEPSEC_CONCURRENCY     Parallel batches for process/revalidate (default: 5)
  DEEPSEC_FINDINGS_DIR    Export output dir for full/export (default: ./findings)
  DEEPSEC_PROJECT_ID      Pass --project-id to every deepsec command

Examples:
  npm run deepsec -- scan
  npm run deepsec -- process --limit 50
  npm run deepsec -- full
  DEEPSEC_CONCURRENCY=3 npm run deepsec -- process

AI stages (process, revalidate, triage, full) need Node.js 22+ and either:
  - .deepsec/.env.local with AI_GATEWAY_API_KEY / ANTHROPIC_AUTH_TOKEN, or
  - claude / codex CLI logged in on this machine.

See .deepsec/README.md for setup.
EOF
}

require_deepsec_dir() {
  if [ ! -d "$DEEPSEC_DIR" ]; then
    echo "❌ Missing .deepsec/ workspace. Run: npx deepsec init"
    exit 1
  fi
}

require_pnpm() {
  if command -v pnpm >/dev/null 2>&1; then
    return 0
  fi

  if command -v corepack >/dev/null 2>&1; then
    echo "📦 Enabling pnpm via corepack..."
    corepack enable pnpm
    return 0
  fi

  echo "❌ pnpm is required. Install it or enable corepack (Node 16.13+)."
  exit 1
}

require_node22() {
  local node_version
  node_version="$(node -v | cut -d'v' -f2 | cut -d'.' -f1)"
  if [ "$node_version" -lt 22 ]; then
    echo "⚠️  deepsec AI commands recommend Node.js 22+. Current: $(node -v)"
  fi
}

ensure_deps() {
  require_deepsec_dir
  require_pnpm

  if [ ! -d "${DEEPSEC_DIR}/node_modules/deepsec" ]; then
    echo "📦 Installing deepsec dependencies..."
    (cd "$DEEPSEC_DIR" && pnpm install)
  fi
}

load_env() {
  if [ -f "${DEEPSEC_DIR}/.env.local" ]; then
    set -a
    # shellcheck disable=SC1091
    source "${DEEPSEC_DIR}/.env.local"
    set +a
  fi
}

run_deepsec() {
  local -a args=("$@")

  cd "$DEEPSEC_DIR"

  if [ -n "${DEEPSEC_PROJECT_ID:-}" ]; then
    pnpm deepsec "${args[@]}" --project-id "$DEEPSEC_PROJECT_ID"
  else
    pnpm deepsec "${args[@]}"
  fi
}

cmd_install() {
  ensure_deps
  echo "✅ deepsec workspace ready at .deepsec/"
}

cmd_scan() {
  ensure_deps
  run_deepsec scan "$@"
}

cmd_process() {
  ensure_deps
  require_node22
  load_env
  run_deepsec process --concurrency "$CONCURRENCY" "$@"
}

cmd_revalidate() {
  ensure_deps
  require_node22
  load_env
  run_deepsec revalidate --concurrency "$CONCURRENCY" "$@"
}

cmd_triage() {
  ensure_deps
  require_node22
  load_env
  run_deepsec triage "$@"
}

cmd_export() {
  ensure_deps
  if [ "$#" -eq 0 ]; then
    run_deepsec export --format md-dir --out "$FINDINGS_DIR"
  else
    run_deepsec export "$@"
  fi
}

cmd_status() {
  ensure_deps
  run_deepsec status "$@"
}

cmd_metrics() {
  ensure_deps
  run_deepsec metrics "$@"
}

cmd_full() {
  ensure_deps
  require_node22
  load_env

  echo "🔍 deepsec scan..."
  run_deepsec scan "$@"

  echo "🤖 deepsec process (concurrency=${CONCURRENCY})..."
  run_deepsec process --concurrency "$CONCURRENCY" "$@"

  echo "✅ deepsec revalidate (concurrency=${CONCURRENCY})..."
  run_deepsec revalidate --concurrency "$CONCURRENCY" "$@"

  echo "📄 deepsec export → ${FINDINGS_DIR}..."
  run_deepsec export --format md-dir --out "$FINDINGS_DIR" "$@"

  echo "✅ deepsec full pipeline complete. Findings: ${DEEPSEC_DIR}/${FINDINGS_DIR}"
}

main() {
  local command="${1:-help}"

  if [ "$command" = "help" ] || [ "$command" = "--help" ] || [ "$command" = "-h" ]; then
    usage
    exit 0
  fi

  shift || true

  case "$command" in
    install) cmd_install "$@" ;;
    scan) cmd_scan "$@" ;;
    process) cmd_process "$@" ;;
    revalidate) cmd_revalidate "$@" ;;
    triage) cmd_triage "$@" ;;
    export) cmd_export "$@" ;;
    status) cmd_status "$@" ;;
    metrics) cmd_metrics "$@" ;;
    full) cmd_full "$@" ;;
    *)
      echo "❌ Unknown command: $command"
      echo ""
      usage
      exit 1
      ;;
  esac
}

main "$@"
