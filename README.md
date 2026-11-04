# Morning Meeting Builder — v0.6.9.5

Round 6 Combined Batches 8 and 9: compact rolling captions, stable capture controls, persistent Next and safe device Back from meeting previews/presentation. Final shop-testing update; not v0.7. Recent background/logo/font/layout/library/rotation work is retained; illustrations remain removed.

Source and prebuilt cPanel files: **Round-6-Development**. No default merge or live deployment.

Existing website: back up, then merge only **hosting-update/public_html contents** into the document root. Preserve live server-paths.php, config.js, root .htaccess, private configs/keys, database, media and corrected paths. **No new SQL.** Earlier 007 once if absent; never reset/reimport starter data or rerun installed migrations.

[Upload and shop checklist](hosting-update/docs/ROUND6_0_6_9_5_UPGRADE.md). [Checkpoint](translation-pilot/docs/ROUND6_CHECKPOINT.md).

User-facing release 0.6.9.5 maps to npm SemVer 0.6.9-5 via package.json releaseVersion. Production remains static assets plus PHP/MySQL; Node is only a developer/build tool. Fullscreen/device-Back browser limitations and emulation versus physical-device checks are documented in the guide.
