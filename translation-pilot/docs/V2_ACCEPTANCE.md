# Morning Meeting Builder - Hosted Company Version V2

## Final development proposal and GPT-6 Astra build brief

**Status:** Product decisions approved; ready for implementation  
**Starting point:** Existing Morning Meeting Builder MVP using React 19, TypeScript, Vite, PWA, IndexedDB, and Capacitor  
**Initial organization:** Douglass Truck Bodies (DTB)  
**Target:** A multi-company-ready, synchronized morning-meeting PWA hosted on standard cPanel and deployable as ordinary files through FileZilla  
**Current testing:** GitHub Pages demo/local mode until the production domain and cPanel account are ready

---

## 1. Executive outcome

Convert the working device-local MVP into a company-hosted application without discarding its existing meeting workflow. DTB will use it first, but the database and authorization model must support additional organizations later without a destructive rewrite.

The finished system will provide:

- shared company libraries and templates;
- location-scoped content and location-owned usage history;
- multiple phones or tablets using the same location history;
- individual management accounts and persistent location accounts;
- template ownership, sharing, and explicit edit permissions;
- scheduled company broadcasts that can be inserted into daily meetings;
- offline-ready meetings and an idempotent synchronization outbox;
- central usage, required-content, safety-video, meeting, and device reports;
- a GitHub Pages-compatible demo/local mode;
- a PHP 8.3/MySQL 8 hosted mode for cPanel;
- a FileZilla-ready deployment package and numbered SQL migrations.

The browser/PWA is the first-release delivery method. Preserve the existing Capacitor project folders for possible later Android or iPad packaging, but an APK, IPA, or app-store release is not required for V2.

---

## 2. Decisions locked in

### Organization model

- The schema is multi-company ready from the beginning.
- DTB is the only seeded/active organization in the first production deployment.
- Every organization-owned row includes an `organization_id` and all API queries enforce it.
- Do not build self-service company registration, subscriptions, billing, or a public marketplace in V2.
- Organization settings include name, branding, timezone, enabled features, and storage/configuration limits.
- Default DTB timezone is `America/Los_Angeles`; server timestamps are stored in UTC.

### Content scopes

| Scope | Visible to | Example |
|---|---|---|
| Company | Every permitted location in the organization | Weekly recap, company safety video, Lean lesson |
| Selected locations | One or more targeted locations | Paint announcement or Assembly defect chart |
| Meeting-only | Only the presentation where it was added | Personal share, temporary photo, one-time talking point |

The server is authoritative for company and selected-location content. Meeting-only content remains local by default, with an explicit action available later to promote it into a location or company library.

### Location-owned usage

- Rotation and usage history belong to a location, not a particular tablet, phone, login session, or presenter.
- Multiple devices signed into Assembly must see Assembly's combined content-use history after synchronization.
- One location presenting an item must not mark it used at another location.
- A replacement tablet must inherit the location's history as soon as it signs in and synchronizes.
- Device identity is still recorded for troubleshooting and audit purposes.

### Scheduled broadcasts

Authorized managers can publish text, image, image-and-text, YouTube, or external-link slides to all or selected locations. A broadcast can:

- run on one date;
- run within a start/end date window;
- appear once per location and then mark that location complete;
- appear in every meeting during the active window;
- be available, suggested, or required;
- target all locations or selected locations;
- be placed into a named template insertion slot;
- expire without deleting its history.

A required broadcast is inserted automatically. It may be skipped only after entering a reason; the skip and reason are included in reporting.

---

## 3. Accounts, roles, and permissions

Use two account categories.

### Individual management accounts

Examples include a personal `Thomas DTB` account. Individual accounts have a username or email and one of these initial roles:

| Role | Capabilities |
|---|---|
| Full administrator | Organization settings, accounts, locations, devices, templates, content, broadcasts, reports, storage, and audit history |
| Content manager | Libraries, media, templates permitted by ownership/sharing, scheduled broadcasts, and content-related reports |
| Report viewer | Read-only access to authorized dashboards, meeting logs, usage reports, and CSV exports |

Use role defaults plus explicit capability checks so DTB can grant narrowly scoped permissions without inventing fake administrator accounts.

### Persistent location accounts

