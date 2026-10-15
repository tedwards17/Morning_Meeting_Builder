# Round 5 checkpoint

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
