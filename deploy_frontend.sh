#!/usr/bin/env bash
set -euo pipefail

"$(dirname "$0")/frontend/deploy/deploy_frontend.sh" "$@"
