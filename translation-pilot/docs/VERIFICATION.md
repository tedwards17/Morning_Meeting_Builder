# V2 release verification — 17 September 2026

This release is an editable reconstruction of the supplied browser-ready MVP, extended with the hosted PHP application. It is packaged for a new staging deployment. No existing GitHub Pages site or cPanel deployment was changed. Work is on `feature/hosted-company-version`.

## Automated evidence

| Check | Result | Scope |
|---|---|---|
| TypeScript `npm run typecheck` | PASS | New TypeScript application and domain code |
| ESLint `npm run lint` | PASS | New frontend code and domain tests |
| Vitest `npm test` | 17 passed | Permissions, scopes, broadcast dates/importance/order/slots/fallback, location rotation, skip completion, numeric normalization, UTC/timezone conversion, DST gap rejection, CSV formula escaping |
| PHP syntax | 12 files passed | PHP 8.3.6, API, config example, CLI setup tools and test router |
| Migration static checks | 3 passed | Numbering, InnoDB and utf8mb4 |
| Empty database installation | PASS | All three migrations, DTB organization/location seed |
| Migration runner rerun | PASS | Applied migrations skipped without rewriting schema |
| PHP API integration | 63 passed | Authentication, permissions, isolation, media, synchronization and reports; detailed cases below |
| Demo browser suite | 14 passed | Original DTB workflow, all five UI corrections, backup/merge, offline restart, phone width, 200% text, no runtime errors |
| Hosted browser suite | 8 passed | Starter installation, MVP image import, replacement protection, upload, required broadcast sync, offline image restart, reconnect report deduplication, no runtime errors |
| Vite demo and hosted builds | PASS | Separate mode builds, repository-relative assets |
| Package inspection | PASS | Matching assets and PWA files, correct public/private layout, no dependencies or private configuration in public tree |
| Repeated packaging | PASS | Identical SHA-256 hashes when packaging the same tree twice |

The local database was **MariaDB 10.11.14**, not MySQL 8. The SQL is targeted to MySQL 8; the included GitHub Actions workflow runs the suite against MySQL 8, but that remote workflow has not been executed here. Chromium was launched headlessly through Playwright. Offline tests used browser network emulation, not an actual tablet losing Wi-Fi. Local API tests use a disposable HTTP-only override; production cookies require HTTPS. The earlier 16 September media run also exercised GD/WebP processing; the final 17 September run exercises the no-GD validated-image fallback.

The recovered JavaScript contains the original bundled React runtime and components. It is exercised through browser tests and Vite builds; it is not represented as the missing original TypeScript source, nor covered by the new TypeScript/lint check. Original native project folders and original automated tests were absent from the supplied browser ZIP. Retained native runtime chunks and a Capacitor configuration are included; APK/IPA output is not included.

## API regression cases

The 63-case suite verifies anonymous rejection; CSRF and Origin checks; report-viewer/content-manager/location role boundaries; location template creation; separate use/edit permissions; owner-only sharing; company visibility without edit; location edit grants; stale-version conflicts; organization isolation for content, templates, account IDs, usernames, media and history; fixed location meeting scope; required-slide integrity and omission rejection; server-owned event identity; UUID and logical-event retry deduplication; two devices sharing Assembly history while Paint stays independent; required skip reasons in reports; single-device revocation; expired sessions; disabled accounts/locations; immutable historical titles; incremental changes and archive state; cookie HttpOnly/Strict flags; validated image metadata and deduplication; rejected empty/spoofed/SVG uploads; protected-media authorization; media-reference laundering rejection; storage quota rejection; and login throttling.

Bootstrap regressions create 300 additional records and verify the 250-record response limit, complete keyset traversal, continuation-token integrity and session binding, catch-up of concurrent writes, and restart after a permission change. Incremental pulls and outbox writes are also bounded. Snapshot cursors are not committed locally until the final page.

The hosted browser test imports a valid MVP-format ZIP containing image bytes through Backup & restore → Merge, checks that protected server asset IDs replace legacy IDs, and verifies that full replacement is disabled. The demo test exports and merges an actual meeting backup while retaining local history. This does not certify every historical export or unsupported direct-video/GIF import; preserve the user's original export and review the migrated content in staging.

## Release contents

- `morning-meeting-builder-source.zip`: editable frontend, recovered DTB components/assets, PHP API, migrations/seed, test suites, CI, scripts and documentation. Run `npm ci` before development.
- `morning-meeting-builder-cpanel.zip`: `public_html/` contains the built hosted index, matching hashed assets, icons, manifest, worker, Apache configuration and API. Private examples, database files, setup scripts and docs are separate.
- `morning-meeting-builder-github-pages-demo.zip`: static demo output, including repository-relative asset paths and PWA files.
- `morning-meeting-builder-migrations.zip`: numbered forward migrations and DTB seed. No passwords or accounts are seeded.
- `SHA256SUMS.txt`: package hashes.

## Required checks on the actual hosting account

1. Confirm PHP 8.3, PDO MySQL, fileinfo, OpenSSL, private writable directories and the documented PHP limits. Test optional GD/WebP and EXIF with actual phone photos; confirm orientation, display copy and thumbnail. No ImageMagick integration is claimed.
2. Install into an empty **MySQL 8** staging database. Run the verification SQL, inspect migration versions, then test with a least-privileged runtime user. Run the included integration suite only on a separate disposable test database, never on company data.
3. Confirm the exact document root and private config path. Test Apache rewrite handling, HTTPS redirect, Secure/HttpOnly/SameSite=Strict cookies, CSP, direct API-internal denial and absence of public paths to private config/media.
4. Verify CPU, memory, connection, inode and storage limits under expected concurrent use. The tests are functional tests, not a load benchmark.
5. Prove a database/config/media/release backup restores to a separate staging root. Confirm retention and off-account backup arrangements with IT.
6. Run GitHub Actions in the actual repository and inspect its MySQL 8 and uploaded-package results before release.

## Required tablet and network checks

- Install on the intended Android and iPad devices. Check keyboard/touch focus, landscape layout, fullscreen/wake lock, scrolling and 200% text. Automated phone-width checks do not replace physical accessibility testing.
- Download a meeting containing current images, close the app, disconnect Wi-Fi, restart the device and present it. Reconnect, Sync Now twice, and verify one set of events in central reports.
- Use two Assembly devices plus one Paint device. Present content, synchronize and rebuild: Assembly devices must share rotation while Paint remains independent. Replace one device and confirm history returns on sign-in.
- Check once-per-location and every-meeting broadcasts, one-day/windows, priority collisions, missing slots, required skip reasons, and later edits/archives preserving history.
- Test real YouTube playback and player events through the host's CSP/firewall. YouTube/external links remain online-only; completion is recorded only when the player supplies the relevant event.
- Exercise session expiry/revocation on real HTTPS, browser storage eviction/near-full storage, missing files, interrupted uploads and poor-network retries. Server revocation cannot erase a downloaded offline copy until the device reconnects; device access controls remain an operational responsibility.

Two devices generating meetings while both are offline can select the same item. Their events reconcile without loss after reconnecting; offline coordination cannot guarantee unique rotation. Broadcasts published after a device disconnects arrive only after synchronization. Rebuild/review saved drafts when schedules change. Keep the existing working demo and its backup until staging acceptance is complete.

## Reproduce

See LOCAL_DEVELOPMENT.md for commands and disposable API/browser test setup, DATABASE_SETUP.md for phpMyAdmin and SSH migrations, and CPANEL_SETUP.md for the first five safe deployment steps. No permanent web installer, production secrets, signing files or real database dump is included.
