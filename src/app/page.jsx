'use client'
import React, { useMemo, useState } from "react";
import { Download, Calendar, Plus, Filter, Bell, Building2, Link as LinkIcon, CheckCircle2, XCircle, ExternalLink, ClipboardList, Settings, SlidersHorizontal, Upload, Trash2 } from "lucide-react";

/**
 * TrackOps MVP — Single-file React app (frontend only)
 * ---------------------------------------------------
 * What this gives you today (no backend needed):
 * - Seeded catalog of gov opportunities (AFWERX/DSIP/SAM placeholders)
 * - Relevance filter by NAICS / keywords / agency
 * - Add-to-deadlines flow with color‑coded categories (govcon/product/fundraise)
 * - Upcoming Deadlines dashboard + month-grouped Planner
 * - ICS export (download .ics you can import to Google/Outlook/Apple Calendar)
 * - Slack integration HOW-TO + generated cURL for your webhook (copy/paste)
 * - Company Profile form (drives recommendations)
 *
 * How to use:
 *  - Drop this in a Next.js app under app/page.tsx or pages/index.tsx and it will render.
 *  - Tailwind is assumed. If you don’t have it, this still works but won’t look as nice.
 *  - Replace seed data + TODOs with real API calls once the backend is wired up.
 */

// ---------- Types ----------
const CATEGORIES = [
  { key: "govcon", label: "GovCon", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { key: "product", label: "Product", color: "bg-green-100 text-green-800 border-green-200" },
  { key: "fundraise", label: "Raise", color: "bg-red-100 text-red-800 border-red-200" },
];

const categoryLabel = (k) => CATEGORIES.find((c) => c.key === k)?.label ?? k;
const categoryClass = (k) => CATEGORIES.find((c) => c.key === k)?.color ?? "bg-gray-100 text-gray-700 border-gray-200";

// Opportunity & Deadline shared shape
/** @typedef {{
 *  id: string; title: string; agency: string; source: "AFWERX"|"DSIP"|"SAM"|"Other";
 *  topic?: string; naics?: string[]; keywords?: string[]; url?: string; due: string; tags?: string[];
 * }} Opportunity
 */

/** @typedef {{ id: string; title: string; date: string; category: "govcon"|"product"|"fundraise"; source?: string; url?: string; tags?: string[]; reminders?: number[]; fromOpportunityId?: string; }} Deadline */

// ---------- Seed Data (replace with real ingestion) ----------
const seedOpportunities = /** @type {Opportunity[]} */ ([
  {
    id: "opp-afx-24-1",
    title: "AFWERX Open Topic SBIR 24.4",
    agency: "USAF",
    source: "AFWERX",
    topic: "Open Topic",
    naics: ["541715", "541330"],
    keywords: ["SBIR", "AFWERX", "Phase I", "Dual-use"],
    url: "https://afwerx.com/opportunities",
    due: inDays(30),
    tags: ["SBIR", "Air Force"],
  },
  {
    id: "opp-dsip-ota-ai",
    title: "DoD xTech OTA: AI/ML Sensor Fusion",
    agency: "DoD",
    source: "DSIP",
    topic: "AI/ML",
    naics: ["541715"],
    keywords: ["OTA", "sensor", "fusion", "ML"],
    url: "https://www.dodinnovations.mil/",
    due: inDays(18),
    tags: ["OTA", "Prototype"],
  },
  {
    id: "opp-sam-sda-sdaops",
    title: "SAM.gov: SDA Space Domain Awareness Demo",
    agency: "Space Force",
    source: "SAM",
    topic: "Space Domain Awareness",
    naics: ["334220", "517410"],
    keywords: ["SDA", "space", "tracking", "telemetry"],
    url: "https://sam.gov/",
    due: inDays(9),
    tags: ["SDA", "Space"],
  },
  {
    id: "opp-other-ato",
    title: "ATO Fast Track Pilot (Beta)",
    agency: "USAF",
    source: "Other",
    topic: "ATO",
    naics: ["541519"],
    keywords: ["ATO", "RMF", "IL6"],
    url: "https://example.com/ato",
    due: inDays(45),
    tags: ["ATO", "Security"],
  },
]);

const seedDeadlines = /** @type {Deadline[]} */ ([
  {
    id: "dl-1",
    title: "SBIR 24.4 whitepaper",
    date: inDays(12),
    category: "govcon",
    source: "AFWERX",
    url: "https://afwerx.com/opportunities",
    tags: ["SBIR", "whitepaper"],
    reminders: [-7, -1],
  },
  {
    id: "dl-2",
    title: "SDA demo deck v1",
    date: inDays(6),
    category: "product",
    source: "Internal",
    tags: ["SDA", "deck"],
    reminders: [-3, -1],
  },
  {
    id: "dl-3",
    title: "Investor update email",
    date: inDays(21),
    category: "fundraise",
    source: "Internal",
    tags: ["raise", "update"],
    reminders: [-2],
  },
]);

// ---------- Utilities ----------
function inDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function prettyDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function daysUntil(iso) {
  const now = new Date();
  const d = new Date(iso + "T00:00:00");
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function groupByMonth(deadlines) {
  const groups = {};
  for (const dl of deadlines) {
    const key = new Date(dl.date + "T00:00:00").toLocaleDateString(undefined, { month: "long", year: "numeric" });
    groups[key] = groups[key] || [];
    groups[key].push(dl);
  }
  return groups;
}

function download(filename, text) {
  const element = document.createElement("a");
  const file = new Blob([text], { type: "text/calendar;charset=utf-8" });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

function makeUid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ICS generator (very simple, all-day events)
function toICS(deadlines) {
  const dtstamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TrackOps//MVP//EN",
  ];
  for (const d of deadlines) {
    const dt = d.date.replace(/-/g, "");
    const uid = (d.id || makeUid()) + "@trackops";
    const summary = `${d.title}${d.category ? " [" + categoryLabel(d.category) + "]" : ""}`;
    const desc = (d.url ? `View: ${d.url}` : "") + (d.tags?.length ? `\nTags: ${d.tags.join(", ")}` : "");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${dt}`,
      `DTEND;VALUE=DATE:${dt}`,
      `SUMMARY:${escapeICS(summary)}`,
      `DESCRIPTION:${escapeICS(desc)}`,
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function escapeICS(text) {
  return (text || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

// ---------- Main App ----------
export default function TrackOpsApp() {
  const [tab, setTab] = useState("dashboard");
  const [company, setCompany] = useState({
    name: "Aethero (Demo)",
    naics: ["541715", "334220"],
    keywords: ["SDA", "edge", "AI", "Kubernetes", "uplink"],
    stage: "Seed",
    capabilities: "Edge compute for space, ML on orbit, energy‑efficient comms",
  });

  const [opps, setOpps] = useState(seedOpportunities);
  const [deadlines, setDeadlines] = useState(seedDeadlines);

  const [filters, setFilters] = useState({ query: "", agency: "", source: "", naics: "", tag: "" });
  const [newDeadline, setNewDeadline] = useState({ title: "", date: "", category: "govcon", url: "", tags: "" });

  const relevantOpps = useMemo(() => {
    return opps.filter((o) => {
      // match by company profile first
      const profileHit =
        (company.naics?.some((n) => o.naics?.includes(n)) || false) ||
        (company.keywords?.some((k) => o.keywords?.map((x) => x.toLowerCase()).includes(k.toLowerCase())) || false);

      // then apply UI filters
      const q = filters.query.trim().toLowerCase();
      const qHit = !q || [o.title, o.topic, o.keywords?.join(" ")].join(" ").toLowerCase().includes(q);
      const agencyHit = !filters.agency || o.agency === filters.agency;
      const sourceHit = !filters.source || o.source === filters.source;
      const naicsHit = !filters.naics || o.naics?.includes(filters.naics);
      const tagHit = !filters.tag || o.tags?.includes(filters.tag);
      return profileHit && qHit && agencyHit && sourceHit && naicsHit && tagHit;
    });
  }, [opps, company, filters]);

  const upcoming = useMemo(() => {
    return [...deadlines].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);
  }, [deadlines]);

  const byMonth = useMemo(() => groupByMonth([...deadlines].sort((a, b) => a.date.localeCompare(b.date))), [deadlines]);

  function addFromOpp(o) {
    const newItem = /** @type {Deadline} */ ({
      id: makeUid(),
      title: o.title,
      date: o.due,
      category: "govcon",
      source: o.source,
      url: o.url,
      tags: o.tags || [],
      reminders: [-7, -1],
      fromOpportunityId: o.id,
    });
    setDeadlines((d) => [...d, newItem]);
  }

  function addCustomDeadline() {
    if (!newDeadline.title || !newDeadline.date) return;
    const tags = newDeadline.tags
      ?.split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    setDeadlines((d) => [
      ...d,
      { id: makeUid(), title: newDeadline.title, date: newDeadline.date, category: newDeadline.category, url: newDeadline.url || undefined, tags, reminders: [-7, -1] },
    ]);
    setNewDeadline({ title: "", date: "", category: "govcon", url: "", tags: "" });
  }

  function removeDeadline(id) {
    setDeadlines((d) => d.filter((x) => x.id !== id));
  }

  function exportSelectedICS(selectedIds) {
    const selected = deadlines.filter((d) => selectedIds.includes(d.id));
    if (selected.length === 0) return;
    download("trackops-deadlines.ics", toICS(selected));
  }

  // Slack helper — we can’t POST directly here for CORS; generate cURL for user
  function slackCurl(webhook, d) {
    const text = `Reminder: ${d.title} due ${prettyDate(d.date)} (${categoryLabel(d.category)}). ${d.url ? d.url : ""}`.trim();
    const payload = JSON.stringify({ text });
    return `curl -X POST -H 'Content-type: application/json' --data '${payload.replace(/'/g, "'\\''")}' ${webhook}`;
  }

  const [slackWebhook, setSlackWebhook] = useState("");
  const [selectedForICS, setSelectedForICS] = useState([]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-lg">
            <ClipboardList className="h-5 w-5" />
            TrackOps
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Building2 className="h-4 w-4 text-slate-500" />
            <input
              className="px-2 py-1 rounded-md border border-slate-300 text-sm"
              value={company.name}
              onChange={(e) => setCompany({ ...company, name: e.target.value })}
            />
            <button onClick={() => setTab("settings")} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm ${tab === "settings" ? "bg-slate-900 text-white border-slate-900" : "bg-white hover:bg-slate-50 border-slate-300"}`}>
              <Settings className="h-4 w-4" /> Settings
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="col-span-12 lg:col-span-3 space-y-2">
          <NavButton icon={<ClipboardList className="h-4 w-4" />} label="Dashboard" active={tab === "dashboard"} onClick={() => setTab("dashboard")} />
          <NavButton icon={<Filter className="h-4 w-4" />} label="Opportunities" active={tab === "opportunities"} onClick={() => setTab("opportunities")} />
          <NavButton icon={<Calendar className="h-4 w-4" />} label="Planner" active={tab === "planner"} onClick={() => setTab("planner")} />
          <NavButton icon={<Bell className="h-4 w-4" />} label="Integrations" active={tab === "integrations"} onClick={() => setTab("integrations")} />
          <NavButton icon={<SlidersHorizontal className="h-4 w-4" />} label="Company Profile" active={tab === "company"} onClick={() => setTab("company")} />
        </aside>

        {/* Main */}
        <main className="col-span-12 lg:col-span-9">
          {tab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <StatCard title="Upcoming (30d)" value={deadlines.filter((d) => daysUntil(d.date) <= 30 && daysUntil(d.date) >= 0).length} />
                <StatCard title="Relevant Opps" value={relevantOpps.length} />
                <StatCard title="My Projects" value={[...new Set(deadlines.map((d) => d.category))].length} />
              </div>

              <section className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-slate-900">Upcoming Deadlines</h2>
                  <button
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 border-slate-300 text-sm"
                    onClick={() => {
                      setSelectedForICS(upcoming.map((u) => u.id));
                      exportSelectedICS(upcoming.map((u) => u.id));
                    }}
                  >
                    <Download className="h-4 w-4" /> Export .ics
                  </button>
                </div>
                <ul className="divide-y divide-slate-100">
                  {upcoming.map((d) => (
                    <li key={d.id} className="py-3 flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full border ${categoryClass(d.category)}`}>{categoryLabel(d.category)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 truncate">{d.title}</div>
                        <div className="text-sm text-slate-500 flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5" /> {prettyDate(d.date)}
                          {d.source && (
                            <span className="inline-flex items-center gap-1 text-slate-400 text-xs">· <LinkIcon className="h-3 w-3" /> {d.source}</span>
                          )}
                          {d.url && (
                            <a className="inline-flex items-center gap-1 text-xs text-blue-700 hover:underline" href={d.url} target="_blank" rel="noreferrer">
                              Open <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                      <button onClick={() => removeDeadline(d.id)} className="p-1.5 rounded-md hover:bg-slate-50 text-slate-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="bg-white rounded-xl border border-slate-200 p-4">
                <h2 className="font-semibold text-slate-900 mb-3">Quick Add</h2>
                <div className="grid md:grid-cols-5 gap-3">
                  <input className="px-3 py-2 rounded-md border border-slate-300 text-sm md:col-span-2" placeholder="Title" value={newDeadline.title} onChange={(e) => setNewDeadline({ ...newDeadline, title: e.target.value })} />
                  <input type="date" className="px-3 py-2 rounded-md border border-slate-300 text-sm" value={newDeadline.date} onChange={(e) => setNewDeadline({ ...newDeadline, date: e.target.value })} />
                  <select className="px-3 py-2 rounded-md border border-slate-300 text-sm" value={newDeadline.category} onChange={(e) => setNewDeadline({ ...newDeadline, category: e.target.value })}>
                    {CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                  <input className="px-3 py-2 rounded-md border border-slate-300 text-sm md:col-span-2" placeholder="URL (optional)" value={newDeadline.url} onChange={(e) => setNewDeadline({ ...newDeadline, url: e.target.value })} />
                  <input className="px-3 py-2 rounded-md border border-slate-300 text-sm md:col-span-3" placeholder="Tags (comma separated)" value={newDeadline.tags} onChange={(e) => setNewDeadline({ ...newDeadline, tags: e.target.value })} />
                  <button onClick={addCustomDeadline} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-slate-900 text-white border-slate-900 text-sm">
                    <Plus className="h-4 w-4" /> Add
                  </button>
                </div>
              </section>
            </div>
          )}

          {tab === "opportunities" && (
            <section className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <input className="px-3 py-2 rounded-md border border-slate-300 text-sm" placeholder="Search title/topic/keywords…" value={filters.query} onChange={(e) => setFilters({ ...filters, query: e.target.value })} />
                  <select className="px-3 py-2 rounded-md border border-slate-300 text-sm" value={filters.agency} onChange={(e) => setFilters({ ...filters, agency: e.target.value })}>
                    <option value="">Any Agency</option>
                    {[...new Set(opps.map((o) => o.agency))].map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <select className="px-3 py-2 rounded-md border border-slate-300 text-sm" value={filters.source} onChange={(e) => setFilters({ ...filters, source: e.target.value })}>
                    <option value="">Any Source</option>
                    {[...new Set(opps.map((o) => o.source))].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select className="px-3 py-2 rounded-md border border-slate-300 text-sm" value={filters.naics} onChange={(e) => setFilters({ ...filters, naics: e.target.value })}>
                    <option value="">Any NAICS</option>
                    {[...new Set(opps.flatMap((o) => o.naics || []))].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <select className="px-3 py-2 rounded-md border border-slate-300 text-sm" value={filters.tag} onChange={(e) => setFilters({ ...filters, tag: e.target.value })}>
                    <option value="">Any Tag</option>
                    {[...new Set(opps.flatMap((o) => o.tags || []))].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-slate-600">
                      <th className="text-left px-4 py-2 font-semibold">Title</th>
                      <th className="text-left px-4 py-2 font-semibold">Agency</th>
                      <th className="text-left px-4 py-2 font-semibold">Source</th>
                      <th className="text-left px-4 py-2 font-semibold">Due</th>
                      <th className="text-left px-4 py-2 font-semibold">NAICS</th>
                      <th className="text-left px-4 py-2 font-semibold">Tags</th>
                      <th className="text-left px-4 py-2 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relevantOpps.map((o) => (
                      <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-2">
                          <div className="font-medium text-slate-900 flex items-center gap-2">
                            {o.url ? (
                              <a href={o.url} target="_blank" rel="noreferrer" className="hover:underline">
                                {o.title}
                              </a>
                            ) : (
                              o.title
                            )}
                            <a href={o.url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-600"><ExternalLink className="h-4 w-4" /></a>
                          </div>
                          {o.topic && <div className="text-xs text-slate-500">{o.topic}</div>}
                        </td>
                        <td className="px-4 py-2">{o.agency}</td>
                        <td className="px-4 py-2">{o.source}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{prettyDate(o.due)} <span className="text-xs text-slate-400">({daysUntil(o.due)}d)</span></td>
                        <td className="px-4 py-2">{o.naics?.join(", ")}</td>
                        <td className="px-4 py-2">
                          <div className="flex flex-wrap gap-1">
                            {(o.tags || []).map((t) => (
                              <span key={t} className="px-2 py-0.5 rounded-full border border-slate-200 text-xs bg-slate-50">{t}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <button onClick={() => addFromOpp(o)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 border-slate-300 text-sm">
                            <Plus className="h-4 w-4" /> Add to Deadlines
                          </button>
                        </td>
                      </tr>
                    ))}

                    {relevantOpps.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500">No matches. Try clearing filters or updating Company Profile keywords.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab === "planner" && (
            <section className="space-y-4">
              {Object.entries(byMonth).map(([month, items]) => (
                <div key={month} className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-slate-900">{month}</h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => exportSelectedICS(items.map((i) => i.id))}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 border-slate-300 text-sm"
                      >
                        <Download className="h-4 w-4" /> Export .ics
                      </button>
                    </div>
                  </div>

                  <ul className="divide-y divide-slate-100">
                    {items.map((d) => (
                      <li key={d.id} className="py-3 flex items-center gap-3">
                        <input type="checkbox" className="h-4 w-4" checked={selectedForICS.includes(d.id)} onChange={(e) => {
                          setSelectedForICS((prev) => e.target.checked ? [...prev, d.id] : prev.filter((x) => x !== d.id));
                        }} />
                        <span className={`text-xs px-2 py-1 rounded-full border ${categoryClass(d.category)}`}>{categoryLabel(d.category)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-900 truncate">{d.title}</div>
                          <div className="text-sm text-slate-500 flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5" /> {prettyDate(d.date)}
                            {d.url && (
                              <a className="inline-flex items-center gap-1 text-xs text-blue-700 hover:underline" href={d.url} target="_blank" rel="noreferrer">
                                Open <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                        <button onClick={() => removeDeadline(d.id)} className="p-1.5 rounded-md hover:bg-slate-50 text-slate-500"><Trash2 className="h-4 w-4" /></button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">Bulk Export Selected</div>
                    <div className="text-sm text-slate-500">Choose checkboxes above, then export.</div>
                  </div>
                  <button
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-slate-900 text-white border-slate-900 text-sm"
                    onClick={() => exportSelectedICS(selectedForICS)}
                  >
                    <Download className="h-4 w-4" /> Export .ics
                  </button>
                </div>
              </div>
            </section>
          )}

          {tab === "integrations" && (
            <section className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h2 className="font-semibold text-slate-900 mb-3">Slack (v1)</h2>
                <p className="text-sm text-slate-600 mb-3">Use an <b>Incoming Webhook</b> in a Slack app for reminders. Paste your webhook and copy the generated cURL for any deadline.</p>
                <div className="flex items-center gap-2 mb-3">
                  <input className="px-3 py-2 rounded-md border border-slate-300 text-sm flex-1" placeholder="https://hooks.slack.com/services/..." value={slackWebhook} onChange={(e) => setSlackWebhook(e.target.value)} />
                </div>
                <div className="text-xs text-slate-500 mb-4">Tip: In Slack, create a new app → Incoming Webhooks → Activate → Add Webhook to Workspace.</div>
                <div className="border rounded-lg divide-y">
                  {deadlines.slice(0, 5).map((d) => (
                    <details key={d.id} className="p-3">
                      <summary className="cursor-pointer text-sm flex items-center gap-2">
                        <Bell className="h-4 w-4" /> {d.title} · {prettyDate(d.date)}
                      </summary>
                      <pre className="bg-slate-50 p-3 rounded-md mt-2 overflow-x-auto text-xs">{slackCurl(slackWebhook || "https://hooks.slack.com/services/XXXX/XXXX/XXXX", d)}</pre>
                    </details>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h2 className="font-semibold text-slate-900 mb-3">Project Tools (stubs)</h2>
                <div className="grid md:grid-cols-3 gap-3">
                  <ToolStub name="Asana" status="Planned" />
                  <ToolStub name="Jira" status="Planned" />
                  <ToolStub name="GitLab" status="Planned" />
                </div>
                <p className="text-sm text-slate-500 mt-3">These will use OAuth + webhooks to create tasks automatically when you add an opportunity to deadlines.</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h2 className="font-semibold text-slate-900 mb-3">Calendar</h2>
                <p className="text-sm text-slate-600 mb-2">Export <code>.ics</code> from Dashboard/Planner. Import to Google/Outlook/Apple Calendar. Google supports <i>Settings → Import → Select file</i>.</p>
              </div>
            </section>
          )}

          {tab === "company" && (
            <section className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h2 className="font-semibold text-slate-900 mb-3">Company Profile</h2>
                <div className="grid md:grid-cols-2 gap-3">
                  <label className="text-sm">
                    <div className="text-slate-600 mb-1">Company Name</div>
                    <input className="px-3 py-2 rounded-md border border-slate-300 w-full" value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} />
                  </label>
                  <label className="text-sm">
                    <div className="text-slate-600 mb-1">Stage</div>
                    <select className="px-3 py-2 rounded-md border border-slate-300 w-full" value={company.stage} onChange={(e) => setCompany({ ...company, stage: e.target.value })}>
                      {"Pre-seed,Seed,Series A,Series B+".split(",").map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                  <label className="text-sm md:col-span-2">
                    <div className="text-slate-600 mb-1">Capabilities</div>
                    <textarea className="px-3 py-2 rounded-md border border-slate-300 w-full" rows={3} value={company.capabilities} onChange={(e) => setCompany({ ...company, capabilities: e.target.value })} />
                  </label>
                  <label className="text-sm">
                    <div className="text-slate-600 mb-1">NAICS (comma separated)</div>
                    <input className="px-3 py-2 rounded-md border border-slate-300 w-full" value={company.naics.join(", ")} onChange={(e) => setCompany({ ...company, naics: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} />
                  </label>
                  <label className="text-sm">
                    <div className="text-slate-600 mb-1">Keywords (comma separated)</div>
                    <input className="px-3 py-2 rounded-md border border-slate-300 w-full" value={company.keywords.join(", ")} onChange={(e) => setCompany({ ...company, keywords: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} />
                  </label>
                </div>
                <div className="text-sm text-slate-500 mt-2">These drive your recommendations on the Opportunities tab.</div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h2 className="font-semibold text-slate-900 mb-3">Admin: Import Opportunities (CSV)</h2>
                <p className="text-sm text-slate-600 mb-3">Paste CSV with columns: <code>title,agency,source,topic,naics,keywords,url,due,tags</code>. Arrays can be pipe or semicolon separated inside a cell.</p>
                <CsvImporter onImport={(rows) => {
                  const mapped = rows.map((r, i) => ({
                    id: `csv-${makeUid()}-${i}`,
                    title: r.title || "",
                    agency: r.agency || "",
                    source: r.source || "Other",
                    topic: r.topic || "",
                    naics: splitArr(r.naics),
                    keywords: splitArr(r.keywords),
                    url: r.url || "",
                    due: r.due || inDays(60),
                    tags: splitArr(r.tags),
                  }));
                  setOpps((prev) => [...mapped, ...prev]);
                }} />
              </div>
            </section>
          )}

          {tab === "settings" && (
            <section className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h2 className="font-semibold text-slate-900 mb-3">Product Settings</h2>
                <div className="grid md:grid-cols-2 gap-3">
                  <ToggleSetting label="Email Reminders (via Resend)" description="Send 7d/1d reminders to your email." enabled={false} />
                  <ToggleSetting label="Enable Multi-tenant Orgs" description="Invite teammates, assign owners to deadlines." enabled={true} />
                </div>
                <p className="text-sm text-slate-500 mt-3">These are conceptual toggles in the MVP UI. Wire them up after backend is live.</p>
              </div>
            </section>
          )}
        </main>
      </div>

      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">TrackOps MVP · © {new Date().getFullYear()}</footer>
    </div>
  );
}

// ---------- Small UI pieces ----------
function NavButton({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm ${active ? "bg-slate-900 text-white border-slate-900" : "bg-white hover:bg-slate-50 border-slate-300"}`}>
      {icon} {label}
    </button>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-slate-500 text-sm">{title}</div>
      <div className="text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function ToolStub({ name, status }) {
  const ok = status === "Connected";
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <div className="font-medium text-slate-900">{name}</div>
        {ok ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-slate-300" />}
      </div>
      <div className="text-sm text-slate-500 mt-1">{status}</div>
      <button className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 border-slate-300 text-sm">
        <Upload className="h-4 w-4" /> Connect
      </button>
    </div>
  );
}

function ToggleSetting({ label, description, enabled }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200">
      <input type="checkbox" defaultChecked={enabled} className="h-4 w-4 mt-0.5" />
      <div>
        <div className="font-medium text-slate-900">{label}</div>
        <div className="text-sm text-slate-500">{description}</div>
      </div>
    </div>
  );
}

function CsvImporter({ onImport }) {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState([]);

  function parseCsv() {
    const rows = text
      .split(/\n|\r/)
      .map((r) => r.trim())
      .filter(Boolean);
    if (rows.length < 2) return setPreview([]);
    const headers = rows[0].split(",").map((h) => h.trim());
    const out = rows.slice(1).map((line) => {
      const cols = smartSplit(line);
      const obj = {};
      headers.forEach((h, i) => (obj[h] = (cols[i] || "").trim()));
      return obj;
    });
    setPreview(out);
  }

  return (
    <div>
      <textarea className="w-full h-40 px-3 py-2 rounded-md border border-slate-300 font-mono text-xs" placeholder="title,agency,source,topic,naics,keywords,url,due,tags\nAFWERX Open Topic SBIR 25.1,USAF,AFWERX,Open Topic,541715|541330,SBIR|AFWERX|Phase I,https://...,2025-10-01,SBIR|Air Force" value={text} onChange={(e) => setText(e.target.value)} />
      <div className="flex items-center gap-2 mt-2">
        <button onClick={parseCsv} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 border-slate-300 text-sm">
          Preview
        </button>
        <button onClick={() => onImport(preview)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-slate-900 text-white border-slate-900 text-sm">
          Import {preview.length ? `(${preview.length})` : ""}
        </button>
      </div>
      {!!preview.length && (
        <div className="mt-3 text-xs text-slate-600">Parsed {preview.length} rows. Click Import to add to Opportunities.</div>
      )}
    </div>
  );
}

function smartSplit(line) {
  // basic CSV split respecting quotes
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQ = !inQ;
    else if (ch === "," && !inQ) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

function splitArr(s) {
  if (!s) return [];
  // allow pipe/semicolon/comma inside the cell
  return s
    .split(/\||;|\s*\,\s*/)
    .map((x) => x.trim())
    .filter(Boolean);
}
