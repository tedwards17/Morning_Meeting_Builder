# FileZilla deployment

Use SFTP or FTPS supported by your host. Verify the server certificate/host key with IT. Extract `morning-meeting-builder-cpanel.zip` on your computer.

- Upload the **contents** of `public_html/` to the new domain document root. `index.html`, `assets/`, `manifest.webmanifest`, icons, `sw.js`, `.htaccess`, and `api/` must be siblings at the root.
- Do not upload the containing `public_html` folder as an extra level.
- Copy private config/media and setup materials outside the document root as described in CPANEL_SETUP.md. Never upload the whole source ZIP or node_modules.
- Ensure FileZilla displays and transfers `.htaccess` and `.nojekyll` hidden files. `.nojekyll` is harmless on cPanel.
- Verify an unauthenticated `/api/v1/auth/session` returns a safe 401 JSON response; a directory listing or PHP source download means the host is misconfigured.
- Sign in over HTTPS and open Readiness. Inspect cookie flags with browser developer tools: Secure, HttpOnly, SameSite=Strict. In production, requests using HTTP must redirect to HTTPS.
- Test that `/api/src/core.php` is denied and the private config/media directories have no public URL.

Upgrade in maintenance time: take a backup, apply only new migrations using the migration user, upload new hashed `assets/` and PHP files first, then `index.html`, PWA manifest, and `sw.js`. Keep old hashed assets until active clients have closed/reopened. The worker activates when prior clients close; it does not forcibly replace an active meeting. If possible upload to a staging directory and switch the domain document root after verification. Do not mix an old index with missing new assets.

`SHA256SUMS.txt` contains package checksums. The packaging script fixes ZIP timestamps and sorted entry order so packaging the same tree produces identical ZIP bytes.
