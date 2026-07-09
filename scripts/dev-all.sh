#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PIDS=()

cleanup() {
  for pid in "${PIDS[@]:-}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done
}

trap cleanup EXIT INT TERM

run_with_prefix() {
  local name="$1"
  shift

  (
    cd "$ROOT_DIR"
    "$@" 2>&1 | sed -u "s/^/[$name] /"
  ) &

  PIDS+=("$!")
}

echo "Starting AGTPS Portal development services..."
echo "API: http://localhost:3002/api"
echo "Web: http://localhost:3001"
echo "Press Ctrl+C to stop both services."
echo

run_with_prefix "api" npm --workspace apps/api run start:dev
run_with_prefix "web" npm --workspace apps/web run dev -- --port 3001

wait -n "${PIDS[@]}"
EXIT_CODE=$?

cleanup
exit "$EXIT_CODE"
