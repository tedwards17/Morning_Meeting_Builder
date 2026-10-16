# Round 5 meeting fixes — update to 0.5.1

For an existing working PHP/MySQL installation at **https://morning.douglasstruckbodies.com**. FileZilla is optional; every step below works through cPanel in your browser. Keep the website closed on meeting devices during the update.

## What changed

- Captions append into three rolling lines. A full line stays at least eight seconds after its last word; the final text stays ten seconds after the queue empties. Short translated phrases no longer replace the whole screen. Queued translation fragments are processed in order, including those arriving during a slower translation request.
- English text is light blue (`#8fc8ff`), Spanish text light green (`#8ae6a3`), on a nearly opaque dark background. These are the displayed language's colors, regardless of the speaker's language.
- Uploaded meeting photos/videos stay in private server storage until the meeting is confirmed complete. Scheduled dates, practice previews and pauses do not expire them. Text history and shared library media are retained.
- On another device, sign into **the same account**, open **Meetings → your saved presentation → Open saved presentation**. This transfers editing to that device and prevents an older device from overwriting it. Finish saving/synchronizing on the preparing device before switching. Another account's private meetings stay private.
- The mobile navigation button sits in its own normal page row below the account bar.

## 1. Back up your working installation

In cPanel File Manager, turn on **Settings → Show Hidden Files (dotfiles)**. Back up the current `public_html` and `morning-meeting-private` folders outside the public web folder; download the backups privately. In phpMyAdmin, select the existing Morning Meeting Builder database and use **Export → Quick → SQL**. Keep the downloaded database backup private too.

Keep your real `config.php`, `translation-config.php`, media and captions-state folders, public `server-paths.php`, and public `config.js`. This update does not require new keys, accounts, cron jobs or database credentials. Do not delete the existing media folder or recreate the database.

## 2. Download the update and stage it in cPanel

1. In GitHub select **Round-5-Development → Code → Download ZIP**. Rename the download to `mmb-update.zip` for convenience. You do not need to extract the long GitHub paths on your Windows computer.
2. In cPanel File Manager, open your home folder `/home/morningdouglass` (one level above `public_html`). Create a temporary folder named `mmb-update` there.
3. Open that temporary folder, choose **Upload**, and upload the GitHub ZIP. Return to File Manager, select the ZIP, choose **Extract**, then **Reload**.
4. Open the extracted repository folder and locate **hosting-update**. Use this folder for this update. Its `public_html` folder deliberately omits `server-paths.php` and `config.js`, preserving your working settings.

Do not extract the entire GitHub repository directly into the live `public_html`. Source code, database scripts and private examples are setup materials.

## 3. Add database migration 4 once

1. In phpMyAdmin, select your **existing MMB database** on the left. Use the actual full prefixed database name already in your private config.
2. Open **SQL** and run:

   ```sql
   SELECT version FROM schema_migrations ORDER BY version;
   ```

3. If the result contains **1, 2, 3**, use **Import → Choose file** and import only `hosting-update/database/004_meeting_media.sql`. You can download that single file from the staging folder with cPanel File Manager if you did not extract the GitHub ZIP locally. You can also copy the complete SQL file into phpMyAdmin's SQL tab and run it once.
4. Run the verification query again. It should show **1, 2, 3, 4**. If 4 already exists, skip the import. If an import errors, inspect the error before retrying; MySQL schema statements cannot be rolled back as a group.

This migration adds `scope`, `meeting_id` and an index to `media_assets`, and records version 4. Existing shared images are marked shared by default. **Do not import migrations 1–3 or the seed file again.** The normal app database user's permissions stay SELECT, INSERT, UPDATE, DELETE; use cPanel's phpMyAdmin administrative access for this schema change.

## 4. Move the updated website files into place

Open the extracted **hosting-update/public_html** folder in cPanel File Manager. You should see `index.html`, `sw.js`, `.htaccess`, `assets`, `api`, `translation-api` and the other public files.

Move/copy its contents into **`/home/morningdouglass/public_html`**, choosing overwrite/replace for matching files. Include hidden `.htaccess` files. Do not place another `public_html` folder inside the live one.

If your File Manager refuses to merge existing folders, move their files separately:

1. Put all files from `assets` into the live `public_html/assets` folder first. Keep old hashed assets for now so an open browser can still load its previous build.
2. Replace the matching files in `api`, `api/src`, and `translation-api`, including their hidden `.htaccess` files. Keep the existing folder structure.
3. Replace the loose public files, including `index.html` and `sw.js`, last.

Leave your live `server-paths.php` and `config.js` alone. Nothing from `hosting-update/database` or `docs` belongs in the live public folder. The full `hosting-upload` folder is still available for first installations, but includes example public settings; use **hosting-update** here.

For larger videos, cPanel's MultiPHP INI Editor may need larger limits for this domain: for example `upload_max_filesize = 150M`, `post_max_size = 160M`, and an adequate `max_input_time` for slow uploads. The application limits meeting files to 150 MiB each (images are checked at 25 MiB in the browser before conversion); smaller host limits still apply. Ordinary photos do not need those maximum values. Ask the host if its request limit cannot be changed in cPanel.

## 5. Refresh and test before the next meeting

1. Close all app tabs, reopen the website, and hard refresh (`Ctrl+Shift+R` on Windows). If an installed app still shows the old version, close it fully and reopen while online; its cached update activates after older tabs close. Settings should show **0.5.1**.
2. Sign in, build a small test meeting, upload a Personal share photo, and choose **Save presentation**. Wait for the saved message. Use **Settings → Sync Now** if a sync warning appears.
3. Preview and close the preview. The photo should stay. Open the same account on another device, find the saved meeting and choose **Open saved presentation**. The photo should display without uploading again.
4. If that presenting device will be offline, use its **Download meeting media** control while connected and check the readiness indicator. Save online first; server-held media does not reach an offline device automatically. YouTube, external links, microphone transcription and live translation still require internet.
5. Start translation; speak short English and Spanish phrases. English display text should be blue, Spanish green; earlier phrases should remain while short phrases append.
6. Pause and resume. The photo should stay. At the final checkmark the app says **“Personal Share Images will not be saved”**. Cancel once to verify it stays, then confirm completion. The temporary image should disappear while the meeting's topic titles/transcript remain.
7. Check the navigation button on your phone. It should sit below the account name instead of floating over it.

When confirmed complete while offline, local media is removed and deletion is queued for the next successful sync; server storage cannot be changed until connectivity returns. Shared library images are not deleted. Once you are satisfied, delete the temporary `mmb-update` staging folder and uploaded ZIP; retain backups privately as needed. Backups can still contain older photos until you remove those backups separately.

Photos already lost before this update cannot be recovered by it. Existing device-only uploads should be re-added from the original files and saved online so the new version places them on the server.

## Caption research and design

Google's [official Meet caption-history announcement](https://workspaceupdates.googleblog.com/2025/02/google-meet-caption-history.html) describes a continuous history with scrollback, rather than discarding each fragment. It does not publish Meet's exact internal timing algorithm. W3C's [WebVTT specification](https://www.w3.org/TR/webvtt1/) describes roll-up regions where new lines push previous lines up. This app uses a measured-width React caption buffer with three lines, an eight-second minimum per full line, at least 2.2 seconds between rolls, and a ten-second final hold. Those timings are our implementation choices, not a claim about Google's internals. If translation outpaces the display, words queue in order rather than being dropped.

Technical verification is recorded in [ROUND5_CHECKPOINT.md](ROUND5_CHECKPOINT.md). This branch contains code/packages only; uploading through cPanel is the separate live deployment step.
