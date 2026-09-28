import type * as RT from "react";
import {
  React as RecoveredReact,
  ReactDOM,
  AppProvider,
  OriginalApp,
  useApp,
  exportBackup,
} from "../recovered/index-DwifuW9D.js";
import * as runtime from "./runtime";
import * as db from "./db";
import { APP_VERSION, defaults, resetDefaults } from "./defaults";
import { csv, normalizeNumber, zonedInput, zonedUtc } from "./domain";
import type { Row, State } from "./types";
import "../recovered/index-BdPx4Tei.css";
import "./v2.css";
const React = RecoveredReact as typeof RT;
const Original = OriginalApp as RT.ComponentType;
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
  return (
    <main className="boot">
      <form
        className="panel login"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          try {
            await runtime.login(
              String(f.get("username")),
              String(f.get("password")),
              String(f.get("device")),
            );
          } catch (e) {
            setError(String(e));
          }
        }}
      >
        <span className="eyebrow">DOUGLASS TRUCK BODIES</span>
        <h1>Morning Meeting Builder</h1>
        <p>Sign in with your location or management account.</p>
        <label>
          Username
          <input name="username" autoComplete="username" required />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        <label>
          This device’s name
          <input name="device" defaultValue="Meeting tablet" required />
        </label>
        <button className="primary">Sign in</button>
        <p role="alert">{error}</p>
      </form>
    </main>
  );
}
function CheckList({
  rows,
  selected,
  onChange,
  label,
}: {
  rows: Row[];
  selected: string[];
  onChange: (s: string[]) => void;
  label: string;
}) {
  return (
    <fieldset>
      <legend>{label}</legend>
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
function Table({ rows, onEdit }: { rows: Row[]; onEdit?: (r: Row) => void }) {
  if (!rows.length) return <p>No records in this view.</p>;
  const keys = [...new Set(rows.flatMap(Object.keys))].filter(
    (k) => !["payload", "password_hash", "csrf", "organization_id"].includes(k),
  );
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {keys.map((k) => (
              <th key={k}>{k.replaceAll("_", " ")}</th>
            ))}
            {onEdit && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id ?? i}>
              {keys.map((k) => (
                <td key={k}>
                  {typeof r[k] === "object" ? (
                    <details>
                      <summary>Details</summary>
                      <pre>{JSON.stringify(r[k], null, 2)}</pre>
                    </details>
                  ) : (
                    String(r[k] ?? "")
                  )}
                </td>
              ))}
              {onEdit && (
                <td>
                  <button onClick={() => onEdit(r)}>Manage</button>
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
    const row = { ...editing };
    if (tab === "broadcasts") {
      if (!row.title?.trim() || !row.content)
        throw new Error("Choose a title and content");
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
            importance: "suggested",
            recurrence: "once",
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
            <span className="eyebrow">COMPANY WORKSPACE</span>
            <h1>Manage & report</h1>
          </div>
          <button onClick={close}>Back to meeting builder</button>
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
                {t === "items" ? "Content scope" : t}
              </button>
            ))}
        </nav>
        <p role="alert">{error}</p>
        {tab === "reports" && (
          <div className="toolbar">
            <label>
              Report
              <select
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
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label>
              Location
              <select
                value={filter.location}
                onChange={(e) =>
                  setFilter({ ...filter, location: e.target.value })
                }
              >
                <option value="">All locations</option>
                {directory.locations.map((l) => (
                  <option value={l.id} key={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              From
              <input
                type="date"
                value={filter.from}
                onChange={(e) => setFilter({ ...filter, from: e.target.value })}
              />
            </label>
            <label>
              Through
              <input
                type="date"
                value={filter.to}
                onChange={(e) => setFilter({ ...filter, to: e.target.value })}
              />
            </label>
            <button onClick={() => saveFile(`mmb-${report}.csv`, csv(rows))}>
              Export CSV
            </button>
          </div>
        )}
        {["broadcasts", "accounts", "locations"].includes(tab) && manager && (
          <button className="primary" onClick={newRow}>
            Create {tab.slice(0, -1)}
          </button>
        )}
        {tab === "templates" && (
          <p>
            Use Templates in the meeting builder to create and edit masters.
            Manage sharing and named insertion slots here. Company use never
            grants edit access.
          </p>
        )}
        {tab === "libraries" || tab === "items" ? (
          <p>
            Create content in the existing library screen. Set its location
            scope here. An empty location selection means company-wide.
          </p>
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
          <button
            onClick={() =>
              perform(async () => {
                const starter = defaults();
                for (const kind of ["libraries", "items", "templates"])
                  for (const row of starter[kind])
                    await runtime.saveRecord(kind, {
                      ...row,
                      company_visible: kind === "templates",
                      locations: [],
                    });
              })
            }
          >
            Install DTB starter libraries and daily template
          </button>
        )}
        {editing && (
          <section className="panel editor">
            <h2>
              {editing.title ?? editing.name ?? editing.username ?? "Edit"}
            </h2>
            {tab === "broadcasts" && (
              <>
                <label>
                  Title
                  <input
                    value={editing.title}
                    onChange={(e) => field("title", e.target.value)}
                    required
                  />
                </label>
                <label>
                  Content
                  <select
                    value={editing.content?.id ?? ""}
                    onChange={(e) =>
                      field(
                        "content",
                        state.items.find((i) => i.id === e.target.value),
                      )
                    }
                  >
                    <option value="">Select content</option>
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
                  Create text, images, image-and-text, YouTube, or links in
                  Content library first.
                </p>
                <div className="form-row">
                  <label>
                    Start (organization timezone)
                    <input
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
                    End (inclusive, organization timezone)
                    <input
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
                  For one date, use 00:00 through 23:59 on that date. DTB’s
                  organization timezone is America/Los_Angeles; check the
                  browser timezone before scheduling.
                </p>
                <label>
                  Importance
                  <select
                    value={editing.importance}
                    onChange={(e) => field("importance", e.target.value)}
                  >
                    {["available", "suggested", "required"].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Frequency
                  <select
                    value={editing.recurrence}
                    onChange={(e) => field("recurrence", e.target.value)}
                  >
                    <option value="once">Once per location</option>
                    <option value="every">Every meeting in window</option>
                  </select>
                </label>
                <label>
                  Insertion slot
                  <input
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
                      <option key={s}>{s}</option>
                    ))}
                  </datalist>
                </label>
                <label>
                  Priority (higher comes first)
                  <Numeric
                    value={editing.priority}
                    onChange={(v) => field("priority", v)}
                    max={1000}
                  />
                </label>
                <label>
                  Publication
                  <select
                    value={editing.status}
                    onChange={(e) => {
                      field("status", e.target.value);
                      setPreview(true);
                    }}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </label>
                <CheckList
                  label="Target locations — none selected means all"
                  rows={directory.locations}
                  selected={editing.locations ?? []}
                  onChange={(v) => field("locations", v)}
                />
                <button onClick={() => setPreview(!preview)}>
                  Preview schedule and placement
                </button>
                {preview && (
                  <div className="info-note">
                    <p>
                      {editing.title}: {editing.start} to {editing.end};{" "}
                      {editing.importance};{" "}
                      {editing.recurrence === "once"
                        ? "once at each location"
                        : "every meeting"}
                      .
                    </p>
                    <p>
                      Locations:{" "}
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
                          ? `after ${editing.slot}`
                          : "fallback after Introduction — slot missing"}
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
                  Company-wide use
                </label>
                <h3>Share use and edit separately</h3>
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
                          {k === "can_use" ? "Use" : "Edit"}
                        </label>
                      ))}
                    </div>
                  );
                })}
                <h3>Named insertion slots</h3>
                {editing.slides.map((s: Row, i: number) => (
                  <label key={s.id}>
                    {s.title}
                    <input
                      value={s.slot ?? ""}
                      placeholder="e.g. Safety"
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
                  Username
                  <input
                    value={editing.username}
                    onChange={(e) => field("username", e.target.value)}
                    required
                  />
                </label>
                <label>
                  New password (12+ characters; blank keeps existing)
                  <input
                    type="password"
                    autoComplete="new-password"
                    onChange={(e) => field("password", e.target.value)}
                  />
                </label>
                <label>
                  Account type
                  <select
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
                    <option value="location">Location account</option>
                    <option value="individual">Individual account</option>
                  </select>
                </label>
                {editing.category === "location" ? (
                  <label>
                    Fixed location
                    <select
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
                    Role
                    <select
                      value={editing.role}
                      onChange={(e) => field("role", e.target.value)}
                    >
                      {[
                        "administrator",
                        "content_manager",
                        "report_viewer",
                      ].map((r) => (
                        <option key={r}>{r}</option>
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
                  Can create templates
                </label>
              </>
            )}
            {["locations", "devices", "organization"].includes(tab) && (
              <label>
                Name
                <input
                  value={editing.name}
                  onChange={(e) => field("name", e.target.value)}
                />
              </label>
            )}
            {tab === "organization" && (
              <label>
                Timezone
                <input
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
                Enabled
              </label>
            )}
            {tab === "devices" && (
              <label className="check">
                <input
                  type="checkbox"
                  checked={!!editing.revoked}
                  onChange={(e) => field("revoked", e.target.checked)}
                />
                Revoke this device and its sessions
              </label>
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
                Archived (history retained)
              </label>
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
                  Archive image
                </button>
                <button
                  className="danger"
                  onClick={() =>
                    confirm(
                      "Permanently delete this archived image? Historical references will block deletion.",
                    ) &&
                    perform(() =>
                      runtime.api("admin/storage", {
                        id: editing.id,
                        action: "delete",
                      }),
                    )
                  }
                >
                  Delete unreferenced image
                </button>
              </>
            ) : (
              <button className="primary" onClick={() => perform(save)}>
                Save
              </button>
            )}
            <button onClick={() => setEditing(null)}>Cancel</button>
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
  const [error, setError] = React.useState("");
  const { state } = useApp() as { state: State };
  const role = runtime.session?.account.role;
  async function exportLocalData() {
    try {
      const zip = await exportBackup(state);
      const url = URL.createObjectURL(zip);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Morning-Meeting-Backup-${new Date().toISOString().slice(0, 10)}.zip`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      await runtime.repository.save({ ...state, settings: { ...state.settings, lastBackupAt: new Date().toISOString() } });
    } catch (e) { setError(String(e)); }
  }
  async function resetStarterData() {
    if (!confirm("Reset the default libraries, their content, and the default Morning Meeting template to the GitHub version? Content you added to those default libraries will be removed. Custom libraries, custom templates, saved meetings, history, and local media will stay. Export your data first if you want a copy.")) return;
    try {
      await runtime.repository.save(resetDefaults(state));
      location.reload();
    } catch (e) { setError(String(e)); }
  }
  return (
    <>
      <div className="v2-bar">
        <strong>
          {runtime.hosted
            ? (runtime.session?.account.location_name ??
              runtime.session?.account.username)
            : "Demo / Local data only"}
        </strong>
        <span>
          {runtime.hosted ? runtime.status : `Round 3 · v${APP_VERSION}`}
          {runtime.lastSync
            ? " · " + new Date(runtime.lastSync).toLocaleString()
            : ""}
        </span>
        {!runtime.hosted && <>
          <button onClick={exportLocalData}>Export current data</button>
          <button onClick={resetStarterData}>Reset GitHub defaults</button>
        </>}
        <button
          onClick={() => runtime.sync().catch((e) => setError(String(e)))}
        >
          Sync Now
        </button>
        <button onClick={() => setOpen(true)}>Company workspace</button>
        <button
          onClick={() =>
            runtime
              .cleanDownloads()
              .then(setError)
              .catch((e) => setError(String(e)))
          }
        >
          Clean old downloads
        </button>
        {runtime.hosted && role !== "location" && (
          <label>
            Meeting location
            <select
              defaultValue=""
              onChange={(e) => (
                (globalThis.MMB.location = e.target.value),
                db.put("meta", "location", e.target.value)
              )}
            >
              <option value="">Choose before building</option>
              {(globalThis.MMB.locations ?? []).map((l: Row) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {runtime.hosted && (
          <button
            onClick={() => runtime.logout().catch((e) => setError(String(e)))}
          >
            Sign out
          </button>
        )}
      </div>
      {(error || runtime.error) && (
        <p className="v2-error" role="alert">
          {error || runtime.error}
        </p>
      )}
      <Original />
      {open && <Manager close={() => setOpen(false)} />}
      <span className="sr-only">{state.settings.company}</span>
    </>
  );
}
function App() {
  useRuntime();
  const [ready, setReady] = React.useState(false);
  const [error, setError] = React.useState("");
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
        setError(String(e));
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
        <h1>Opening your meeting workspace…</h1>
        {startupDelayed && (
          <div className="panel" role="alert">
            <p>{databaseBlocked
              ? "Another Morning Meeting Builder tab is holding an older browser database open. Close other tabs for this site, then try again."
              : "Local storage is taking longer than expected. Close any other Morning Meeting Builder tabs, then try again."}</p>
            <p>Your saved meetings and media will stay on this device. Do not clear site data.</p>
            <button className="primary" onClick={() => location.reload()}>Try again</button>
          </div>
        )}
      </main>
    );
  if (runtime.hosted && !runtime.session) return <Login />;
  return (
    <>
      {error && <p role="alert">{error}</p>}
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
