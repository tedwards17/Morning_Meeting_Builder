# cPanel setup — staging first

Use a dedicated HTTPS subdomain and document root. Do not overwrite the current GitHub Pages demo or any existing production root.

## First five safe deployment steps

1. Export a ZIP backup from the current MVP and retain the original browser ZIP. Create a new staging subdomain and record its exact document root; confirm AutoSSL works.
2. In cPanel, select PHP 8.3, enable PDO MySQL and fileinfo, inspect the extension/limit checklist below, and create `morning-meeting-private/media` outside the public document root.
3. Create a new database and users in Database Wizard. Import migrations `001`, `002`, `003`, then `database/seed/001_dtb.sql` into that empty database, following DATABASE_SETUP.md. Do not import into an existing application database.
4. Configure the private `config.php` with that database, absolute media path, and exact HTTPS origin. Create the first administrator through the private one-time CLI/cron method; there is no web installer.
5. Upload only the ZIP’s `public_html/` contents to the new document root, open the HTTPS URL, sign in, check Company workspace → Readiness, install the DTB starter, and run the two-device staging checks before rollout.

## Directory placement

```text
/home/CPANEL_ACCOUNT/morning-meeting-private/config.php
/home/CPANEL_ACCOUNT/morning-meeting-private/media/
/home/CPANEL_ACCOUNT/mmb-setup/scripts/   (temporary private setup tools)
/home/CPANEL_ACCOUNT/mmb-setup/api/src/core.php
/home/CPANEL_ACCOUNT/mmb-setup/database/
/home/CPANEL_ACCOUNT/PUBLIC_DOCUMENT_ROOT/index.html
/home/CPANEL_ACCOUNT/PUBLIC_DOCUMENT_ROOT/assets/
/home/CPANEL_ACCOUNT/PUBLIC_DOCUMENT_ROOT/api/
```

The API defaults to `dirname(api directory, 2)/morning-meeting-private/config.php`, which fits a root immediately beneath the account home. **For a nested document root, set the private absolute configuration path** with cPanel’s environment configuration or a private `SetEnv MMB_CONFIG /home/CPANEL_ACCOUNT/morning-meeting-private/config.php` directive in the domain’s `.htaccess`. This path is not a secret; the config contents are. Verify `getenv` is supported by that host. As a portable alternative, edit the `$configPath` fallback in `api/index.php` to your exact private path before uploading.

Copy `private/config.example.php` to the private directory as `config.php`. Replace all placeholders. `origin` must be exactly `https://YOUR_DOMAIN` with no trailing slash. Never set `test_http` in production. The default session duration is 90 days; device revocation invalidates its sessions immediately on the next online request.

Use 0700 for private directories and 0600 for config/media when PHP runs under the account owner. If the host runs PHP with a different account/group, ask IT for the minimum readable/writable group permissions; never use 0777. Keep directory listing disabled. Media must be retrieved through the authenticated API.

## PHP/readiness

Required: PHP 8.3+, PDO, pdo_mysql, fileinfo, openssl, JSON, sessions, writable private media, HTTPS, Apache rewrite/headers. GD with WebP support is optional but recommended; EXIF improves phone orientation. The current implementation uses GD, not ImageMagick. When GD/WebP is unavailable, validated original image bytes are stored safely without conversion/thumbnail. ZIP extension is optional: backups are handled in-browser and deployment packaging happens in development.

Recommended domain PHP settings:

```ini
upload_max_filesize = 32M
post_max_size = 40M
memory_limit = 512M
max_execution_time = 120
max_input_time = 120
```

Application limit defaults to 15 MiB/image, 40 megapixels, and 10 GiB total stored image bytes. Adjust private config deliberately. Check actual storage, inode, request, connection, CPU, and memory limits with IT. The application does not use FFmpeg, queues, cron for synchronization, or any long-running production service.

## Without SSH: first administrator

Preferred cPanel-only route uses a **temporary cron task outside the web root**, not a web installer:

1. Upload ZIP `scripts/` and its private `api/src/core.php` into `/home/CPANEL_ACCOUNT/mmb-setup/`. Keep these outside the public root.
2. In cPanel Cron Jobs, add the following for once per minute temporarily. Verify the PHP CLI path shown by your host (common cPanel path below):

```sh
/usr/local/bin/php /home/CPANEL_ACCOUNT/mmb-setup/scripts/bootstrap-admin.php /home/CPANEL_ACCOUNT/morning-meeting-private/config.php YOUR_ADMIN_USERNAME
```

3. After one run, use File Manager to privately open/download `morning-meeting-private/first-admin-once.txt`. It contains a newly generated random password. No fixed/default password is used. The script refuses to create another administrator after initialization.
4. **Remove the cron entry immediately**, save the password in a password manager, sign in, then delete `first-admin-once.txt` and the private setup tools when no longer needed. Neither credentials nor setup scripts ever belong under the public document root.

If Cron Jobs are unavailable, run `php scripts/create-admin.php > first-admin.sql` on your own computer with PHP installed, enter the chosen password interactively, and import the generated SQL using phpMyAdmin. This also requires no SSH on the host. Delete that generated SQL afterward; it contains a password hash, not the password.

## After sign-in

Company workspace → Templates → **Install DTB starter libraries and daily template** installs the recovered starting workflow. Then Accounts creates unique location passwords; location accounts default to template-creation capability. Use Organization to confirm name/timezone. Share templates for company use and selected edit permissions. The administrator account can operate meetings after selecting a meeting location in the top bar.

Do not remove the existing demo until the staging verification checklist passes. There is no automatic transfer of GitHub Pages browser data to the new domain. See BACKUP_AND_RECOVERY.md for deliberate migration.
