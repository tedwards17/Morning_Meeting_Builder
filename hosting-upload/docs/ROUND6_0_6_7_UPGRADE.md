# v0.6.7 — separate type sizes, readable quote titles, unused draft deletion

Continues verified v0.6.6 on Round-6-Development. Static HTML/CSS/JavaScript plus PHP/MySQL; no production Node service. Source and prebuilt update are published together. No default merge or live deployment.

## cPanel upload and one-time SQL

1. Back up the website files and database. Keep the existing private configuration, provider keys, server-held media and manually corrected media path.
2. In phpMyAdmin select the existing app database and run `SELECT version FROM schema_migrations ORDER BY version;`. Install any genuinely missing earlier migrations in order using their upgrade guides. **Never rerun installed 005 or 006**, reimport starter content, or reset the database.
3. If version **7** is absent, import **hosting-update/database/007_quote_titles.sql** into that existing database once. This is a data-only update: no table/schema alteration. It records version 7 itself. With private CLI access, the existing `scripts/migrate.php` instead applies only uninstalled numbered migrations when pointed at the existing private config. Do not put database files or private scripts in the public web root.
4. Merge **only hosting-update/public_html contents** into the existing document root. Keep live **server-paths.php, config.js and root .htaccess**; the update excludes them. Preserve all private configs, database and media. Do not substitute hosting-upload or the root demo for this update.
5. Reload online, let the app update and synchronize, then check the app version and quote titles. Do not clear browser storage.

Migration 007 updates only exact original starter ID/library/title/body matches, including archived quotes. It changes the title, version and update timestamp, retains the original record version, and publishes sync changes. Customized titles, edited quote bodies, moved entries, IDs, quote wording, source/attribution, sharing, rotation memberships, usage, media and all saved presentation snapshots remain. All 688 entries have reviewed short titles; the original source datasets remain unchanged. New starter installations use the same title map. See **QUOTE_TITLES.csv** for the full old/new title catalog. One source entry contains only “132”; its honest title is **Quote needs review: numeric entry**, with body unchanged. Two holiday greeting entries receive greeting titles. No quote-body or attribution corrections were made.

## Controls

- Template name, theme & groups → Template theme now has **Title font size** and **Text font size**, each 16–96. Title size covers slide/content headings. Text size covers template body, library body, meeting additions and presenter/date text. The values apply to all slide types and visual groups; branding/footer sizes remain. Text wraps first and scales both sizes in proportion only on actual overflow.
- Existing shared `fontSize` initializes both settings. Older snapshots without a size use 48. Editing a template does not rewrite saved presentations; build a new meeting to use the edited defaults.
- Background image and Logo image labels/dropdowns now share the same vertical baseline and 44px control height, including group themes. Narrow layouts stack. The paired font controls also align; the cause was a legacy `details .field:first-of-type` rule adding 16px only to the first field.
- **Administrator:** Meetings → select an unused saved presentation → **Delete unused presentation** → confirm its name/date. Cancel preserves it. Only never-started drafts with no usage events, transcript or presented topics can be deleted. Other roles cannot delete, even through direct API requests. Paused, started and completed meetings remain protected.
- Deletion removes the unused meeting record, logs the action, and synchronizes its removal. It retains company content and server-held media; meeting-only files lose download access when their parent is absent. No disk deletion or new cleanup job is introduced. Old device copies cannot recreate the deleted draft.

Before cleaning up old drafts, bring meeting devices online and synchronize: a server cannot know about use that exists only on an offline device. If such a device later sends a deleted draft, sync retains its pending snapshot privately for recovery and removes the stale active copy. Do not clear that device's storage if recovery is needed. Unrelated pending meetings continue to sync.

## Short manual check

1. Set title size 64 and text size 32, save, reload, and build a new meeting. Compare template body, library body and meeting additions on Standard, Library content and Media slides. Check the actual presentation and a visual group.
2. Add three numbered lines. Confirm wrapping before shrinking, the chosen title/body ratio on real overflow, and restoration after shortening text. Confirm existing saved meetings retain their previous sizes.
3. Check Background image/Logo image alignment and mobile stacking in template and group settings; switch the interface to Spanish.
4. Browse/search the quote library for **Uncomfortable people improve**; open its full text. Check a customized quote stayed untouched, plus rotation and a saved quote presentation.
5. As admin cancel an unused draft deletion, then confirm it and reload. Verify another account/device loses that saved draft after sync. Check a location account has no delete button and a previously presented meeting is protected. Check shared media still plays.

Automated results and remaining physical-device/cPanel checks are in ROUND6_CHECKPOINT.md. No paid translation-provider calls are part of verification.
