# Morning Meeting Builder — v0.6.7

Source and prebuilt PHP/static cPanel files are on **Round-6-Development**. No default merge or live deployment. Round 5 and earlier Round 6 releases remain available for rollback.

**Existing website:** back up first, import **hosting-update/database/007_quote_titles.sql once if version 7 is absent**, then merge **hosting-update/public_html contents** into the document root. Preserve live server-paths.php, config.js, root .htaccess, private configs/provider keys, database, media and corrected paths. Never reset/reimport starter data or rerun installed 005/006.

[Upgrade and manual checklist](hosting-update/docs/ROUND6_0_6_7_UPGRADE.md). [Development checkpoint](translation-pilot/docs/ROUND6_CHECKPOINT.md). [688 reviewed quote titles](hosting-update/docs/QUOTE_TITLES.csv).

Independent template-wide title/text sizes, aligned theme image selectors, short starter quote summaries, and administrator deletion of unused saved presentations with confirmation, history protection and synchronized removal. Saved presentations retain captured text/theme. Existing compact library, contribution permissions, rotation, media, translation and completion cleanup remain.

Editable source is translation-pilot/. Developer checks: npm ci; typecheck; lint; test; both builds; check:php; scripts/check-migrations.py; npm run package. Disposable hosted checks: tests/api/round6-editor.py, all five Round 6 browser suites and package-smoke. No production Node service.
