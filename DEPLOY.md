# Deploying to Render (Postgres edition)

This app was originally built for MySQL and has been converted to run on
**Postgres**, so it can use Render's free managed database — no credit
card required.

## What changed from the original MySQL version

- `php/config.php` — DSN switched from `mysql:` to `pgsql:`, plus a few
  MySQL-only SQL fragments (`NOW() - INTERVAL 1 HOUR`,
  `INTERVAL ? MINUTE`) rewritten in Postgres syntax.
- `php/dashboard_stats.php` — MySQL's `SUM(column=value)` boolean-sum
  shorthand and `CURDATE()` aren't valid Postgres; rewritten as
  `SUM(CASE WHEN ... END)` and `CURRENT_DATE`.
- `database/postgres_schema.sql` — new file: the original
  `restaurant_db.sql` + `migration_customer_auth.sql`, merged into one
  Postgres-compatible schema. Idempotent — safe to run repeatedly.
- `Dockerfile` — now installs `pdo_pgsql` instead of `pdo_mysql`, plus
  the `psql` client.
- `docker-entrypoint.sh` — new: runs `postgres_schema.sql` against the
  database automatically every time the container boots, before Apache
  starts. Schema creation *is* deployment — no manual import needed.
- `render.yaml` — now provisions a Render-managed Postgres database
  (`databases:` block, `plan: free`) instead of a self-hosted MySQL
  private service. Both the app and database use Render's free tier.

## Steps

1. Push this repo (with all the above changes) to GitHub.
2. Render Dashboard -> New -> Blueprint -> connect your repo.
   Render reads render.yaml and shows two resources to create:
   - restaurant-postgres (free Postgres database)
   - restaurant-website (free web service, Docker)
3. Click through to deploy. No sync:false prompts this time -- all
   DB credentials flow automatically via fromDatabase.
4. Watch the restaurant-website Logs tab during first boot. You
   should see "Running schema import against Postgres..." followed
   by "Schema import complete." -- confirms schema + seed data loaded.
5. Visit your site's Menu page -- items should now show up.

## Notes

- Default admin login is admin / Admin@1234 -- the app forces a
  password change on first login. Do this immediately after deploy.
- Render's free Postgres tier expires after 30 days unless upgraded to
  a paid plan -- fine for testing, keep in mind for long-term use.
- temp_*.php debug/migration scripts have already been removed from
  this copy.
