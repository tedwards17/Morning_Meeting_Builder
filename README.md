# Morning Meeting Builder — Round 6, Batch 1 (v0.6.1)

Branch: **Round-6-Development**, from the latest Round 5 v0.5.4 commit **7b1e113**. Round-5-Development remains available for rollback. No default-branch merge or live deployment is performed.

**Existing PHP/MySQL website:** download this branch as ZIP and upload only the contents of **hosting-update/public_html** into the existing domain document root. Follow [the cPanel update and manual test guide](hosting-update/docs/ROUND6_BATCH1_UPGRADE.md). The files are prebuilt; no production Node service is needed. No new SQL migration is required on v0.5.4.

**v0.6.1 correction:** every signed-in role can add content and shared images to company libraries. Stretches now auto-selects content and lists text/images/video links from its connected library in the builder. Library management and editing existing records keep their prior role requirements.

This batch fixes readable, in-form save/validation errors, clearer role restrictions, library create/rename input retention, successful-save confirmation and list updates, request IDs for unexpected server failures, and global warnings hidden by the sidebar. It preserves the working presentation, accounts, translation, saved meetings and server-held media.

The update folder excludes **server-paths.php**, **config.js** and the root **.htaccess**. Keep the live copies, all private configs/API keys, the database and the manually corrected media-directory path/permissions. **Do not upload hosting-upload or the repository root demo over the existing site.**

[Development checkpoint: cause, decisions, verification and remaining host checks](translation-pilot/docs/ROUND6_CHECKPOINT.md). [Original setup guide for new installations](hosting-upload/docs/ROUND5_SETUP.md).

Editable source is in `translation-pilot/`. Development: `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build:demo`, `npm run build:hosted`, `npm run check:php`, `python3 scripts/check-migrations.py`, `npm run package`. PHP/MySQL API/browser tests require a disposable configured database; see the checkpoint and existing verification guide. The new focused tests are `tests/api/round6.py` and `tests/e2e/round6-content.cjs`.

Batch 1 only. Location-sharing/rotation, video previews, slide types, template redesign, captions and presentation navigation are separate batches.
