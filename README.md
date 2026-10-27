# Morning Meeting Builder — Round 6, combined Batches 4 and 5 (v0.6.4)

Source and prebuilt PHP/static cPanel files are on **Round-6-Development**. No default merge or live deployment. Round 5 remains available for rollback.

**Existing website:** back up first, apply data-only migration **006 once after 001–005**, then merge only **hosting-update/public_html contents** into the document root. Keep live **server-paths.php**, **config.js**, root **.htaccess**, all private config/provider keys, database, media and corrected media paths. Those three live public files are excluded from the update. Do not replace an existing installation with hosting-upload or the root demo.

[Upgrade and short manual checklist](hosting-update/docs/ROUND6_BATCH4_5_UPGRADE.md). [Development checkpoint](translation-pilot/docs/ROUND6_CHECKPOINT.md).

Three template categories, repeated content, one item per new library selection, no countdown, arbitrary builder color, aligned theme controls, accessible nine-position text picker, browsing descriptions and selected-content thumbnails. Legacy types and saved multi-item presentations retain compatibility. Media uploads retain multiple files. Compact library, all-account contributions, per-location rotation and deletion permissions remain.

Editable source is in translation-pilot/. Developer checks: npm ci; npm run typecheck; npm run lint; npm test; both build:demo/build:hosted; npm run check:php; python3 scripts/check-migrations.py; npm run package. Disposable hosted checks: tests/api/round6-slides.py, tests/e2e/round6-compact.cjs, tests/e2e/round6-slides.cjs, then package-smoke. No Node service in production. Stop after combined Batches 4 and 5.
