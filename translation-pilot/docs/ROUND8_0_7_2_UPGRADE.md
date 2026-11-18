# v0.7.2 — a visual Home for the daily meeting

Continues verified v0.7.1 on Round-6-Development. No default-branch merge or live deployment.

## What changed

Home now leads with two large clickable tiles: **Build a new meeting**, showing the default template's actual slide/theme preview; and **Present a saved meeting**, showing the latest unfinished presentation dated today for the current location. Opening the saved tile goes directly to that meeting's builder/review screen; it does not start recording use or microphone capture. If none is ready, the tile explains that a meeting must be saved for today. Yesterday's, future and completed meetings cannot take over today's shortcut. Older and completed records stay in the saved-presentations list underneath, with the existing ten-completed-record limit.

Removed from Home: the greeting/tagline, duplicate area tag, Your workspace shortcut group, last-template/extra-new-meeting shortcuts and pilot-starter note. Sidebar navigation and SAMPLE content labels remain. Home provides one visible new-meeting action instead of several competing choices. Default-template selection retains the existing first-usable-template fallback; an empty template collection opens the existing template chooser.

The top account bar shows the location name (or existing account name when there is no assigned location) in larger text, without the account-type subtitle. Sign out is in the bottom-right of the sidebar, below the scrolling navigation, including phone landscape. It is hidden with the closed mobile drawer. The existing authentication, unsent-record guard, logout and drawer keyboard/focus behavior remain. No permissions are widened.

English/Spanish labels, saved snapshots, content, captions, video expansion, Back/pause, explicit Finish, transcripts and temporary-media rules remain. No provider, database/schema, template-management or production-stack changes. Production is static assets plus PHP/MySQL; no Node service is required.

## Existing cPanel website

1. Back up the live website, database, private configuration, keys and media.
2. Extract `morning-meeting-builder-update-0.7.2.zip`. Merge only the contents of `public_html` into the existing document root. Do not replace the document root or delete its media directories.
3. Preserve live `server-paths.php`, `config.js`, root `.htaccess`, private keys/configuration, media paths/directories and database. The three root configuration files are excluded from this update.
4. No new SQL. Keep installed migrations; prior 007 is needed once only if absent. Never reset/reimport starter data or rerun installed migrations.
5. Reload online and allow the service worker to update; reopen older tabs if necessary and confirm **v0.7.2**. Do not clear storage containing unsynced work.

## Shop check

- On the normal Assembly/location login, confirm the header shows just the area name. On a phone, open the hamburger menu and find Sign out at its bottom-right; close it and confirm Sign out disappears.
- Tap the preview/body of Build a new meeting. Confirm the default template opens, prepare today's meeting, save and return Home. Confirm the second tile now shows the correct saved meeting and opens it directly with edits intact.
- Check a saved meeting from yesterday and a completed meeting remain in the list without replacing today's shortcut. Save two meetings for today and confirm the most recently saved unfinished one is shown.
- Try desktop, portrait and landscape. Confirm all important actions stay readable and usable.

## Adoption pilot — proposal, not an approved operating standard

Try one willing meeting leader over three mornings: Thomas and the leader prepare/open one real meeting together; the leader operates the next one while Thomas observes; then the leader prepares/opens one independently. The leader's corrections are still needed. Record where they hesitate or ask for help, and whether they can prepare/open today's meeting without directions. Fix the observed blocker before adding more features. Thomas can support the handoff, while the leader owns their daily meeting once the pilot works. No leader has been assigned or contacted by this update.

Automated browser viewports are emulation, not physical-device or shop acceptance. No paid translation calls or live production access are needed. Verification results and remaining environment limitations are recorded in ROUND6_CHECKPOINT.md.
