# Morning Meeting Builder — Round 3 editable source

This is the editable reconstruction and hosted extension of the supplied DTB browser MVP. The original ZIP contained bundled JavaScript/CSS, not the former TypeScript sources or tests. `frontend/recovered/` preserves that working React UI and its bundled runtime in readable JavaScript. `frontend/src/` contains new TypeScript domain, IndexedDB, synchronization, account, reporting, and management code. This is not a claim that the original source or Git history was recovered exactly. The original native folders were absent; see `native/README.md`.

## Start

Node 24 is used only on a developer computer/CI. Production uses ordinary files, PHP 8.3 and MySQL 8.

```sh
npm ci
npm run dev
npm run typecheck
npm run lint
npm test
npm run build:demo
npm run build:hosted
npm run check:php
python3 scripts/check-migrations.py
npm run package
```

The Home, Templates, Content library, meeting review, presentation, Backup & restore, and Settings screens remain. **Company workspace** adds broadcast scheduling, template sharing/slots, scopes, account/location/device administration, reports, and readiness. The public Round 3 GitHub Pages build is local-only. Hosted uses `./api/v1` on the same origin; do not point a demo build at the API. See `docs/ROUND3_PRESENTATIONS.md` for the saved draft workflow and the future account/tablet design.

Read `docs/CPANEL_SETUP.md` and `docs/VERIFICATION.md` before deployment. `artifacts/` contains reproducible ZIPs after packaging. No production credentials, default account passwords, media, database dumps, or dependencies belong in those ZIPs.

## Database design

Identity, devices, sessions, media, meetings, immutable events, and synchronization sequences use relational tables with organization-scoped keys. Libraries, content, templates, groups/slides/slots/sharing, and broadcasts use typed JSON records plus append-only version snapshots, preserving the recovered MVP shape instead of destructively flattening it. PHP validates target accounts, locations, library references, media references, ownership, and versions. `docs/ARCHITECTURE.md` explains the mapping and tradeoffs. For the optional hosted Azure captions pilot, see `docs/LIVE_TRANSLATION.md`.

## Release posture

This is a reconstructed application that requires the documented staging acceptance run on the actual MySQL/cPanel account and target tablets. See the exact local checks and remaining environment-specific checks in `docs/VERIFICATION.md`. The local-only demo is published at `https://tedwards17.github.io/Morning_Meeting_Builder/`; the hosted account service is not deployed.
