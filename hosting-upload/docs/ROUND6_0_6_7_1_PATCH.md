# v0.6.7.1 — meeting slide numbering patch

Small maintenance patch on v0.6.7, on Round-6-Development. The app displays 0.6.7.1; the build/package version is 0.6.7-1. No GitHub release, default merge or live deployment.

Cause: every meeting reserves an internal, hidden announcement placement marker. The agenda hid that row but displayed numbers and totals from the unfiltered stored array. Nine visible slides could therefore read 1, 3, 4 … 10. This is independent of phone size, template ownership and sharing.

The builder now derives numbers, agenda total and “Slide X of Y” from the current real meeting slides. Actual announcements/broadcasts count as real slides. Visible skipped slides remain in the builder's numbered agenda; the separate included count and presentation still exclude skipped slides. Existing builder previous/next and move controls target that same visible list so they cannot select or stop on the hidden marker. Moving a slide preserves slide IDs/content and hidden placement markers. Saved meetings use the same numbering without rewriting stored slides. Presentation navigation is unchanged. Existing English/Spanish labels are reused.

No new slide-creation controls, new permissions or SQL migrations. Existing media-slide controls remain. You can wait and upload with the next batch. When uploading, merge only hosting-update/public_html contents and preserve server-paths.php, config.js, root .htaccess, private configuration, database, media and corrected media paths. If v0.6.7's data-only migration 007 is not yet installed, follow ROUND6_0_6_7_UPGRADE.md once; do not rerun installed migrations.

At the next manual check, use the shared nine-slide template on the phone: confirm 1–9 and “Slide 2 of 9,” move a slide, skip one, then save/reopen. Real announcement slides should add a numbered row; hidden empty slots should add none. Compare desktop and Spanish labels. No immediate user test is required.