- One easy-to-identify account per meeting location, such as `Assembly`, `Paint`, `Mount`, or `Detail`.
- A location account is permanently linked to one organization and one location.
- It may be used from the eventual location tablet or temporarily from employee phones.
- Each browser installation receives its own device UUID, friendly device name, session, last-seen time, and revocation state.
- Presenters choose or enter their name when building the meeting; presenters do not need individual logins in V2.
- Login remains active through a random server session stored in a `Secure`, `HttpOnly`, `SameSite=Strict` cookie.
- The server stores only a hash of the session token.
- Administrators can revoke one device without signing every device out of the location account.

DTB wants simple login UX, but do not ship predictable passwords such as `DTBAssembly`, a universal default password, or credentials embedded in source code. Let an administrator create/reset a location password or enrollment code, hash it with PHP `password_hash()`, rate-limit failed login attempts, and keep approved devices signed in so the password is rarely needed.

### Template ownership and sharing

Template creation is not limited to full administrators.

- Any account with `can_create_templates` may create a template. Enable this for DTB location accounts initially.
- Every template has an owner account.
- The owner and full administrators can manage sharing.
- `Can use` and `Can edit` are separate permissions.
- Sharing a template with the company does not automatically let everyone edit it.
- A creator may keep a template private, allow selected accounts to use it, allow selected accounts to edit it, share it with selected locations, or publish it company-wide for use.
- A template may designate named insertion slots such as `Announcements`, `Safety`, `Quality`, `Recognition`, and `Closing`.
- Published template versions are immutable snapshots. Editing a template creates a new version and must not change old meetings.

Location accounts can edit that day's meeting draft regardless of whether they can edit the underlying master template.

### Authorization requirements

- Enforce organization, role, location, ownership, and sharing permissions in PHP on every endpoint.
- Never rely on hidden React controls as authorization.
- Add CSRF protection to state-changing cookie-authenticated requests.
- Use prepared statements, transaction boundaries, secure headers, generic authentication errors, audit records, and login throttling.
- Never place database credentials or server secrets in frontend JavaScript or GitHub.

---

## 4. Daily meeting and scheduled-content workflow

1. A location opens the PWA on its tablet or a phone.
2. The app synchronizes company content, location content, template changes, broadcasts, and that location's usage history.
3. The presenter selects a template and enters/selects the presenter name.
4. Normal template rules populate rotating content using the location's shared history.
5. Active broadcasts are evaluated for the organization, location, date, completion state, and selected template.
6. Broadcasts are inserted into matching named slots. If the requested slot does not exist, use a documented fallback after Introduction and show a warning in the builder.
7. The presenter reviews the meeting. Required broadcasts cannot be removed, but they can be skipped during presentation after a reason is entered.
8. Previewing or selecting a slide does not count as presenting it.
9. Presentation mode writes usage locally first and uploads it through the outbox.
10. Central reporting shows which locations presented, completed, or skipped each required item.

Broadcast priority when several items target the same slot should be deterministic: explicit priority, then start date/time, then creation sequence. Administrators should be able to preview the affected locations and placement before publishing.

The app does not require WebSockets. It should synchronize on app start, login, reconnect, meeting-builder entry, manual **Sync Now**, and a modest foreground polling interval while online. A broadcast created after a tablet goes offline cannot appear until that tablet reconnects.

---

## 5. Usage, rotation, and reporting

The immutable usage-event stream is the source of truth. Do not maintain an easily corrupted per-device "used" flag.

Every event includes at least:

```text
organization_id
location_id
device_id
account_id
meeting_id
slide_id
content_id/content_version_id when applicable
broadcast_id when applicable
event_type
occurred_at_utc
duration_or_progress when applicable
client_generated_idempotency_key
server_received_at
```

Required event types include:

- `meeting_started`
- `meeting_completed`
- `slide_opened`
- `slide_skipped`
- `content_presented`
- `video_started`
- `video_completed` when reliably available
- `broadcast_presented`
- `broadcast_skipped`

Rules:

- An item counts as presented only when its slide opens in presentation mode.
- Builder selection and preview do not count.
- Missing media does not count.
- A skipped required item records the reason, location, device, presenter, and time.
- YouTube completion may not be reliably available unless the YouTube player API is integrated; distinguish opened/started from completed.
- Each event is idempotent so an offline retry cannot create duplicates.
- Rotation selects by the target location's history, not the account or device.
- Before generating a meeting while online, pull the latest location usage to reduce duplicate selection by two devices.
- If two devices build offline simultaneously, reconcile both histories without losing events; duplicated offline selection is possible and should be documented rather than hidden.

