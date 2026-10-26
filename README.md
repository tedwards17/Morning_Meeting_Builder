# Morning Meeting Builder — Round 6, combined Batches 2 and 3 (v0.6.2)

Continue on **Round-6-Development** from working v0.6.1 (`d7971bf`). Round-5-Development remains available for rollback. No default-branch merge or live deployment.

**Existing PHP/MySQL website:** download this branch ZIP, back up files/database, apply **migration 005 once**, then merge only **hosting-update/public_html contents** into the existing document root. Follow [the cPanel upgrade guide](hosting-update/docs/ROUND6_BATCH2_3_UPGRADE.md). Prebuilt files need no production Node service.

Every signed-in role can still add content. The editor now offers Text, Image/Video and Link, with location sharing separate from subject tags. Available content can be chosen manually; explicit server-held per-location rotation controls automatic selection. Migration 005 preserves the existing pool; newly created items need opt-in. Location accounts manage their own rotation, administrators any selected location. Visual cards and isolated previews support legacy content, reusable MP4/WebM and YouTube. Administrator deletion archives company content while retaining saved-meeting snapshots/media.

The update folder excludes **server-paths.php**, **config.js** and the root **.htaccess**. Keep the live copies, all private configs/API keys, the database and the manually corrected media-directory path/permissions. **Do not upload hosting-upload or the repository root demo over the existing site.**

[Development checkpoint: cause, decisions, verification and remaining host checks](translation-pilot/docs/ROUND6_CHECKPOINT.md). [Original setup guide for new installations](hosting-upload/docs/ROUND5_SETUP.md).

Editable source is in `translation-pilot/`. Run `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, both `build:demo`/`build:hosted`, `npm run check:php`, `python3 scripts/check-migrations.py`, and `npm run package`. Focused disposable hosted checks: `tests/api/round6-combined.py`, `tests/e2e/round6-combined.cjs`, then package-smoke with `MMB_PACKAGE_FIXTURE=/tmp/mmb-combined-fixture.json`.

Stop after combined Batches 2 and 3. Template/slide-type redesign, captions, presentation navigation and later batches remain outside this update.
