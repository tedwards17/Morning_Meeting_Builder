# Round 5 — first hosting setup

Version 0.5.4. Existing installations: use [ROUND5_0_5_4_UPGRADE.md](ROUND5_0_5_4_UPGRADE.md); do not repeat first installation. Start with the `hosting-upload` folder in the **Round-5-Development** GitHub branch. Everything in `public_html` is already built. You do not run npm, Node, Next.js, or a development server on the host.

## 1. Confirm the host and domain

In the hosting control panel, find your domain's **document root**: the actual folder serving the website. This may be `public_html`, `public_html/morning`, or a separate subdomain folder. Record its full path and your hosting account's home path. Examples below use `/home/ACCOUNT/public_html` and `https://morning.douglasstruckbodies.com`; substitute the actual values.

Use PHP 8.3 or newer (8.4/8.5 are supported PHP branches), MySQL 8+ or MariaDB 10.6+, HTTPS, PDO MySQL, fileinfo, mbstring, cURL, and Apache/LiteSpeed with `.htaccess` rewrites. GD is recommended for image resizing. Enable the certificate for the exact domain before signing in. If the host uses nginx, IT must translate the included rewrite and security-header rules.

## 2. Create the database

Open **MySQL Databases / Database Wizard** in the hosting control panel.

1. Create an empty database named `mmb`. The panel may turn this into `ACCOUNT_mmb`.
2. Create a database user named `mmb_app`, with a unique generated password. Save the FULL username, full database name, password, and database hostname (often `localhost`). These are database credentials, separate from website logins.
3. Add that user to this database with SELECT, INSERT, UPDATE, DELETE permissions. Use your hosting/phpMyAdmin administrative login to import the structure. If your panel requires temporary ALL PRIVILEGES for installation, reduce the app user's privileges afterward.
4. Open **phpMyAdmin**, click the new empty database in the left column, then **Import**. Import each file individually and wait for a success message, in this order:

   1. `hosting-upload/database/migrations/001_foundation.sql`
   2. `hosting-upload/database/migrations/002_content_sync.sql`
   3. `hosting-upload/database/migrations/003_meetings_events.sql`
   4. `hosting-upload/database/migrations/004_meeting_media.sql`
   5. `hosting-upload/database/seed/001_dtb.sql`

Do not import these into the Key Manager database or another app's database. On a first-install error, stop and inspect it; these scripts are for an empty database. There are no seeded passwords. Expected migration versions are 1, 2, 3, 4. See DATABASE_SETUP.md for verification queries.

## 3. Put private configuration outside the website

Using FileZilla or the hosting File Manager, create `/home/ACCOUNT/morning-meeting-private` **outside all public website folders**. If FileZilla is restricted to the document root, use the hosting File Manager or ask IT to place the private folder. Do not put it inside `public_html`.

Create a `media` subfolder there. PHP must be able to write to it. Private folders should normally be 0700 and private files 0600 when PHP runs as your account; IT may need to adjust group permissions. Do not use 0777.

Copy `hosting-upload/private/config.example.php` there, rename it **config.php**, and edit:

```php
'dsn' => 'mysql:host=localhost;dbname=ACCOUNT_mmb;charset=utf8mb4',
'user' => 'ACCOUNT_mmb_app',
'password' => 'YOUR_DATABASE_PASSWORD',
'media_dir' => '/home/ACCOUNT/morning-meeting-private/media',
'origin' => 'https://morning.douglasstruckbodies.com',
```

Use the exact domain origin: `https://` plus hostname, no path or trailing slash. Keep the other supplied defaults. Never enable `test_http` on the live host. Save with a plain text editor; keep PHP quotes intact.

Open `hosting-upload/public_html/server-paths.php`. Its default finds a private folder beside the domain root. For nested domain roots, change only the path to your absolute private directory:

```php
return ['hosted_accounts' => true, 'private_dir' => '/home/ACCOUNT/morning-meeting-private'];
```

This public PHP file contains paths only. Passwords and API keys stay in private files. No hosting environment variables are required; `MMB_CONFIG` and `MMB_TRANSLATION_CONFIG` remain optional overrides for IT.

## 4. Upload the website

In GitHub choose **Round-5-Development → Code → Download ZIP**, unzip it on your computer, and open `hosting-upload/public_html`.

