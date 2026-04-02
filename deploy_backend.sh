#!/usr/bin/env bash
set -euo pipefail

"$(dirname "$0")/backend/deploy/deploy_backend.sh" "$@"
