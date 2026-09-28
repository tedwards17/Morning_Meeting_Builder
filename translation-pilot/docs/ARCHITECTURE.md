# Architecture and implementation mapping

One frontend supports demo and hosted builds. The former bundle supplies recovered React components, schema validators, DTB styling, ZIP backup validation, asset storage compatibility, and native-runtime chunks. New TypeScript orchestrates a record-level IndexedDB database and PHP API without rebuilding the interface as an unrelated dashboard.

| Proposal domain | Implementation |
|---|---|
| Organization/settings | `organizations` with timezone/settings JSON |
| Locations/accounts/roles/capability | relational locations/accounts with role enum, explicit can_create_templates; PHP capability/ownership checks |
| Devices/sessions/throttling/audit | relational devices/sessions/login_attempts/audit_log |
| Libraries/content/scopes | typed `records` kinds libraries/items; locations arrays; library references validated server-side |
| Templates/groups/slides/slots/shares | template JSON snapshots with groups/slides/slot/access; independent account/location can_use/can_edit |
| Immutable content/template/broadcast versions | append-only record_versions with composite organization/kind/id/version foreign key |
| Broadcast targeting/scheduling | typed broadcast record, UTC start/end, importance/recurrence/priority/sequence/location IDs and content snapshot |
| Meetings/slides/content | relational meeting identity and immutable completed payload snapshot; slide/content snapshot arrays |
| Usage/completion/skips | immutable usage_events; reports/rotation derive from events rather than device used flags |
| Image metadata/bytes | relational media_assets; random protected filesystem paths, authenticated endpoint |
| Change cursor/tombstones | organization-serialized sequence and sync_changes; scoped payload or tombstone |

This deliberately consolidates several suggested tables into versioned typed JSON records to preserve MVP snapshots. It is not a claim that every suggested table name exists. Identity and event relationships have relational organization-scoped foreign keys; references inside JSON are validated by PHP. Every server record version is append-only, and completed meetings are not rewritten by subsequent template edits.

The organization row is locked for mutations before allocating sequence numbers. This prevents a committed later transaction from advancing a client past an earlier uncommitted change. Incremental pull pages have up to 250 changes. Permission/scope changes cause a visible-record bootstrap reset, retaining local outbox events and historical meetings. Bootstrap uses keyset pages of at most 250 records with session-bound signed continuation tokens. Its initial high-water cursor is committed locally only after the final page, then incremental changes catch up concurrent writes. Interrupted snapshots restart safely; a permission-epoch change restarts the snapshot. Edits use expected_version and reject stale clients with 409.

Outbox writes carry UUIDs generated before network use. Meetings are sent before dependent events across batches of 50; event UUID and logical meeting/slide/type/content key deduplicate retries. Server account, device, organization and location are authoritative. A failed push leaves the pending local record intact. Editable master content is online-first; meetings/events are local-first. Usage is aggregated by location, not account/browser.

Images are downloaded explicitly into local storage and cached independently from the HTTP cache. App-shell precaching includes only build files. API endpoints and the company image library are not runtime cached by the service worker. An old active worker is not forcibly replaced mid-meeting. Browser storage persistence is requested through the existing Settings screen when supported.

Broadcasts are evaluated at builder generation. Already saved drafts preserve their snapshots; rebuild/review after a schedule change. A broadcast published while a location is offline cannot arrive until reconnection. Once-completion is location-specific; a later skip on the same meeting/slide prevents that presentation from satisfying completion. Every-meeting completion reports are event counts, with skipped reasons kept separately. No queue or background scheduler is needed: time-window evaluation occurs on the client against synchronized records, and authoritative reporting occurs in PHP.

The initial roles are a fixed enum with explicit capability checks. Arbitrary role editors, account-specific capability matrices beyond template creation, self-service organization creation, billing, direct-video upload, PDFs, WebSockets, and native packaging are not part of the pilot. Native project sources were absent from the supplied ZIP.
