# Round 5 image decoding repair — 0.5.4

This update addresses the pre-upload “this browser cannot display this image” error while preserving server-held meeting photos. It includes the previous 0.5.3 attachment/cache fixes.

## Update through cPanel

1. Keep your existing private backup. Download the latest **Round-5-Development** ZIP. Upload/extract it in the temporary **mmb-update** folder outside public_html. Empty only old temporary update files first.
2. Copy/merge the **contents of hosting-update/public_html** into **/home/morningdouglass/public_html**, replacing matching files. Upload assets first, API folders next, and index.html/sw.js last. Keep existing directories and old hashed assets. Do not empty the live public_html or nest another public_html inside it.
3. Keep the live server-paths.php, config.js, root .htaccess, private configuration/keys, media directory and database. The update package omits those edited public configuration files. **No SQL or PHP settings changes are needed from 0.5.1/0.5.2/0.5.3 when migration 004 is already installed.** Do not rerun the seed or migrations for this patch.
4. Close all app tabs and installed app windows. Reopen online, refresh (Ctrl+Shift+R on desktop), and verify **0.5.4** in Settings. Do not clear browser/site data.
5. Open an unfinished meeting and select the original photo again. Look for **Media attached and saved to this meeting**, a visible preview and Selected content. Reopen the saved meeting to confirm the attachment.

If it still fails, copy the exact message beside the upload button and provide the original image file if possible. A filename alone cannot establish its actual format or whether it is damaged. HEIC/HEIF that the browser cannot convert still needs exporting to JPEG; standard JPEG/PNG/WebP now reach PHP for validation when browser preparation fails. Truly invalid or oversized files are still rejected.

## What changed

The September v0.3.4 fix added normal browser Image loading after createImageBitmap failure. That code was already present. This update adds a third path using FileReader/data URLs. If all preparation decoders reject a standard hosted JPEG/PNG/WebP, upload the original bytes and let the existing PHP MIME/image/dimension checks decide whether it is valid. PHP processes images using GD/WebP when available. Existing client resizing remains for camera photos that decode normally.

The focused checks use real generated JPEG/PNG files with deliberately failed preparation decoders, including a JPEG named 1000023509.jp; forged JPEG bytes are rejected by PHP. The user's original image and the production host have not been inspected.

Photos remain on the website until the presentation's confirmed completion. Use Download meeting media while online and wait for ready confirmation before presenting offline. No browser-only storage rollback or new server dependency is introduced.
