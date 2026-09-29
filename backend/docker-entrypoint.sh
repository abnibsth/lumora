#!/bin/sh
#
# Railway mounts volumes owned by root, while the app runs as `lumora`
# (see USER in the Dockerfile). Without this fix-up the first upload fails
# with EACCES as soon as a volume is attached to the service.
#
# Only the mount point itself is chowned, not recursively: a fresh volume
# is empty, and every file the app writes afterwards already belongs to
# lumora. A recursive chown would stall startup on a volume holding many
# files.
#
# Railway starts this container as root via RAILWAY_RUN_UID=0 so that the
# chown is possible; the app itself still runs unprivileged.
set -eu

# Apply pending migrations before serving, so a deploy can never answer
# requests on a stale schema. Skipped for the one-shot `migrate`/`seed`
# binaries (compose services, `railway run /app/migrate`), which run the
# schema step themselves. Safe while the service is single-instance:
# Railway volumes block replicas.
if [ "${1:-}" = "/app/api" ] && [ -n "${DATABASE_URL:-}" ]; then
	echo "menjalankan migrasi sebelum API..."
	/app/migrate
fi

if [ "$(id -u)" = "0" ]; then
	mkdir -p "$UPLOAD_DIR"
	chown lumora:lumora "$UPLOAD_DIR"
	exec su-exec lumora "$@"
fi

# Already non-root (plain `docker run`, or compose): nothing to fix up.
exec "$@"
