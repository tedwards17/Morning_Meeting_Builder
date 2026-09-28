# Backup, migration, upgrade, rollback

## Company backups

Back up these as one consistent set: database, private config, private media tree, and the currently deployed public release. Protect backups as company data. Use cPanel Backup/JetBackup or the host-approved solution and confirm retention and off-account storage with IT. Test restoring to a separate staging database/root before relying on backups. Database snapshots alone cannot restore image bytes.

SSH example (the prompt asks for the password; do not include it in shell history):

```sh
mysqldump --single-transaction --default-character-set=utf8mb4 -u CPANELPREFIX_BACKUP_USER -p CPANELPREFIX_mmb > /PRIVATE_BACKUP_PATH/mmb.sql
```

Use an account authorized for backup. Keep files outside public_html, encrypt offsite copies, and define retention. The application does not claim to configure your hosting backup system.

## Existing MVP data

At the same GitHub Pages origin, V2 demo mode migrates the original `dtb-morning-meeting` state document into record-level `mmb-v2` stores without deleting the old database/media. Keep the original ZIP backup for rollback. The original Backup & restore screens and ZIP validation remain available in demo mode.

For a different origin, export a complete backup from the old app, open the new demo, and import it using Merge or Replacement after reviewing the preview. Production migration should be deliberate: sign into the hosted administrator and use Backup & restore → Merge. Company records become online-first writes. **Hosted Merge uploads JPEG/PNG/WebP image bytes into protected storage and remaps their references before saving the libraries, content and templates.** GIFs and direct local video are rejected for hosted import; remove/replace them in a copy of the demo backup first. Hosted full replacement is disabled. Merge retains the current hosted location identity/history and does not import the legacy device’s meeting history as if it were a current server event. Keep that original export as the historical archive. Do not assume moving the deployed browser files transfers its IndexedDB data.

Local backups do not constitute a complete server backup and do not include other locations’ private offline drafts. Keep the original demo/export until staged content and history have been reviewed.

## Upgrade

1. Announce a short maintenance period; ask locations to finish and Sync Now.
2. Create and verify database/media/config/release backups.
3. Apply only unapplied forward migrations using a migration-capable user. Check `schema_migrations` and the query checks in DATABASE_SETUP.md.
4. Deploy matching assets/API/index/worker following FILEZILLA_DEPLOYMENT.md. Test sign-in, image access, a short meeting, and reports before reopening.
5. Close/reopen client tabs to activate the new worker after meetings finish. Keep prior hashed assets during this transition.

## Rollback

If no schema changes occurred, restore the prior matched public files and compatible API release. Do not selectively mix old JS with a new incompatible API. If schema changed, restore the pre-upgrade database/media/config together into a separate staging environment and verify it before switching. Forward migrations do not have destructive automatic down scripts. Consider any events recorded after the backup: preserve/export them before restoration rather than silently dropping them. Keep the new database backup too.

## Offline images and cleanup

Download is explicit; the entire company library is never cached automatically. Draft and recent meeting downloads are retained. **Clean old downloads** removes only downloaded image blobs older than 30 days, oldest first, excluding all drafts and the last ten completed meetings. Original local imports are not removed by this optional cleanup. Metadata, meeting snapshots, and immutable events remain. Download an older meeting again before presenting it offline. Browser/OS eviction and user-cleared site data remain external risks; use persistent storage where available.
