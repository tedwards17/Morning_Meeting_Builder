# v0.7.0 — video expansion and final branding

User approved the Corner overlay design and promotion to v0.7. This release continues verified v0.6.9.5 on Round-6-Development; no default-branch merge or live deployment.

## Existing cPanel website

1. Back up the live website, database, private configuration, keys and media.
2. Extract `morning-meeting-builder-update-0.7.0.zip`. Merge only the contents of `public_html` into the existing document root. Do not replace/delete the document root or upload the whole repository.
3. Keep live `server-paths.php`, `config.js`, root `.htaccess`, private credentials/configuration, database, media directories and the corrected media path. The three root configuration files are excluded from this update.
4. No new SQL. If upgrading from before v0.6.7, earlier migration 007 is required once only if absent. Never reset/reimport starter data or rerun installed migrations.
5. Reload online and allow the service worker to update. Reopen older tabs if necessary and confirm **v0.7.0**. Do not clear storage containing unsynced work.

Static assets plus PHP/MySQL remain the production stack. No Node production service, new integration or provider configuration is required. The GitHub hosting-update/public_html folder has the same prebuilt payload; hosting-upload remains for new installations.

## What changed

- YouTube videos in actual presentations get a dark, slightly translucent, 44px **Expand video** button in the upper-right corner. It stays independent of YouTube's own controls and the fading presentation bar.
- Expansion fills the presentation viewport even while the presentation itself is in native fullscreen. It uses the same mounted iframe/player, rather than opening a new window or remounting/reloading the video. Captions, the clock and Next remain available. **Back to slide**, Escape or device/browser Back restores the slide. The next Back uses the usual pause confirmation. Next/clicker navigation cleans up expansion and advances normally; Finish still needs explicit confirmation. Preview usage behavior is unchanged, and the new overlay is limited to actual presentation.
- The video is expanded within the app; this does not invoke YouTube's native fullscreen mode or force video orientation. Native fullscreen may still consume a physical Back/Escape before the app receives it. Actual device gesture and iframe playback behavior need physical acceptance; automated viewport/native-fullscreen checks are not universal Android/iOS support claims.
- Logo size accepts **25–200%**, in the editor, client schema, renderer and server validation. Transparent trimming remains. Through 100%, the existing 4cqw header spacing remains. Larger logos reserve their actual height, moving the title only as needed to prevent overlap. The same rules apply to template previews, meeting previews and presentations. Original image files are unchanged. Existing saved meetings retain their captured size unless rebuilt/edited through existing flows.
- The upper-right meeting/theme-group text moves to the bottom-left footer, replacing the repeated slide title. The default reads **Morning Meeting**; an existing custom theme-group heading moves with it. Company branding stays at the upper-left and company name at the bottom-right. Main slide titles remain. This shared rendering change also appears when viewing older saved snapshots without modifying their stored content.
- v0.6.9.5 captions, persistent Next, transcript/capture cleanup, safe pause/finish, content/rotation, backgrounds, fonts, layout, numbering and saved media behavior remain. Illustrations stay removed.

## Shop check

- Start a YouTube video on the phone. Try Expand and Back to slide while both outside and inside presentation fullscreen. Confirm playback continues, captions remain readable and Next advances once.
- Expand again, use device Back to return to the slide, then Back again to test the normal pause confirmation. Check temporary images/transcripts remain after pausing.
- Try a transparent logo at 100%, 150% and 200%, including a long slide title and phone landscape. Confirm it stays clear of the title, then save/reopen the template.
- Check that Morning Meeting/custom group appears at the bottom-left, company name remains at the bottom-right and the slide title appears only in its main position.

See ROUND6_CHECKPOINT.md for exact automated results, verified commit and browser/device limitations. No paid translation-provider calls are made by the automated tests. Real YouTube playback and live shop audio/provider behavior remain manual acceptance.