Admin reports must include:

- safety videos presented by location and date range;
- locations that have not completed a required broadcast;
- required items skipped and their reasons;
- last meeting, last sync, and active devices per location;
- content usage by location and company-wide;
- per-meeting history and presenter;
- scheduled-broadcast completion by location;
- CSV exports that retain immutable historical titles/version labels even after content is archived.

---

## 6. Dual operating modes

### Demo/local mode for GitHub Pages

- Preserve a fully usable IndexedDB-backed demonstration/local mode.
- It must work as a static Vite/PWA build on GitHub Pages with repository-relative asset paths.
- Demo mode supports existing templates, libraries, meeting building, presentation, local usage, and backup/restore.
- Use clearly labeled demo/local accounts and seeded data; never package production credentials.
- Demo mode does not pretend that data is shared across browsers or devices.
- Provide a visible non-intrusive `Demo / Local data only` status.

### Hosted mode for cPanel

- Uses same-origin `/api/v1` PHP endpoints, MySQL, authenticated sessions, protected media, synchronization, organization/location permissions, broadcasts, and reporting.
- The mode is selected at build/configuration time, not by exposing production secrets in the browser.
- Use the same frontend components and domain model in both modes where practical.

GitHub Pages can test the user interface and local workflows, but it cannot run PHP or MySQL. Do not claim shared-account, synchronization, or report testing based only on GitHub Pages.

---

## 7. Synchronization and offline behavior

Replace the MVP's single saved `AppState` document with record-level IndexedDB stores for settings, safe session/device metadata, organizations, locations, libraries, content, media metadata/blobs, templates/versions, broadcasts, meetings, slides, usage events, the server cursor, and the outbox.

### Server to device

- Provide a first-login bootstrap endpoint.
- After bootstrap, request changes after a reliable monotonically increasing organization/device cursor.
- Include archive tombstones so removed data disappears from current lists without breaking historical meetings.
- Use record versions/ETags for editable records.
- Return only data the authenticated account may access.
- Template and content edits are online-first in V2. Reject stale edits with `409 Conflict` and show a refresh/retry decision.

### Device to server

- Generate UUIDs before creating offline meetings and usage events.
- Write locally before attempting a network call.
- Queue unsent writes in an outbox.
- Retry on app start, reconnect, presentation completion, and **Sync Now**.
- Batch safely and enforce server-side idempotency.
- Show `Synced`, `Syncing`, `Offline`, or `Needs attention`, plus last successful sync time.

### Offline media

- Cache the app shell through the service worker.
- Store downloaded meeting images in IndexedDB or Cache Storage, not only normal HTTP cache.
- Show `Ready offline`, `Downloading`, or `Missing` before presenting.
- Add **Download meeting for offline use**.
- Never download the entire company library automatically.
- Retain current drafts and recent meeting media; clean older optional media through a documented least-recently-used policy.
- YouTube and external links require connectivity and must be labeled accordingly. Cache their metadata/thumbnail only when permitted; do not attempt to download YouTube video files.

---

## 8. Technical stack

| Layer | Technology | Requirement |
|---|---|---|
| Frontend | Existing React 19 + TypeScript + Vite | Preserve DTB interface and working MVP behavior |
| Installable app | PWA service worker + IndexedDB | Android, iPad, phone, and desktop browser support |
| Native folders | Existing Capacitor projects | Preserve, but native packaging is not a V2 acceptance gate |
| API | PHP 8.3-compatible JSON REST API using PDO | Same-origin and uploadable as ordinary `.php` files |
| Database | MySQL 8.0/InnoDB with `utf8mb4` | Transactions, indexes, and foreign keys |
| Media | Protected cPanel filesystem | Image bytes outside the database; metadata in MySQL |
| CI | GitHub Actions | Test, lint, build both modes, validate migrations, and package deployment |
| Deployment | FileZilla + cPanel/phpMyAdmin | No Node.js required on production hosting |

Do not require Node.js, Docker, Firebase, Supabase, a queue server, or a long-running application process on cPanel. Node.js is only for development and GitHub Actions. Prefer a small organized PHP codebase without a production Composer dependency unless inspection proves a dependency is necessary and compatible with the host.

---

## 9. Data model

