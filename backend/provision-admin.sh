#!/usr/bin/env bash
#
# Buat akun admin LUMORA di VPS.
#   bash provision-admin.sh "Nama Admin" admin@lumora.id
#
# Password diminta lewat prompt (tidak tampil di layar) lalu diteruskan ke
# /app/provision-admin yang sudah ada di dalam container api.
#
set -euo pipefail
cd "$(dirname "$0")"

if [ $# -lt 2 ]; then
  echo "Pakai: bash provision-admin.sh <nama> <email>" >&2
  exit 1
fi
NAME="$1"
EMAIL="$2"

read -rsp "Password admin: " PASS
echo
if [ -z "$PASS" ]; then
  echo "Password tidak boleh kosong." >&2
  exit 1
fi

echo "$PASS" | docker compose -f docker-compose.prod.yml --env-file .env.production exec -T api \
  /app/provision-admin -name "$NAME" -email "$EMAIL"
