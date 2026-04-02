#!/usr/bin/env bash
set -euo pipefail

APP_NAME="auth-service"
BASE_DIR="/srv/${APP_NAME}"
RELEASES_DIR="${BASE_DIR}/releases/backend"
CURRENT_LINK="${BASE_DIR}/current/backend"
SHARED_DIR="${BASE_DIR}/shared/backend"
SERVICE_NAME="auth-service-backend"
ARCHIVE_ROOT_DIR="auth-service-backend"
ENV_FILE="${SHARED_DIR}/env/backend.env"
BINARY_NAME="auth-service"
MIGRATOR_NAME="auth-service-migrator"

restart_service() {
  if [ "$(id -u)" -eq 0 ]; then
    systemctl restart "${SERVICE_NAME}"
    return
  fi

  if ! sudo -n systemctl restart "${SERVICE_NAME}"; then
    echo "[backend] ERROR: systemctl restart ${SERVICE_NAME} failed (check passwordless sudo for this unit)" >&2
    exit 1
  fi
}

if [ $# -ne 1 ]; then
  echo "Usage: $0 /path/to/backend.tar.gz"
  exit 1
fi

ARCHIVE_PATH="$1"
if [ ! -f "${ARCHIVE_PATH}" ]; then
  echo "[backend] ERROR: archive not found: ${ARCHIVE_PATH}"
  exit 1
fi

TIMESTAMP="$(date +"%Y-%m-%d_%H%M%S")"
RELEASE_DIR="${RELEASES_DIR}/${TIMESTAMP}"

echo "[backend] Creating release directory: ${RELEASE_DIR}"
mkdir -p "${RELEASE_DIR}" "$(dirname "${CURRENT_LINK}")" "$(dirname "${ENV_FILE}")"

echo "[backend] Extracting archive..."
tar --warning=no-timestamp -xzf "${ARCHIVE_PATH}" -C "${RELEASE_DIR}"

if [ -d "${RELEASE_DIR}/${ARCHIVE_ROOT_DIR}" ]; then
  RELEASE_DIR="${RELEASE_DIR}/${ARCHIVE_ROOT_DIR}"
fi

if [ ! -f "${RELEASE_DIR}/${BINARY_NAME}" ]; then
  echo "[backend] ERROR: binary not found: ${RELEASE_DIR}/${BINARY_NAME}"
  exit 1
fi

if [ ! -f "${RELEASE_DIR}/${MIGRATOR_NAME}" ]; then
  echo "[backend] ERROR: migrator not found: ${RELEASE_DIR}/${MIGRATOR_NAME}"
  exit 1
fi

if [ ! -d "${RELEASE_DIR}/migrations" ]; then
  echo "[backend] ERROR: migrations directory not found: ${RELEASE_DIR}/migrations"
  exit 1
fi

if [ ! -f "${ENV_FILE}" ]; then
  echo "[backend] ERROR: env file not found: ${ENV_FILE}"
  exit 1
fi

chown -R deploy:deploy "${RELEASE_DIR}"
chmod +x "${RELEASE_DIR}/${BINARY_NAME}" "${RELEASE_DIR}/${MIGRATOR_NAME}"

echo "[backend] Loading env from ${ENV_FILE}..."
set -a
source "${ENV_FILE}"
set +a

export MIGRATIONS_PATH="${RELEASE_DIR}/migrations"

echo "[backend] Running database migrations..."
"${RELEASE_DIR}/${MIGRATOR_NAME}"

echo "[backend] Switching current -> ${RELEASE_DIR}"
ln -sfn "${RELEASE_DIR}" "${CURRENT_LINK}"
chown -h deploy:deploy "${CURRENT_LINK}"

echo "[backend] Restarting service: ${SERVICE_NAME}"
restart_service

echo "[backend] Done."
