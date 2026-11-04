# v0.7.1 — optional media and compact slide options

Continues verified v0.7.0 on Round-6-Development. No default-branch merge or live deployment.

## Existing cPanel website

1. Back up the website, database, private configuration, keys and media.
2. Extract `morning-meeting-builder-update-0.7.1.zip`. Merge only the contents of `public_html` into the existing document root. Keep existing directories; do not replace the document root with the update folder.
3. Preserve live `server-paths.php`, `config.js`, root `.htaccess`, private credentials, media paths/directories and database. The three root configuration files are excluded from this update.
4. No new SQL. Existing installations keep their installed migrations. Earlier 007 is only needed once if absent; never reset/reimport starter data or rerun installed migrations.
5. Reload online and allow the service worker to update. Reopen older tabs if needed and confirm **v0.7.1**. Do not clear storage containing unsynced work.

Production remains static HTML/CSS/JavaScript plus PHP/MySQL, with no Node production service or provider configuration changes.

## Changes

- Media is optional for every slide. Included Introduction/media slides can advance and present with no attachment, without requiring Skip. Existing saved `mediaOptional: false` metadata no longer blocks starting; no stored records are rewritten. Uploading, moving, detaching, saving and confirmed-finish cleanup retain their existing behavior.
- Template slide text is two lines tall with the TV brevity hint as a placeholder. Web link guidance is behind a keyboard/touch-accessible circled info control beside the label. Title/type/link/builder-color label styles match. Background override & presenter notes uses the same boxed disclosure style as Slide layout.
- Selected library content and its selection buttons remain in their own panel below the preview, separate from the universal **Slide Options** disclosure. Existing media organizer remains available. Plain slides without library content do not get a redundant empty selection box. Required broadcasts show the same options structure with their existing editing protection.
- Slide Options contains **Title** (superseding “Title and text” and the old fixed-title guidance), two-line additional meeting text, content position and layout reset. Editing a title updates only that meeting snapshot and its agenda/preview/presentation; the source template/library text stays intact. A temporarily empty title field retains the last valid saved title when it loses focus. Reset sits beside content position on desktop and below it on phones. Obsolete positioning helper text is removed.
- A position button immediately beside the logo percentage offers Left, Center and Right. All positions stay at the top; Left preserves the original inset and Right mirrors it. Theme/group themes save the optional `logoPosition` field, copy it into new meeting snapshots and validate it on the server. Missing position defaults to Left, so existing snapshots retain their captured appearance. Transparent trimming and the 25–200% size range remain.
- English and Spanish interface text is included. Captions, video expansion, persistent Next, scoped Back/pause, explicit Finish, transcripts, temporary media, fonts/backgrounds, library permissions/rotation and removed illustrations are preserved.

## Shop check

- Start a meeting with an empty Introduction and an empty media slide; talk through both and use Next normally.
- Open Slide Options for standard, library and media slides. Edit a title and add text, save/reopen, and confirm the template title is unchanged.
- On a phone, try the info button and two-line text fields. Confirm content selection is above Slide Options and the layout reset stacks comfortably.
- Save a logo in Left, Center and Right, including at 200%, and inspect template preview, meeting preview and presentation.
- Pause/Back after attaching a temporary photo; confirm the photo and transcript remain. Check captions/YouTube expansion and final confirmation as usual.

Automated checks use browser emulation and mock speech/translation/YouTube services; physical phones/TVs and live shop audio remain manual acceptance. Native fullscreen may consume an initial physical Back/Escape before the application receives it, as documented in v0.7.0. No paid translation calls are needed for verification. GitHub verification passed: 103 unit tests, 120 API checks, 359 browser checks and four real cPanel-package checks. Run: https://github.com/tedwards17/Morning_Meeting_Builder/actions/runs/41927983183 . See ROUND6_CHECKPOINT.md for the tested commit and environment.
