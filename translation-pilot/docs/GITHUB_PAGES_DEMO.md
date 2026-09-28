# GitHub Pages demo/local mode

`npm run build:demo` produces `build/demo/`. `morning-meeting-builder-github-pages-demo.zip` contains that folder’s contents directly, ready to extract/upload to a Pages repository. There are no production credentials or server calls in demo mode. Company workspace demonstrations affect only this browser’s IndexedDB.

The Round-3-Development branch contains only the browser build files at its root. Upload `index.html`, `assets/`, icons, manifest, `sw.js`, and `.nojekyll` together. Keep all hashed files matching index.html. The base, manifest start_url, worker scope, and assets are relative, so a URL like `https://USERNAME.github.io/REPOSITORY/` works.

Use HTTPS; opening index.html directly from disk is not supported. Wait for the initial load to finish, then test an offline reload. Export a backup before replacing the old demo. Using a new domain, browser profile, or device creates a separate local workspace. Saved meeting media stays in that browser; YouTube/external links are always online-only. See `ROUND3_PRESENTATIONS.md` for the future cross-device workflow.

The recovered MVP IndexedDB document is imported into V2 record stores on first local-mode startup at the same origin. Its original database is retained rather than deleted. Original media remains readable through the recovered asset store. Moving to another origin requires exporting/importing the original ZIP backup.
