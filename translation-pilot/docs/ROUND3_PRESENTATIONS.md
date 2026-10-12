# Round 3 presentation workflow

## Browser build (v0.3.6)

1. Build a meeting, choose the presenter/date and review each slide. Changes are saved as a local draft as you work. The Save presentation action returns to the workspace.
2. Open the saved draft under Saved presentations. Present saved meeting starts it and records actual slide/content use. Preview does not record use. A meeting in progress can be paused and resumed; Finish meeting marks it completed. Completed meetings can still be edited and presented again through the day after the scheduled date. Repeated presentation of the same content on the same slide does not duplicate its usage record.
3. Personal share and Improvements photos and videos live in this browser's local storage. A file chosen on a PC cannot be fetched by a different tablet from GitHub Pages; the two browsers have separate storage. The old Download for offline use action is removed from the demo builder. The shell remains available offline after its service worker has installed, but online videos still require a connection.
4. A September 25 completed meeting is editable and replayable until 11:59 p.m. September 26 in the browser's local time zone. At midnight September 27 the app removes its meeting-only media and blocks replay/editing, while keeping presenter, date, reusable content selections and usage history. Expired uploads are deleted on the next app opening if the browser was closed at the cutoff. Upload bytes are retained when another active meeting or library item still references them. Drafts and meetings in progress are not auto-purged; finish a meeting before its retention window can close. Export a backup before clearing browser data or if you need to retain personal-share media beyond its scheduled window.

## Hosted account and tablet workflow (future)

Use a server-side presentation record containing the template snapshot, ordered slide definitions, chosen content versions, meeting date and presenter. Store personal share media in an authenticated object store, with access scoped to the owner and presenting location. A user builds and saves from their account; the presentation appears on the location's tablet as a queued, downloadable presentation. The tablet confirms media availability before presenting; showing slides records use through unique event IDs so reconnects do not duplicate it.

Until 11:59 p.m. in the meeting location's time zone on the day after the scheduled date, retain the complete presentation and its media, even if the meeting has already ended. A scheduled cleanup after that point removes only meeting-specific uploaded media and its access links. Retain meeting ID, presenter, date, selected reusable content IDs/versions and presentation events for reporting. A rescheduled meeting must update the cleanup time before deletion. Shared media still referenced by another upcoming meeting must not be removed. Keep a recoverable state during any failed upload or interrupted cleanup.

GitHub Pages has no account service or shared storage, so the hosted workflow and automated **server** cleanup are not part of this browser build. The browser cleanup above is local to each device.
