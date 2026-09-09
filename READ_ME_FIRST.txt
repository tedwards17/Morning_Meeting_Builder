MORNING MEETING BUILDER — BROWSER-READY EDITION

This folder is already built. No Node.js or Visual Studio Code is needed to
publish it. Keep the original source ZIP for future development.

GITHUB PAGES SETUP (ALL IN YOUR BROWSER)

1. Sign in to GitHub and create a new repository, for example
   morning-meeting-builder. For GitHub Free, choose Public. Enable Add README
   so the repository opens with a file list.
2. In the repository choose Add file > Upload files.
3. Open this extracted folder. Upload the CONTENTS: index.html, the assets
   folder, the icons, manifest.webmanifest, sw.js, workbox-*.js, .nojekyll,
   and this text file. Do not upload only the ZIP or the enclosing folder.
4. Commit the upload to main. Confirm index.html is at the repository's top
   level, with the assets folder alongside it.
5. Go to Settings > Pages. Under Build and deployment select:
     Source: Deploy from a branch
     Branch: main
     Folder: /(root)
   Click Save.
6. Wait for publishing to finish. Refresh Settings > Pages and use the
   displayed Visit site link. No manual Node build or custom Actions workflow
   is needed for this already-built package.

The link normally resembles:
https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/
Use the actual link GitHub displays, including the repository path.

IMPORTANT BEHAVIOR

- The published app is publicly reachable and contains no login. A private
  repository does not by itself make the Pages website private.
- Photos, videos, drafts, and history that you import in the app stay in that
  browser/device. They are not uploaded to GitHub. Do not upload your content
  backups or shop media into the repository itself.
- Opening the same link on another device does not synchronize its content.
  Use the app's ZIP Backup & Restore to distribute content across locations.
- Keep a backup outside the browser. Clearing site data can erase local data.
- Use the published HTTPS link, not a double-clicked local index.html file.
- After the first successful online load, the app is designed to cache for
  offline use. Validate offline startup and media on your chosen device.
- This version has the same underlying app as the source project. Its build
  succeeded with relative asset paths for repository-subfolder hosting.
  Actual GitHub deployment and real-browser/device testing have not been
  performed here.

UPDATING THE APP

A future browser-ready build can replace these files in the same repository.
Export an app backup first. Keep the site address the same. Close all open app
windows after an update, then reopen so the service worker can activate the new
version. Old hashed asset files can remain; remove only files that the new
package no longer uses if you are maintaining the repository yourself.

Official GitHub guide:
https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
