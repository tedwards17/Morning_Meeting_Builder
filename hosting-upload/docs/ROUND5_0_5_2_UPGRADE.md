# Round 5 repair — update to 0.5.2

For the existing site at https://morning.douglasstruckbodies.com. This fixes the mobile menu, blocked meeting creation after the 0.5.1 update, duplicate persistent error bars, and presentation controls that would stay visible.

## Upload through cPanel

1. Keep a private backup of your existing files and database. Close other app tabs during the update.
2. Download the **Round-5-Development** branch ZIP. Upload and extract it in a temporary folder **outside public_html**, as before. You do not need to extract the long GitHub paths on Windows.
3. Open the extracted **hosting-update/public_html** folder. Merge its contents into your live **/home/morningdouglass/public_html**, replacing matching files. Upload assets first, the API files next, and index.html/sw.js last. Keep existing folders and old hashed assets; do not delete public_html or nest another public_html inside it. Replace both frontend and API files so recovery uses the new endpoint.
4. The update folder deliberately omits **server-paths.php**, **config.js**, and the **root .htaccess**. Your private configuration, API keys, PHP upload settings, media folder and database stay in place. Do not replace them with first-install examples from hosting-upload.
5. **No new SQL migration is needed if you already imported migration 004 for 0.5.1.** If upgrading directly from 0.5.0, check schema_migrations first and follow ROUND5_0_5_1_UPGRADE.md to import migration 004 once. Never reimport the seed or migrations 001–003.
6. Close all app tabs and fully close any installed app. Reopen the site online, hard refresh (Ctrl+Shift+R on Windows), and confirm **0.5.2** in Settings. The updated service worker activates after older tabs close. Use Settings → Sync Now if necessary.

**Do not clear browser/site data to fix the old error.** The new version automatically repairs the pending completed-meeting save when online: it reads the server's completed record, preserves its frozen details, and merges any unsent speech or missing translations. It also retains the original pending payload privately in this browser's account storage before rebasing it. Other errors and unauthorized writes remain errors; recovery is limited to completed-history conflicts.

## Check the fixes

- In portrait, the hamburger sits at the top left **beside the account name**. Opening it displays the side menu with a separate X in its own header. The flag and wording below have their own space. The background is locked while the drawer is open; tap the X, backdrop, or Escape to close it.
- Rotate to landscape, open the menu, and scroll inside it. You should be able to reach Content library, Settings and the rest of the menu while its close button stays visible.
- Build and save a new meeting from Home or Meetings. The old “Completed meeting details cannot be changed” error should repair itself on sync. Finishing this meeting must leave earlier completed meetings unchanged.
- There is one dismissible error banner. It clears after a successful sync or when navigating to another app page. A genuine unresolved failure can appear again when the operation is retried.
- Start a presentation, tap to reveal the controls, and change slides. The controls hide after five seconds of inactivity, including when a button was last tapped. Tap or move the pointer to show them again. This replaces the old keep-controls-visible preference.
- The browser's fullscreen exit notice is **browser-controlled**. A normal website cannot suppress it through the Fullscreen API. We keep the fullscreen toggle and do not add an app success notice. The app only shows a message when fullscreen is unavailable.

The fullscreen behavior follows the [Fullscreen API standard's security considerations](https://fullscreen.spec.whatwg.org/#security-and-privacy-considerations): browsers announce fullscreen and provide a reliable exit. There is no supported page setting to disable that browser overlay.

The existing rolling captions, English-blue/Spanish-green colors, server-held meeting photos, confirmed completion cleanup, and same-account device handoff remain in this update. Real microphone/provider and TV testing still happens on the live device after uploading. No production host changes are made by publishing this branch.