Use UUID primary keys where practical, UTC timestamps, `organization_id` isolation, InnoDB foreign keys, indexes for all common scope/date/report queries, optimistic record versions, and archive/soft-delete fields for referenced history.

### Organization and identity

- `organizations`
- `organization_settings`
- `locations`
- `accounts` - individual or location category, role, organization, optional fixed location, enabled state
- `roles`
- `role_permissions`
- `account_permission_overrides` if needed
- `devices`
- `sessions`
- `login_attempts` or equivalent throttling records
- `audit_log`

### Libraries and media

- `libraries`
- `library_locations`
- `content_items`
- `content_versions`
- `content_locations`
- `media_assets`

First-release content types:

- text;
- JPEG, PNG, and WebP image;
- image plus text;
- YouTube link;
- external web link.

Do not require direct video uploads or PDF rendering in V2. Users may export a chart/PDF page as an image. Design the content-type system so PDF support can be added later.

### Templates and sharing

- `templates`
- `template_versions`
- `template_groups`
- `template_slides`
- `template_slots`
- `template_location_access`
- `template_account_access` with separate `can_use` and `can_edit`

### Broadcasts

- `broadcasts` - title, content/version, status, importance, start/end, recurrence/completion mode, priority, requested slot, creator
- `broadcast_locations`
- `broadcast_completion` or a derived/materialized completion record backed by immutable events
- `broadcast_skip_reasons`

### Meetings and usage

- `meetings`
- `meeting_slides`
- `meeting_slide_content`
- `usage_events`
- `content_requirements` if retained separately from broadcasts
- `sync_changes` and/or reliable server sequence/cursor records

Meeting and template snapshots must preserve what was actually shown even if the source template, broadcast, or content is later edited or archived.

---

## 10. Media storage

Store image bytes in protected filesystem storage and metadata/references in MySQL. Do not store routine image BLOBs in the database.

First-release rules:

- Accept JPEG, PNG, and WebP after MIME and file-signature validation.
- Correct phone orientation when supported.
- Create an optimized WebP display copy and thumbnail when GD or ImageMagick is available.
- Default to keeping the optimized copy rather than the oversized original; document the choice.
- Start with a configurable application image limit around 15 MB.
- Use random stored filenames and date/hash directories; never trust the uploaded filename as a path.
- Record SHA-256, byte size, MIME type, dimensions, creator, and archive state.
- Deduplicate only when authorization and historical references remain correct.
- Store YouTube video IDs/URLs and metadata, not YouTube video bytes.
- Archiving media must not delete historical usage. Physical deletion is an explicit administrator action with reference warnings.
- Provide storage reporting by type, largest files, archived files, and total use.

Preferred server layout:

```text
/home/CPANEL_ACCOUNT/
|-- morning-meeting-private/
|   |-- config.php
|   `-- media/
`-- PUBLIC_DOCUMENT_ROOT/
    |-- index.html
    |-- assets/
    |-- icons and PWA files
    |-- .htaccess
    `-- api/
        |-- index.php
        `-- src/
```

If the future account cannot serve files from outside its document root, use a denied directory plus an authenticated PHP media endpoint. Never leave private company uploads directly browsable.

Recommended domain-level PHP values:

```ini
upload_max_filesize = 32M
post_max_size = 40M
memory_limit = 512M
max_execution_time = 120
max_input_time = 120
```

The API must also enforce its own limits because PHP configuration alone is not an application policy.

---

## 11. API groups

Use versioned same-origin JSON routes under `/api/v1`. Exact route names may be adjusted consistently.

```text
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/session
GET    /api/v1/sync/bootstrap
GET    /api/v1/sync/changes?after={cursor}
POST   /api/v1/sync/push
GET    /api/v1/libraries
POST   /api/v1/content
PATCH  /api/v1/content/{id}
POST   /api/v1/media
GET    /api/v1/media/{id}
GET    /api/v1/templates
POST   /api/v1/templates
PATCH  /api/v1/templates/{id}
POST   /api/v1/templates/{id}/share
GET    /api/v1/broadcasts
POST   /api/v1/broadcasts
PATCH  /api/v1/broadcasts/{id}
POST   /api/v1/broadcasts/{id}/publish
POST   /api/v1/meetings
POST   /api/v1/usage/batch
GET    /api/v1/admin/accounts
GET    /api/v1/admin/locations
GET    /api/v1/admin/devices
GET    /api/v1/admin/reports/usage
GET    /api/v1/admin/reports/requirements
GET    /api/v1/admin/reports/broadcasts
GET    /api/v1/admin/storage
```

