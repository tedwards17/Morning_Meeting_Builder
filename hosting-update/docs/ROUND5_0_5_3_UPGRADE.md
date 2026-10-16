# Round 5 media attachment repair — 0.5.3

For the existing morning.douglasstruckbodies.com installation. No new SQL, PHP settings, keys, or private configuration changes are required when upgrading from 0.5.1/0.5.2 with migration 004 installed.

## Upload with cPanel File Manager

1. Keep your private backup of the live files and database. Download the latest **Round-5-Development** branch ZIP from GitHub.
2. Empty the temporary **mmb-update** extraction folder if it contains only old update files. Upload/extract the new ZIP there, outside the live document root.
3. Inside the extracted repository, open **hosting-update/public_html**. Copy/merge **the contents** into **/home/morningdouglass/public_html**, replacing matching files. Copy the assets folder first, API folders next, and index.html/sw.js last. Keep old hashed assets and existing directories; do not empty the live public_html or nest another public_html inside it.
4. This update intentionally omits server-paths.php, config.js and the root .htaccess. Keep the live copies, private configuration/keys, media folder and database. Do not use first-install examples from hosting-upload to overwrite them. Do not reimport SQL, the seed, or migrations for this patch.
5. Close all tabs and any installed app on each device. Reopen online and refresh. On desktop use Ctrl+Shift+R. Confirm **0.5.3** in Settings before testing. Do not clear site/browser data.

## Verify the upload

Open an unfinished meeting, select **Small changes. Better work.**, and use **Upload images / videos**. Wait for **Media attached and saved to this meeting.** The image should appear in the preview and Selected content, and the missing-media warning should clear. Uploading to a skipped media slide includes it automatically. Reopen the saved meeting, check the image, and start presenting.

If offline caching is unavailable, the message explains that the attachment is saved but its offline download is incomplete. Online previews use the saved server image. Use **Download meeting media** while connected before presenting offline; wait for its ready confirmation.

Upload failures now appear **beside the upload button**. If the live host still rejects an upload, send that exact message and the file extension/size. For example, a PHP upload-limit error needs hosting settings checked; it is not resolved by clearing browser data. The tests reproduce storage/download failures locally; they do not establish which error occurred on the live host.

## Changes

- A successful hosted upload is no longer discarded when the browser cannot cache it for offline playback. An eight-second cache timeout releases an upload blocked by the legacy media database or a stalled download.
- Online previews read the server image even when the offline media database is unavailable. The requested asset ID is preserved when the same photo occurs in several meetings.
- Save the current draft before uploading; attach by stable slide ID using the latest edits, include the media slide, and persist the attachment immediately. Switching slides or changing the presenter during a slow upload preserves those changes.
- Preparation, success and failure feedback sits next to the upload control.

The PHP storage/authorization and confirmed-finish media deletion rules are unchanged. Photos remain on the server until the meeting's confirmed completion. Publishing this branch does not deploy the live website.
