# Morning Meeting Builder — v0.7.0

Approved Corner overlay expands YouTube videos within the presentation without restarting the player. Captions and Next remain available, and Back to slide/Escape/device Back restores the slide. Logos support 25–200%; larger artwork reserves header space. Morning Meeting/theme-group text moves to the bottom-left footer, replacing the repeated slide title.

Source and prebuilt cPanel files: **Round-6-Development**. No default merge or live deployment.

Existing website: back up, then merge only **hosting-update/public_html contents** into the document root. Preserve live server-paths.php, config.js, root .htaccess, private configuration/keys, database, media and corrected paths. **No new SQL.** Earlier 007 once if absent; never reset/reimport starter data or rerun installed migrations.

[Upload and shop checklist](hosting-update/docs/ROUND7_0_7_0_UPGRADE.md). [Checkpoint](translation-pilot/docs/ROUND6_CHECKPOINT.md).

User-facing, npm and package versions are 0.7.0. Production remains static assets plus PHP/MySQL; Node is only a developer/build tool. Physical device/video/fullscreen behavior still needs shop acceptance.