Use a consistent error envelope, request IDs, pagination, transactions for multi-record writes, bounded batches, explicit HTTP status codes, ownership/location tests, and organization isolation tests.

---

## 12. Required interface areas

### Location experience

- Simple persistent location login usable from a tablet or phone.
- Presenter dropdown/manual entry.
- Company, selected-location, and meeting-only scope indicators.
- Shared location usage and rotation history.
- Last-sync and offline-readiness status.
- Accessible templates according to `can_use` permissions.
- Template creation when the account has `can_create_templates`.
- Daily draft editing without modifying the master.
- Automatic scheduled-content placement.
- Required-slide badge and skip-with-reason dialog.
- Fullscreen presentation and existing meeting controls.

### Content-management experience

- Create/edit/archive permitted libraries, content, templates, and broadcasts.
- Upload optimized images or add YouTube/external links.
- Target company-wide or selected locations.
- Template sharing dialog with separate use/edit permission controls.
- Broadcast preview showing schedule, locations, placement, and completion rule.

### Administrative/reporting experience

- Organization/location/account/device/session management.
- Full administrator, content manager, and report viewer roles.
- Location last meeting, last sync, and active devices.
- Required/broadcast completion and skipped reasons.
- Safety-video and general content-use reports with CSV export.
- Individual meeting history.
- Storage dashboard and archive/delete workflow.
- Audit history for account, permission, template-sharing, broadcast, and archive actions.

---

## 13. Existing MVP corrections required

1. Introduction slides cannot add library content.
2. Already-selected content is pinned to the top when reopening the picker.
3. Selected content can be removed; content-free slides are valid, including repeated Safety Comments slides.
4. Timed-slide timers remain paused until **Start** is pressed.
5. Numeric fields may be blank while actively edited, conveniently replace the selected value, and validate/default only on blur or save. Do not force `0` while typing.

---

## 14. Repository and build structure

Keep one repository and preserve useful existing native folders and history.

```text
morning-meeting-builder/
|-- frontend/
|-- api/
|-- database/
|   |-- migrations/
|   `-- seed/
|-- tests/
|   |-- frontend/
|   `-- api/
|-- scripts/
|-- docs/
|   |-- CPANEL_SETUP.md
|   |-- DATABASE_SETUP.md
|   |-- FILEZILLA_DEPLOYMENT.md
|   |-- GITHUB_PAGES_DEMO.md
|   |-- LOCAL_DEVELOPMENT.md
|   |-- ADMIN_GUIDE.md
|   |-- LOCATION_DEVICE_GUIDE.md
|   |-- BACKUP_AND_RECOVERY.md
|   `-- SECURITY.md
|-- .github/workflows/ci.yml
|-- .env.example
`-- deploy/
    |-- public_html/
    |-- private/
    `-- database-migrations/
