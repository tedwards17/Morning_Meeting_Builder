# Round 5 checkpoint

Current follow-up: **v0.5.1**, 2026-10-16. Existing live installations should use [ROUND5_0_5_1_UPGRADE.md](ROUND5_0_5_1_UPGRADE.md). The 0.5.0 launch notes below are historical; the follow-up replaces their device-only media limitation.

Base: Round-4-Development c7e413d (v0.4.18). Branch: Round-5-Development. Target: v0.5.0.

Implemented: branded EN/ES login, sign-in loading/error feedback, visible account/role/sign-out, maintenance in Settings, password change and other-session invalidation, safe account/device switching, signed-in account authorization for captions, private config discovery via public paths-only PHP file, hosted upload packaging and setup guide. The browser-local pilot and its passphrase flow remain separate.

Validation and final delivery results are appended before the branch is pushed. Host deployment and paid-provider microphone tests must be performed with Thomas's private configuration after upload. No production host changes are made by this session.

Launch review found and fixed two additional hosted-path gaps: maintenance/password Settings must be available to location accounts; starter installation now sends up to 50 records per request and syncs once, with restart-safe skipping of completed batches. Device IDs remain stable per account across sign-out, and other open tabs reload on account changes. Hosted company/location identity fields are managed centrally rather than edited as local names.

The first real hosted starter-install check exposed a shipped 300-character video title containing ® (301 UTF-8 bytes). The API now checks the title's character count, matching the frontend, rather than rejecting valid Unicode titles. A boundary regression check covers this. Root GitHub Actions now runs Round 5 verification from translation-pilot and produces a hosting artifact; it does not deploy.

## Final local verification — 2026-10-15

- TypeScript and lint passed; 59 frontend unit checks passed.
- 20 PHP files passed syntax checks; migrations 1–3 installed in a new disposable MariaDB 10.11 database and rerun safely.
- 71 existing database/API checks passed (permissions, account and company isolation, transcript history, media, synchronization, revocation and login throttling).
- 13 Round 5 API checks passed (account captions, CSRF, password changes, session invalidation and Unicode title boundary).
- 13 Chromium browser checks passed (desktop/mobile login, account display, starter installation, actual saved meeting in MySQL, Settings, sign-out, switching accounts and stable device identity).
- 22 PHP history, 22 mocked-provider captions gateway and 20 Codespaces origin checks passed. No paid provider calls were made.
- 3 checks passed against the actual upload package with environment variables removed: private file discovery, account API login, captions login and refusal to fall back to passphrase authorization.
- Both static builds and package asset/link validation passed. Desktop/mobile sign-in and Settings screenshots were inspected.
- Compatible dependency patches applied to idb, React/React DOM, zod, Vite and Vitest; npm audit reports zero known vulnerabilities, including development dependencies. Major compiler upgrades were kept out of this hosting round.

The legacy hosted.cjs browser script uses pre-Round-4 labels and is superseded for this round by round5.cjs; it is not reported as passing. The root Round 5 workflow runs the current tests, packages the app and uploads an artifact without publishing a site.

Remaining: Thomas/IT must create the real hosting database and private configs, import migrations/seed, create the first administrator, upload public files, and test the real domain/tablet/microphone using private provider keys. Apache/LiteSpeed rewrites, host PHP settings/proxy HTTPS, actual provider credentials and physical-device capture cannot be certified by local tests. Temporary meeting-only media remains device-local as in Round 4; the account database preserves meeting text, topics and transcripts. Do not treat this round as a migration of old browser-local history.

Start with docs/ROUND5_SETUP.md. The prebuilt deliverable is hosting-upload/public_html in the Round-5-Development branch. The repository root is the separate local-data Pages preview. Default branch and production hosting are unchanged.


## Meeting follow-up — 2026-10-16, v0.5.1

Implemented rolling, measured-width captions with three lines, eight-second minimum line hold, staggered rolls, a ten-second final hold, resize reflow, long-word wrapping and displayed-language colors (English blue, Spanish green). A FIFO translation queue preserves fragments that arrive while another request is pending; same-language batches retain stable transcript IDs. Deepgram endpointing is now 300 ms. Caption research and original-source links are in the upgrade guide.

Meeting photos and videos now upload into private server storage, with scope and meeting ownership recorded by migration 004. Pending drafts and paused presentations never expire by scheduled date. Confirming the finish checkmark removes temporary asset references while keeping item IDs/titles and transcript history, immediately blocks downloads, then deletes the files; unsuccessful disk deletion stays archived and retries on sync. Shared files are isolated from temporary deduplication and deletion. Same-account device handoff checks the expected previous device and blocks stale writes. Saving waits for online sync; history owned by another device is never accidentally put in the new device's outbox. An existing completed-history merge variable-shadowing bug was fixed and covered with a real-database late-translation regression.

A visible Download meeting media button supports preparing the presenting device while online. The hamburger button is a normal-height row below the account header. The cPanel update folder excludes server-paths.php/config.js; real private configs, credentials, database and media stay in place. No production host changes were made by this session.

Verified locally:

- TypeScript and lint; 65 frontend unit checks, including caption timing/roll pacing/resize and delayed translation ordering.
- 20 PHP syntax checks; four migrations installed in an empty disposable MariaDB database and rerun safely.
- 71 existing API checks plus 13 Round 5 API checks.
- 22 new database/API media checks: upload, account isolation, device handoff/stale writes, past-date retention, byte-range reads, required completion confirmation, actual disk deletion, shared-file preservation and additive late transcript/translation history.
- 13 Round 5 hosted browser checks plus 14 meeting-fix browser checks, using real uploads/PHP/MySQL and two isolated browser contexts. Covered cross-device photo rendering, offline downloads, six-second caption persistence/colors, preview, pause/resume, cancel/confirm finish, server deletion and retained transcript. Microphone/provider events were mocked for deterministic browser checks.
- 22 history, 24 mocked-provider translation gateway and 20 origin checks. No paid provider requests made.
- Three smoke checks passed against the actual hosted package with environment-variable config overrides removed: private-file discovery, account API login, and account-authorized captions.
- Both built packages passed asset/link validation; the update package omits edited public configuration files. Repeated packaging produces identical checksums.
- Desktop captions and mobile navigation screenshots visually inspected. npm audit reports zero known vulnerabilities in the locked dependency tree.

The live hosting update, physical TV/phone behavior and real provider microphone test remain deployment checks for Thomas. Existing photos already lost before this patch cannot be restored; re-add any old device-only photos and save online.