You may use cPanel File Manager through your browser; FileZilla is optional. For a browser-only upload, upload the GitHub ZIP into a temporary folder outside public_html and extract it there. Move the contents of hosting-upload/public_html into the domain document root, showing hidden files so .htaccess is included.

In FileZilla, open the domain's document root on the remote side. Upload **all contents** of `hosting-upload/public_html`, including `.htaccess`, `api/.htaccess`, and `translation-api/.htaccess`. Include every asset and subfolder; do not upload just `index.html`. The `public_html` folder itself does not need to be nested inside your existing document root. Check FileZilla's Failed transfers tab.

Upload only public website files there. Database files, setup scripts, private examples, docs, source, node_modules, and ZIP backups do not belong in the document root. FileZilla uploads files; database creation/import happens separately in the hosting panel.

On later updates keep the private configuration/media and existing database. Back up first, upload new assets before index.html/sw.js, retain old hashed assets until open tablets have refreshed, and preserve your edited server-paths.php and public config.js. Do not rerun the first-install seed or migrations blindly.

## 5. Create the first administrator without SSH

Use the hosting panel's **Cron Jobs** and File Manager. Nothing sensitive is put in a public web installer.

1. Outside the document root, create `/home/ACCOUNT/mmb-setup`.
2. Upload `hosting-upload/scripts` into that folder. Also upload `hosting-upload/api` into that same folder. The resulting files include `mmb-setup/scripts/bootstrap-admin.php` and `mmb-setup/api/src/core.php`.
3. In Cron Jobs add a temporary once-per-minute job (all five schedule fields `*`). Use the PHP CLI path shown by your host, often `/usr/local/bin/php`:

```sh
/usr/local/bin/php /home/ACCOUNT/mmb-setup/scripts/bootstrap-admin.php /home/ACCOUNT/morning-meeting-private/config.php thomas
```

4. After the first successful run, use File Manager to privately open `morning-meeting-private/first-admin-once.txt`. It contains your generated website username and password. The script refuses a second initialization.
5. Remove the cron job immediately. Save the password securely, sign in, then delete `first-admin-once.txt` and the temporary `mmb-setup` folder.

If Cron Jobs are unavailable, the alternative is running `scripts/create-admin.php` on a computer with PHP installed, then importing its generated SQL using phpMyAdmin. See CPANEL_SETUP.md. Never send passwords/API keys in chat.

## 6. Finish the workspace

1. Open your HTTPS website and sign in. You should see your username and role at the top, plus **Sign out**.
2. **Settings → Your account → Change password** changes your own password. Other devices must sign in again.
3. **Company workspace → Server readiness** checks PHP, database versions/migrations, writable media and private config presence. No keys are displayed. Company/location names are managed centrally; device preferences and password tools are in Settings.
4. **Company workspace → Templates → Install DTB starter libraries and daily template** installs the starter content. Import any wanted Round 4 backup through Backup & restore while signed in as administrator; use Merge content. Old browser-local data does not move automatically to a new domain. Do not assume old browser-local transcripts/history migrate into hosted account history.
5. **Locations**: rename/add meeting areas (for example Sumner, Assembly, Paint, Detail and Office). The initial database seed has Assembly, Paint, Mount and Detail; adjust these deliberately before making accounts.
6. **Accounts**: create one location account per meeting area, with its own username and password. Administrators manage accounts and company settings; content managers manage shared content; report viewers have read access; location accounts build meetings in their assigned area. Passwords require 12–72 bytes. Administrators reset forgotten passwords from Accounts.
7. Share the daily template for company use or grant selected locations use/edit access. Management accounts select a meeting location before building; location accounts use their assigned area automatically.

Meeting photos/videos now upload into private server storage. Save the presentation while online; on another device sign into the same account, open Meetings, and choose Open saved presentation. Opening transfers editing to that device. Drafts, scheduled dates, previews and pauses do not delete photos. The finish checkmark asks for confirmation, then removes only temporary meeting media; shared library images, meeting text, topics and transcripts remain. For offline use, download the images on the presenting device while online. YouTube and speech/translation APIs still need internet.

Ordinary account meeting history is scoped to that account; administrators can review all company meetings. Sync/download maintenance is in Settings. Sign-out waits for pending records to sync so a meeting is not silently lost.

