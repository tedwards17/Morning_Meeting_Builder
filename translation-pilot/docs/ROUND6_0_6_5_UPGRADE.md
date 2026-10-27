# v0.6.5 — protected slide areas, layout defaults and media removal

Continue on Round-6-Development from verified v0.6.4 b5da59f. Source and prebuilt public files are delivered together. No live deployment/default merge. Production stays static HTML/CSS/JavaScript plus PHP/MySQL.

## cPanel update

1. Back up the live public files and database.
2. **No new SQL for v0.6.5.** Existing installations already at migration 006 need no database step. If upgrading from older than v0.6.4, follow ROUND6_BATCH4_5_UPGRADE.md first. Never rerun 006 after adding new video text; it is a one-time cleanup.
3. Merge only the **contents of hosting-update/public_html** into the existing document root, replacing matching app files. The update excludes live server-paths.php, config.js and root .htaccess. Keep them, private configs/provider keys, database, media directories and the manually corrected media path/permissions. Do not upload hosting-upload or the root demo over the live site.
4. Reload online. Do not clear browser storage. Run the acceptance checklist below.

## Text and layout model

Three sources remain separate: template title/body in definition.title/text; selected library title/body in the saved content snapshot; additional meeting text on the meeting slide. Browsing descriptions are still excluded from presentation. Meeting additions no longer replace the template body or title. Existing saved title/body edits remain part of their original snapshots; there is no attempt to guess or move old authored text.

The template builder now has **Slide layout defaults** alongside the theme. It sets title/template-text position, Text only position, Image only position, Image + Text position, and image/text arrangement (left/right/above/below). Each slide can inherit these or customize its own values; resetting the slide restores inheritance. Legacy textPosition and media layout metadata map compatibly into the new model. New slides inherit instead of receiving an implicit centered override.

The meeting builder can add **Additional meeting text** and adjust only content positioning/arrangement. Its controls switch to the actual mode as content or meeting text changes. Template title/body positioning stays in the template builder. Defaults are copied into each new meeting's definition snapshot; editing a template later does not rewrite saved meetings.

Titles and template body have a reserved area. Selected-content text and meeting text stack in a separate content region; image/video and text have distinct adjacent cells. Top titles reserve a top band with content below. Middle titles reserve a middle band with content below; bottom titles reserve a bottom band with content above. Position pickers align within their corresponding reserved areas. Media remains contained without cropping/stretching, including multi-file slides. Template background images remain backgrounds, not content media. This does not add overlay text boxes.

Text automatically fits the space as a group, with wrapping, a comfortable line height and bottom padding for descenders (y/g/j/p). Long text may need a smaller font; shorter text or another slide remains the best way to keep it readable on a TV. Template and meeting previews use the same renderer as presentation. Original branding, captions, playback and navigation are retained.

## Uploaded media and highlight color

Every uploaded meeting attachment has an accessible red × in its media card, including touch and keyboard support, with a solid red hover/focus state. Removing one detaches only that item from the slide, leaving other attachments and company-library content intact. Removing the last item is allowed and the upload control remains available. Included non-optional Media slides still require a replacement or skip before presenting. Draft removal uses the existing autosave/save path. Server files follow existing confirmed-completion/temporary-upload cleanup; clicking × does not immediately purge a shared or referenced file.

Builder slide color now appears immediately on the template slide-list row, including before Save. It still highlights the builder/agenda only and does not set presentation background.

## Short acceptance checklist

- Create a template with title/body, choose defaults, then override one slide and reset it. Change its highlight color before saving; confirm the list changes immediately.
- Select image + content text, add meeting text, and verify all three text sources appear without overlapping each other or the image. Try left/right/above/below arrangements and a title containing y/g/j/p.
- Upload two files, remove one, remove the last, and upload a replacement. Save/reopen; removed attachments must stay removed. Confirm company-library media remains available.
- Save and present, then edit template defaults separately. The saved meeting should keep its previous template text/layout snapshot.
- Check text-only/image-only/image + text on desktop and portrait/landscape mobile in English and Spanish. Check normal and long titles on the TV. Native browser dropdown and actual device codec/YouTube checks remain manual.

No changes to accounts, rotation, library contribution/deletion permissions, translation/transcripts, completed-meeting cleanup, or live configuration. No paid translation calls are needed for these checks.
