# Morning Meeting Builder — v0.6.9

Illustrations removed; transparent logos have automatic padding trim and adjustable size within a fixed header. Dedicated reusable background images replace general-media/library selectors, with Fill slide / Shrink to fit at theme and slide levels. Existing saved data, fonts, numbering, sharing, content/rotation and unused-draft deletion remain compatible.

Source and prebuilt cPanel files are on **Round-6-Development**. No default merge or live deployment. Earlier releases remain available for rollback.

**Existing website:** back up, then merge only **hosting-update/public_html contents** into the document root. Preserve live server-paths.php, config.js, root .htaccess, private configs/keys, database, media and corrected paths. **No new SQL for v0.6.9.** Earlier 007 once if absent; never reset/reimport starter content or rerun installed 005/006.

[Upgrade and manual checklist](hosting-update/docs/ROUND6_0_6_9_UPGRADE.md). [Development checkpoint](translation-pilot/docs/ROUND6_CHECKPOINT.md).

Editable source is translation-pilot/. Production uses PHP/MySQL and static assets; Node is only for development/build. Developer checks: typecheck, lint, test, both builds, check:php, check-migrations and package. Hosted verification uses disposable databases, six browser suites and package-smoke; no paid provider calls.
