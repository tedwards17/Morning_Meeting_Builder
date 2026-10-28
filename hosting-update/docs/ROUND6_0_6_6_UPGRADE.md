# v0.6.6 — consistent typography and compact controls

Continue Round-6-Development from verified v0.6.5 e7cbf03. Production remains static files plus PHP/MySQL; no production Node service. No live deployment or default-branch merge.

## cPanel

Back up the public files and database, then merge only **hosting-update/public_html contents** into the existing document root. **No new SQL if migration 006 is installed.** Earlier installations should first follow ROUND6_BATCH4_5_UPGRADE.md; never rerun installed 006 after adding new video text. Keep the live server-paths.php, config.js, root .htaccess, all private configs/provider keys, database and server-held media, including the manually corrected media directory path/permissions. The update excludes those three live public configuration files. Do not replace the existing site with hosting-upload or the root demo. Reload online without clearing browser storage.

## Changes

- Uploaded-media remove controls use a centered SVG × inside the existing translucent red circle. Hover/focus and removal behavior remain.
- Thumbnail play controls are fixed circles at the bottom left in the library, selection dialog and builder/media organizer, on desktop and mobile. Videos retain previews and player cleanup; images/text do not receive a video button.
- The protected template area uses its natural wrapped height. Top-aligned content starts a normal gap below it. Media/text still occupy separate cells, and bottom/middle template positioning remains supported.
- Under **Template name, theme & groups → Template theme**, **Slide font size** sets one shared size (16–96, default 48) for the slide title, template body, library title/body, meeting additions and media-item title. It applies to every slide type, including visual groups. The size scales with the slide; company branding/footer labels retain their existing small styling.
- Text wraps at full available width and honors entered line breaks at the selected size. Center/top/bottom alignment uses the same available area. The slide first measures the exact requested size, then reduces all authored text together only when natural content truly exceeds its available space. Shortening text restores the requested size. Template and media-title areas grow naturally; no fixed 28% title reservation or 16% media-title reservation forces premature shrinkage. Media cells remain bounded to avoid overlap.

The font value is optional in existing theme JSON, validated on template/meeting writes. No schema addition. Existing saved meetings retain their captured theme; older snapshots without a font setting use the shared default 48. Editing a template's font does not rewrite saved meetings. Translation, accounts, rotations, usage, saved snapshots and confirmed-completion cleanup remain.

## Short manual check

1. Choose a font size in template settings, save, and build a new meeting. Compare a text slide, image + text, video, and a visual-group slide.
2. Add numbered lines 1, 2 and 3 with Enter in center and top-left positions. Text should wrap/use available space at the same size; a genuinely overflowing slide should shrink consistently. Delete excess text and confirm the selected size returns.
3. Check top text directly below the template title, clear image/text separation, and footer spacing in preview and presentation.
4. Check circular bottom-left play controls in all three content browsing areas and on mobile. Upload/remove a picture using the centered red ×.
5. Confirm English/Spanish controls, saved-meeting reopening, and normal playback on the actual meeting TV/tablet. No paid translation calls are needed for these checks.