```

CI/package requirements:

1. Run TypeScript checks, lint, frontend tests, PHP syntax/tests, and package validation.
2. Build and validate the GitHub Pages demo/local mode.
3. Build the hosted frontend with same-origin API configuration.
4. Copy matching Vite output into `deploy/public_html/`, preserving `assets/` exactly.
5. Copy production PHP into `deploy/public_html/api/`.
6. Include private configuration examples without secrets.
7. Include numbered forward-only migrations and a migration status/version mechanism.
8. Produce `morning-meeting-builder-cpanel.zip`.
9. Prove every asset referenced by built `index.html` exists at its relative path.

Develop on a branch such as `feature/hosted-company-version`; do not overwrite the current working deployment until the hosted branch is reviewed.

---

## 15. Installation and database setup deliverables

Astra must provide exact, copyable setup instructions for both common cPanel paths:

- phpMyAdmin/database-wizard setup without SSH;
- command-line setup when SSH is available.

Deliver:

- numbered MySQL migration files;
- a safe migration runner or exact import order;
- database/database-user creation guidance without hard-coded real names or passwords;
- least-privilege MySQL grants;
- `utf8mb4` and InnoDB verification;
- private `config.php` example;
- a safe first-admin bootstrap process;
- admin UI steps for creating DTB, locations, location accounts, and management accounts;
- server-readiness check for PHP version/extensions, writable private directories, upload limits, HTTPS, and rewrite support;
- rollback and backup procedure.

Do not expose a permanent web installer or default password. A temporary bootstrap route, if unavoidable, must require a strong single-use token and disable itself immediately. Prefer a local/CLI password-hash tool plus phpMyAdmin insert or another documented non-public bootstrap.

---

## 16. Implementation gates

### Gate 1 - Preserve and correct the MVP

- Existing meeting, template, library, backup, and presentation flows still work.
- Five recorded UI corrections are complete.
- Current tests remain passing or are intentionally migrated.
- GitHub Pages demo/local mode works with correct repository-relative assets.

### Gate 2 - Organization and server foundation

- Multi-company-ready schema with strict organization isolation.
- PHP API, configuration, migrations, accounts, three management roles, locations, devices, sessions, CSRF, throttling, audit records, and health/readiness checks.
- Unauthorized cross-organization, cross-location, and role access tests pass.

### Gate 3 - Libraries, templates, and sharing

- Company/location content synchronizes correctly.
- Permitted non-admin/location accounts can create templates.
- Template owner, use, edit, selected-account, selected-location, and company sharing work.
- Immutable template versions preserve historical meetings.

### Gate 4 - Scheduled broadcasts

- All targeting, date, recurrence/completion, importance, named-slot placement, priority, and fallback rules work.
- Required broadcasts auto-insert.
- Skip requires a reason and appears in reports.
- One-time-per-location completion does not affect other locations.

### Gate 5 - Images and offline sync

- Secure image upload, processing fallback, authenticated retrieval, thumbnails, limits, deduplication, and storage reporting work.
- Bootstrap, incremental pull, outbox push, reconnect, idempotency, tombstones, and conflict messages work.
- A downloaded meeting remains presentable after restart while offline, except clearly labeled YouTube/external content.

### Gate 6 - Reporting and packaging

- Shared location history works across two devices.
- Central dashboards and CSV reports answer the required questions.
- CI produces both a valid demo build and FileZilla-ready cPanel ZIP.
- Fresh install and upgrade instructions are tested against an empty test database and representative MVP data/export.

---

## 17. Verification checklist

- Unit tests for scope filtering, organization isolation, template permissions, broadcast selection/placement, rotation, timer start, numeric fields, usage rules, and sync idempotency.
- PHP integration tests for authentication, authorization, CSRF, file validation, role restrictions, cross-location isolation, cross-organization isolation, and report filters.
- End-to-end admin upload/broadcast -> location sync -> offline presentation -> reconnect -> central report.
- Two devices at one location share history after sync.
- Two locations retain independent rotation histories.
- Required broadcast skipped with reason is reported correctly.
- One-time broadcast completes separately for every targeted location.
- Tablet/phone refresh and restart while offline.
- Expired session, revoked device, disabled location, failed upload, missing media, stale edit, and near-full storage states.
- YouTube slides clearly communicate that connectivity is required.
- Demo mode never calls the production API or contains credentials.
- Deployment ZIP contains `index.html`, matching `assets/`, PWA files, `.htaccess`, and `api/` at correct levels.
- No secrets, uploaded media, database dumps, signing files, or `node_modules` enter Git or the deployment ZIP.
- Keyboard, touch, landscape tablet, phone, desktop, and 200% text scaling behavior.
- Do not claim cPanel, physical-device, or real offline verification unless actually performed.

---

## 18. Confirmed hosting profile

The current hosting service demonstrates that the intended architecture is viable. The future standalone domain may receive a separate cPanel account, so verify its settings again before production.

| Item | Confirmed/current information |
|---|---|
| PHP choices | PHP 8.3 or 8.5 available; target compatibility baseline is PHP 8.3 |
| Database | MySQL 8.0.46 with InnoDB |
| Database capacity | 10 databases allowed; 1 currently used on the inspected account |
| Current extensions seen | `mysqli`, `curl`, `mbstring` |
| Disk | Approximately 30 GB total, almost entirely unused |
| Bandwidth | 75 GB/month, almost entirely unused |
| Default PHP limits | upload 2 MB, post 8 MB, memory 512 MB, execution 30 s, input 60 s; values appear editable |
| HTTPS | AutoSSL domain-validated certificates with automatic renewal |
| Scheduled tasks | Cron Jobs available |
| Private paths | Account home contains directories outside `public_html` |
| Deployment tools | File Manager, FileZilla/FTP, phpMyAdmin, backup tools, Git Version Control, SSH Access |
| Current-domain capacity | Current account shows 0 addon domains allowed and 10 subdomains; IT may provision a separate account for the purchased domain |

Verify on the new account before launch:

- `pdo_mysql`, `fileinfo`, `openssl`, `zip`, and GD or ImageMagick;
- writable private media/config directories;
- Apache `.htaccess`, rewrite rules, and security headers;
- actual backup frequency, retention, and restoration process;
- inode/file-count, CPU, memory/process, database-connection, and concurrent-request limits;
- forced HTTPS behavior and the exact domain document root.

The application must not depend on FFmpeg or direct uploaded-video playback in V2.

---

# Copy/paste prompt for GPT-6 Astra

Attach the full existing source project ZIP, this V2 proposal, and the original proposal deck. Do not attach only the browser-ready GitHub Pages files.

Copy everything between **START OF PROMPT** and **END OF PROMPT** into a new GPT-6 Astra coding conversation.

## START OF PROMPT

You are the lead full-stack engineer responsible for converting the attached Morning Meeting Builder MVP into the V2 company-hosted, synchronized Progressive Web App described in the attached development proposal. Work directly on the attached source and implement the application end to end. Do not merely return code samples, mockups, or another plan.

Read the complete **Morning Meeting Builder - Hosted Company Version V2** proposal before editing. Treat every locked decision, role, permission, data rule, scheduled-broadcast behavior, existing UI correction, implementation gate, deployment constraint, and verification item as acceptance criteria.

### Starting application

The MVP already uses React 19, TypeScript, Vite, a PWA service worker, IndexedDB, Capacitor/native folders, and automated tests. Preserve its working DTB-branded experience and meeting workflow. Inspect the actual source, package scripts, data model, PWA configuration, tests, and documentation before choosing migrations. Refactor incrementally rather than replacing it with a generic dashboard.

Work on a new branch named `feature/hosted-company-version` if Git is available. Do not overwrite an existing deployed build or discard unrelated changes.

### Required architecture

Build one frontend with two supported configurations:

1. A GitHub Pages-compatible demo/local mode using IndexedDB, repository-relative asset paths, local meeting history, and no production credentials.
2. A cPanel hosted mode using a same-origin PHP 8.3-compatible PDO JSON API, MySQL 8/InnoDB, authenticated sessions, protected image storage, organization/location permissions, incremental synchronization, scheduled broadcasts, and centralized reporting.

Production cPanel must not require Node.js, Docker, Firebase, Supabase, a long-running server, or a background queue. Preserve the Capacitor folders, but APK/IPA packaging is not required for V2.

### Multi-company and accounts

Make the data model multi-company ready and enforce `organization_id` server-side on every applicable query. Seed/use DTB only; do not build self-service company registration, billing, or subscriptions.

Implement individual management accounts with full administrator, content manager, and report viewer roles. Implement persistent location accounts fixed to one organization and location. Multiple browsers/devices may use one location account, but every device has its own ID, session, status, and revocation control. Presenters select or enter their name; they do not need individual presenter logins.

Keep login easy without weakening server security. Never ship predictable/default passwords or embed credentials. Use PHP password hashing, opaque random hashed server sessions, `Secure`/`HttpOnly`/`SameSite=Strict` cookies, CSRF protection, login throttling, prepared statements, safe errors, security headers, audit logging, and private production configuration.

### Template ownership and sharing

Do not restrict template creation to administrators. Implement a `can_create_templates` capability and enable it for DTB location accounts in the initial DTB setup. Every template has an owner. Keep `can_use` and `can_edit` separate. Owners/full administrators can share use/edit access with selected accounts or locations, or publish a template company-wide for use. Company-visible does not mean company-editable. Location accounts may edit daily meeting drafts without editing the master. Preserve immutable template versions and add named insertion slots.

### Location-owned usage

Usage and content rotation belong to a location, not a device or session. Two Assembly devices must share Assembly history after synchronization, while Paint remains independent. Replacing a tablet must not lose history. Record device/account IDs for audit, but query rotation by location. Pull fresh location history before online meeting generation. Preserve offline events with client UUIDs and idempotent server writes.

### Scheduled broadcasts

Build scheduled company content similar to a lightweight OptiSigns workflow. Authorized users can publish text, image, image-and-text, YouTube, or external-link slides to all or selected locations. Support one date, a date window, once per location, and every meeting during the active window. Support available, suggested, and required importance.

Insert broadcasts into named template slots such as Announcements, Safety, Quality, Recognition, or Closing. Use a documented fallback after Introduction when a slot is missing and warn in the builder. Resolve collisions deterministically by priority, start date/time, and creation sequence. Required slides auto-insert and cannot be removed from the draft. They may be skipped during presentation only after entering a reason, which must appear in central reports.

### Content and media

V2 content types are text, JPEG/PNG/WebP image, image plus text, YouTube link, and external link. Do not implement direct video uploads or PDF rendering as launch requirements. Store image metadata in MySQL and bytes in protected filesystem storage, preferably outside the public document root. Validate MIME/signatures, use random paths, record SHA-256/size/dimensions, generate optimized WebP/thumbnails when server support exists, and provide a safe fallback when GD/ImageMagick is absent. YouTube media remains online-only and must not be downloaded.

### Synchronization and offline behavior

Replace the single device state document with record-level IndexedDB stores and server records. Implement bootstrap, incremental pull with reliable cursors, archive tombstones, version/conflict checks, an offline outbox, bounded batch pushes, and idempotent UUID writes. Retry on app start, reconnect, presentation completion, and Sync Now. Show sync state and last successful sync.

Cache the app shell and explicitly downloaded/current meeting images. Provide Download meeting for offline use and readiness states. Do not cache the entire company library. A downloaded meeting must remain presentable after restart with no network except for clearly labeled YouTube/external content.

### Usage and reports

Write usage locally before attempting upload. Count content only when its slide opens in presentation mode. Builder selection and preview do not count; missing media does not count. Record meetings, slide opens/skips, content presentation, video start/completion when reliable, broadcast presentation, and broadcast skips with reasons. Include organization, location, device, account, presenter/meeting, content/version, UTC time, and an idempotency key.

Build dashboards and CSV exports for safety-video usage, required/broadcast completion by location, skips/reasons, last meeting and sync, device status, content use by location/company, and individual meeting history.

### Existing corrections

1. Introduction slides cannot add library content.
2. Already-selected content is pinned at the top when reopening the picker.
3. Content can be removed and content-free slides are valid.
4. Timed-slide timers remain paused until Start is pressed.
5. Numeric fields may be blank while edited and validate/default only on blur/save.

### Repository, database, and deployment

Follow the proposal's repository structure while respecting the existing project. Provide numbered forward MySQL migrations, migration version tracking, `utf8mb4`, InnoDB, indexes, foreign keys, and transactions. Do not put a permanent installer or default password on the internet.

Provide exact setup instructions for both phpMyAdmin/cPanel without SSH and command-line setup when SSH is available. Include safe first-admin creation, DTB organization/location/account setup, database-user/grant guidance, private configuration, migration order/runner, readiness checks, backup, upgrade, and rollback procedures. Use fake example secrets only.

Create GitHub Actions checks and a deterministic `morning-meeting-builder-cpanel.zip`. Its public tree must contain the built hosted `index.html`, matching `assets/`, PWA assets, `.htaccess`, and `api/`. Include migrations and private config examples separately. React source and `node_modules` must not be placed in the public deployment directory. Also produce and validate the GitHub Pages demo build.

### Work and verification

Proceed autonomously through implementation, tests, documentation, and packaging. Ask only when blocked by missing host capabilities or a truly product-changing ambiguity. Use portable defaults for unknown host details and document the exact later verification.

Run all available type checks, linting, builds, PHP syntax/tests, frontend/integration tests, migration checks, package inspection, and end-to-end simulations. Test organization isolation, location isolation, roles, template sharing, broadcast scheduling/placement, two devices sharing one location history, separate location rotation, offline retry without duplicates, required-skip reasons, and asset-path correctness. Fix failures. Do not claim physical-device, cPanel, or real-network verification unless performed.

At completion provide:

1. the complete updated source project ZIP;
2. `morning-meeting-builder-cpanel.zip` ready for FileZilla;
3. the GitHub Pages demo build/package;
4. numbered MySQL migration files;
5. exact phpMyAdmin and optional SSH database setup instructions/commands;
6. a concise implemented-feature summary;
7. exact test/build results;
8. remaining cPanel, extension, tablet, and network checks;
9. the first five safe deployment steps.

## END OF PROMPT

