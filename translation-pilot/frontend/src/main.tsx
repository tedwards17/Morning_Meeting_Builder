import {ColorControl,ThemeColors,PositionPicker,SlideTypeControl} from "./slide-controls";
import {ContentEditor, ContentSelector, ContentCards, BuilderContent} from "./content-ui";
import { confirmUI } from "./dialogs";
import { t as translateUI, getLanguage, getLocale, subscribeLanguage, uiText, uiError, uiLabel } from "./i18n";
import { LanguageSelector } from "./language-selector";
import { fieldLabel, fieldValue } from "./ui-fields";
import { FilePicker } from "./file-picker";
import type * as RT from "react";
import {
  React as RecoveredReact,
  ReactDOM,
  AppProvider,
  OriginalApp,
  useApp,
} from "../recovered/index-DwifuW9D.js";
import * as runtime from "./runtime";
import * as db from "./db";
import { defaults } from "./defaults";
import { csv, normalizeNumber, zonedInput, zonedUtc } from "./domain";
import type { Row, State } from "./types";
import { canReadMeeting, groupMeetings } from "./meeting-history";
import { RollingCaptions } from "./rolling-captions";
import { TranscriptReader } from "./transcript-reader";
import "../recovered/index-BdPx4Tei.css";
import "./v2.css";
import { learnableKey } from "./remote";
const React = RecoveredReact as typeof RT;
globalThis.MMB.BuilderContent=BuilderContent;
globalThis.MMB.ColorControl=ColorControl;
globalThis.MMB.ThemeColors=ThemeColors;
globalThis.MMB.PositionPicker=PositionPicker;
globalThis.MMB.SlideTypeControl=SlideTypeControl;
globalThis.MMB.ContentEditor = ContentEditor;
globalThis.MMB.ContentSelector = ContentSelector;
globalThis.MMB.ContentCards = ContentCards;
globalThis.MMB.FilePicker = FilePicker;
globalThis.MMB.LanguageSelector = LanguageSelector;
const Original = OriginalApp as RT.ComponentType<{navigationOpen:boolean;onCloseNavigation:()=>void}>;
const Provider = AppProvider as RT.ComponentType<{ children: RT.ReactNode }>;
function useRuntime() {
  const [, set] = React.useState(0);
  React.useEffect(() => runtime.subscribe(() => set((n) => n + 1)), []);
}
function saveFile(name: string, data: string) {
  const url = URL.createObjectURL(
    new Blob([data], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function RemoteSettings() {
  const {state,update,run}=useApp() as {state:State;update:(fn:(s:State)=>State)=>Promise<void>;run:(fn:()=>Promise<void>)=>void};
  const [learning,setLearning]=React.useState<"next"|"previous"|null>(null);
  const [message,setMessage]=React.useState("");
  React.useEffect(()=>{
    if(!learning)return;
    const timer=setTimeout(()=>{setLearning(null);setMessage(translateUI("No keyboard key received. Check tablet pairing and keyboard mode; volume and camera buttons may be intercepted by the tablet."));},15000);
    const pressed=(event:KeyboardEvent)=>{
      if(event.key==="Escape"){setLearning(null);return;}
      event.preventDefault();event.stopPropagation();
      if(event.repeat||event.ctrlKey||event.altKey||event.metaKey||event.shiftKey||!learnableKey(event.key)){setMessage(translateUI("Choose a plain keyboard key other than Tab or Escape."));return;}
      const other=learning==="next"?"previous":"next";
      if(state.settings.remoteKeys?.[other]===event.key){setMessage(translateUI("Use a different key for each direction."));return;}
      setLearning(null);setMessage(translateUI("Saving remote key…"));
      run(async()=>{await update(s=>({...s,settings:{...s.settings,remoteKeys:{...s.settings.remoteKeys,[learning]:event.key}}}));setMessage(translateUI("Saved {arg0} for {arg1}.", {arg0: event.key===" "?translateUI("Space"):event.key, arg1: getLanguage() === "en" ? learning : uiLabel(learning!)}));});
    };
    document.addEventListener("keydown",pressed,true);
    return()=>{clearTimeout(timer);document.removeEventListener("keydown",pressed,true);};
  },[learning,state.settings.remoteKeys,run,update]);
  return <section className="panel"><h2>{translateUI("Presentation remote")}</h2>
    <p>{translateUI("Pair your Bluetooth remote in tablet settings, or connect a wired keyboard / USB receiver. Keyboard remotes work without an app pairing step.")}</p>
    <p className="muted">{translateUI("Next: right/down arrow, Page Down, Space or Enter. Previous: left/up arrow, Page Up or Backspace. Remote navigation hides controls; touch the slide to show them.")}</p>
    <div className="actions">{(["next","previous"] as const).map(direction=><button key={direction} onClick={()=>{setMessage("");setLearning(direction);}}>{translateUI(direction === "next" ? "Learn next key" : "Learn previous key")}{state.settings.remoteKeys?.[direction]?` · ${state.settings.remoteKeys[direction]===" "?translateUI("Space"):state.settings.remoteKeys[direction]}`:""}</button>)}
      <button onClick={()=>run(async()=>{await update(s=>({...s,settings:{...s.settings,remoteKeys:{}}}));setMessage(translateUI("Standard keys restored."));})}>{translateUI("Reset remote keys")}</button>
      {learning&&<button onClick={()=>setLearning(null)}>{translateUI("Cancel learning")}</button>}</div>
    <p role="status">{learning?translateUI("Press the remote’s {arg0} button now. Escape cancels.", {arg0: getLanguage() === "en" ? learning : uiLabel(learning!)}):uiText(message)}</p>
  </section>;
}
globalThis.MMB.RemoteSettings=RemoteSettings;
globalThis.MMB.RollingCaptions=RollingCaptions;
function Meetings({onBuild,onOpen}: {onBuild:(template?:Row)=>void;onOpen:(meeting:Row)=>void}) {
  const {state}=useApp() as {state:State};
  const [selected,setSelected]=React.useState<string|null>(null);
  const [openError,setOpenError]=React.useState("");
  const account=runtime.session?.account;
  const rows=state.meetings.filter(meeting=>!account||canReadMeeting(account,meeting));
  const meeting=rows.find(row=>row.id===selected);
  const groups=groupMeetings(rows);
  const newMeeting=()=>onBuild(state.templates.find(template=>template.id===(state.settings.lastTemplateId??state.settings.defaultTemplateId)&&!template.archived&&globalThis.MMB.canUse(template)));
  if(meeting) {
    const editable=(!runtime.hosted||(meeting.account_id===account?.id))&&
      !globalThis.MMB.isMeetingExpired(meeting);
    const topics=meeting.presentedTopics??[];
    return <section className="meeting-record">
      <div className="page-title"><div><h1>{meeting.templateName}</h1><p>{meeting.presenter||translateUI("Presenter not entered")} · {meeting.date}</p></div>
        <div className="actions"><button onClick={()=>setSelected(null)}>{translateUI("Back to Meetings")}</button>
          {editable&&<button className="primary" onClick={async()=>{try{setOpenError("");onOpen(await runtime.claimSavedMeeting(meeting));}catch(error){setOpenError(uiError(error));}}}>{translateUI("Open saved presentation")}</button>}
          <button onClick={()=>globalThis.MMB.exportTranscript(meeting)}>{translateUI("Download meeting notes")}</button></div></div>
      {openError&&<p role="alert">{openError}</p>}
      <div className="panel"><h2>{translateUI("Meeting details")}</h2><dl className="meeting-metadata">
        <dt>{translateUI("Presenter")}</dt><dd>{meeting.presenter||translateUI("Not entered")}</dd><dt>{translateUI("Scheduled date")}</dt><dd>{meeting.date}</dd>
        <dt>{translateUI("Status")}</dt><dd>{meeting.status==="presenting"?translateUI("Paused / in progress"):meeting.status==="completed"?translateUI("Presented"):translateUI("Saved for presentation")}</dd>
        <dt>{translateUI("Meeting area")}</dt><dd>{(globalThis.MMB.locations??[]).find((row:Row)=>row.id===meeting.location_id)?.name??state.device.name}</dd>
        {meeting.startedAt&&<><dt>{translateUI("Started")}</dt><dd>{new Date(meeting.startedAt).toLocaleString(getLocale())}</dd></>}
        {meeting.endedAt&&<><dt>{translateUI("Finished")}</dt><dd>{new Date(meeting.endedAt).toLocaleString(getLocale())}</dd></>}
      </dl></div>
      <div className="panel"><h2>{topics.length?translateUI("Presented topics"):translateUI("Prepared agenda")}</h2>
        {topics.length?<ol>{topics.map((topic:Row)=><li key={topic.slideId}><strong>{topic.title}</strong>
          {(topic.content??[]).length>0&&<span> — {topic.content.map((item:Row)=>item.title).join("; ")}</span>}</li>)}</ol>
          :<ol>{meeting.slides.filter((slide:Row)=>!slide.skipped).map((slide:Row)=><li key={slide.id}>{slide.definition.title}
            {slide.items.length>0&&<span> — {slide.items.map((item:Row)=>item.title).join("; ")}</span>}</li>)}</ol>}
        {meeting.mediaExpiredAt&&<p className="muted">{translateUI("Personal Share Images were removed after completion. Saved topic titles and transcript remain available.")}</p>}
      </div>
      <TranscriptReader key={meeting.id} meeting={meeting} />
    </section>;
  }
  return <section className="meetings-page">
    <div className="page-title"><div><h1>{translateUI("Meetings")}</h1><p>{runtime.hosted&&account?.role==="administrator"?translateUI("All meeting accounts"):translateUI("Your saved meetings and meeting notes")}</p></div>
      <button className="primary" disabled={account?.role==="report_viewer"} onClick={newMeeting}>{translateUI("Build a new meeting")}</button></div>
    {!runtime.hosted&&<p className="muted">{translateUI("Meetings are saved in this browser. Company account history requires the hosted account service.")}</p>}
    {([['Saved for presentation',groups.saved],['Previously presented',groups.presented]] as const).map(([title,list])=><section className="panel" key={title}>
      <h2>{uiText(title)}</h2>{list.length?<div className="meeting-list">{list.map(meeting=><button className="meeting-list-row" key={meeting.id} onClick={()=>setSelected(meeting.id)}>
        <span><strong>{meeting.templateName}</strong><small>{meeting.presenter||translateUI("Presenter not entered")} · {meeting.date}</small></span>
        <span>{meeting.status==="presenting"?translateUI("Paused"):meeting.status==="completed"?translateUI("Presented"):translateUI("Saved")} · {(meeting.transcript??[]).length} {translateUI("transcript phrases")}</span>
      </button>)}</div>:<p className="muted">{title==='Saved for presentation'?translateUI("No saved presentations yet."):translateUI("No presentations logged yet.")}</p>}</section>)}
  </section>;
}
globalThis.MMB.Meetings=Meetings;
function Numeric({
  value,
  onChange,
  fallback = 0,
  min = 0,
  max = 3600,
}: {
  value: number;
  onChange: (n: number) => void;
  fallback?: number;
  min?: number;
  max?: number;
}) {
  const [text, set] = React.useState(String(value));
  return (
    <input
      type="number"
      value={text}
      min={min}
      max={max}
      onFocus={(e) => e.target.select()}
      onChange={(e) => set(e.target.value)}
      onBlur={() => {
        const n = normalizeNumber(text, fallback, min, max);
        set(String(n));
        onChange(n);
      }}
    />
  );
}
function Login() {
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  return <main className="login-page">
    <div className="login-language"><LanguageSelector /></div>
    <section className="login-welcome">
      <span className="eyebrow">DOUGLASS TRUCK BODIES</span>
      <h1>{translateUI("Morning Meeting Builder")}</h1>
      <p>{translateUI("A better day starts together.")}</p>
      <div className="login-topics"><span>{translateUI("Safety")}</span><span>{translateUI("Improvements")}</span><span>{translateUI("Teamwork")}</span></div>
    </section>
    <form className="panel login" onSubmit={async e=>{
      e.preventDefault(); if(busy)return;
      const f=new FormData(e.currentTarget);setBusy(true);setError("");
      try {await runtime.login(String(f.get("username")).trim(),String(f.get("password")),String(f.get("device")||translateUI("Meeting tablet")));}
      catch(e){setError(uiError(e));}finally{setBusy(false);}
    }}>
      <h2>{translateUI("Welcome back")}</h2>
      <p>{translateUI("Sign in with your location or management account.")}</p>
      <label>{translateUI("Username")}<input name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={190} required disabled={busy}/></label>
      <label>{translateUI("Password")}<input name="password" type="password" autoComplete="current-password" required disabled={busy}/></label>
      <details><summary>{translateUI("Device name (optional)")}</summary>
        <label>{translateUI("This device’s name")}<input name="device" defaultValue={translateUI("Meeting tablet")} maxLength={200}/></label>
      </details>
      <button className="primary" disabled={busy}>{translateUI(busy?"Signing in…":"Sign in")}</button>
      <p className="muted">{translateUI("Need an account or password reset? Contact your Morning Meeting Builder administrator.")}</p>
      {(error||runtime.error)&&<p role="alert">{uiError(error||runtime.error)}</p>}
    </form>
  </main>;
}
function AccountSettings() {
  useRuntime();
  const [message,setMessage]=React.useState("");
  const [busy,setBusy]=React.useState(false);
  const account=runtime.session?.account;
  async function perform(fn:()=>Promise<unknown>) {
    setBusy(true);setMessage("");try{await fn();}catch(e){setMessage(uiError(e));}finally{setBusy(false);}
  }
  return <section className="panel account-settings">
    <h2>{translateUI(runtime.hosted?"Your account":"Workspace tools")}</h2>
    {account&&<><p><strong>{account.username}</strong> · {uiLabel(account.role)}{account.location_name?` · ${account.location_name}`:""}</p>
      <p className="muted">{translateUI("Device")}: {runtime.session?.device.name}</p></>}
    <p role="status">{uiText(runtime.status)}{runtime.lastSync?` · ${new Date(runtime.lastSync).toLocaleString(getLocale())}`:""}</p>
    <div className="actions">
      <button disabled={busy} onClick={()=>void perform(()=>runtime.sync())}>{translateUI("Sync Now")}</button>
      <button disabled={busy} onClick={()=>void perform(async()=>setMessage(await runtime.cleanDownloads()))}>{translateUI("Clean old downloads")}</button>
      {(!runtime.hosted||account?.role!=="location")&&<button onClick={()=>window.dispatchEvent(new Event("mmb-open-workspace"))}>{translateUI("Company workspace")}</button>}
    </div>
    {runtime.hosted&&<details className="password-settings"><summary>{translateUI("Change password")}</summary>
      <form onSubmit={e=>{
        e.preventDefault();const form=e.currentTarget;const f=new FormData(form);
        if(f.get("password")!==f.get("confirm")){setMessage(translateUI("Passwords do not match."));return;}
        void perform(async()=>{await runtime.api("auth/password",{current_password:f.get("current"),password:f.get("password")});form.reset();setMessage(translateUI("Password updated. Other devices must sign in again."));});
      }}>
        <label>{translateUI("Current password")}<input type="password" name="current" autoComplete="current-password" required/></label>
        <label>{translateUI("New password")}<input type="password" name="password" autoComplete="new-password" minLength={12} maxLength={72} required/></label>
        <label>{translateUI("Confirm new password")}<input type="password" name="confirm" autoComplete="new-password" minLength={12} maxLength={72} required/></label>
        <button disabled={busy} className="primary">{translateUI("Update password")}</button>
      </form>
    </details>}
    <p role="status">{message}</p>
  </section>;
}
globalThis.MMB.AccountSettings=AccountSettings;
function CheckList({
  rows,
  selected,
  onChange,
  label,
  selectAll = false,
}: {
  rows: Row[];
  selected: string[];
  onChange: (s: string[]) => void;
  label: string;
  selectAll?: boolean;
}) {
  return (
    <fieldset>
      <legend>{label}</legend>
      {selectAll&&<label className="check"><input type="checkbox" checked={rows.length>0&&rows.every(row=>selected.includes(row.id))} onChange={e=>onChange(e.target.checked?rows.map(row=>row.id):[])}/>{translateUI("Select all meeting areas")}</label>}
      {rows.map((r) => (
        <label className="check" key={r.id}>
          <input
            type="checkbox"
            checked={selected.includes(r.id)}
            onChange={(e) =>
              onChange(
                e.target.checked
                  ? [...selected, r.id]
                  : selected.filter((id) => id !== r.id),
              )
            }
          />
          {(r as Row).name ?? (r as Row).username}
        </label>
      ))}
    </fieldset>
  );
}
function RecordDetails({value}: {value: unknown}) {
  if (value === null) return null;
  if (Array.isArray(value)) return <ol className="record-details">{value.map((item,index)=><li key={index}>{typeof item === "object" ? <RecordDetails value={item}/> : String(item)}</li>)}</ol>;
  if (typeof value !== "object") return <span>{String(value)}</span>;
  return <dl className="record-details">{Object.entries(value as Record<string,unknown>).map(([key,item])=><div key={key}><dt>{fieldLabel(key)}</dt><dd>{item !== null && typeof item === "object" ? <RecordDetails value={item}/> : fieldValue(key,item)}</dd></div>)}</dl>;
}
function Table({ rows, onEdit }: { rows: Row[]; onEdit?: (r: Row) => void }) {
  if (!rows.length) return <p>{translateUI("No records in this view.")}</p>;
  const keys = [...new Set(rows.flatMap(Object.keys))].filter(
    (k) => !["payload", "password_hash", "csrf", "organization_id"].includes(k),
  );
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {keys.map((k) => (
              <th scope="col" key={k}>{fieldLabel(k)}</th>
            ))}
            {onEdit && <th scope="col">{translateUI("Action")}</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id ?? i}>
              {keys.map((k) => (
                <td key={k}>
                  {typeof r[k] === "object" ? (
                    <details>
                      <summary>{translateUI("Details")}</summary>
                      <RecordDetails value={r[k]} />
                    </details>
                  ) : (
                    fieldValue(k,r[k])
                  )}
                </td>
              ))}
              {onEdit && (
                <td>
                  <button onClick={() => onEdit(r)}>{translateUI("Manage")}</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Manager({ close }: { close: () => void }) {
  const { state } = useApp() as {
    state: State;
    update: (fn: (s: State) => State) => Promise<State>;
  };
  const [tab, setTab] = React.useState("broadcasts");
  const [rows, setRows] = React.useState<Row[]>([]);
  const [editing, setEditing] = React.useState<Row | null>(null);
  const [error, setError] = React.useState("");
  const [directory, setDirectory] = React.useState<{
    locations: Row[];
    accounts: Row[];
  }>({ locations: [], accounts: [] });
  const [report, setReport] = React.useState("requirements");
  const [filter, setFilter] = React.useState({
    location: "",
    from: "",
    to: "",
  });
  const [preview, setPreview] = React.useState(false);
  const [uploadingAnnouncement,setUploadingAnnouncement]=React.useState(false);
  const [installing,setInstalling]=React.useState(false);
  const admin =
    !runtime.hosted || runtime.session?.account.role === "administrator";
  const manager = admin || runtime.session?.account.role === "content_manager";
  const viewer = runtime.session?.account.role === "report_viewer";
  const load = React.useCallback(async () => {
    try {
      setError("");
      if (runtime.hosted) {
        const dir = await runtime.api("directory");
        setDirectory(dir);
        if (tab === "reports") {
          const params = new URLSearchParams(filter);
          setRows(
            (await runtime.api(`admin/reports/${report}?${params}`)).rows,
          );
        } else if (
          ["accounts", "locations", "devices", "audit", "storage"].includes(tab)
        )
          setRows((await runtime.api(`admin/${tab}`)).rows);
        else if (tab === "readiness")
          setRows(
            Object.entries(await runtime.api("admin/readiness")).map(
              ([k, v]) => ({
                id: k,
                check: fieldLabel(k),
                value: typeof v === "object" ? JSON.stringify(v) : v,
              }),
            ),
          );
        else if (tab === "organization")
          setEditing(await runtime.api("admin/organization"));
        else setRows(await db.all(tab));
      } else {
        setDirectory({
          locations: [{ id: state.device.id, name: state.device.name }],
          accounts: [{ id: "demo", username: "Demo account" }],
        });
        setRows(await db.all(tab === "reports" ? "events" : tab));
      }
    } catch (e) {
      setError(String(e));
    }
  }, [tab, report, JSON.stringify(filter)]);
  React.useEffect(() => {
    void load();
  }, [load]);
  const perform = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      setEditing(null);
      setPreview(false);
      await load();
    } catch (e) {
      setError(String(e));
    }
  };
  const save = async () => {
    if (!editing) return;
    if(uploadingAnnouncement)throw new Error(translateUI("Wait for the image upload to finish."));
    const row = { ...editing };
    if (tab === "broadcasts") {
      if (!row.title?.trim() || !row.content)
        throw new Error(translateUI("Choose a title and content"));
      if(row.announcement){
        if(!admin)throw new Error(translateUI("Only administrators can publish announcements."));
        if(!/^\d{4}-\d{2}-\d{2}$/.test(row.announcementDate??""))throw new Error(translateUI("Choose the announcement date."));
        if(row.allAccounts===false&&!row.accounts?.length)throw new Error(translateUI("Select at least one meeting account, or select all."));
        const zone=runtime.session?.organization.timezone??"America/Los_Angeles";
        row.start=zonedUtc(`${row.announcementDate}T00:00`,zone);
        row.end=new Date(Date.parse(zonedUtc(`${row.announcementDate}T23:59`,zone))+59000).toISOString();
        row.slot="Announcements";row.importance="required";row.recurrence="every";
      }
      await runtime.saveRecord("broadcasts", row);
    } else if (tab === "templates") await runtime.saveRecord("templates", row);
    else if (tab === "items" || tab === "libraries")
      await runtime.saveRecord(tab, row);
    else await runtime.api(`admin/${tab}`, row);
    await runtime.sync();
  };
  const newRow = () => {
    setPreview(false);
    setEditing(
      tab === "broadcasts"
        ? {
            id: crypto.randomUUID(),
            title: "",
            start: new Date().toISOString(),
            end: new Date(Date.now() + 86400000).toISOString(),
            announcement: admin,
            announcementDate: new Intl.DateTimeFormat("en-CA",{timeZone:runtime.session?.organization.timezone??"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date()),
            allAccounts: true, accounts: [],
            importance: admin ? "required" : "suggested",
            recurrence: admin ? "every" : "once",
            slot: "Announcements",
            priority: 0,
            sequence: Date.now(),
            locations: [],
            status: "draft",
            archived: false,
          }
        : tab === "accounts"
          ? {
              id: crypto.randomUUID(),
              username: "",
              category: "location",
              role: "location",
              location_id: directory.locations[0]?.id,
              enabled: true,
              can_create_templates: true,
            }
          : { id: crypto.randomUUID(), name: "", enabled: true },
    );
  };
  const field = (key: string, value: unknown) =>
    setEditing((e) => (e ? { ...e, [key]: value } : null));
  return (
    <div className="v2-overlay">
      <div className="v2-workspace">
        <header>
          <div>
            <span className="eyebrow">{translateUI("COMPANY WORKSPACE")}</span>
            <h1>{translateUI("Manage & report")}</h1>
          </div>
          <div className="actions"><LanguageSelector /><button onClick={close}>{translateUI("Back to meeting builder")}</button></div>
        </header>
        <nav className="tabs">
          {[
            "broadcasts",
            "templates",
            "libraries",
            "items",
            "reports",
            ...(admin
              ? [
                  "accounts",
                  "locations",
                  "devices",
                  "organization",
                  "storage",
                  "audit",
                  "readiness",
                ]
              : []),
          ]
            .filter((t) => !viewer || t === "reports")
            .map((t) => (
              <button
                key={t}
                className={tab === t ? "primary" : ""}
                onClick={() => {
                  setEditing(null);
                  setTab(t);
                }}
              >
                {t === "items" ? translateUI("Content scope") : t === "broadcasts" ? translateUI("Announcements / broadcasts") : uiLabel(t)}
              </button>
            ))}
        </nav>
        <p role="alert">{uiError(error)}</p>
        {tab === "reports" && (
          <div className="toolbar">
            <label>
              {translateUI("Report")}<select aria-label={translateUI("Report")}
                value={report}
                onChange={(e) => setReport(e.target.value)}
              >
                {[
                  "requirements",
                  "broadcasts",
                  "skips",
                  "locations",
                  "usage",
                  "safety",
                  "meetings",
                ].map((t) => (
                  <option key={t} value={t}>{uiLabel(t)}</option>
                ))}
              </select>
            </label>
            <label>
              {translateUI("Location")}<select aria-label={translateUI("Location")}
                value={filter.location}
                onChange={(e) =>
                  setFilter({ ...filter, location: e.target.value })
                }
              >
                <option value="">{translateUI("All locations")}</option>
                {directory.locations.map((l) => (
                  <option value={l.id} key={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {translateUI("From")}<input
                type="date"
                value={filter.from}
                onChange={(e) => setFilter({ ...filter, from: e.target.value })}
              />
            </label>
            <label>
              {translateUI("Through")}<input
                type="date"
                value={filter.to}
                onChange={(e) => setFilter({ ...filter, to: e.target.value })}
              />
            </label>
            <button onClick={() => saveFile(`mmb-${report}.csv`, csv(rows))}>
              {translateUI("Export CSV")}</button>
          </div>
        )}
        {["broadcasts", "accounts", "locations"].includes(tab) && manager && (
          <button className="primary" onClick={newRow}>
            {translateUI(tab === "broadcasts" ? "Create broadcast" : tab === "accounts" ? "Create account" : "Create location")}
          </button>
        )}
        {tab === "templates" && (
          <p>
            {translateUI("Use Templates in the meeting builder to create and edit masters. Manage sharing and named insertion slots here. Company use never grants edit access.")}</p>
        )}
        {tab === "libraries" || tab === "items" ? (
          <p>
            {translateUI("Create content in the existing library screen. Set its location scope here. An empty location selection means company-wide.")}</p>
        ) : null}
        <Table
          rows={rows}
          onEdit={
            tab === "reports" ||
            tab === "audit" ||
            tab === "readiness" ||
            viewer
              ? undefined
              : (r) => {
                  setEditing(structuredClone(r));
                  setPreview(false);
                }
          }
        />
        {admin && runtime.hosted && tab === "templates" && !rows.length && (
          <button disabled={installing}
            onClick={()=>void perform(async()=>{
              setInstalling(true);
              try {
                await runtime.sync();
                const starter=defaults();
                // Libraries precede their content, and templates reference both.
                // Skip completed batches if a prior installation was interrupted.
                for(const kind of ["libraries","items","templates"]) {
                  const existing=new Set((await db.all(kind)).map(row=>row.id));
                  const missing=starter[kind].filter((row:Row)=>!existing.has(row.id));
                  for(let start=0;start<missing.length;start+=50) {
                    const result=await runtime.api("records/batch",{records:missing.slice(start,start+50).map((row:Row)=>({id:row.id,kind,expected_version:0,data:{...row,company_visible:kind==="templates",locations:[]}}))});
                    for(const record of result.records)await db.put(kind,record.id,record.data);
                  }
                }
                await runtime.sync();
              }finally{setInstalling(false);}
            })}
          >
            {translateUI("Install DTB starter libraries and daily template")}</button>
        )}
        {editing && (
          <section className="panel editor">
            <h2>
              {editing.title ?? editing.name ?? editing.username ?? translateUI("Edit")}
            </h2>
            {tab === "broadcasts" && (
              <>
                {admin&&<label className="check"><input type="checkbox" checked={!!editing.announcement} onChange={e=>field("announcement",e.target.checked)}/>{translateUI("Automatic dated announcement after stretches")}</label>}
                {editing.announcement&&<label>{translateUI("Announcement date")}<input type="date" value={editing.announcementDate??""} onChange={e=>field("announcementDate",e.target.value)}/></label>}
                <label>
                  {translateUI("Title")}<input
                    value={editing.title}
                    onChange={(e) => field("title", e.target.value)}
                    required
                  />
                </label>
                {editing.announcement&&<>
                  <label>{translateUI("Upload announcement image")}<FilePicker aria-label={translateUI("Upload announcement image")} accept="image/jpeg,image/png,image/webp" disabled={uploadingAnnouncement} onChange={async e=>{
                    const file=e.target.files?.[0];if(!file)return;setUploadingAnnouncement(true);setError("");
                    try{field("content",{...await globalThis.MMB.announcementImage(file),description:editing.content?.description??""});}catch(error){setError(String(error));}finally{setUploadingAnnouncement(false);}
                  }}/></label>
                  <label>{translateUI("Announcement message")}<textarea value={editing.content?.description??""} onChange={e=>field("content",{...(editing.content??globalThis.MMB.meetingOnly(editing.title||translateUI("Announcement"),"")),type:editing.content?.assetId?"image-text":"text",description:e.target.value})}/></label>
                  {uploadingAnnouncement&&<p role="status">{translateUI("Uploading image…")}</p>}
                  {editing.content?.assetId&&<p>{translateUI("Selected image:") + " "}{editing.content.title}</p>}
                </>}
                <label>
                  {translateUI("Content")}<select aria-label={translateUI("Content")}
                    value={editing.content?.id ?? ""}
                    onChange={(e) =>
                      field(
                        "content",
                        state.items.find((i) => i.id === e.target.value),
                      )
                    }
                  >
                    <option value="">{translateUI("Select content")}</option>
                    {editing.content?.scope==="meeting-only"&&<option value={editing.content.id}>{editing.content.title}</option>}
                    {state.items
                      .filter((i) => !i.archived)
                      .map((i) => (
                        <option value={i.id} key={i.id}>
                          {i.title}
                        </option>
                      ))}
                  </select>
                </label>
                <p>
                  {translateUI("Create text, images, image-and-text, YouTube, or links in Content library first.")}</p>
                {!editing.announcement&&<>
                <div className="form-row">
                  <label>
                    {translateUI("Start (organization timezone)")}<input
                      type="datetime-local"
                      value={localDate(editing.start)}
                      onChange={(e) =>
                        e.target.value &&
                        field(
                          "start",
                          zonedUtc(
                            e.target.value,
                            runtime.session?.organization.timezone ??
                              "America/Los_Angeles",
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    {translateUI("End (inclusive, organization timezone)")}<input
                      type="datetime-local"
                      value={localDate(editing.end)}
                      onChange={(e) =>
                        e.target.value &&
                        field(
                          "end",
                          zonedUtc(
                            e.target.value,
                            runtime.session?.organization.timezone ??
                              "America/Los_Angeles",
                          ),
                        )
                      }
                    />
                  </label>
                </div>
                <p>
                  {translateUI("For one date, use 00:00 through 23:59 on that date. DTB’s organization timezone is America/Los_Angeles; check the browser timezone before scheduling.")}</p>
                <label>
                  {translateUI("Importance")}<select aria-label={translateUI("Importance")}
                    value={editing.importance}
                    onChange={(e) => field("importance", e.target.value)}
                  >
                    {["available", "suggested", "required"].map((v) => (
                      <option key={v} value={v}>{uiLabel(v)}</option>
                    ))}
                  </select>
                </label>
                <label>
                  {translateUI("Frequency")}<select aria-label={translateUI("Frequency")}
                    value={editing.recurrence}
                    onChange={(e) => field("recurrence", e.target.value)}
                  >
                    <option value="once">{translateUI("Once per location")}</option>
                    <option value="every">{translateUI("Every meeting in window")}</option>
                  </select>
                </label>
                <label>
                  {translateUI("Insertion slot")}<input
                    list="slots"
                    value={editing.slot}
                    onChange={(e) => field("slot", e.target.value)}
                  />
                  <datalist id="slots">
                    {[
                      "Announcements",
                      "Safety",
                      "Quality",
                      "Recognition",
                      "Closing",
                    ].map((s) => (
                      <option key={s} value={s}>{uiLabel(s)}</option>
                    ))}
                  </datalist>
                </label>
                </>}
                <label>
                  {translateUI("Priority (higher comes first)")}<Numeric
                    value={editing.priority}
                    onChange={(v) => field("priority", v)}
                    max={1000}
                  />
                </label>
                <label>
                  {translateUI("Publication")}<select
                    aria-label={translateUI("Publication")}
                    value={editing.status}
                    onChange={(e) => {
                      field("status", e.target.value);
                      setPreview(true);
                    }}
                  >
                    <option value="draft">{translateUI("Draft")}</option>
                    <option value="published">{translateUI("Published")}</option>
                  </select>
                </label>
                {editing.announcement?<>
                  <CheckList label="Receiving meeting accounts" selectAll
                    rows={directory.accounts.filter(a=>a.category==="location"||a.id==="demo").map(a=>({...a,name:`${directory.locations.find(l=>l.id===a.location_id)?.name??translateUI("Meeting area")} · ${a.username}`}))}
                    selected={editing.allAccounts!==false?directory.accounts.filter(a=>a.category==="location"||a.id==="demo").map(a=>a.id):editing.accounts??[]}
                    onChange={accounts=>setEditing({...editing,accounts,allAccounts:accounts.length>0&&accounts.length===directory.accounts.filter(a=>a.category==="location"||a.id==="demo").length})}/>
                  <p className="muted">{translateUI("Select all includes future meeting accounts. An empty recipient selection cannot be published. Published announcements appear automatically on the selected day. Sync online before presenting.")}</p>
                </>:<CheckList
                  label="Target locations — none selected means all"
                  rows={directory.locations}
                  selected={editing.locations ?? []}
                  onChange={(v) => field("locations", v)}
                />}
                <button onClick={() => setPreview(!preview)}>
                  {translateUI("Preview schedule and placement")}</button>
                {preview && (
                  <div className="info-note">
                    <p>
                      {editing.title}: {editing.start} {translateUI("to") + " "}{editing.end};{" "}
                      {editing.importance};{" "}
                      {editing.recurrence === "once"
                        ? translateUI("once at each location")
                        : translateUI("every meeting")}
                      .
                    </p>
                    <p>
                      {translateUI("Locations:")}{" "}
                      {directory.locations
                        .filter(
                          (l) =>
                            !editing.locations.length ||
                            editing.locations.includes(l.id),
                        )
                        .map((l) => l.name)
                        .join(", ")}
                    </p>
                    {state.templates.map((t) => (
                      <p key={t.id}>
                        {t.name}:{" "}
                        {t.slides.some(
                          (s: Row) =>
                            (s.slot ?? s.title).toLowerCase() ===
                            editing.slot.toLowerCase(),
                        )
                          ? translateUI("after {arg0}", {arg0: editing.slot})
                          : translateUI("fallback after Introduction — slot missing")}
                      </p>
                    ))}
                  </div>
                )}
              </>
            )}
            {tab === "templates" && (
              <>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={!!editing.company_visible}
                    onChange={(e) => field("company_visible", e.target.checked)}
                  />
                  {translateUI("Company-wide use")}</label>
                <h3>{translateUI("Share use and edit separately")}</h3>
                {[
                  ...directory.accounts.map((a) => ({
                    ...a,
                    accessKind: "account_id",
                  })),
                  ...directory.locations.map((l) => ({
                    ...l,
                    accessKind: "location_id",
                  })),
                ].map((r) => {
                  const a = (editing.access ?? []).find(
                    (a: Row) => a[r.accessKind] === r.id,
                  ) ?? {
                    [r.accessKind]: r.id,
                    can_use: false,
                    can_edit: false,
                  };
                  return (
                    <div className="sharing-row" key={r.accessKind + r.id}>
                      <span>{(r as Row).name ?? (r as Row).username}</span>
                      {["can_use", "can_edit"].map((k) => (
                        <label className="check" key={k}>
                          <input
                            type="checkbox"
                            checked={!!a[k]}
                            onChange={(e) =>
                              field("access", [
                                ...(editing.access ?? []).filter(
                                  (v: Row) => v[r.accessKind] !== r.id,
                                ),
                                { ...a, [k]: e.target.checked },
                              ])
                            }
                          />
                          {k === "can_use" ? translateUI("Use") : translateUI("Edit")}
                        </label>
                      ))}
                    </div>
                  );
                })}
                <h3>{translateUI("Named insertion slots")}</h3>
                {editing.slides.map((s: Row, i: number) => (
                  <label key={s.id}>
                    {s.title}
                    <input
                      value={s.slot ?? ""}
                      placeholder={translateUI("e.g. Safety")}
                      onChange={(e) =>
                        field(
                          "slides",
                          editing.slides.map((x: Row, j: number) =>
                            j === i ? { ...x, slot: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </label>
                ))}
              </>
            )}
            {["libraries", "items"].includes(tab) && (
              <CheckList
                label="Visible at locations — none means company-wide"
                rows={directory.locations}
                selected={editing.locations ?? []}
                onChange={(v) => field("locations", v)}
              />
            )}
            {tab === "accounts" && (
              <>
                <label>
                  {translateUI("Username")}<input
                    value={editing.username}
                    onChange={(e) => field("username", e.target.value)}
                    required
                  />
                </label>
                <label>
                  {translateUI("New password (12+ characters; blank keeps existing)")}<input
                    type="password"
                    autoComplete="new-password"
                    onChange={(e) => field("password", e.target.value)}
                  />
                </label>
                <label>
                  {translateUI("Account type")}<select aria-label={translateUI("Account type")}
                    value={editing.category}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        category: e.target.value,
                        role:
                          e.target.value === "location"
                            ? "location"
                            : "content_manager",
                        location_id:
                          e.target.value === "location"
                            ? directory.locations[0]?.id
                            : undefined,
                      })
                    }
                  >
                    <option value="location">{translateUI("Location account")}</option>
                    <option value="individual">{translateUI("Individual account")}</option>
                  </select>
                </label>
                {editing.category === "location" ? (
                  <label>
                    {translateUI("Fixed location")}<select aria-label={translateUI("Fixed location")}
                      value={editing.location_id}
                      onChange={(e) => field("location_id", e.target.value)}
                    >
                      {directory.locations.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <label>
                    {translateUI("Role")}<select aria-label={translateUI("Role")}
                      value={editing.role}
                      onChange={(e) => field("role", e.target.value)}
                    >
                      {[
                        "administrator",
                        "content_manager",
                        "report_viewer",
                      ].map((r) => (
                        <option key={r} value={r}>{uiLabel(r)}</option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="check">
                  <input
                    type="checkbox"
                    checked={!!editing.can_create_templates}
                    onChange={(e) =>
                      field("can_create_templates", e.target.checked)
                    }
                  />
                  {translateUI("Can create templates")}</label>
              </>
            )}
            {["locations", "devices", "organization"].includes(tab) && (
              <label>
                {translateUI("Name")}<input
                  value={editing.name}
                  onChange={(e) => field("name", e.target.value)}
                />
              </label>
            )}
            {tab === "organization" && (
              <label>
                {translateUI("Timezone")}<input
                  value={editing.timezone}
                  onChange={(e) => field("timezone", e.target.value)}
                />
              </label>
            )}
            {["locations", "accounts"].includes(tab) && (
              <label className="check">
                <input
                  type="checkbox"
                  checked={!!editing.enabled}
                  onChange={(e) => field("enabled", e.target.checked)}
                />
                {translateUI("Enabled")}</label>
            )}
            {tab === "devices" && (
              <label className="check">
                <input
                  type="checkbox"
                  checked={!!editing.revoked}
                  onChange={(e) => field("revoked", e.target.checked)}
                />
                {translateUI("Revoke this device and its sessions")}</label>
            )}
            {["broadcasts", "templates", "items", "libraries"].includes(
              tab,
            ) && (
              <label className="check">
                <input
                  type="checkbox"
                  checked={!!editing.archived}
                  onChange={(e) => field("archived", e.target.checked)}
                />
                {translateUI("Archived (history retained)")}</label>
            )}
            {tab === "storage" ? (
              <>
                <button
                  onClick={() =>
                    perform(() =>
                      runtime.api("admin/storage", {
                        id: editing.id,
                        action: "archive",
                      }),
                    )
                  }
                >
                  {translateUI("Archive image")}</button>
                <button
                  className="danger"
                  onClick={async () =>
                    (await confirmUI(translateUI("Permanently delete this archived image? Historical references will block deletion."))) &&
                    perform(() =>
                      runtime.api("admin/storage", {
                        id: editing.id,
                        action: "delete",
                      }),
                    )
                  }
                >
                  {translateUI("Delete unreferenced image")}</button>
              </>
            ) : (
              <button className="primary" disabled={uploadingAnnouncement || (!!editing.announcement && !admin)} onClick={() => perform(save)}>
                {translateUI("Save")}</button>
            )}
            <button onClick={() => setEditing(null)}>{translateUI("Cancel")}</button>
          </section>
        )}
      </div>
    </div>
  );
}
function localDate(iso: string) {
  return zonedInput(
    iso,
    runtime.session?.organization.timezone ?? "America/Los_Angeles",
  );
}
function _unusedLocalDate(iso: string) {
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
function Workspace() {
  useRuntime();
  const [open, setOpen] = React.useState(false);
  const [navigationOpen,setNavigationOpen]=React.useState(false);
  const closeNavigation=React.useCallback(()=>setNavigationOpen(false),[]);
  React.useEffect(()=>{const query=matchMedia("(max-width:900px)");const resized=()=>{if(!query.matches)setNavigationOpen(false);};query.addEventListener("change",resized);return()=>query.removeEventListener("change",resized);},[]);
  const { state } = useApp() as { state: State };
  const role = runtime.session?.account.role;
  React.useEffect(()=>{
    const open=()=>setOpen(true);window.addEventListener("mmb-open-workspace",open);
    return ()=>window.removeEventListener("mmb-open-workspace",open);
  },[]);
  return (
    <>
      <div className="v2-bar">
        <button className="account-menu-toggle icon-button" aria-label={translateUI("Open navigation")} aria-controls="mmb-navigation" aria-expanded={navigationOpen} onClick={()=>setNavigationOpen(value=>!value)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <div className="account-identity"><strong>{runtime.hosted?runtime.session?.account.username:translateUI("Browser preview")}</strong>
          <span>{runtime.hosted?uiLabel(role??""):translateUI("Local data only")}</span></div>
        {(!runtime.hosted||role!=="location")&&<button onClick={()=>setOpen(true)}>{translateUI("Company workspace")}</button>}
        {runtime.hosted && role !== "location" && (
          <label>
            {translateUI("Meeting location")}<select aria-label={translateUI("Meeting location")}
              value={globalThis.MMB.meetingLocation || globalThis.MMB.location || ""}
              disabled={Boolean(globalThis.MMB.meetingLocation)}
              title={globalThis.MMB.meetingLocation?translateUI("Close the current meeting before choosing another location."):undefined}
              onChange={(e) => { void globalThis.MMB.chooseContentLocation(e.target.value).catch(runtime.reportError); }}
            >
              <option value="">{translateUI("Choose before building")}</option>
              {(globalThis.MMB.locations ?? []).filter((l:Row)=>l.enabled).map((l: Row) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {runtime.hosted && (
          <button className="account-signout"
            onClick={() => runtime.logout().catch(runtime.reportError)}
          >
            {translateUI("Sign out")}</button>
        )}
      </div>
      {runtime.error && <div className="v2-error" role="alert"><span>{uiError(runtime.error)}</span>
        <button className="icon-button" aria-label={translateUI("Dismiss error")} onClick={runtime.clearError}>×</button>
      </div>}
      <Original navigationOpen={navigationOpen} onCloseNavigation={closeNavigation} />
      {open && <Manager close={() => setOpen(false)} />}
      <span className="sr-only">{state.settings.company}</span>
    </>
  );
}
function App() {
  React.useSyncExternalStore(subscribeLanguage, getLanguage, getLanguage);
  useRuntime();
  const [ready, setReady] = React.useState(false);
  const [startupDelayed, setStartupDelayed] = React.useState(db.databaseBlocked);
  const [databaseBlocked, setDatabaseBlocked] = React.useState(db.databaseBlocked);
  React.useEffect(() => {
    const timer = window.setTimeout(() => setStartupDelayed(true), 12000);
    const onBlocked = () => {
      setDatabaseBlocked(true);
      setStartupDelayed(true);
    };
    window.addEventListener("mmb-db-blocked", onBlocked);
    if (db.databaseBlocked) onBlocked();
    runtime
      .initialize()
      .then(async () => {
        await runtime.refreshAssets();
        globalThis.MMB.events = await db.all("events");
        globalThis.MMB.locations = await db.all("locations");
        setReady(true);
      })
      .catch((e) => {
        runtime.reportError(e);
        setReady(true);
      })
      .finally(() => window.clearTimeout(timer));
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("mmb-db-blocked", onBlocked);
    };
  }, []);
  if (!ready)
    return (
      <main className="boot">
      <LanguageSelector />
        <h1>{translateUI("Opening your meeting workspace…")}</h1>
        {startupDelayed && (
          <div className="panel" role="alert">
            <p>{databaseBlocked
              ? translateUI("Another Morning Meeting Builder tab is holding an older browser database open. Close other tabs for this site, then try again.")
              : translateUI("Local storage is taking longer than expected. Close any other Morning Meeting Builder tabs, then try again.")}</p>
            <p>{translateUI("Your saved meetings and media will stay on this device. Do not clear site data.")}</p>
            <button className="primary" onClick={() => location.reload()}>{translateUI("Try again")}</button>
          </div>
        )}
      </main>
    );
  if (runtime.hosted && !runtime.session) return <Login />;
  return (
    <>
      <Provider>
        <Workspace />
      </Provider>
    </>
  );
}
(ReactDOM as typeof import("react-dom/client"))
  .createRoot(document.getElementById("root")!)
  .render(<App />);
if (!import.meta.env.DEV && "serviceWorker" in navigator)
  navigator.serviceWorker.register("./sw.js").catch(console.error);
