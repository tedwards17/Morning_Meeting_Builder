# v0.6.8 — combined Batches 6 and 7

## Existing cPanel website

1. Download the **Round-6-Development** branch ZIP and extract it. Back up the document root, private configuration, database and media before uploading.
2. Merge **only the contents of `hosting-update/public_html`** into the existing website document root, overwriting matching application files. Do not replace/delete the document root or upload the entire repository. This folder deliberately omits live `server-paths.php`, `config.js` and root `.htaccess`; keep all three, private provider/database configs, the database, media directory and its manually corrected path.
3. **No new SQL is required for v0.6.8.** On an installation older than v0.6.7, check installed migration versions first: apply data-only `007_quote_titles.sql` once if version 7 is absent, following ROUND6_0_6_7_UPGRADE.md. Earlier sites must follow the earlier upgrade chain. Never reset/reimport starter content or rerun installed 005/006.
4. Reload online after upload and confirm v0.6.8. Let the service worker finish updating; close/reopen the app if an older tab remains. Do not clear browser storage containing unsynced work.

Do not upload `hosting-upload` over an existing site: that new-install package includes example config/path/rewrite files. Node is used only for development/build; production stays static HTML/CSS/JavaScript and PHP/MySQL. No live deployment is performed by this release.

## Initial review and completed work

| Requirement | Baseline assessment | v0.6.8 result |
| --- | --- | --- |
| Reusable per-slide illustration picker | Missing | None, eight built-ins and company collection; editable by authorized template editors |
| Agenda-inspired illustrations | Missing | Original transparent SVG line art for introduction, stretching, safety, vocabulary, lean, recognition, ownership and dismissal; English/Spanish labels |
| Match actual slide highlight | Missing | Optional original-color/matched modes, immediate preview, persisted snapshots and shared presentation renderer |
| Protected text/media layout | Complete and verified; art integration missing | Dedicated illustration column; existing title/body priorities, fitting, media primacy, footer and captions retained |
| Background/logo rendering and alignment | Partially complete | Existing fields reused; direct template background upload, admin logo collection and cross-device references completed |
| Template distribution | Partially complete | Existing availability/edit/default model retained; All current locations, individual location checks, company-wide/future-location setting |
| Delete unused saved presentations | Complete and verified | Existing administrator-only confirmation/history guards and synchronized deletion preserved |
| Readable meeting dates | Missing in list/details | Localized year-last dates, unchanged date storage/order, no timezone shift |

No newer behavior was reversed. The broader older meeting-deletion request remains superseded by the implemented **never-used draft only** rule. Distribution changes availability; they do not replace templates, change defaults or rewrite saved meetings. Current numbering and separate title/text font sizes remain.

## Using illustrations and branding

In a template slide, open **Illustration** to select None, a built-in or a company illustration. Select **Match slide highlight color** to use that slide's Builder slide color. With no highlight, original colors remain. A contrasting backing keeps light colors visible. Background and media are still independent settings. Illustrations occupy their own right-hand area; media slides give the larger area to uploaded content.

Administrators can manage the reusable collection from the picker and company logos from the existing theme Logo field: upload, rename, hide and show. Hiding removes an entry from new choices; it retains original files and saved references. Authorized template editors can choose these images but cannot manage the company collection. Background upload checks permission on that specific template. Existing inaccessible template cards cannot be edited or archived from the Templates screen.

Uploads accept JPEG, PNG and WebP up to 15 MB (subject to existing hosting/storage limits). Only transparent single-color icon artwork is eligible for matching. Opaque panels and multicolor/photos retain original colors with an explanation. The check is deliberately conservative: unusual anti-aliasing may require an image with cleaner transparent edges. Matching uses an alpha mask; original files are unchanged. Design-image PNG/WebP uploads use lossless encoding to preserve edge colors; ordinary content-media behavior is unchanged. SVG upload is not enabled; built-in SVGs are application assets.

Reusable designs use existing shared media and generic versioned records, outside temporary meeting uploads and content rotation. Cross-device metadata and permission updates use the existing synchronization mechanisms. The company collection is server-held; a browser-only backup is not a substitute for backing up the server database/media or moving a company catalog between unrelated organizations.

## Sharing and compatibility

Company-wide availability includes future locations. Turn it off for targeted location access. **All current locations** visibly selects/deselects current location Use boxes, preserving explicit Edit grants, individual account permissions and defaults. Edit remains distinct from Use. Existing account grants remain effective independently. Defaults are not changed automatically.

A canonical JSON comparison fixes a false sharing-permission rejection when authorized location editors save a template whose unchanged access keys arrive in another order. It does not grant new sharing rights. Explicitly authorized location editors can open Templates; use-only recipients continue to use available templates through the meeting builder without editing them.

Themes, per-group background overrides, legacy references and saved snapshots remain compatible. Existing meetings keep captured image/text/theme choices after template edits. None can explicitly hide an inherited background; Use theme restores inheritance. Shared illustration/logo/background assets are retained by temporary-media cleanup. No captions, translation-provider behavior or presentation-navigation redesign is included.

## Verification and remaining device checks

Local verification: 100 unit tests; 119 hosted API checks (97 retained + 22 visual/permission cases); 228 browser checks (190 retained + 38 new); 23 PHP syntax checks; seven unchanged migrations; typecheck, lint, localization and both builds. All four package smoke checks and GitHub CI passed; run 41738358591 is linked in ROUND6_CHECKPOINT.md. Disposable PHP 8.3/MariaDB 10.11 and headless Chromium 153 were used locally, with mocked provider tests and no paid provider calls. Desktop/mobile screenshots inspected. These are not physical-phone/TV or native open-dropdown acceptance tests.

## Short manual checklist

- Admin: choose each built-in and None; upload transparent monochrome, opaque and multicolor images; toggle matching and change slide highlight; rename/hide/restore an entry. Confirm originals retain colors/transparency.
- Edit-authorized location: upload a background and select a company logo/illustration; save and reopen on another device. A use-only location can build/present with those assets and cannot edit the template or manage company images.
- Share with one, several and all current locations; check company-wide/future-location behavior separately. Confirm Edit grants and location defaults stay intentional.
- On desktop, phone and meeting-room TV: check long template/library/additional text, media primary sizing, captions/footer clearance, all existing text positions and no horizontal overflow. Confirm preview/presentation agree.
- Confirm current slide numbers, EN/ES dates and saved snapshot stability. Admin can cancel/delete a never-used draft; started/completed presentations and non-admin accounts have no delete action.
- Check native dropdown readability on desktop Edge/Chrome and Android Chrome/Samsung Internet; physical-browser behavior remains an acceptance check from earlier batches.
