# Database setup

## cPanel Database Wizard / phpMyAdmin (no SSH)

1. Create a new database, for example `CPANELPREFIX_mmb`, using the cPanel wizard. The actual prefix is added by cPanel; copy the resulting full name.
2. Create a migration user with a random unique password. Give it the DDL and data privileges needed for installation (cPanel “ALL PRIVILEGES” is acceptable for this temporary migration user).
3. Select the empty database in phpMyAdmin. Import these files separately, in this exact order:
   - `database/migrations/001_foundation.sql`
   - `database/migrations/002_content_sync.sql`
   - `database/migrations/003_meetings_events.sql`
   - `database/seed/001_dtb.sql`
4. Check each import result before continuing. DDL is not transactionally rollbackable in MySQL. If a first installation fails partway, inspect the error, then recreate the **new empty staging database** and reimport; do not rerun all statements against a half-created schema.
5. Create a separate runtime database user and grant only SELECT, INSERT, UPDATE, DELETE on this database. Put that user's credentials in private config. It does not need CREATE, ALTER, DROP, FILE, GRANT OPTION, SUPER, or access to another database. Some cPanel setups require using the privileges checkboxes instead of GRANT SQL.
6. Keep migration credentials separate and remove/revoke them between upgrades if your IT policy allows. Do not keep them in public PHP or frontend variables.

Verification queries in phpMyAdmin SQL tab:

```sql
SELECT version, applied_at FROM schema_migrations ORDER BY version;
SELECT TABLE_NAME, ENGINE, TABLE_COLLATION
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE();
SELECT id, name, timezone FROM organizations;
SELECT id, name, enabled FROM locations;
SELECT @@version, @@character_set_database, @@collation_database;
```

Expected migration versions: 1, 2, 3. Every application table uses InnoDB and utf8mb4. DTB has Assembly, Paint, Mount, and Detail; rename/disable/add locations in the admin UI before creating fixed location accounts. There are deliberately no seeded account passwords.

## SSH / command line

Use the host's cPanel database wizard for database/user creation when possible. With MySQL administrative access, substitute your actual names; do not use the example passwords:

```sql
CREATE DATABASE CPANELPREFIX_mmb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'CPANELPREFIX_mmb_app'@'localhost' IDENTIFIED BY 'REPLACE_WITH_RANDOM_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE ON CPANELPREFIX_mmb.* TO 'CPANELPREFIX_mmb_app'@'localhost';
```

The migration user needs SELECT/INSERT/UPDATE/DELETE plus CREATE/ALTER/INDEX/REFERENCES (and DROP only if IT explicitly authorizes destructive recovery). Run the migration script with a temporary private config pointing to that user:

```sh
php scripts/migrate.php /home/CPANEL_ACCOUNT/morning-meeting-private/migration-config.php
mysql -u CPANELPREFIX_mmb_migrator -p CPANELPREFIX_mmb < database/seed/001_dtb.sql
php scripts/create-admin.php > /home/CPANEL_ACCOUNT/first-admin.sql
mysql -u CPANELPREFIX_mmb_migrator -p CPANELPREFIX_mmb < /home/CPANEL_ACCOUNT/first-admin.sql
rm /home/CPANEL_ACCOUNT/first-admin.sql
```

The runner obtains a database advisory lock and consults `schema_migrations`; reruns skip applied versions. Never rerun the DTB seed on an initialized database. Every future migration must have a new number and end by recording that number. Back up before schema changes. Runtime config must be switched back to the least-privileged user after setup.

UTC is set per database connection. Organization scheduling uses an IANA timezone, default America/Los_Angeles. No MySQL named-timezone tables are required.
