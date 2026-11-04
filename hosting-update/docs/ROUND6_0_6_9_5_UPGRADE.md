# v0.6.9.5 — Combined Batches 8 and 9

Final Round 6 shop-testing update. This is not v0.7. Continue from v0.6.9 on Round-6-Development; no default-branch merge or live deployment.

## Existing cPanel website

1. Back up the live website, database, private configuration, and media.
2. Extract `morning-meeting-builder-update-0.6.9.5.zip`. Merge only the contents of `public_html` into the existing document root, overwriting matching application files. Do not replace/delete the document root or upload the whole repository.
3. Preserve live `server-paths.php`, `config.js`, root `.htaccess`, all private keys/configuration, database, media directories and the corrected media path. Those three root configuration files are excluded from the update.
4. No new SQL. Earlier data-only migration 007 is required once only if absent; never reset/reimport the starter database or rerun installed 005/006/007.
5. Reload online, allow the service worker to update, and reopen older tabs if necessary. Confirm the displayed app version is **0.6.9.5**. Do not clear browser storage with unsynced work.

Static HTML/CSS/JavaScript plus PHP/MySQL remain the production stack. No production Node service or provider/configuration changes are required. The GitHub `hosting-update/public_html` folder contains the same application payload. `hosting-upload` remains a separate new-install package.

## Changes and preserved behavior

- Desktop captions are 30% smaller than v0.6.9: clamp(18px,1.85vw,36px) becomes clamp(12.6px,1.295vw,25.2px). Narrow mobile captions use a 14px readability floor and 15.4px maximum rather than compounding reductions. Each line has a compact 65%-opaque dark backing, 3px/6px padding and unchanged opaque blue English/green Spanish words with dark text shadow.
- Completed rows wait about five seconds, roll in order, and retire without replacing a readable phrase with a single word. Queued phrases are retained for display. The final remaining captions clear after five seconds without new displayed speech; explicit Stop clears immediately. Resize reflow and captions across slides/YouTube are preserved.
- Removed normal floating capture/translation wording. Start/Stop buttons retain stable labels across listening/translating and expose their active state with aria-pressed. Actionable connection/microphone/storage/provider errors remain visible as alerts. Transcript-only capture and the 45-minute/background stop rules remain.
- One persistent 44px Next/Finish target stays at the same safe bottom-right coordinates. It fades to 55% opacity when the other controls hide. Pointer/click propagation is isolated so a tap advances once, without first revealing the controls. The expanded bar reserves its space; captions sit above it and move above the full controls when visible. Keyboard/clicker navigation remains; the last button always requires the existing Finish confirmation before completion/media cleanup.
- A single same-document history entry exists only while a meeting preview, builder thumbnail preview or actual presentation is open. Preview Back returns to that meeting's builder without usage. Actual Back uses the existing pause confirmation; cancellation stays in presentation. A confirmed exit stops capture immediately, drains storage for already captured final phrases/returned translations, sends the existing session-stop request, and restores the latest saved meeting. Pause keeps its existing resumable status, transcript and temporary media. Only confirmed Finish completes/cleans up. Normal navigation elsewhere is not overridden.
- v0.6.9 backgrounds, logo trim/sizing, fonts, protected text/media regions, compact library, sharing/rotation, numbering and history remain. Illustrations stay removed. No content translation or new integration was added.

## Internal version mapping

The user-facing version and artifact name are **0.6.9.5**. Npm requires SemVer, so package.json/package-lock.json use **0.6.9-5** internally. The explicit package.json `releaseVersion: "0.6.9.5"` drives packaging; APP_VERSION displays 0.6.9.5. Do not rename the update ZIP to the internal npm version.

## Browser/device limits and verification

See ROUND6_CHECKPOINT.md for exact tested versions/results. Automated portrait/landscape viewports are browser emulation, not physical Android/iOS or meeting-room TV testing. Speech/translation and YouTube API behavior are mocked for focused tests; no paid provider calls are made. Real provider latency, audio quality, YouTube playback/ads and TV readability need shop acceptance.

Native browser fullscreen can consume a device Back/Escape to leave fullscreen before dispatching a history popstate. In that case the first Back exits native fullscreen and the next Back reaches the app's pause/exit confirmation. The app does not force a pause solely because fullscreen ended or automatically reenter fullscreen. Browser-history Back and native fullscreen API behavior are tested where supported, but a programmatic history traversal is not proof of a physical Android Back gesture. If native fullscreen is unavailable, the existing actionable fallback explains browser fullscreen/Add to Home Screen. No universal device support is claimed.

## Real shop meeting checklist

- Speak short English/Spanish phrases, then continuously; pause for five seconds. Confirm compact blue/green captions are readable over light, dark, photo and video slides, roll coherently and clear during silence.
- Wait for controls to hide. Tap Next once; reveal the controls elsewhere and confirm the same button has not moved. Check portrait/landscape and fullscreen, including safe areas.
- Back from a preview, then from a real presentation. Test Cancel and Confirm; reopen the same meeting and verify text, selections, transcript and temporary images survive. Confirm the microphone indicator turns off after exit.
- At the last slide, cancel Finish once, then confirm only when the meeting is truly over. Verify notes remain and only confirmed-finish temporary-media cleanup occurs.
