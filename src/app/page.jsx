'use client';

import React, { useMemo, useState, useEffect } from "react";
import { Download, Calendar, Plus, Filter, Bell, Building2, Link as LinkIcon, CheckCircle2, XCircle, ExternalLink, ClipboardList, Settings, SlidersHorizontal, Upload, Trash2, ChevronLeft, ChevronRight, ShieldCheck, AlertTriangle } from "lucide-react";

/**
 * TrackOps MVP — Single-file React app (frontend only)
 * ---------------------------------------------------
 * Updates in this version:
 * - Customizable categories (defaults expanded: govcon, product, fundraise, legal, accounting, talent, marketing, sales, partnerships, compliance)
 * - Planner List ↔ Calendar toggle + filter by category
 * - **CUI‑safe mode** (toggle in Settings):
 *    • links‑only posture enforcement (allow‑listed enclave domains)
 *    • title sanitizer & keyword red‑flagging (client‑side)
 *    • prominent banner + badges when enabled
 * - CSV import for opportunities
 * - ICS export (selected / per month)
 *
 * Paste into Next.js (App Router) page or component. Tailwind recommended.
 */

// ---------- Default Categories ----------
const DEFAULT_CATEGORIES = [
  { key: "govcon", label: "GovCon", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { key: "product", label: "Product", color: "bg-green-100 text-green-800 border-green-200" },
  { key: "fundraise", label: "Raise", color: "bg-red-100 text-red-800 border-red-200" },
  { key: "legal", label: "Legal", color: "bg-purple-100 text-purple-800 border-purple-200" },
  { key: "accounting", label: "Accounting", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { key: "talent", label: "Talent", color: "bg-pink-100 text-pink-800 border-pink-200" },
  { key: "marketing", label: "Marketing", color: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200" },
  { key: "sales", label: "Sales", color: "bg-orange-100 text-orange-800 border-orange-200" },
  { key: "partnerships", label: "Partnerships", color: "bg-teal-100 text-teal-800 border-teal-200" },
  { key: "compliance", label: "Compliance", color: "bg-slate-100 text-slate-800 border-slate-200" },
];

// ---------- CUI Safety helpers ----------
const ALLOWED_ENCLAVE_DOMAINS = [
  ".sharepoint.us", ".dps.mil", ".disa.mil", ".af.mil", ".army.mil", ".navy.mil", ".spaceforce.mil", ".azure.us"
];
const CUI_RISK_PATTERNS = [
  /\bCUI\b/i,
  /\bITAR\b|\bEAR\b/i,
  /\bSSEB\b|\bsource selection\b|\bcompetitive range\b/i,
  /\bcost volume\b|\blabor rate(s)?\b|\bwrap rate\b/i,
  /\bBOM\b|\bvendor pricing\b/i,
  /\btest report\b|\bdesign (?:doc|analysis)\b|\bdrawing\b/i,
  /\bIP(?:v4|v6)?\b|\bsubnet\b|\bCIDR\b/i
];
function isAllowedDomain(u){ try{ const { hostname } = new URL(u); return ALLOWED_ENCLAVE_DOMAINS.some(s => hostname.endsWith(s)); } catch { return false; } }
function hasCuiRisk(text){ if(!text) return false; return CUI_RISK_PATTERNS.some(re=> re.test(text)); }
function sanitizeTitleForCui(title){ if(!title) return title; if(hasCuiRisk(title)) return 'CUI – see enclave'; return title.replace(/\b(design|test|cost|rate|BOM)\b/gi,'deliverable'); }

// ---------- Seed Data ----------
const seedOpportunities = [
  { id: "opp-afx-24-1", title: "AFWERX Open Topic SBIR 24.4", agency: "USAF", source: "AFWERX", topic: "Open Topic", naics: ["541715","541330"], keywords: ["SBIR","AFWERX","Phase I","Dual-use"], url: "https://afwerx.com/opportunities", due: inDays(30), tags: ["SBIR","Air Force"] },
  { id: "opp-dsip-ota-ai", title: "DoD xTech OTA: AI/ML Sensor Fusion", agency: "DoD", source: "DSIP", topic: "AI/ML", naics: ["541715"], keywords: ["OTA","sensor","fusion","ML"], url: "https://www.dodinnovations.mil/", due: inDays(18), tags: ["OTA","Prototype"] },
  { id: "opp-sam-sda-sdaops", title: "SAM.gov: SDA Space Domain Awareness Demo", agency: "Space Force", source: "SAM", topic: "Space Domain Awareness", naics: ["334220","517410"], keywords: ["SDA","space","tracking","telemetry"], url: "https://sam.gov/", due: inDays(9), tags: ["SDA","Space"] },
  { id: "opp-other-ato", title: "ATO Fast Track Pilot (Beta)", agency: "USAF", source: "Other", topic: "ATO", naics: ["541519"], keywords: ["ATO","RMF","IL6"], url: "https://example.com/ato", due: inDays(45), tags: ["ATO","Security"] },
];

const seedDeadlines = [
  { id: "dl-1", title: "SBIR 24.4 whitepaper", date: inDays(12), category: "govcon", source: "AFWERX", url: "https://afwerx.com/opportunities", tags: ["SBIR","whitepaper"], reminders: [-7,-1] },
  { id: "dl-2", title: "SDA demo deck v1", date: inDays(6), category: "product", source: "Internal", tags: ["SDA","deck"], reminders: [-3,-1] },
  { id: "dl-3", title: "Investor update email", date: inDays(21), category: "fundraise", source: "Internal", tags: ["raise","update"], reminders: [-2] },
];

// ---------- Utilities ----------
function inDays(n){ const d=new Date(); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); }
function prettyDate(iso){ const d=new Date(iso+"T00:00:00"); return d.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"}); }
function daysUntil(iso){ const now=new Date(); const d=new Date(iso+"T00:00:00"); return Math.ceil((d-now)/86400000); }
function groupByMonth(deadlines){ const groups={}; for(const dl of deadlines){ const key=new Date(dl.date+"T00:00:00").toLocaleDateString(undefined,{month:"long",year:"numeric"}); (groups[key] ||= []).push(dl);} return groups; }
function download(filename, text){ const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([text],{type:"text/calendar;charset=utf-8"})); a.download=filename; a.click(); }
function makeUid(){ return Math.random().toString(36).slice(2)+Date.now().toString(36); }
function escapeICS(text){ return (text||"").replace(/\\/g,"\\\\").replace(/\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;"); }
function toICS(deadlines){ const dtstamp=new Date().toISOString().replace(/[-:]/g,"").split(".")[0]+"Z"; const L=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//TrackOps//MVP//EN"]; for(const d of deadlines){ const dt=d.date.replace(/-/g,""); const uid=(d.id||makeUid())+"@trackops"; const sum=`${d.title}${d.category?` [${d.category}]`:''}`; const desc=(d.url?`View: ${d.url}`:"")+(d.tags?.length?`\nTags: ${d.tags.join(', ')}`:""); L.push("BEGIN:VEVENT",`UID:${uid}`,`DTSTAMP:${dtstamp}`,`DTSTART;VALUE=DATE:${dt}`,`DTEND;VALUE=DATE:${dt}`,`SUMMARY:${escapeICS(sum)}`,`DESCRIPTION:${escapeICS(desc)}`,"END:VEVENT"); } L.push("END:VCALENDAR"); return L.join("\r\n"); }
function smartSplit(line){ const out=[]; let cur=""; let inQ=false; for(let i=0;i<line.length;i++){ const ch=line[i]; if(ch==='"') inQ=!inQ; else if(ch==="," && !inQ){ out.push(cur); cur="";} else cur+=ch; } out.push(cur); return out; }
function splitArr(s){ if(!s) return []; return s.split(/\||;|\s*\,\s*/).map(x=>x.trim()).filter(Boolean); }

// ---------- Main App ----------
export default function TrackOpsApp(){
  const [tab, setTab] = useState('dashboard');
  const [company, setCompany] = useState({ name: "Aethero (Demo)", naics: ["541715","334220"], keywords: ["SDA","edge","AI","Kubernetes","uplink"], stage: "Seed", capabilities: "Edge compute for space, ML on orbit, energy‑efficient comms" });
  const [opps, setOpps] = useState(seedOpportunities);
  const [deadlines, setDeadlines] = useState(seedDeadlines);

  // CUI‑safe mode
  const [cuiSafe, setCuiSafe] = useState(false);
  useEffect(()=>{ const saved = localStorage.getItem('trackops:cuiSafe'); if(saved!==null) setCuiSafe(saved==='1'); },[]);
  useEffect(()=>{ localStorage.setItem('trackops:cuiSafe', cuiSafe?'1':'0'); },[cuiSafe]);

  // Categories: defaults + user customizations
  const [customCategories, setCustomCategories] = useState([]); // {key,label,color}
  const allCategories = useMemo(()=>[...DEFAULT_CATEGORIES, ...customCategories], [customCategories]);
  const categoryLabel = (k)=> allCategories.find(c=>c.key===k)?.label ?? k;
  const categoryClass = (k)=> allCategories.find(c=>c.key===k)?.color ?? "bg-gray-100 text-gray-700 border-gray-200";

  // Filters & inputs
  const [filters, setFilters] = useState({ query: "", agency: "", source: "", naics: "", tag: "" });
  const [newDeadline, setNewDeadline] = useState({ title: "", date: "", category: "govcon", url: "", tags: "" });

  // Planner view mode + category filter
  const [plannerMode, setPlannerMode] = useState('list'); // 'list' | 'calendar'
  const [plannerCategory, setPlannerCategory] = useState('all');
  const [calendarYM, setCalendarYM] = useState(() => { const d=new Date(); return { y:d.getFullYear(), m:d.getMonth() }; }); // month index 0-11

  // Slack
  const [slackWebhook, setSlackWebhook] = useState("");
  const [selectedForICS, setSelectedForICS] = useState([]);

  const relevantOpps = useMemo(()=>{
    return opps.filter((o)=>{
      const profileHit = (company.naics?.some(n=>o.naics?.includes(n))||false) || (company.keywords?.some(k=>o.keywords?.map(x=>x.toLowerCase()).includes(k.toLowerCase()))||false);
      const q = filters.query.trim().toLowerCase();
      const qHit = !q || [o.title,o.topic,o.keywords?.join(' ')].join(' ').toLowerCase().includes(q);
      const agencyHit = !filters.agency || o.agency === filters.agency;
      const sourceHit = !filters.source || o.source === filters.source;
      const naicsHit = !filters.naics || (o.naics||[]).includes(filters.naics);
      const tagHit = !filters.tag || (o.tags||[]).includes(filters.tag);
      return profileHit && qHit && agencyHit && sourceHit && naicsHit && tagHit;
    });
  },[opps, company, filters]);

  // Apply planner category filter
  const filteredDeadlines = useMemo(()=>{ return deadlines.filter(d => plannerCategory==='all' || d.category===plannerCategory); },[deadlines, plannerCategory]);

  const upcoming = useMemo(()=>[...deadlines].sort((a,b)=>a.date.localeCompare(b.date)).slice(0,6),[deadlines]);
  const byMonth = useMemo(()=>groupByMonth([...filteredDeadlines].sort((a,b)=>a.date.localeCompare(b.date))),[filteredDeadlines]);

  function warnIfCui(text){ if(hasCuiRisk(text)) alert('CUI‑safe mode: potential CUI keywords found. Title will be sanitized.'); }

  function addFromOpp(o){
    let t = o.title; let url = o.url || '';
    if(cuiSafe){
      warnIfCui(t);
      t = sanitizeTitleForCui(t);
      if(url && !isAllowedDomain(url)) url = '';
    }
    const item = { id: makeUid(), title: t, date: o.due, category: 'govcon', source: o.source, url, tags: o.tags||[], reminders: [-7,-1], fromOpportunityId: o.id };
    setDeadlines(d=>[...d,item]);
  }

  function addCustomDeadline(){
    if (!newDeadline.title || !newDeadline.date) return;
    let { title, url } = newDeadline;
    if(cuiSafe){
      warnIfCui(title);
      title = sanitizeTitleForCui(title);
      if(url && !isAllowedDomain(url)) { url = ''; alert('CUI‑safe mode: URL removed because domain is not on enclave allow‑list.'); }
    }
    const tags = newDeadline.tags?.split(',').map(t=>t.trim()).filter(Boolean);
    setDeadlines(d=>[...d,{ id: makeUid(), title, date: newDeadline.date, category: newDeadline.category, url: url||undefined, tags, reminders: [-7,-1] }]);
    setNewDeadline({ title:"", date:"", category:'govcon', url:"", tags:"" });
  }

  function removeDeadline(id){ setDeadlines(d=>d.filter(x=>x.id!==id)); }
  function exportSelectedICS(ids){ const selected = deadlines.filter(d=>ids.includes(d.id)); if (!selected.length) return; download('trackops-deadlines.ics', toICS(selected)); }
  function slackCurl(webhook, d){ const text = ("Reminder: "+d.title+" due "+prettyDate(d.date)+" ("+categoryLabel(d.category)+"). "+(d.url?d.url:" ")).trim(); const payload = JSON.stringify({ text }); return "curl -X POST -H 'Content-type: application/json' --data '"+ payload.replace(/'/g,"'\\''") +"' "+ (webhook||'https://hooks.slack.com/services/XXXX/XXXX/XXXX'); }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-lg"><ClipboardList className="h-5 w-5"/>TrackOps</div>
          {cuiSafe && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-700"><ShieldCheck className="h-3.5 w-3.5"/> CUI‑safe mode</span>
          )}
          <div className="ml-auto flex items-center gap-3">
            <Building2 className="h-4 w-4 text-slate-500"/>
            <input className="px-2 py-1 rounded-md border border-slate-300 text-sm" value={company.name} onChange={(e)=>setCompany({...company, name: e.target.value})}/>
            <button onClick={()=>setTab('settings')} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm ${'settings'===tab?"bg-slate-900 text-white border-slate-900":"bg-white hover:bg-slate-50 border-slate-300"}`}><Settings className="h-4 w-4"/> Settings</button>
          </div>
        </div>
        {cuiSafe && (
          <div className="bg-amber-50 border-t border-b border-amber-200">
            <div className="max-w-7xl mx-auto px-4 py-2 text-amber-800 text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4"/> No CUI content here. Use links to approved enclave only. Titles are sanitized and non‑enclave URLs are blocked.
            </div>
          </div>
        )}
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="col-span-12 lg:col-span-3 space-y-2">
          <NavButton icon={<ClipboardList className="h-4 w-4"/>} label="Dashboard" active={tab==='dashboard'} onClick={()=>setTab('dashboard')}/>
          <NavButton icon={<Filter className="h-4 w-4"/>} label="Opportunities" active={tab==='opportunities'} onClick={()=>setTab('opportunities')}/>
          <NavButton icon={<Calendar className="h-4 w-4"/>} label="Planner" active={tab==='planner'} onClick={()=>setTab('planner')}/>
          <NavButton icon={<Bell className="h-4 w-4"/>} label="Integrations" active={tab==='integrations'} onClick={()=>setTab('integrations')}/>
          <NavButton icon={<SlidersHorizontal className="h-4 w-4"/>} label="Company Profile" active={tab==='company'} onClick={()=>setTab('company')}/>
          <NavButton icon={<Settings className="h-4 w-4"/>} label="Settings" active={tab==='settings'} onClick={()=>setTab('settings')}/>
        </aside>

        {/* Main */}
        <main className="col-span-12 lg:col-span-9">
          {tab==='dashboard' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <StatCard title="Upcoming (30d)" value={deadlines.filter(d=>daysUntil(d.date)<=30 && daysUntil(d.date)>=0).length}/>
                <StatCard title="Relevant Opps" value={relevantOpps.length}/>
                <StatCard title="Categories Active" value={[...new Set(deadlines.map(d=>d.category))].length}/>
              </div>

              {/* Upcoming Deadlines */}
              <section className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3"><h2 className="font-semibold text-slate-900">Upcoming Deadlines</h2>
                  <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 border-slate-300 text-sm" onClick={()=>{ setSelectedForICS(upcoming.map(u=>u.id)); exportSelectedICS(upcoming.map(u=>u.id)); }}><Download className="h-4 w-4"/>Export .ics</button>
                </div>
                <ul className="divide-y divide-slate-100">
                  {upcoming.map((d)=> (
                    <li key={d.id} className="py-3 flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full border ${categoryClass(d.category)}`}>{categoryLabel(d.category)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 truncate">{d.title}</div>
                        <div className="text-sm text-slate-500 flex items-center gap-2"><Calendar className="h-3.5 w-3.5"/>{prettyDate(d.date)}{d.source && (<span className="inline-flex items-center gap-1 text-slate-400 text-xs">· <LinkIcon className="h-3 w-3"/>{d.source}</span>)}{d.url && (<a className="inline-flex items-center gap-1 text-xs text-blue-700 hover:underline" href={d.url} target="_blank" rel="noreferrer">Open<ExternalLink className="h-3 w-3"/></a>)}</div>
                      </div>
                      <button onClick={()=>removeDeadline(d.id)} className="p-1.5 rounded-md hover:bg-slate-50 text-slate-500"><Trash2 className="h-4 w-4"/></button>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Quick Add */}
              <section className="bg-white rounded-xl border border-slate-200 p-4">
                <h2 className="font-semibold text-slate-900 mb-3">Quick Add</h2>
                <div className="grid md:grid-cols-6 gap-3">
                  <input className="px-3 py-2 rounded-md border border-slate-300 text-sm md:col-span-2" placeholder={cuiSafe?"Generic title (no CUI)":"Title"} value={newDeadline.title} onChange={(e)=>setNewDeadline({...newDeadline, title:e.target.value})}/>
                  <input type="date" className="px-3 py-2 rounded-md border border-slate-300 text-sm" value={newDeadline.date} onChange={(e)=>setNewDeadline({...newDeadline, date:e.target.value})}/>
                  <select className="px-3 py-2 rounded-md border border-slate-300 text-sm" value={newDeadline.category} onChange={(e)=>setNewDeadline({...newDeadline, category:e.target.value})}>{allCategories.map(c=> <option key={c.key} value={c.key}>{c.label}</option>)}</select>
                  <input className="px-3 py-2 rounded-md border border-slate-300 text-sm md:col-span-2" placeholder={cuiSafe?"Enclave link (sharepoint.us, azure.us, .mil)":"URL (optional)"} value={newDeadline.url} onChange={(e)=>setNewDeadline({...newDeadline, url:e.target.value})}/>
                  <input className="px-3 py-2 rounded-md border border-slate-300 text-sm md:col-span-3" placeholder="Tags (comma separated)" value={newDeadline.tags} onChange={(e)=>setNewDeadline({...newDeadline, tags:e.target.value})}/>
                  <button onClick={addCustomDeadline} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-slate-900 text-white border-slate-900 text-sm"><Plus className="h-4 w-4"/>{cuiSafe?"Add (sanitized)":"Add"}</button>
                </div>
              </section>
            </div>
          )}

          {tab==='opportunities' && (
            <section className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <input className="px-3 py-2 rounded-md border border-slate-300 text-sm" placeholder="Search title/topic/keywords…" value={filters.query} onChange={(e)=>setFilters({ ...filters, query: e.target.value })}/>
                  <select className="px-3 py-2 rounded-md border border-slate-300 text-sm" value={filters.agency} onChange={(e)=>setFilters({ ...filters, agency: e.target.value })}><option value="">Any Agency</option>{[...new Set(opps.map(o=>o.agency))].map(a=> <option key={a} value={a}>{a}</option>)}</select>
                  <select className="px-3 py-2 rounded-md border border-slate-300 text-sm" value={filters.source} onChange={(e)=>setFilters({ ...filters, source: e.target.value })}><option value="">Any Source</option>{[...new Set(opps.map(o=>o.source))].map(s=> <option key={s} value={s}>{s}</option>)}</select>
                  <select className="px-3 py-2 rounded-md border border-slate-300 text-sm" value={filters.naics} onChange={(e)=>setFilters({ ...filters, naics: e.target.value })}><option value="">Any NAICS</option>{[...new Set(opps.flatMap(o=>o.naics||[]))].map(n=> <option key={n} value={n}>{n}</option>)}</select>
                  <select className="px-3 py-2 rounded-md border border-slate-300 text-sm" value={filters.tag} onChange={(e)=>setFilters({ ...filters, tag: e.target.value })}><option value="">Any Tag</option>{[...new Set(opps.flatMap(o=>o.tags||[]))].map(t=> <option key={t} value={t}>{t}</option>)}</select>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200"><tr className="text-slate-600"><th className="text-left px-4 py-2 font-semibold">Title</th><th className="text-left px-4 py-2 font-semibold">Agency</th><th className="text-left px-4 py-2 font-semibold">Source</th><th className="text-left px-4 py-2 font-semibold">Due</th><th className="text-left px-4 py-2 font-semibold">NAICS</th><th className="text-left px-4 py-2 font-semibold">Tags</th><th className="text-left px-4 py-2 font-semibold">Action</th></tr></thead>
                  <tbody>
                    {relevantOpps.map((o)=> (
                      <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-2"><div className="font-medium text-slate-900 flex items-center gap-2">{o.url? (<a href={o.url} target="_blank" rel="noreferrer" className="hover:underline">{o.title}</a>): o.title}{o.url && (<a href={o.url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-600"><ExternalLink className="h-4 w-4"/></a>)}</div>{o.topic && <div className="text-xs text-slate-500">{o.topic}</div>}</td>
                        <td className="px-4 py-2">{o.agency}</td>
                        <td className="px-4 py-2">{o.source}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{prettyDate(o.due)} <span className="text-xs text-slate-400">({daysUntil(o.due)}d)</span></td>
                        <td className="px-4 py-2">{o.naics?.join(", ")}</td>
                        <td className="px-4 py-2"><div className="flex flex-wrap gap-1">{(o.tags||[]).map(t=> <span key={t} className="px-2 py-0.5 rounded-full border border-slate-200 text-xs bg-slate-50">{t}</span>)}</div></td>
                        <td className="px-4 py-2"><button onClick={()=>addFromOpp(o)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 border-slate-300 text-sm"><Plus className="h-4 w-4"/>{cuiSafe? 'Add (sanitized)':'Add to Deadlines'}</button></td>
                      </tr>
                    ))}

                    {relevantOpps.length===0 && (<tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No matches. Try clearing filters or updating Company Profile keywords.</td></tr>)}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab==='planner' && (
            <section className="space-y-4">
              {/* Planner controls: view + category filter */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 flex-wrap">
                <div className="text-sm text-slate-600">View:</div>
                <div className="inline-flex rounded-md border border-slate-300 overflow-hidden">
                  <button className={`px-3 py-1.5 text-sm ${plannerMode==='list'? 'bg-slate-900 text-white':'bg-white hover:bg-slate-50'}`} onClick={()=>setPlannerMode('list')}>List</button>
                  <button className={`px-3 py-1.5 text-sm ${plannerMode==='calendar'? 'bg-slate-900 text-white':'bg-white hover:bg-slate-50'}`} onClick={()=>setPlannerMode('calendar')}>Calendar</button>
                </div>
                <div className="text-sm text-slate-600 ml-2">Category:</div>
                <select className="px-3 py-1.5 rounded-md border border-slate-300 text-sm" value={plannerCategory} onChange={(e)=>setPlannerCategory(e.target.value)}>
                  <option value="all">All</option>
                  {allCategories.map(c=> <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>

              {plannerMode==='list' && (
                <>
                  {Object.entries(byMonth).map(([month, items])=> (
                    <div key={month} className="bg-white rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between mb-3"><h2 className="font-semibold text-slate-900">{month}</h2>
                        <button onClick={()=>exportSelectedICS(items.map(i=>i.id))} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 border-slate-300 text-sm"><Download className="h-4 w-4"/>Export .ics</button>
                      </div>
                      <ul className="divide-y divide-slate-100">
                        {items.map(d=> (
                          <li key={d.id} className="py-3 flex items-center gap-3">
                            <input type="checkbox" className="h-4 w-4" checked={selectedForICS.includes(d.id)} onChange={(e)=> setSelectedForICS(prev=> e.target.checked ? [...prev,d.id] : prev.filter(x=>x!==d.id)) }/>
                            <span className={`text-xs px-2 py-1 rounded-full border ${categoryClass(d.category)}`}>{categoryLabel(d.category)}</span>
                            <div className="flex-1 min-w-0"><div className="font-medium text-slate-900 truncate">{d.title}</div><div className="text-sm text-slate-500 flex items-center gap-2"><Calendar className="h-3.5 w-3.5"/>{prettyDate(d.date)}{d.url && (<a className="inline-flex items-center gap-1 text-xs text-blue-700 hover:underline" href={d.url} target="_blank" rel="noreferrer">Open<ExternalLink className="h-3 w-3"/></a>)}</div></div>
                            <button onClick={()=>removeDeadline(d.id)} className="p-1.5 rounded-md hover:bg-slate-50 text-slate-500"><Trash2 className="h-4 w-4"/></button>
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
                      <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-slate-900 text-white border-slate-900 text-sm" onClick={()=>exportSelectedICS(selectedForICS)}><Download className="h-4 w-4"/>Export .ics</button>
                    </div>
                  </div>
                </>
              )}

              {plannerMode==='calendar' && (
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <button className="px-2 py-1 rounded-md border bg-white hover:bg-slate-50 border-slate-300" onClick={()=>setCalendarYM(({y,m})=> (m===0? {y:y-1,m:11}:{y,m:m-1}))}><ChevronLeft className="h-4 w-4"/></button>
                    <div className="font-semibold">{new Date(calendarYM.y, calendarYM.m, 1).toLocaleDateString(undefined,{month:'long', year:'numeric'})}</div>
                    <button className="px-2 py-1 rounded-md border bg-white hover:bg-slate-50 border-slate-300" onClick={()=>setCalendarYM(({y,m})=> (m===11? {y:y+1,m:0}:{y,m:m+1}))}><ChevronRight className="h-4 w-4"/></button>
                  </div>
                  <CalendarMonth year={calendarYM.y} monthIndex={calendarYM.m} deadlines={filteredDeadlines} categoryClass={categoryClass} categoryLabel={categoryLabel}/>
                </div>
              )}
            </section>
          )}

          {tab==='integrations' && (
            <section className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h2 className="font-semibold text-slate-900 mb-3">Slack (v1)</h2>
                <p className="text-sm text-slate-600 mb-3">Use an <b>Incoming Webhook</b> for reminders. Paste your webhook and copy the generated cURL for any deadline. {cuiSafe && <span className="text-amber-700">(CUI‑safe mode: messages use sanitized titles and allow‑listed links only.)</span>}</p>
                <div className="flex items-center gap-2 mb-3"><input className="px-3 py-2 rounded-md border border-slate-300 text-sm flex-1" placeholder="https://hooks.slack.com/services/..." value={slackWebhook} onChange={(e)=>setSlackWebhook(e.target.value)}/></div>
                <div className="text-xs text-slate-500 mb-4">Tip: Slack → Create app → Incoming Webhooks → Activate → Add Webhook to Workspace.</div>
                <div className="border rounded-lg divide-y">{deadlines.slice(0,5).map(d=> (
                  <details key={d.id} className="p-3"><summary className="cursor-pointer text-sm flex items-center gap-2"><Bell className="h-4 w-4"/>{d.title} · {prettyDate(d.date)}</summary>
                    <pre className="bg-slate-50 p-3 rounded-md mt-2 overflow-x-auto text-xs">{slackCurl(slackWebhook, d)}</pre></details>
                ))}</div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h2 className="font-semibold text-slate-900 mb-3">Project Tools (stubs)</h2>
                <div className="grid md:grid-cols-3 gap-3"><ToolStub name="Asana" status="Planned"/><ToolStub name="Jira" status="Planned"/><ToolStub name="GitLab" status="Planned"/></div>
                <p className="text-sm text-slate-500 mt-3">These will use OAuth + webhooks to create tasks automatically when you add an opportunity to deadlines.</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h2 className="font-semibold text-slate-900 mb-3">Calendar</h2>
                <p className="text-sm text-slate-600 mb-2">Export <code>.ics</code> from Planner (selected or month). Calendar view is interactive above; live feeds come later via API.</p>
              </div>
            </section>
          )}

          {tab==='company' && (
            <section className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h2 className="font-semibold text-slate-900 mb-3">Company Profile</h2>
                <div className="grid md:grid-cols-2 gap-3">
                  <label className="text-sm"><div className="text-slate-600 mb-1">Company Name</div><input className="px-3 py-2 rounded-md border border-slate-300 w-full" value={company.name} onChange={(e)=>setCompany({...company, name: e.target.value})}/></label>
                  <label className="text-sm"><div className="text-slate-600 mb-1">Stage</div><select className="px-3 py-2 rounded-md border border-slate-300 w-full" value={company.stage} onChange={(e)=>setCompany({...company, stage: e.target.value})}>{"Pre-seed,Seed,Series A,Series B+".split(",").map(s=> <option key={s} value={s}>{s}</option>)}</select></label>
                  <label className="text-sm md:col-span-2"><div className="text-slate-600 mb-1">Capabilities</div><textarea className="px-3 py-2 rounded-md border border-slate-300 w-full" rows={3} value={company.capabilities} onChange={(e)=>setCompany({...company, capabilities: e.target.value})}/></label>
                  <label className="text-sm"><div className="text-slate-600 mb-1">NAICS (comma separated)</div><input className="px-3 py-2 rounded-md border border-slate-300 w-full" value={company.naics.join(", ")} onChange={(e)=>setCompany({...company, naics: e.target.value.split(",").map(x=>x.trim()).filter(Boolean) })}/></label>
                  <label className="text-sm"><div className="text-slate-600 mb-1">Keywords (comma separated)</div><input className="px-3 py-2 rounded-md border border-slate-300 w-full" value={company.keywords.join(", ")} onChange={(e)=>setCompany({...company, keywords: e.target.value.split(",").map(x=>x.trim()).filter(Boolean) })}/></label>
                </div>
                <div className="text-sm text-slate-500 mt-2">These drive your recommendations on the Opportunities tab.</div>
              </div>

              {/* Admin Import — Opportunities CSV */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h2 className="font-semibold text-slate-900 mb-3">Admin: Import Opportunities (CSV)</h2>
                <p className="text-sm text-slate-600 mb-3">Paste CSV with columns: <code>title,agency,source,topic,naics,keywords,url,due,tags</code>. Arrays can be pipe or semicolon separated inside a cell.</p>
                <CsvImporter onImport={(rows)=>{ const mapped = rows.map((r,i)=>({ id: `csv-${makeUid()}-${i}`, title:r.title||"", agency:r.agency||"", source:r.source||"Other", topic:r.topic||"", naics: splitArr(r.naics), keywords: splitArr(r.keywords), url:r.url||"", due:r.due||inDays(60), tags: splitArr(r.tags) })); setOpps(prev=>[...mapped, ...prev]); }}/>
              </div>

              {/* Category Manager */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h2 className="font-semibold text-slate-900 mb-3">Categories</h2>
                <p className="text-sm text-slate-600 mb-3">Defaults are built-in. Add custom ones or tweak colors. (Deleting defaults is disabled for now.)</p>
                <CategoryManager all={allCategories} custom={customCategories} onAdd={(cat)=>setCustomCategories(cs=>[...cs,cat])} onRemove={(key)=>setCustomCategories(cs=>cs.filter(c=>c.key!==key))} />
              </div>
            </section>
          )}

          {tab==='settings' && (
            <section className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h2 className="font-semibold text-slate-900 mb-2">Security & Compliance</h2>
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
                  <div>
                    <div className="font-medium text-slate-900">CUI‑safe mode</div>
                    <div className="text-sm text-slate-500">No CUI in app. Titles sanitized, non‑enclave links blocked, banner shown.</div>
                  </div>
                  <label className="inline-flex items-center gap-2">
                    <span className="text-sm text-slate-600">{cuiSafe? 'On':'Off'}</span>
                    <input type="checkbox" className="h-4 w-4" checked={cuiSafe} onChange={(e)=>setCuiSafe(e.target.checked)} />
                  </label>
                </div>
                <div className="text-xs text-slate-500 mt-2">Allow‑listed domains: {ALLOWED_ENCLAVE_DOMAINS.join(', ')}</div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h2 className="font-semibold text-slate-900 mb-2">Look & Feel</h2>
                <p className="text-sm text-slate-600">Nothing here yet — coming soon.</p>
              </div>
            </section>
          )}
        </main>
      </div>

      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">TrackOps MVP · © {new Date().getFullYear()}</footer>
    </div>
  );
}

// ---------- Calendar Month ----------
function CalendarMonth({ year, monthIndex, deadlines, categoryClass, categoryLabel }){
  // Build days for given month
  const first = new Date(year, monthIndex, 1);
  const last = new Date(year, monthIndex + 1, 0);
  const daysInMonth = last.getDate();
  const startWeekday = (first.getDay() + 7) % 7; // 0=Sun

  // Map date -> deadlines
  const map = new Map();
  for (let d of deadlines) {
    const dt = new Date(d.date + 'T00:00:00');
    if (dt.getFullYear() === year && dt.getMonth() === monthIndex) {
      const key = dt.getDate();
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(d);
    }
  }

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-md overflow-hidden">
      {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=> (
        <div key={d} className="bg-slate-50 p-2 text-xs font-semibold text-slate-600">{d}</div>
      ))}
      {cells.map((c, idx)=> (
        <div key={idx} className="bg-white min-h-[90px] p-2 align-top">
          {c && <div className="text-xs font-medium text-slate-600 mb-1">{c}</div>}
          {c && (map.get(c)||[]).slice(0,4).map(ev=> (
            <div key={ev.id} className={`mb-1 text-xs px-2 py-1 rounded border ${categoryClass(ev.category)} truncate`} title={`${ev.title} • ${categoryLabel(ev.category)}`}>
              {ev.title}
            </div>
          ))}
          {c && (map.get(c)||[]).length>4 && (
            <div className="text-[11px] text-slate-500">+{(map.get(c).length-4)} more</div>
          )}
        </div>
      ))}
    </div>
  );
}
// ---------- Sheets (Excel-like) ----------
function makeBlankSheet(rows, cols){
  const data = Array.from({length: rows}, ()=> Array.from({length: cols}, ()=>""));
  return { rows, cols, data };
}
function colLabel(n){
  let s=""; n++; while(n){ const rem=(n-1)%26; s=String.fromCharCode(65+rem)+s; n=Math.floor((n-1)/26);} return s;
}
function SheetsLite({ sheet, setSheet }, setSheet){
  const tableRef = useRef<HTMLTableElement|null>(null);
  const setCell = (r,c,val)=> setSheet((s)=>{ const d=s.data.map((row)=>row.slice()); d[r][c]=val; return {...s, data:d}; });
  const addRow = ()=> setSheet((s)=> ({...s, rows:s.rows+1, data:[...s.data, Array.from({length:s.cols},()=>"")] }));
  const addCol = ()=> setSheet((s)=> ({...s, cols:s.cols+1, data:s.data.map((row)=>[...row,""])}));

  const toCSV = ()=>{
    return sheet.data
      .map(row=> row.map(v=>{
        const needsQuote = v.includes(",") || v.includes("\"") || v.indexOf(String.fromCharCode(10))>-1;
        return needsQuote ? `"${v.split("\"").join("\"\"")}"` : v;
      }).join(","))
      .join(`\n`);
  };
  const exportCSV = ()=> download("trackops-sheet.csv", toCSV());

  const importCSV = (text)=>{
    const lines = text.split(String.fromCharCode(10)).filter(Boolean);
    const parsed = lines.map(line=> smartSplit(line));
    const rows = parsed.length; const cols = Math.max(...parsed.map(r=>r.length));
    const data = Array.from({length: rows}, (_,r)=> Array.from({length: cols}, (_,c)=> (parsed[r][c]||"") ));
    setSheet({ rows, cols, data });
  };

  const onPasteGrid = (e, r, c)=>{
    const text = e.clipboardData?.getData("text") || "";
    if (!text || (text.indexOf(String.fromCharCode(10))===-1 && text.indexOf(String.fromCharCode(9))===-1 && text.indexOf(",")===-1)) return;
    e.preventDefault();
    const rows = text
      .split(String.fromCharCode(10)).filter(x=>x.length>0)
      .map(line=> line.split(String.fromCharCode(9)).flatMap(chunk=> chunk.split(",")));
    setSheet((s)=>{
      const d = s.data.map((row)=>row.slice());
      for(let i=0;i<rows.length;i++){
        for(let j=0;j<rows[i].length;j++){
          const rr=r+i, cc=c+j;
          if(rr<s.rows && cc<s.cols) d[rr][cc]=rows[i][j];
        }
      }
      return {...s, data:d};
    });
  };

  const moveFocus = (r,c)=>{
    const next = tableRef.current?.querySelector<HTMLInputElement>(`[data-rc="${r}-${c}"]`);
    next?.focus();
  };
  const onKey = (e, r, c)=>{
    if(e.key==="Enter"){ e.preventDefault(); moveFocus(Math.min(r+1, sheet.rows-1), c); }
    if(e.key==="Tab"){ e.preventDefault(); const nextC = e.shiftKey? Math.max(0,c-1): Math.min(sheet.cols-1,c+1); moveFocus(r, nextC); }
    if(e.key==="ArrowDown"){ e.preventDefault(); moveFocus(Math.min(r+1, sheet.rows-1), c); }
    if(e.key==="ArrowUp"){ e.preventDefault(); moveFocus(Math.max(0, r-1), c); }
    if(e.key==="ArrowRight"){ e.preventDefault(); moveFocus(r, Math.min(sheet.cols-1, c+1)); }
    if(e.key==="ArrowLeft"){ e.preventDefault(); moveFocus(r, Math.max(0, c-1)); }
  };
  const onFile = (e)=>{
    const f=e.target.files?.[0]; if(!f) return;
    const reader=new FileReader();
    reader.onload=()=> importCSV(String(reader.result||""));
    reader.readAsText(f); e.target.value="";
  };

  return (
    <section className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2"><TableIcon className="h-5 w-5"/> Sheets</h2>
        <div className="flex items-center gap-2 text-sm">
          <input type="file" accept=".csv" onChange={onFile} className="hidden" id="csvimp"/>
          <label htmlFor="csvimp" className="px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 border-slate-300 cursor-pointer">Import CSV</label>
          <button onClick={exportCSV} className="px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 border-slate-300">Export CSV</button>
          <button onClick={addRow} className="px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 border-slate-300">+ Row</button>
          <button onClick={addCol} className="px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 border-slate-300">+ Col</button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-auto">
        <table ref={tableRef} className="min-w-full text-sm">
          <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="w-10 px-2 py-1 text-slate-400">#</th>
              {Array.from({length: sheet.cols}).map((_,c)=>(<th key={c} className="px-2 py-1 text-slate-600 font-semibold">{colLabel(c)}</th>))}
            </tr>
          </thead>
          <tbody>
            {Array.from({length: sheet.rows}).map((_,r)=>(
              <tr key={r} className="border-b border-slate-100">
                <td className="w-10 px-2 py-1 text-slate-400 bg-slate-50">{r+1}</td>
                {Array.from({length: sheet.cols}).map((_,c)=>(
                  <td key={c} className="px-1 py-0.5">
                    <input
                      data-rc={`${r}-${c}`}
                      className="w-full px-2 py-1 rounded border border-transparent focus:border-slate-300 focus:bg-white bg-slate-50"
                      value={sheet.data[r][c]}
                      onChange={(e)=>setCell(r,c,(e.target).value)}
                      onKeyDown={(e)=>onKey(e,r,c)}
                      onPaste={(e)=>onPasteGrid(e,r,c)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-slate-500">Shortcuts: Enter ↓, Tab → (Shift+Tab ←), Arrow keys navigate. Paste from Excel/Sheets to fill multiple cells.</div>
    </section>
  );
}

// ---------- WBS Editor ----------
const seedWbs = [
  { id: uid(), title: "Proposal", level: 0, owner: "", due: inDays(21) },
  { id: uid(), title: "Capture plan", level: 1, owner: "Chris", due: inDays(20) },
  { id: uid(), title: "Technical Volume", level: 1, owner: "Mina", due: inDays(14) },
  { id: uid(), title: "System architecture", level: 2, owner: "Mina", due: inDays(10) },
  { id: uid(), title: "Cost Volume (sanitized title)", level: 1, owner: "", due: inDays(13) },
  { id: uid(), title: "Submission", level: 0, owner: "", due: inDays(12) },
];

function WBSEditor({ items, setItems }) {  
  function renumber(list){
    const counters = [];
    return list.map(it=>{
      const lvl=it.level||0; counters[lvl]=(counters[lvl]||0)+1; counters.length=lvl+1;
      return {...it, number: counters.slice(0,lvl+1).join(".")};
    });
  }
  const numbered = renumber(items);

  const addSibling = (index)=>{
    const base=items[index]; const newItem = { id: uid(), title:"New task", level: base.level, owner:"", due: inDays(14) };
    const arr=[...items]; arr.splice(index+1,0,newItem); setItems(arr);
  };
  const addChild = (index)=>{
    const base=items[index]; const newItem = { id: uid(), title:"Sub-task", level: (base.level||0)+1, owner:"", due: inDays(14) };
    const arr=[...items]; arr.splice(index+1,0,newItem); setItems(arr);
  };
  const indent = (index)=> setItems((arr)=> arr.map((it,i)=> i===index? {...it, level: Math.min(5,(it.level||0)+1)}: it));
  const outdent = (index)=> setItems((arr)=> arr.map((it,i)=> i===index? {...it, level: Math.max(0,(it.level||0)-1)}: it));
  const remove = (index)=> setItems((arr)=> arr.filter((_,i)=> i!==index));
  const update = (index, patch)=> setItems((arr)=> arr.map((it,i)=> i===index? {...it, ...patch}: it));

  const exportCSV = ()=>{
    const rows = numbered.map(it=> [it.number, " ".repeat((it.level||0)*2)+it.title, it.owner||"", it.due||""]);
    const csv = ["WBS,Task,Owner,Due", ...rows.map(r=> r.map(v=> v.includes(",")?(`"${v.split('"').join('""')}"`):v).join(","))].join(`\n`);
    download("trackops-wbs.csv", csv);
  };

  const onKey = (e, index)=>{
    if(e.key==="Enter"){ e.preventDefault(); addSibling(index); }
    if(e.key==="Tab" && !e.shiftKey){ e.preventDefault(); indent(index); }
    if(e.key==="Tab" && e.shiftKey){ e.preventDefault(); outdent(index); }
    if(e.key==="Backspace" && (e.target).value===""){ e.preventDefault(); remove(index); }
  };

  return (
    <section className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2"><ListTree className="h-5 w-5"/> WBS</h2>
        <div className="flex items-center gap-2 text-sm">
          <button onClick={()=>setItems((items)=>[...items, { id: uid(), title:"New task", level:0, owner:"", due: inDays(14)}])} className="px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 border-slate-300"><Plus className="h-4 w-4"/> Task</button>
          <button onClick={exportCSV} className="px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 border-slate-300"><Download className="h-4 w-4"/> Export CSV</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-slate-600"><th className="text-left px-3 py-2 w-24">WBS</th><th className="text-left px-3 py-2">Task</th><th className="text-left px-3 py-2 w-40">Owner</th><th className="text-left px-3 py-2 w-40">Due</th><th className="px-3 py-2 w-44">Actions</th></tr>
          </thead>
          <tbody>
            {numbered.map((it, idx)=>(
              <tr key={it.id} className="border-b border-slate-100">
                <td className="px-3 py-1 text-slate-500">{it.number}</td>
                <td className="px-3 py-1">
                  <input className="w-full px-2 py-1 rounded border border-slate-300" value={it.title} onKeyDown={(e)=>onKey(e,idx)} onChange={(e)=>update(idx,{title:(e.target).value})} style={{paddingLeft: `${(it.level||0)*16 + 8}px`}}/>
                </td>
                <td className="px-3 py-1"><input className="w-full px-2 py-1 rounded border border-slate-300" value={it.owner||""} onChange={(e)=>update(idx,{owner:(e.target).value})}/></td>
                <td className="px-3 py-1"><input type="date" className="w-full px-2 py-1 rounded border border-slate-300" value={it.due||""} onChange={(e)=>update(idx,{due:(e.target).value})}/></td>
                <td className="px-3 py-1">
                  <div className="flex items-center gap-2">
                    <button onClick={()=>addSibling(idx)} className="px-2 py-1 border rounded">+ Sibling</button>
                    <button onClick={()=>addChild(idx)} className="px-2 py-1 border rounded">+ Child</button>
                    <button onClick={()=>indent(idx)} className="px-2 py-1 border rounded">→</button>
                    <button onClick={()=>outdent(idx)} className="px-2 py-1 border rounded">←</button>
                    <button onClick={()=>remove(idx)} className="px-2 py-1 border rounded text-red-600">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-slate-500">Shortcuts: Enter = new sibling · Tab = indent · Shift+Tab = outdent · Backspace on empty = delete.</div>
    </section>
  );
}

// ---------- Keyboard help overlay ----------
function ShortcutHelp({ onClose }) {
    return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-2xl p-6" onClick={(e)=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="font-semibold text-slate-900 flex items-center gap-2"><Keyboard className="h-5 w-5"/> Keyboard shortcuts</div>
          <button onClick={onClose} className="text-slate-500">Close</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium mb-1">Global</div>
            <ul className="space-y-1 text-slate-700">
              <li><b>?</b> – Toggle this help</li>
              <li><b>g</b> then <b>d/o/p/i/c/s/w</b> – Go to Dashboard/Opportunities/Planner/Integrations/Company/Sheets/WBS</li>
              <li><b>n</b> – Focus Quick Add</li>
              <li><b>/</b> – Focus Opportunities search</li>
            </ul>
          </div>
          <div>
            <div className="font-medium mb-1">Sheets</div>
            <ul className="space-y-1 text-slate-700">
              <li><b>Enter</b> – Move down</li>
              <li><b>Tab/Shift+Tab</b> – Move right/left</li>
              <li><b>Arrows</b> – Navigate cells</li>
              <li><b>Paste</b> – Multi-cell paste from Excel/Sheets/CSV</li>
            </ul>
          </div>
          <div>
            <div className="font-medium mb-1">WBS</div>
            <ul className="space-y-1 text-slate-700">
              <li><b>Enter</b> – New sibling</li>
              <li><b>Tab / Shift+Tab</b> – Indent / Outdent</li>
              <li><b>Backspace</b> (on empty) – Delete row</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
// ---------- Small UI pieces ----------
function NavButton({ icon, label, active, onClick }) { return (<button onClick={onClick} className={`w-full inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm ${active?"bg-slate-900 text-white border-slate-900":"bg-white hover:bg-slate-50 border-slate-300"}`}>{icon}{label}</button>); }
function StatCard({ title, value }) { return (<div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-slate-500 text-sm">{title}</div><div className="text-2xl font-semibold text-slate-900">{value}</div></div>); }
function ToolStub({ name, status }) { const ok = status === 'Connected'; return (<div className="rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between"><div className="font-medium text-slate-900">{name}</div>{ok? <CheckCircle2 className="h-5 w-5 text-green-600"/>: <XCircle className="h-5 w-5 text-slate-300"/>}</div><div className="text-sm text-slate-500 mt-1">{status}</div><button className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 border-slate-300 text-sm"><Upload className="h-4 w-4"/>Connect</button></div>); }
function ToggleSetting({ label, description, enabled }) { return (<div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200"><input type="checkbox" defaultChecked={enabled} className="h-4 w-4 mt-0.5"/><div><div className="font-medium text-slate-900">{label}</div><div className="text-sm text-slate-500">{description}</div></div></div>); }

function CsvImporter({ onImport }) {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState([]);
  function parseCsv(){ const rows=text.split(/\n|\r/).map(r=>r.trim()).filter(Boolean); if(rows.length<2) return setPreview([]); const headers=rows[0].split(",").map(h=>h.trim()); const out=rows.slice(1).map(line=>{ const cols=smartSplit(line); const obj={}; headers.forEach((h,i)=> obj[h]=(cols[i]||"").trim()); return obj; }); setPreview(out); }
  return (
    <div>
      <textarea className="w-full h-40 px-3 py-2 rounded-md border border-slate-300 font-mono text-xs" placeholder={`title,agency,source,topic,naics,keywords,url,due,tags\nAFWERX Open Topic SBIR 25.1,USAF,AFWERX,Open Topic,541715|541330,SBIR|AFWERX|Phase I,https://...,2025-10-01,SBIR|Air Force`} value={text} onChange={(e)=>setText(e.target.value)}/>
      <div className="flex items-center gap-2 mt-2">
        <button onClick={parseCsv} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 border-slate-300 text-sm">Preview</button>
        <button onClick={()=>onImport(preview)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-slate-900 text-white border-slate-900 text-sm">Import {preview.length?`(${preview.length})`:''}</button>
      </div>
      {!!preview.length && (<div className="mt-3 text-xs text-slate-600">Parsed {preview.length} rows. Click Import to add to Opportunities.</div>)}
    </div>
  );
}

function CategoryManager({ all, custom, onAdd, onRemove }) {
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("bg-sky-100 text-sky-800 border-sky-200");

  function slugify(s) {
    return String(s).toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function submit() {
    const key = slugify(label || "");
    if (!key) return;
    if (all.some(c => c.key === key)) {
      alert("Category exists");
      return;
    }
    onAdd({ key, label: label.trim(), color });
    setLabel("");
  }

  // Pretty list of common Tailwind badge palettes
  const colorChoices = [
    "bg-blue-100 text-blue-800 border-blue-200",
    "bg-green-100 text-green-800 border-green-200",
    "bg-red-100 text-red-800 border-red-200",
    "bg-purple-100 text-purple-800 border-purple-200",
    "bg-amber-100 text-amber-800 border-amber-200",
    "bg-pink-100 text-pink-800 border-pink-200",
    "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
    "bg-orange-100 text-orange-800 border-orange-200",
    "bg-teal-100 text-teal-800 border-teal-200",
    "bg-slate-100 text-slate-800 border-slate-200",
    "bg-sky-100 text-sky-800 border-sky-200",
  ];

  // Derive "defaults" = everything in `all` that's not in `custom`
  const customKeys = new Set((custom || []).map(c => c.key));
  const defaultKeys = new Set((all || []).filter(c => !customKeys.has(c.key)).map(c => c.key));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {all.map(c => (
          <span
            key={c.key}
            className={`text-xs px-2 py-1 rounded-full border ${c.color} inline-flex items-center gap-2`}
          >
            {c.label}
            {!defaultKeys.has(c.key) && (
              <button
                onClick={() => onRemove(c.key)}
                className="text-[10px] underline"
                type="button"
              >
                remove
              </button>
            )}
          </span>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-2">
        <input
          className="px-3 py-2 rounded-md border border-slate-300 text-sm"
          placeholder="New category label (e.g., BD)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <select
          className="px-3 py-2 rounded-md border border-slate-300 text-sm"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        >
          {colorChoices.map(c => {
            const name = c.split(" ")[0].replace("bg-", "").replace("-100", "");
            return (
              <option key={c} value={c}>
                {name}
              </option>
            );
          })}
        </select>
        <button
          onClick={submit}
          type="button"
          className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border bg-slate-900 text-white border-slate-900 text-sm"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>
    </div>
  );
}