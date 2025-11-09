#!/usr/bin/env bash
set -euo pipefail
BASE="${1:-http://localhost:4000}"
URL="$BASE/api/health"
echo "Probing $URL"
code=$(curl -s -o /tmp/hbody -w "%{http_code}" "$URL" || true)
echo "Status: $code"
if [ -f /tmp/hbody ]; then
  echo "Body:"; cat /tmp/hbody; echo
fi
if [ "$code" != "200" ]; then
  echo "Health check failed" >&2
  exit 1
fi
