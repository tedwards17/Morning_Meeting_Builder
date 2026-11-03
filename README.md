# Morning Meeting Builder — v0.6.8

Combined Batches 6 and 7: agenda-inspired slide illustrations, optional slide-highlight matching, reusable administrator-managed illustrations/logos, template background uploads, targeted location availability and readable English/Spanish meeting dates. Existing saved presentations, numbering, text layouts, contribution/rotation and admin unused-draft deletion remain compatible.

Source and prebuilt cPanel files are on **Round-6-Development**. No default-branch merge or live deployment. Earlier Round 5/Round 6 commits remain available for rollback.

**Existing website:** back up, then merge only **hosting-update/public_html contents** into the document root. Keep live server-paths.php, config.js, root .htaccess, private configs/keys, database, media and corrected paths. **No new SQL for v0.6.8.** If earlier 007 quote-title migration is absent, apply it once per the guide; never reset/reimport starter content or rerun installed 005/006.

[Upgrade and manual checklist](hosting-update/docs/ROUND6_0_6_8_UPGRADE.md). [Development checkpoint](translation-pilot/docs/ROUND6_CHECKPOINT.md). [688 reviewed quote titles](hosting-update/docs/QUOTE_TITLES.csv).

Editable source: translation-pilot/. Node is a development/build tool only; production is PHP/MySQL and static assets. Developer checks: npm ci; typecheck; lint; test; both builds; check:php; scripts/check-migrations.py; npm run package. Hosted checks: tests/api/round6-visuals.py, six Round 6 browser suites and package-smoke (disposable database only).
