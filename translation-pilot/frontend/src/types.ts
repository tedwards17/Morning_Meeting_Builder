export type Row = {
  id: string;
  version?: number;
  organization_id?: string;
  location_id?: string;
  archived?: boolean;
  [key: string]: any;
};
export type Account = Row & {
  role: "administrator" | "content_manager" | "report_viewer" | "location";
  category: "individual" | "location";
  can_create_templates: boolean;
  location_id?: string;
};
export type Session = {
  account: Account;
  device: Row;
  organization: Row;
  csrf: string;
};
export type State = {
  schemaVersion: number;
  settings: Row;
  device: Row;
  templates: Row[];
  libraries: Row[];
  items: Row[];
  assets: Row[];
  meetings: Row[];
  usage: Row[];
  broadcasts: Row[];
  [key: string]: any;
};
export type Broadcast = Row & {
  title: string;
  start: string;
  end: string;
  importance: "available" | "suggested" | "required";
  recurrence: "once" | "every";
  slot: string;
  priority: number;
  sequence: number;
  locations: string[];
  status: "draft" | "published";
  content: Row;
};
export type Usage = Row & {
  meeting_id: string;
  slide_id?: string;
  content_id?: string;
  broadcast_id?: string;
  event_type: string;
  occurred_at_utc: string;
  reason?: string;
};
