import { t, uiLabel } from "./i18n";

export const fieldLabels: Record<string, string> = {
  record_id:"Record ID", creator_id:"Creator ID", owner_id:"Owner ID", definition:"Slide definition", byte_size:"File size", width:"Width", height:"Height", value:"Value", check:"Check", sha256:"File hash",
  id:"ID", version:"Version", name:"Name", title:"Title", description:"Description",
  location:"Location", location_id:"Location ID", account_id:"Account ID", device_id:"Device ID",
  username:"Username", category:"Account type", role:"Role", enabled:"Enabled", archived:"Archived",
  can_create_templates:"Can create templates", can_use:"Use", can_edit:"Edit", settings:"Settings",
  timezone:"Timezone", created_at:"Created", updated_at:"Updated", last_login:"Last sign-in",
  last_seen:"Last seen", last_sync:"Last sync", revoked:"Revoked", installed_at:"Installed",
  createdAt:"Created", updatedAt:"Updated", startedAt:"Started", endedAt:"Finished",
  lastUsedAt:"Last used", useCount:"Uses", date:"Meeting date", presenter:"Presenter", status:"Status",
  event_type:"Event", event_key:"Event key", occurred_at_utc:"Occurred (UTC)", server_received_at:"Received (UTC)",
  meeting_id:"Meeting ID", slide_id:"Slide ID", content_id:"Content ID", content_version:"Content version",
  content_type:"Content type", broadcast_id:"Announcement ID", broadcast_version:"Announcement version",
  reason:"Reason", reasons:"Reasons", broadcast:"Announcement", presented:"Presented", skipped:"Skipped",
  presentations:"Presentations", last_presented:"Last presented", last_meeting:"Last meeting", active_devices:"Active devices",
  templateId:"Template ID", templateName:"Template name", slides:"Slides", groups:"Slide groups", theme:"Theme",
  transcript:"Transcript", presentedTopics:"Presented topics", slideId:"Slide ID", slideTitle:"Slide title",
  at:"Time", text:"Text", language:"Language", contentTitles:"Content titles", content:"Content",
  type:"Type", tags:"Tags", source:"Source / credit", url:"Web link", libraryId:"Library ID",
  assetId:"Image ID", thumbnailAssetId:"Thumbnail ID", optional:"Optional", required:"Required",
  defaultSkipped:"Skipped by default", builderColor:"Builder slide color", mediaOptional:"Media optional",
  personalShare:"Personal share", notes:"Presenter notes", selection:"Selection rule", count:"Count", duration:"Duration",
  contentIds:"Content IDs", allowRepeat:"Allow repeats", groupId:"Group ID", layout:"Layout",
  background:"Background", foreground:"Text color", accent:"Accent color", backgroundAssetId:"Background image ID",
  background_asset_id:"Background image ID", logoAssetId:"Logo image ID", slot:"Insertion slot", slots:"Insertion slots",
  priority:"Priority", sequence:"Sequence", start:"Start", end:"End", importance:"Importance", recurrence:"Frequency",
  announcement:"Announcement", announcementDate:"Announcement date", locations:"Locations", accounts:"Accounts",
  allAccounts:"All meeting accounts", access:"Permissions", company_visible:"Company-wide use",
  target_kind:"Recipient type", target_id:"Recipient ID", scope:"Scope", owner_account_id:"Owner account ID",
  mime:"File type", size:"File size", hash:"File hash", thumbnail_size:"Thumbnail size", stored_path:"Stored file path",
  thumbnail_path:"Thumbnail path", mediaExpiredAt:"Media expired", bytes:"Bytes", used_bytes:"Used storage", quota_bytes:"Storage limit",
  total:"Total", organization_id:"Organization ID", actor_account_id:"Account ID", action:"Action",
  detail:"Details", details:"Details", request_id:"Request ID", ip:"IP address", user_agent:"Browser",
  php:"PHP", pdo_mysql:"MySQL driver", fileinfo:"File information", openssl:"OpenSSL", gd:"GD images",
  imagick:"ImageMagick", zip:"ZIP support", media_writable:"Media folder writable", https:"HTTPS",
  upload_max_filesize:"Maximum upload size", post_max_size:"Maximum request size", database:"Database",
  migrations:"Database migrations", applied_at:"Applied", storage:"Storage", limit:"Limit",
  company:"Company name", defaultTemplateId:"Default template", lastTemplateId:"Last template", dateFormat:"Meeting date format",
  hideControls:"Hide controls while presenting", wakeLock:"Keep the screen awake", appVersion:"App version",
  meeting_started:"Meeting started", meeting_completed:"Meeting completed", slide_opened:"Slide opened",
  slide_skipped:"Slide skipped", content_presented:"Content presented", video_started:"Video started",
  video_completed:"Video completed", broadcast_presented:"Announcement presented", broadcast_skipped:"Announcement skipped",
};
export function fieldLabel(key: string): string { return t(fieldLabels[key] ?? key.replaceAll("_", " ")); }
export function fieldValue(key: string, value: unknown): string {
  if (typeof value === "boolean") return t(value ? "Yes" : "No");
  if (["type", "role", "category", "status", "importance", "event_type", "action", "recurrence", "selection", "layout"].includes(key)) {
    const text = String(value ?? "");
    return fieldLabels[text] ? fieldLabel(text) : uiLabel(text);
  }
  return String(value ?? "");
}
