#!/bin/sh
set -e

# Auto-import the schema against Render's managed Postgres. Every statement
# in postgres_schema.sql is idempotent (IF NOT EXISTS / ON CONFLICT), so
# it's safe to run this on every container start, not just the first.
if [ -n "$DATABASE_URL" ]; then
    echo "Running schema import against Postgres..."
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f /var/www/html/database/postgres_schema.sql \
        && echo "Schema import complete." \
        || echo "WARNING: schema import failed — app may not have tables yet."
else
    echo "WARNING: DATABASE_URL not set — skipping schema import."
fi

exec "$@"
