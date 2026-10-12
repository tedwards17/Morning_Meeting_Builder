# Morning Meeting Builder v0.4.10 — follow-up handoff

All ten requested changes have individual commits on **Round-4-Development**. `ROUND4_CHECKPOINTS.md` records what was completed and verified. The default branch and production host are unchanged.

## Use the updated app

- **Save presentation** keeps the builder open. Its success notice can be dismissed and otherwise clears after three seconds. Entering the presenter and choosing **Present meeting** also saves the draft; a separate Save click is optional.
- **Meetings** shows saved presentations first, then presented/paused meetings newest first. Open a row for presenter, dates, prepared/presented topics and transcript. Download meeting notes as text. The home quick-build button remains.
- In live presentation, choose **Start transcript** to recognize and save original English/Spanish speech without Azure translation, or **Start Translation** to save the same original transcript while displaying translated captions. Both require microphone permission and the existing private presenter unlock. Stop either with its button. Only phrases received while capture is active are saved; earlier speech is not reconstructed. No audio recording or translated speech is stored.
- Speech stops on presentation exit, backgrounding/page departure and the 45-minute session limit. A final phrase not received from Deepgram before closing can be lost. Saved text remains after the separate media replay/cleanup window expires.
- **Preview → Fullscreen preview** practices slides without logging content use or speech. Live fullscreen is separate. Browser support/user activation still apply; mobile restrictions have a clear fallback.
- Pair a keyboard/HID Bluetooth or USB remote in the tablet settings. Page Down/Up, arrows and other standard presentation keys work. Settings → Presentation remote can learn alternate keys. Remote input keeps fullscreen and hides controls; touch the slide to reveal them. See `PRESENTATION_REMOTES.md` for YouTube focus, OS-reserved buttons and tablet compatibility limits.
- Only Settings → Local data shows the application version. `frontend/src/defaults.ts` contains the central UI version constant.
- Admins can publish a dated image/message to selected meeting accounts, including select-all, through Company workspace → Announcements / broadcasts. Empty announcement slots are hidden; published content appears after stretches. See `ANNOUNCEMENTS.md`.
- Personal share is always included; media is optional. Template slides can be **Skipped by default in new meetings** when the presenter is allowed to skip them. The default improvement-image slide starts skipped and can be enabled when needed. Existing saved/past meetings retain their skip choices, except unstarted Personal share is included as requested.
- Template **Builder slide color** offers six muted colors or no highlight. It appears only in the builder’s left slide list, not on audience slides or in practice preview.
- Presenting a completed meeting again creates a new record with the same prepared content and a fresh transcript, preserving the previous meeting notes.

## Continue the working Codespaces pilot

From the repository terminal:

```sh
git switch Round-4-Development
git pull --ff-only
cd translation-pilot
npm ci
npm run build:demo
```

Keep the already-working PHP process on port 8081 and its private environment. Rebuilding replaces its static browser files; reload the phone/browser and check Settings → Local data for **v0.4.10**. No new speech credentials are required. If PHP must be restarted, use the original configured terminal/environment and `npm run pilot:php`; exporting variables in a different terminal does not change a running PHP process. The existing Codespaces rewritten-origin fix is retained. Export a browser backup before moving to a different site origin or host; browser-local records do not automatically move between origins.

The current one-port pilot remains **browser-local data**. It can test transcripts, UI, fullscreen, remotes and local announcement placement. It is not a company account service and cannot push announcements to other tablets.

## Company account/privacy and announcement test

Use the **PHP/MySQL account build** on a dedicated temporary HTTPS staging subdomain. Follow `CPANEL_SETUP.md` and `DATABASE_SETUP.md`: create a disposable database, import migrations/DTB seed, configure private `api/config.example.php`, create the initial admin with the private CLI/cron tool and install the starter template/content after signing in. Do not reset an existing application database.

Create two meeting-area/location accounts and an admin; use separate browser profiles/tablets. Present and capture a short transcript as account A. Verify A can see its history, B cannot see A’s meeting/transcript (including through API sync/report access), and admin can see both. Publish an announcement for today targeted to A only; sync both tablets and build/open an unstarted saved meeting. Verify it appears after stretches for A and is absent for B. Repeat with select-all, tomorrow’s date and a withdrawn draft. Keep an already-started meeting’s content/history intact.

The disposable-database integration script `tests/api/integration.py` includes transcript ownership and immutable-history checks but was **not run against MySQL in this workspace**. IT’s staging test is still required. Production remains static browser files plus PHP requests and MySQL; **Node/npm are build-time tools only**. If IT provides PHP without a supported database, the local PHP package is the closest option; it cannot provide authenticated company history or central pushes.

## Packages and upload

Run in `translation-pilot` on the build machine:

```sh
npm run build:demo
npm run build:hosted
npm run package
```

Outputs are in `artifacts/`:

| File | Use |
|---|---|
| `morning-meeting-builder-cpanel.zip` | Full PHP/MySQL company account app; required for account privacy and cross-device announcements |
| `morning-meeting-builder-round4-php.zip` | Working browser-local app + private PHP speech gateway; no database required |
| `morning-meeting-builder-github-pages-demo.zip` | Static app only; GitHub Pages cannot run PHP or Java |
| `morning-meeting-builder-source.zip` | Editable source, configuration examples, scripts, tests and instructions |
| `morning-meeting-builder-migrations.zip` | Existing database migrations/seed materials; no new tables for this follow-up |

Upload **only `public_html/` contents** to the dedicated host document root. Keep database config, speech config, setup scripts, credentials and private media outside it. Follow `ROUND4_HANDOFF.md` for the actual Deepgram Nova-3 and Azure Translator resource setup and private variables. Permanent provider keys remain server-side; the browser receives a short-lived Deepgram token. ElevenLabs remains an alternative provider, not a dependency of this build.

GitHub Pages tests the static UI and browser-local records. For safe speech tests use the existing one-origin Codespaces PHP pilot or a temporary HTTPS PHP host serving both frontend and gateway. Do not put credentials in Pages or add permissive cross-origin access to a private backend. GitHub Pages does not exercise company PHP/MySQL accounts or server announcement distribution.

## Files and remaining IT questions

Main changes: recovered React UI, TypeScript `main.tsx`, `runtime.ts`, `defaults.ts`, new `meeting-history.ts`, `slide-policy.ts`, `remote.ts`, `v2.css`; PHP `history.php`, `sync.php`, `records.php`, `core.php`, `admin.php`; focused frontend/PHP/browser checks; deployment/checkpoint docs; refreshed root static files for development Pages testing. Existing YouTube player and private provider gateway are retained.

Confirm PHP 8.3+, cURL with trusted certificates, PDO MySQL/database availability, HTTPS, writable private media/sessions, request/upload limits and outbound HTTPS to Deepgram/Azure. The tablet needs microphone access and outbound secure WebSocket access to Deepgram. Agree on transcript retention/backups and account assignments before rollout. Actual tablet fullscreen behavior, the purchased remote, real-room recognition, Azure free-tier quota behavior and a two-account PHP/MySQL deployment still need a real-device/staging trial; see `ROUND4_FOLLOWUP_VERIFICATION.md` for executed checks.
