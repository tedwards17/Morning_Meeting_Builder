# Daily location workflow

Sign in once with the assigned location account and give the browser a recognizable device name. Do not share the management account with the shop. Presenters choose/type their name; no presenter login is needed.

1. Check sync state. Online meeting generation pulls the latest location history before selecting rotating content. Two Assembly devices share Assembly history; Paint remains independent. Simultaneous offline devices can select the same item, and reconciliation preserves both event histories.
2. Choose a template, enter presenter/date, and review. Introduction cannot take library content. Selected picker items remain at the top. Remove content to leave a valid content-free discussion slide. Add meeting-only text for one-time talking points. Do not edit a master merely to change today’s draft.
3. Review required broadcasts and missing-slot warnings. Available/suggested broadcasts can be included explicitly. Required slides cannot be removed from drafts; if they cannot be presented, use the presentation’s skip-with-reason action.
4. Use **Download meeting for offline use** while connected and wait for Ready offline. Save the draft. The current/downloaded images remain in browser storage across restart. YouTube and external links require internet and are labeled. Browser storage can still be evicted/cleared; request persistent storage in Settings where available and keep server/backups.
5. Start presentation. Timers remain paused until Start countdown. Preview and builder choices do not record usage. Images count only after loading; missing media does not count. Embedded YouTube start/completion is recorded only on reliable player callbacks.
6. Finish/exit the meeting. Events are written locally first, then uploaded. Sync retries at app start, reconnect, builder entry, presentation completion, every foreground minute, and Sync Now. Needs attention shows the reason; do not clear site data to repair a pending outbox.

Replacing a tablet: sign in at the same location and sync; history is inherited from the server. Download the next meeting’s images on the replacement device. A revoked/expired session requires online sign-in. Existing offline session metadata permits presenting already downloaded meetings while offline; revocation takes effect when the device reconnects.

Logout requires a successful sync when pending events exist. Use a separate browser profile for a different account if the device is registered to another account. Keep physical tablet passcodes and OS updates enabled; app device revocation is not a device wipe.
