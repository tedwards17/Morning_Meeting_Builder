# v0.6.4 — combined Batches 4 and 5

Use only Round-6-Development. No live deployment or default branch merge is included. Source is under translation-pilot; hosting-update/public_html is prebuilt static HTML/CSS/JavaScript plus PHP. No production Node service.

## Existing cPanel installation

1. Back up the database and current public files. Keep private config/provider keys, database, media and corrected media directory path/permissions.
2. Confirm schema_migrations contains 1–5. Older installations must follow the earlier upgrade guides first. **Apply hosting-update/database/006_video_text_cleanup.sql exactly once**, before uploading new public files. If version 6 is present, skip it. Either import this one SQL file using phpMyAdmin, or run the private migration runner with the live private config. Never import seed data or reset the database. The runner skips installed migrations.
3. Merge the **contents of hosting-update/public_html** into the existing document root, replacing matching public application files. Keep the live server-paths.php, config.js and root .htaccess: these three files are excluded from the update. Keep all private configuration and server-held media. Do not upload hosting-upload, repository root demo, database or docs into the document root. hosting-upload is a full-install example, including example paths; it must not replace an existing installation.
4. Reload the app online and run the short acceptance check below. Do not clear browser storage as an upgrade step.

006 is a data-only migration with no permanent schema addition. It clears the slide body and browsing description on current video/YouTube items in the Safety and Lean libraries (standard library IDs or Safety/Safety videos/Lean/Lean learning/Lean videos names). It includes archived entries. IDs, titles, media URLs/files, attribution, sharing, rotations and usage are retained. Version snapshots and sync notifications are created. Saved meeting snapshots are untouched. A temporary InnoDB table is dropped in the same transaction. Back up before running: clearing those two fields is intentional. Later user-authored text is retained because the migration is run once. No starter-content reimport.

## Changes and compatibility

- No countdown controls, timer, or overlay. Existing duration metadata remains accepted and inert. Caption, translation auto-stop, playback and presentation-control hiding timers remain.
- Every available item can be selected repeatedly, including when used elsewhere or in history. Automatic pools still require location visibility and rotation membership; manual selection does not enroll an item or erase its history.
- New automatic/manual library selections contain one item. Legacy counts and existing saved multi-item snapshots remain stored and playable. Media uploads still accept up to 12 files.
- Three template slide categories: **Standard** (title/text, optional media/library), **Library content**, **Media** (uploads or an optional web link). Existing wire types are retained until the user deliberately changes type. Intro/divider/closing/discussion/text map to Standard; library/stretch/vocabulary/recognition map to Library content; image/image-text/gallery/video/external map to Media. This retains old intro/presenter and personal-share capabilities. Supported YouTube URLs use the existing player; ordinary links open their website. An inline Media URL is only used if no library is connected; empty rotation never triggers a hidden URL fallback.
- Builder color is an arbitrary six-digit hex picker and remains a builder-list highlight. Theme colors share aligned swatch/hex controls. Text position has a keyboard-accessible 3×3 popup. New choices move the title/body group together in template preview, builder preview and presentation. Existing slides without textPosition keep their media layout; nine-position text may overlay media by the selected position, with proportions retained.
- Browsing description is separate from slide body/accompanying text, max 4000 characters, for all three content categories. It is searchable/readable in the library, selector and selected builder row, and excluded from presentation rendering. Text still requires body text; media/link body remains optional as established in v0.6.3.
- Selected media has thumbnails; video play opens the existing isolated preview without recording usage. Compact right-side Edit/View, creator-location rotation, all-account contribution and admin deletion rules remain.
- Native select/option colors explicitly use a readable light palette for normal/focused/selected/disabled states. The intermittent native black popup was not physically reproduced. No browser rendering claim is made from headless checks alone.

## Short manual acceptance check

- At each location, create text with a separate description; add/edit video accompanying text. Verify only accompanying text appears in presentation. New contributions enroll only in the creator location.
- Build a meeting, choose the same item on two slides and again in another meeting; try Auto-select and Stretches/Morning movement. New library selections must contain one item. Preview a selected video via its play icon.
- Open an older saved multi-item presentation. All its content/media should remain. Upload two files to a Media slide and present both.
- Save/reopen arbitrary builder/theme colors and all nine text positions; compare template preview, builder preview and presentation. Check portrait and landscape for overflow, using English and Spanish.
- On physical desktop Edge/Chrome and Android Chrome/Samsung Internet, repeatedly open, focus, select, close and reopen the slide-type/library/layout dropdowns, including disabled fields. Report browser/device/version and a screenshot if the native black popup returns.
- Confirm sign-in, saved meeting, media playback and existing translation/transcript features on the host. Automated checks do not make paid translation calls.

For rollback, retain the Round 5 and prior Round 6 branches. Restore the matching backed-up database if the cleared body text is needed; replacing frontend files alone does not undo data cleanup.
