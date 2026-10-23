# Round 6, Batch 1 — v0.6.0 cPanel update

This is an update for the working PHP/MySQL site (v0.5.4, with migrations 001–004 already installed). **No SQL migration or configuration edit is required for Batch 1.** Node is used only to build the files; production remains static HTML/CSS/JavaScript plus PHP/MySQL.

## Upload

1. Download the **Round-6-Development** branch ZIP from GitHub and extract it on your computer. Keep a copy of the current website files as a rollback backup. Round-5-Development remains at v0.5.4.
2. Open the domain's actual document root in cPanel File Manager. Merge/upload **only the contents of `hosting-update/public_html/`** into that existing root. Overwrite matching application files and merge the `assets`, `api` and `translation-api` directories. Do not replace or delete the entire document root.
3. This update folder deliberately excludes **`server-paths.php`, `config.js`, and the root `.htaccess`**. Leave the live copies untouched. Leave private configuration, API keys, media storage, its manually corrected `media_dir` path/permissions, and the database untouched. Do not upload private/config.example.php, setup scripts, or database files. Do not use hosting-upload for this existing site.
4. Close other MMB tabs and reopen/refresh the website online. If it still shows 0.5.4, close the installed app/browser tab and reopen again after the updated service worker installs. Do **not** clear browser/site storage. Confirm **0.6.0** in Settings.

The existing API and translation-api directory `.htaccess` files are included as before; the customized **root** `.htaccess` is excluded. The update includes historical migration 004 as reference for installations older than 0.5.1; do not run it again on this working v0.5.4 site. No change to cron jobs is required.

## Short manual test

- Sign in as an Administrator. In Content library → Libraries, create a uniquely named library and rename it. Confirm “Library saved.” appears inside the manager and the library tab updates.
- Add a Text lesson with a title and description. Save, reopen, change the description, save again, and refresh. Confirm the saved values remain.
- Add Image content with a title, description and a JPEG, PNG or WebP. Confirm it saves and renders after refresh. Repeat these three save checks with a Content Manager account.
- Try a missing description, or choose Image without selecting a file. Confirm the relevant error is visible **inside the form**, and entered values remain. Correct it and save.
- Sign in with a Location account. Confirm it sees the role explanation and disabled creation controls. On desktop and phone, confirm warnings and form errors can be read without being covered by the sidebar. Close the phone's drawer if needed to return to the page.
- Briefly open a saved meeting/presentation and confirm existing media, sign-in, captions and transcript still work on your real device. This session did not call paid transcription/translation providers or deploy to the live site.

A denied role, form validation failure, save conflict and server/connectivity failure now have distinct feedback. Unexpected server failures show a **Request ID** that an administrator can find in the PHP error log (`MMB <request ID>`). Share that ID and the action attempted; do not send private config files or API keys. An expired session leaves an open draft visible so values can be copied before closing it and signing back in.

## Rollback

Restore the backed-up v0.5.4 application files (including its index.html/sw.js/API files), or obtain matching application files from Round-5-Development's hosting-update folder. Keep the existing live public configuration, private configuration, root .htaccess, database and media directory. Batch 1 does not change the database schema. Newly saved records remain compatible with v0.5.4; reopening online lets the browser load the older application shell.