## 7. Configure Deepgram and Azure privately

Copy `hosting-upload/private/translation-config.example.php` into the **same private folder** as `translation-config.php`. Set:

```php
'enabled' => true,
'auth_mode' => 'account',
'origin' => 'https://morning.douglasstruckbodies.com',
'deepgram_key' => 'YOUR_DEEPGRAM_API_KEY',
'translator_key' => 'YOUR_AZURE_TRANSLATOR_KEY',
'translator_region' => 'YOUR_RESOURCE_REGION',
'state_dir' => '/home/ACCOUNT/morning-meeting-private/translation-state',
```

Keep `test_http` false. The state folder is created automatically if PHP can write its private parent, or create it yourself with suitable private permissions. The hosted package always requires a current website login for paid provider requests; a standalone pilot passphrase cannot bypass it. `presenter_hash` can remain blank. Permanent API keys never go into browser Settings, config.js, GitHub, or public PHP.

**Deepgram:** open your existing project in the Deepgram console and create/use a private server API key with permission to create temporary tokens (Member or Admin). Speech still uses Nova-3 multilingual English/Spanish. PHP grants the browser a short-lived token; the permanent key stays private.

**Azure:** in the Azure portal open your **Translator** resource → **Keys and Endpoint**. Copy a key and the resource's displayed Location/Region into the private file. Use `global` only for an actual global Translator resource; a regional or multi-service resource needs its region. This uses Translator Text, not an Azure Speech key. Existing free-tier limits still apply.

The host must allow outbound HTTPS from PHP to `api.deepgram.com` and `api.cognitive.microsofttranslator.com`. The tablet/browser must allow a secure WebSocket to `api.deepgram.com`. HTTPS and microphone permission are required. No hosted WebSocket server, Node service, FFmpeg, or long-running PHP worker is needed. Sessions stop after 45 minutes or when the page is closed/backgrounded.

To leave translation unavailable during initial account testing, keep private `enabled` false and set `translationEnabled: false` in public `config.js`. Turn both on when ready. Start transcript uses Deepgram; live translated captions also use Azure.

## 8. First real-device test

- Sign in as a location account, save a meeting, refresh, and open it again. Confirm the account name and area.
- Present with a short microphone test: “The F-550 is ready for quality control. Please check the latch rods and mounting spacers.” Then read a Spanish sentence. Confirm captions and saved transcript.
- Open the same account on another device and confirm its meeting history. A different location account must not see that history; the administrator should see it.
- Sign out, sign into another account in the same browser, and confirm the previous account's data is gone from the view.
- Test your normal media/YouTube workflow and tablet fullscreen. Provider credentials, domain routing, microphone permission and host-specific limits require this hosted test; local checks cannot prove them.

## Troubleshooting

| Symptom | Check |
|---|---|
| Site opens the old local app | Upload `hosting-upload/public_html`, not the repository root demo. Refresh/close old tabs. |
| Account service unavailable / HTML instead of JSON | PHP enabled, entire api folder and both .htaccess files uploaded, rewrite support. |
| Private configuration is not installed | server-paths.php absolute private directory and config.php filename. |
| Database request fails | Full prefixed database/user names, assigned permissions, host, password, all four migrations plus seed. Use the request ID in the PHP error log. |
| App origin rejected | Both private origin values exactly match the browser's scheme and hostname; no trailing slash. |
| HTTPS required behind a proxy | Ask IT to pass trusted HTTPS information to PHP. Do not enable test_http. |
| Deepgram grant rejected | Key permissions, project/balance, outbound HTTPS, cURL and CA certificates. |
| Azure credentials rejected | Translator resource key and the matching region; do not substitute Speech credentials. |
| Private captions state not writable | Absolute folder outside public root, PHP ownership/permissions. |
| Sign-out says sync pending | Connect online, open Settings and choose Sync Now; resolve the displayed error first. |

Current service references checked for this round: https://www.php.net/supported-versions.php ; https://developers.deepgram.com/guides/fundamentals/token-based-authentication ; https://developers.deepgram.com/docs/models-languages-overview/ ; https://learn.microsoft.com/en-us/azure/ai-services/translator/text-translation/reference/authentication .
