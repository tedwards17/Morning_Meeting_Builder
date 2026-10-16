# Morning Meeting Builder — Round 5 (v0.5.3)

Branch: **Round-5-Development**, based on the tested Round 4 v0.4.18 (`c7e413d`).

For the real PHP/MySQL website, download this branch as ZIP and use **hosting-upload/public_html**. It is already built: upload its contents through cPanel File Manager or FileZilla. **Do not upload the repository root demo as the real account website.**

**Already running the website? Use [the 0.5.3 cPanel update guide](hosting-update/docs/ROUND5_0_5_3_UPGRADE.md) and `hosting-update/public_html`. No new SQL is needed if migration 4 is installed. This update preserves public paths/config and the root .htaccess. Keep browser storage: stuck completed-history saves recover automatically online.**

This patch adds rolling blue/green captions, temporary meeting photos/videos stored privately on the server until confirmed completion, same-account device handoff, and a hamburger beside the account name with a separate scrollable drawer. Version 0.5.2 repairs blocked meeting creation and makes presentation controls hide after five seconds. Version 0.5.3 repairs upload attachment failure paths, uses server previews when browser caching fails, and saves media attachments immediately.

Start with [the Round 5 setup guide](hosting-upload/docs/ROUND5_SETUP.md), covering the database, private PHP configuration, first administrator, meeting-area accounts and Deepgram/Azure keys. [Development checkpoint](translation-pilot/docs/ROUND5_CHECKPOINT.md).

The hosted app has a login front page, visible account and sign-out, Settings maintenance/password tools, authenticated company data, and account-authorized captions. Production runs static HTML/JavaScript plus PHP/MySQL; Node is development/build tooling only. No Next.js server is required.

`hosting-upload/private`, `database`, `scripts`, `api` and `docs` are setup materials, **not public website content**. Real passwords, API keys and stored images stay outside the public document root and GitHub. The public server-paths.php contains only a path to that private directory.

Editable project: `translation-pilot/`. Build with `npm ci`, `npm run build:demo`, `npm run build:hosted`, and `npm run package` there. The package command refreshes `hosting-upload` and creates ZIPs under `translation-pilot/artifacts`. The repository root remains a browser-local GitHub Pages preview; Pages cannot run PHP accounts or the database. Existing default branch/Pages settings are unchanged.
