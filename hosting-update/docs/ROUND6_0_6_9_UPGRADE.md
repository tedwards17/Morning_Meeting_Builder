# v0.6.9 — simpler branding and background images

## Upload to an existing cPanel website

1. Download/extract **Round-6-Development**. Back up the live document root, database, private configuration and media.
2. Merge **only the contents of `hosting-update/public_html`** into the existing document root, overwriting matching app files. Do not replace/delete the whole directory or upload the entire repository.
3. Keep the live `server-paths.php`, `config.js` and root `.htaccess` (all three are excluded from this update folder), private credentials/provider keys, database, uploaded media and the manually corrected media-directory path.
4. **No new SQL is needed.** If upgrading from before v0.6.7, check installed migration versions and apply data-only 007 once if absent, per ROUND6_0_6_7_UPGRADE.md. Never reset/reimport starter data or rerun installed 005/006.
5. Reload online and confirm v0.6.9. Allow the service worker to update; reopen older tabs if needed. Do not clear browser storage with unsynced work.

Use `hosting-update` for existing sites. `hosting-upload` is the separate new-install package and contains example configuration/path/rewrite files. Production stays static HTML/CSS/JavaScript plus PHP/MySQL; Node is only a developer/build tool. No live deployment or default-branch merge is performed.

## What changed

- Removed the illustration picker, built-in artwork, matching controls, badges and presentation rendering. All slide text/media now use the full protected workspace. Old illustration settings are ignored, without rewriting saved meetings or deleting old server records/files. The user's new request supersedes v0.6.8's illustration feature; it is not converted into background images automatically.
- Logos use their **visible artwork**, trimming transparent outer padding for display by default. Original server images remain unchanged. **Logo size (%)**, 25–100, adjusts the artwork within the same fixed header height. **Trim transparent logo padding** can restore intentional original padding. Preview, meeting builder and actual presentation share the renderer. Logo width can now use up to 35% of slide width while retaining proportions; changing size does not push the title down. Adding/removing a logo still switches between the existing company-name header and logo header.
- Background images have their own reusable collection, separate from content-library images and meeting uploads. Theme/group and individual-slide selectors show registered backgrounds, not all media/library items. An old currently selected background stays available as **Current background image** until changed; old files are not automatically enrolled or deleted.
- **Manage background images** provides thumbnails, upload, rename, hide and restore. Anyone authorized to edit the current template can upload backgrounds and manage their own entries; administrators can manage all. Use-only template recipients cannot upload/manage images through that template. Backgrounds are shared company design assets, available across devices; they do not become content items or enter rotation.
- Direct **Upload background image** registers and selects the file. Uploading the same file again reuses its existing collection entry. Design uploads by different uploaders retain separate ownership when the existing media deduplication would otherwise assign another person's file.
- **Background image fit** offers **Fill slide** (existing cropped fill behavior) and **Shrink to fit** (whole image, no cropping/distortion/tiling, centered). Unfilled space uses the slide's existing background color. Templates/groups set a default; individual slides can override it or **Use theme fit**. Existing No background image / Use theme background behavior remains.

JPEG, PNG and WebP upload support and hosting limits remain. Logo bounds are measured in the browser from alpha pixels; opaque white margins are intentional image pixels and are not automatically removed. No new crop editor or image-file rewriting is introduced. English/Spanish controls and responsive field alignment are included.

Accounts, sharing/edit/default distinctions, compact library, all-account content contribution, rotation, numbering, separate fonts, multiple meeting-media files, captions/translation and administrator unused-draft deletion remain. Template changes do not rewrite saved snapshots. The requested illustration removal applies to rendering of old snapshots as well, while retaining their stored data for rollback.

## Verification

Results and GitHub run are recorded in ROUND6_CHECKPOINT.md. Automated browser tests use headless desktop/mobile viewports; physical phone, TV and native-dropdown checks remain manual. No paid translation-provider calls are used.

## Short manual checklist

- Open a template with an old illustration: no illustration setting, art, badge or empty reserved column should appear.
- Select your transparent company logo. Try 25%, 50% and 100%; toggle padding trim. Check visible size, proportions, unchanged title position and matching preview/presentation on the TV.
- Upload landscape and portrait backgrounds. Compare Fill slide / Shrink to fit at theme and slide levels; check No background image and Use theme fit. Confirm old library photos are absent from the choices.
- Open Manage background images: rename/hide/restore an entry; upload the same file twice and confirm one reusable choice. Check permission with an edit-authorized location and a use-only location, then reopen on another device.
- Reopen an older saved meeting and check text/media/fonts, slide numbering and saved image settings. Check phone overflow and English/Spanish labels.
