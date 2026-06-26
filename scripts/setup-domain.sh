#!/usr/bin/env bash
# Vicariustab — привязка домена (обёртка для Linux-сервера)
set -euo pipefail
cd "$(dirname "$0")/.."
exec node scripts/setup-domain.mjs "$@"
