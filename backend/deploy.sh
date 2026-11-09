#!/usr/bin/env bash
#
# Deploy produksi LUMORA ke VPS — jalankan dari folder backend/:
#   bash deploy.sh
#
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker belum terpasang. Install dulu (lihat docs/deploy-vps.md)." >&2
  exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose (v2) belum tersedia. Install plugin compose dulu." >&2
  exit 1
fi

if [ ! -f .env.production ]; then
  echo "File .env.production belum ada." >&2
  echo "Jalankan dulu:" >&2
  echo "  cp .env.production.example .env.production" >&2
  echo "lalu isi POSTGRES_PASSWORD, GEMINI_API_KEY, RESEND_API_KEY, dan FRONTEND_BASE_URL." >&2
  exit 1
fi

# Pastikan tidak ada placeholder <...> yang belum diganti.
if grep -q '<[^>]*>' .env.production; then
  echo "Masih ada placeholder yang belum diisi di .env.production:" >&2
  grep -n '<[^>]*>' .env.production >&2
  exit 1
fi

COMPOSE=(docker compose -f docker-compose.prod.yml --env-file .env.production)

echo "==> Build & jalankan stack (postgres -> migrate -> seed -> api)"
"${COMPOSE[@]}" up -d --build

echo "==> Menunggu API sehat (maks. 120 detik)..."
for _ in $(seq 1 60); do
  if curl -fsS http://localhost:8080/healthz >/dev/null 2>&1; then
    echo "==> API sehat: http://localhost:8080/healthz"
    echo ""
    echo "Selesai. Langkah berikutnya:"
    echo "  1. Buka port 8080 di firewall VPS."
    echo "  2. Buat akun admin: bash provision-admin.sh <nama> <email>"
    echo "  3. Set BACKEND_URL di Vercel ke http://<IP-VPS>:8080 lalu redeploy."
    exit 0
  fi
  sleep 2
done

echo "==> API belum sehat setelah 120 detik. Cek log:" >&2
echo "    ${COMPOSE[*]} logs api" >&2
exit 1
