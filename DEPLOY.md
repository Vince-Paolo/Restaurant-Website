# Deploying to Render

This folder is deploy-ready: `Dockerfile` builds the PHP+Apache app, and
`render.yaml` is a Blueprint that provisions both the web service and a
MySQL database together.

## Option A — One-click Blueprint (recommended)

1. Push this folder to a GitHub repo.
2. In the Render Dashboard: **New → Blueprint**, and point it at your repo.
   Render will read `render.yaml` and create two services:
   - `restaurant-website` — the PHP app (Docker web service)
   - `restaurant-mysql` — MySQL 8 (Docker private service, with a 1GB
     persistent disk so data survives restarts/redeploys)
3. Render will prompt you to fill in the `sync: false` values:
   `DB_USER`, `DB_PASS` (for the app) and `MYSQL_USER`, `MYSQL_PASSWORD`
   (for the database) — make these match on both sides.
   `MYSQL_ROOT_PASSWORD` is auto-generated.
4. Deploy. `DB_HOST` is wired automatically to the database's internal
   hostname — you don't need to set it yourself.

## Import the schema

Once `restaurant-mysql` is live, you still need to create the tables —
the app doesn't do this automatically:

1. Open the Render Shell for `restaurant-mysql` (or deploy a temporary
   [Adminer](https://render.com/docs/deploy-mysql#connecting-with-adminer)
   web service pointed at it).
2. Run the SQL files in this repo against the `restaurant_db` database,
   in this order:
   - `database/restaurant_db.sql`
   - `database/migration_customer_auth.sql`

## Option B — Manual setup (no Blueprint)

If you'd rather click through the UI instead of using `render.yaml`:

1. **New → Private Service** → Docker → image `mysql:8.0`. Set
   `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE=restaurant_db`, `MYSQL_USER`,
   `MYSQL_PASSWORD`. Attach a persistent disk mounted at `/var/lib/mysql`
   (this step is essential — without it your data resets on every deploy).
2. Import the schema as above.
3. **New → Web Service** → connect this repo → Runtime: Docker. Set env
   vars `DB_HOST` (the MySQL private service's internal hostname, shown
   on its Render page, e.g. `restaurant-mysql:3306`), `DB_NAME`,
   `DB_USER`, `DB_PASS` to match step 1.
4. Deploy.

## Notes

- `temp_*.php` debug/migration scripts have already been removed from
  this copy — they exposed schema/admin internals and shouldn't ship.
- The `.htaccess` file blocks direct access to `.sql` files and disables
  directory listing; the Dockerfile enables `mod_rewrite`/`mod_headers`
  and `AllowOverride All` so those rules are actually enforced.
