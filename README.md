# Morning Meeting Builder — Round 6, combined Batches 2 and 3 follow-up (v0.6.3)

Continue on **Round-6-Development** from working v0.6.1 (`d7971bf`). Round-5-Development remains available for rollback. No default-branch merge or live deployment.

**Existing PHP/MySQL website:** download this branch ZIP and merge only **hosting-update/public_html contents** into the existing document root. **No new SQL if migration 005 is already installed.** See [v0.6.3 cPanel instructions](hosting-update/docs/ROUND6_0_6_3_UPGRADE.md); older installations need 005 once. Prebuilt PHP/static assets need no production Node service.

The library returns to compact rows with Edit/View on the right. Meeting content selection keeps media thumbnails, uses the video play icon or See Full Text, and immediately chooses one item with Use content. Rotation/deletion controls live in the library editor. New contributions join only the creator location's rotation (an administrator's selected location); other locations choose independently. Admin deletion offers archive, permanent deletion or cancel, including permanent deletion of archived content. Saved-meeting snapshots/media remain intact. Everyone signed in can still contribute.

The update folder excludes **server-paths.php**, **config.js** and the root **.htaccess**. Keep the live copies, all private configs/API keys, the database and the manually corrected media-directory path/permissions. **Do not upload hosting-upload or the repository root demo over the existing site.**

[Development checkpoint: cause, decisions, verification and remaining host checks](translation-pilot/docs/ROUND6_CHECKPOINT.md). [Original setup guide for new installations](hosting-upload/docs/ROUND5_SETUP.md).

Editable source is in `translation-pilot/`. Run `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, both `build:demo`/`build:hosted`, `npm run check:php`, `python3 scripts/check-migrations.py`, and `npm run package`. Focused disposable hosted checks: `tests/api/round6-combined.py`, `tests/e2e/round6-compact.cjs`, then package-smoke with `MMB_PACKAGE_FIXTURE=/tmp/mmb-combined-fixture.json`.

Stop after combined Batches 2 and 3. Template/slide-type redesign, captions, presentation navigation and later batches remain outside this update.
