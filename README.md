# Morning Meeting Builder — v0.6.5, protected slide areas and media editing

Source and prebuilt PHP/static cPanel files are on **Round-6-Development**. No default merge or live deployment. Round 5 and previous Round 6 commits remain available for rollback.

**Existing website:** back up first, then merge only **hosting-update/public_html contents** into the document root. **No new SQL if migration 006 is already installed.** Keep live server-paths.php, config.js, root .htaccess, all private configs/provider keys, database, media and corrected paths. Do not replace an existing installation with hosting-upload or the root demo.

[Upgrade and manual checklist](hosting-update/docs/ROUND6_0_6_5_UPGRADE.md). [Development checkpoint](translation-pilot/docs/ROUND6_CHECKPOINT.md).

Individual uploaded-media removal; separate protected template text, selected-content text and meeting additions; template/slide/meeting layout inheritance; distinct image/text areas; immediate highlight color in the template list; fitted titles with descender padding. Saved meeting snapshots retain their own template text/layout. Existing accounts, translations, compact library, repeated single-item selection, location rotations and cleanup remain.

Editable source is translation-pilot/. Developer checks: npm ci; typecheck; lint; test; both builds; check:php; scripts/check-migrations.py; npm run package. Disposable hosted checks: tests/api/round6-layout.py, tests/e2e/round6-compact.cjs, tests/e2e/round6-slides.cjs, tests/e2e/round6-layout.cjs and package-smoke. No production Node service.
