'use client';

import React, { useMemo, useState, useEffect, useRef } from "react";
import { Download, Calendar, Plus, Filter, Bell, Building2, Link as LinkIcon, CheckCircle2, XCircle, ExternalLink, ClipboardList, Settings, SlidersHorizontal, Upload, Trash2, FileSpreadsheet, FileText, ChevronRight, ChevronDown, IndentIncrease, IndentDecrease, HelpCircle, Star, StarOff } from "lucide-react";

/**
 * TrackOps MVP — App Router client app (JavaScript)
 * -------------------------------------------------
 * Excel-friendly workflows for teams coming from spreadsheets:
 * - CSV **and** XLSX import/export (via dynamic import of 'xlsx' if present)
 * - WBS editor with indent/outdent + keyboard shortcuts
 * - Priorities / Check‑in view (RYG based on due dates + status)
 * - Document tracker with lightweight version history + reviewers (@mentions)
 * - Compliance Matrix & Gov templates (OCI mitigation, SubK plan, End‑Game check)
 * - Split calendar export by category/tag (per‑view .ics)
 * - Global keyboard shortcuts cheat‑sheet (press `?`)
 *
 * NOTE: To enable .xlsx import/export, run:  npm i xlsx
 * If not installed, falls back to CSV.
 */

// ---------- Categories ----------
const CATEGORIES = [
  { key: "govcon", label: "GovCon", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { key: "product", label: "Product", color: "bg-green-100 text-green-800 border-green-200" },
  { key: "fundraise", label: "Raise", color: "bg-red-100 text-red-800 border-red-200" },
];

function categoryLabel(k){ return (CATEGORIES.find(c=>c.key===k)||{}).label || k; }
function categoryClass(k){ return (CATEGORIES.find(c=>c.key===k)||{}).color || "bg-gray-100 text-gray-700 border-gray-200"; }

// ---------- Seed Data ----------
const seedOpportunities = [
  { id: "opp-afx-24-1", title: "AFWERX Open Topic SBIR 24.4", agency: "USAF", source: "AFWERX", topic: "Open Topic", naics: ["541715","541330"], keywords: ["SBIR","AFWERX","Phase I","Dual-use"], url: "https://afwerx.com/opportunities", due: inDays(30), tags: ["SBIR","Air Force"] },
  { id: "opp-dsip-ota-ai", title: "DoD xTech OTA: AI/ML Sensor Fusion", agency: "DoD", source: "DSIP", topic: "AI/ML", naics: ["541715"], keywords: ["OTA","sensor","fusion","ML"], url: "https://www.dodinnovations.mil/", due: inDays(18), tags: ["OTA","Prototype"] },
  { id: "opp-sam-sda-sdaops", title: "SAM.gov: SDA Space Domain Awareness Demo", agency: "Space Force", source: "SAM", topic: "Space Domain Awareness", naics: ["334220","517410"], keywords: ["SDA","space","tracking","telemetry"], url: "https://sam.gov/", due: inDays(9), tags: ["SDA","Space"] },
  { id: "opp-other-ato", title: "ATO Fast Track Pilot (Beta)", agency: "USAF", source: "Other", topic: "ATO", naics: ["541519"], keywords: ["ATO","RMF","IL6"], url: "https://example.com/ato", due: inDays(45), tags: ["ATO","Security"] },
];

const seedDeadlines = [
  { id: "dl-1", title: "SBIR 24.4 whitepaper", date: inDays(12), category: "govcon", source: "AFWERX", url: "https://afwerx.com/opportunities", tags: ["SBIR","whitepaper"], reminders: [-7,-1], priority: "P0", status: "in-progress" },
  { id: "dl-2", title: "SDA demo deck v1", date: inDays(6), category: "product", source: "Internal", tags: ["SDA","deck"], reminders: [-3,-1], priority: "P1", status: "in-progress" },
  { id: "dl-3", title: "Investor update email", date: inDays(21), category: "fundraise", source: "Internal", tags: ["raise","update"], reminders: [-2], priority: "P2", status: "not-started" },
];

const seedWbs = [
  { id: uid(), title: "Proposal", level: 0, owner: "Chris", status: "in-progress", priority: "P0" },
  { id: uid(), title: "└─ Executive summary", level: 1, owner: "Mina", status: "not-started", priority: "P1" },
  { id: uid(), title: "└─ Tech volume", level: 1, owner: "Chris", status: "in-progress", priority: "P0" },
  { id: uid(), title: "└─ Pricing volume", level: 1, owner: "Alex", status: "not-started", priority: "P1" },
];

const seedDocs = [
  { id: uid(), name: "OCI Mitigation Plan", kind: "Plan", owner: "Chris", version: 1, updatedAt: today(), tags: ["OCI"], notes: "Draft", reviewers: ["@Mina"], history: [] },
  { id: uid(), name: "Subcontracting Plan", kind: "Plan", owner: "Alex", version: 3, updatedAt: today(-2), tags: ["SubK"], reviewers: ["@CO","@Legal"], history: [{version:2, updatedAt: today(-10)},{version:1, updatedAt: today(-20)}] },
];

const seedCompliance = [
  { id: uid(), requirement: "Past Performance references compiled", source: "RFP Section L", owner: "Chris", status: "in-progress", due: inDays(10) },
  { id: uid(), requirement: "OCI Mitigation finalized", source: "FAR 9.5", owner: "Legal", status: "open", due: inDays(7) },
  { id: uid(), requirement: "Compliance Matrix complete", source: "RFP C/L/M crosswalk", owner: "PM", status: "open", due: inDays(5) },
];

// ---------- Utilities ----------
function inDays(n){ const d=new Date(); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); }
function today(offsetDays=0){ const d=new Date(); d.setDate(d.getDate()+offsetDays); return d.toISOString().slice(0,10); }
function prettyDate(iso){ if(!iso) return ""; const d=new Date(iso+"T00:00:00"); return d.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"}); }
function daysUntil(iso){ const now=new Date(); const d=new Date(iso+"T00:00:00"); return Math.ceil((d-now)/86400000); }
function groupByMonth(items){ const groups={}; for(const it of items){ const key=new Date(it.date+"T00:00:00").toLocaleDateString(undefined,{month:"long",year:"numeric"}); (groups[key] ||= []).push(it);} return groups; }
function download(filename, text, mime="text/plain;charset=utf-8"){ const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([text],{type:mime})); a.download=filename; a.click(); }
function uid(){ return Math.random().toString(36).slice(2)+Date.now().toString(36); }
function escapeICS(text){ return (text||"").replace(/\\/g,"\\\\").replace(/\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;"); }
function toICS(deadlines){ const dtstamp=new Date().toISOString().replace(/[-:]/g,"").split(".")[0]+"Z"; const L=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//TrackOps//MVP//EN"]; for(const d of deadlines){ const dt=d.date.replace(/-/g,""); const sum=d.title+(d.category?` [${categoryLabel(d.category)}]`:"" ); const desc=(d.url?`View: ${d.url}`:"")+(d.tags?.length?`\nTags: ${d.tags.join(', ')}`:""); L.push("BEGIN:VEVENT",`UID:${d.id}@trackops`,`DTSTAMP:${dtstamp}`,`DTSTART;VALUE=DATE:${dt}`,`DTEND;VALUE=DATE:${dt}`,`SUMMARY:${escapeICS(sum)}`,`DESCRIPTION:${escapeICS(desc)}`,"END:VEVENT"); } L.push("END:VCALENDAR"); return L.join("\r\n"); }

// XLSX helpers (lazy load)
async function tryImportXLSX(){ try{ const mod=await import('xlsx'); return mod; } catch{ return null; } }
async function exportXLSX(rows, sheetName, filename){ if(!rows||!rows.length){ return; } const XLSX=await tryImportXLSX(); if(!XLSX){ // fallback to CSV
  const headers=Object.keys(rows[0]||{}); const csv=[headers.join(","), ...rows.map(r=>headers.map(h=>JSON.stringify(r[h]??"")).join(","))].join("\n");
  download(filename.replace(/\.xlsx$/i,'.csv'), csv, 'text/csv;charset=utf-8'); return; }
  const ws=XLSX.utils.json_to_sheet(rows); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, sheetName); const out=XLSX.write(wb,{bookType:'xlsx',type:'array'}); const blob=new Blob([out],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); }

async function importFileToRows(file){ if(file.name.toLowerCase().endsWith('.csv')){ const text = await file.text(); return csvToRows(text); } const XLSX=await tryImportXLSX(); if(!XLSX){ const text=await file.text(); return csvToRows(text); } const data=new Uint8Array(await file.arrayBuffer()); const wb=XLSX.read(data,{type:'array'}); const ws=wb.Sheets[wb.SheetNames[0]]; return XLSX.utils.sheet_to_json(ws); }

function csvToRows(text){ const lines=text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean); if(lines.length<2) return []; const headers=smartSplit(lines[0]); return lines.slice(1).map(line=>{ const cols=smartSplit(line); const o={}; headers.forEach((h,i)=>o[h]=cols[i]??""); return o; }); }
function smartSplit(line){ const out=[]; let cur=""; let inQ=false; for(let i=0;i<line.length;i++){ const ch=line[i]; if(ch==='"') inQ=!inQ; else if(ch==="," && !inQ){ out.push(cur); cur="";} else cur+=ch; } out.push(cur); return out; }
function splitArr(s){ if(!s) return []; return s.split(/\||;|\s*\,\s*/).map(x=>x.trim()).filter(Boolean); }

// ---------- Main App ----------
export default function TrackOpsApp(){
  const [tab, setTab] = useState('dashboard');
  const [company, setCompany] = useState({ name: "Aethero (Demo)", naics: ["541715","334220"], keywords: ["SDA","edge","AI","Kubernetes","uplink"], stage: "Seed", capabilities: "Edge compute for space, ML on orbit, energy‑efficient comms" });
  const [opps, setOpps] = useState(seedOpportunities);
  const [deadlines, setDeadlines] = useState(seedDeadlines);
  const [wbs, setWbs] = useState(seedWbs);
  const [docs, setDocs] = useState(seedDocs);
  const [matrix, setMatrix] = useState(seedCompliance);
  const [filters, setFilters] = useState({ query: "", agency: "", source: "", naics: "", tag: "" });
  const [newDeadline, setNewDeadline] = useState({ title: "", date: "", category: "govcon", url: "", tags: [], priority: "P2", status: "not-started" });
  const [slackWebhook, setSlackWebhook] = useState("");
  const [selectedForICS, setSelectedForICS] = useState([]);
  const [showHelp, setShowHelp] = useState(false);

  // Local persistence for demo comfort
  useEffect(()=>{ const d=localStorage.getItem('trackops.deadlines'); const o=localStorage.getItem('trackops.opps'); const w=localStorage.getItem('trackops.wbs'); const dc=localStorage.getItem('trackops.docs'); const cm=localStorage.getItem('trackops.matrix'); if(d) setDeadlines(JSON.parse(d)); if(o) setOpps(JSON.parse(o)); if(w) setWbs(JSON.parse(w)); if(dc) setDocs(JSON.parse(dc)); if(cm) setMatrix(JSON.parse(cm)); },[]);
  useEffect(()=>{ localStorage.setItem('trackops.deadlines', JSON.stringify(deadlines)); },[deadlines]);
  useEffect(()=>{ localStorage.setItem('trackops.opps', JSON.stringify(opps)); },[opps]);
  useEffect(()=>{ localStorage.setItem('trackops.wbs', JSON.stringify(wbs)); },[wbs]);
  useEffect(()=>{ localStorage.setItem('trackops.docs', JSON.stringify(docs)); },[docs]);
  useEffect(()=>{ localStorage.setItem('trackops.matrix', JSON.stringify(matrix)); },[matrix]);

  // Global shortcuts
  useEffect(()=>{
    const onKey=(e)=>{
      if (e.key === '?' || (e.shiftKey && e.key === '/')){ setShowHelp(true); }
      if (e.metaKey || e.ctrlKey) return; // leave copy/paste etc
      const k = (e.key||'').toLowerCase();
      if (["d","o","p","i","c","w","x"].includes(k)) e.preventDefault();
      if (k==='d') setTab('dashboard');
      if (k==='o') setTab('opportunities');
      if (k==='p') setTab('planner');
      if (k==='i') setTab('integrations');
      if (k==='c') setTab('company');
      if (k==='w') setTab('wbs');
      if (k==='x') setTab('docs');
    };
    window.addEventListener('keydown', onKey); return ()=>window.removeEventListener('keydown', onKey);
  },[]);

  const relevantOpps = useMemo(()=>{
    return opps.filter((o)=>{
      const profileHit = (company.naics?.some((n)=>o.naics?.includes(n))||false) || (company.keywords?.some((k)=>o.keywords?.map((x)=>x.toLowerCase()).includes(k.toLowerCase()))||false);
      const q = (filters.query||'').trim().toLowerCase();
      const qHit = !q || [o.title,o.topic,o.keywords?.join(' ')].join(' ').toLowerCase().includes(q);
      const agencyHit = !filters.agency || o.agency === filters.agency;
      const sourceHit = !filters.source || o.source === filters.source;
      const naicsHit = !filters.naics || (o.naics||[]).includes(filters.naics);
      const tagHit = !filters.tag || (o.tags||[]).includes(filters.tag);
      return profileHit && qHit && agencyHit && sourceHit && naicsHit && tagHit;
    });
  },[opps, company, filters]);

  const upcoming = useMemo(()=>[...deadlines].sort((a,b)=>a.date.localeCompare(b.date)).slice(0,8),[deadlines]);
  const byMonth = useMemo(()=>groupByMonth([...deadlines].sort((a,b)=>a.date.localeCompare(b.date))),[deadlines]);

  function addFromOpp(o){ const item = { id: uid(), title: o.title, date: o.due, category: 'govcon', source: o.source, url: o.url, tags: o.tags||[], reminders: [-7,-1], fromOpportunityId: o.id, priority: 'P1', status: 'not-started' }; setDeadlines(d=>[...d,item]); }
  function addCustomDeadline(){ if (!newDeadline.title || !newDeadline.date) return; setDeadlines(d=>[...d,{ id: uid(), title: String(newDeadline.title), date: String(newDeadline.date), category: newDeadline.category||'govcon', url: newDeadline.url||'', tags: newDeadline.tags||[], reminders: [-7,-1], priority: newDeadline.priority||'P2', status: newDeadline.status||'not-started' }]); setNewDeadline({ title:"", date:"", category:'govcon', url:"", tags:[], priority:'P2', status:'not-started' }); }
  function removeDeadline(id){ setDeadlines(d=>d.filter(x=>x.id!==id)); }
  function exportSelectedICS(ids){ const selected = deadlines.filter(d=>ids.includes(d.id)); if (!selected.length) return; download('trackops-deadlines.ics', toICS(selected), 'text/calendar;charset=utf-8'); }

  function slackCurl(webhook, d){ const text = ("Reminder: "+d.title+" due "+prettyDate(d.date)+" ("+categoryLabel(d.category)+"). "+(d.url?d.url:" ")).trim(); const payload = JSON.stringify({ text }); return "curl -X POST -H 'Content-type: application/json' --data '"+ payload.replace(/'/g,"'\\''") +"' "+ (webhook||'https://hooks.slack.com/services/XXXX/XXXX/XXXX'); }

  function priorityColor(p){ return p==='P0'? 'text-red-600' : p==='P1'? 'text-orange-600' : 'text-slate-500'; }
  function rybStatus(d){ const du = daysUntil(d.date); if (d.status==='done') return '✅'; if (du<=2 || d.priority==='P0') return '🔴'; if (du<=7 || d.priority==='P1') return '🟠'; return '🟢'; }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-lg"><ClipboardList className="h-5 w-5"/>TrackOps</div>
          <div className="ml-auto flex items-center gap-3">
            <Building2 className="h-4 w-4 text-slate-500"/>
            <input className="px-2 py-1 rounded-md border border-slate-300 text-sm" value={company.name} onChange={(e)=>setCompany({...company, name: e.target.value})}/>
            <button onClick={()=>setShowHelp(true)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 border-slate-300 text-sm"><HelpCircle className="h-4 w-4"/>Shortcuts</button>
            <button onClick={()=>setTab('settings')} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm ${'settings'===tab?"bg-slate-900 text-white border-slate-900":"bg-white hover:bg-slate-50 border-slate-300"}`}><Settings className="h-4 w-4"/>Settings</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="col-span-12 lg:col-span-3 space-y-2">
          <NavButton icon={<ClipboardList className="h-4 w-4"/>} label="Dashboard" active={tab==='dashboard'} onClick={()=>setTab('dashboard')}/>
          <NavButton icon={<Filter className="h-4 w-4"/>} label="Opportunities" active={tab==='opportunities'} onClick={()=>setTab('opportunities')}/>
          <NavButton icon={<Calendar className="h-4 w-4"/>} label="Planner" active={tab==='planner'} onClick={()=>setTab('planner')}/>
          <NavButton icon={<Bell className="h-4 w-4"/>} label="Integrations" active={tab==='integrations'} onClick={()=>setTab('integrations')}/>
          <NavButton icon={<SlidersHorizontal className="h-4 w-4"/>} label="Company Profile" active={tab==='company'} onClick={()=>setTab('company')}/>
          <NavButton icon={<FileSpreadsheet className="h-4 w-4"/>} label="Sheets & WBS" active={tab==='wbs'} onClick={()=>setTab('wbs')}/>
          <NavButton icon={<FileText className="h-4 w-4"/>} label="Docs & Compliance" active={tab==='docs'} onClick={()=>setTab('docs')}/>
        </aside>

        {/* Main */}
        <main className="col-span-12 lg:col-span-9">
          {tab==='dashboard' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <StatCard title="Upcoming (30d)" value={deadlines.filter(d=>daysUntil(d.date)<=30 && daysUntil(d.date)>=0).length}/>
                <StatCard title="Relevant Opps" value={relevantOpps.length}/>
                <StatCard title="Priority P0/P1" value={deadlines.filter(d=>d.priority!=='P2').length}/>
              </div>

              {/* Priorities / Check-in */}
              <section className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3"><h2 className="font-semibold text-slate-900">Check‑in (Prioritized)</h2>
                  <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 border-slate-300 text-sm" onClick={()=>exportXLSX(deadlines.map(d=>({title:d.title,date:d.date,category:d.category,priority:d.priority,status:d.status})), 'Priorities','trackops-priorities.xlsx')}><Download className="h-4 w-4"/>Export</button>
                </div>
                <ul className="divide-y divide-slate-100">
                  {[...deadlines].filter(d=>d.priority!=='P2').sort((a,b)=> (a.priority||'P2').localeCompare(b.priority||'P2') || a.date.localeCompare(b.date)).slice(0,10).map(d=> (
                    <li key={d.id} className="py-3 flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full border ${categoryClass(d.category)}`}>{categoryLabel(d.category)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 truncate">{d.title} <span className={`ml-2 text-xs ${priorityColor(d.priority)}`}>{d.priority}</span> <span className="ml-2 text-xs">{rybStatus(d)}</span></div>
                        <div className="text-sm text-slate-500 flex items-center gap-2"><Calendar className="h-3.5 w-3.5"/>{prettyDate(d.date)}{d.url && (<a className="inline-flex items-center gap-1 text-xs text-blue-700 hover:underline" href={d.url} target="_blank" rel="noreferrer">Open<ExternalLink className="h-3 w-3"/></a>)}</div>
                      </div>
                      <button onClick={()=>setDeadlines(prev=>prev.map(x=>x.id===d.id?{...x, status:x.status==='done'?'in-progress':'done'}:x))} className="p-1.5 rounded-md hover:bg-slate-50 text-slate-500">{d.status==='done'?<StarOff className="h-4 w-4"/>:<Star className="h-4 w-4"/>}</button>
                    </li>
                  ))}
                </ul>
              </section>

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
                  <input className="px-3 py-2 rounded-md border border-slate-300 text-sm md:col-span-2" placeholder="Title" value={newDeadline.title||''} onChange={(e)=>setNewDeadline({...newDeadline, title:e.target.value})}/>
                  <input type="date" className="px-3 py-2 rounded-md border border-slate-300 text-sm" value={newDeadline.date||''} onChange={(e)=>setNewDeadline({...newDeadline, date:e.target.value})}/>
                  <select className="px-3 py-2 rounded-md border border-slate-300 text-sm" value={newDeadline.category||'govcon'} onChange={(e)=>setNewDeadline({...newDeadline, category:e.target.value})}>{CATEGORIES.map(c=> <option key={c.key} value={c.key}>{c.label}</option>)}</select>
                  <select className="px-3 py-2 rounded-md border border-slate-300 text-sm" value={newDeadline.priority||'P2'} onChange={(e)=>setNewDeadline({...newDeadline, priority:e.target.value})}><option>P0</option><option>P1</option><option>P2</option></select>
                  <input className="px-3 py-2 rounded-md border border-slate-300 text-sm md:col-span-2" placeholder="URL (optional)" value={newDeadline.url||''} onChange={(e)=>setNewDeadline({...newDeadline, url:e.target.value})}/>
                  <button onClick={addCustomDeadline} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-slate-900 text-white border-slate-900 text-sm"><Plus className="h-4 w-4"/>Add</button>
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
                        <td className="px-4 py-2"><div className="font-medium text-slate-900 flex items-center gap-2">{o.url? (<a href={o.url} target="_blank" rel="noreferrer" className="hover:underline">{o.title}</a>): o.title}<a href={o.url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-600"><ExternalLink className="h-4 w-4"/></a></div>{o.topic && <div className="text-xs text-slate-500">{o.topic}</div>}</td>
                        <td className="px-4 py-2">{o.agency}</td>
                        <td className="px-4 py-2">{o.source}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{prettyDate(o.due)} <span className="text-xs text-slate-400">({daysUntil(o.due)}d)</span></td>
                        <td className="px-4 py-2">{o.naics?.join(", ")}</td>
                        <td className="px-4 py-2"><div className="flex flex-wrap gap-1">{(o.tags||[]).map(t=> <span key={t} className="px-2 py-0.5 rounded-full border border-slate-200 text-xs bg-slate-50">{t}</span>)}</div></td>
                        <td className="px-4 py-2"><button onClick={()=>addFromOpp(o)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 border-slate-300 text-sm"><Plus className="h-4 w-4"/>Add to Deadlines</button></td>
                      </tr>
                    ))}
                    {relevantOpps.length===0 && (<tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No matches. Update Company Profile keywords.</td></tr>)}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab==='planner' && (
            <section className="space-y-4">
              {/* Split calendar export by category */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center gap-2">
                <div className="font-semibold mr-2">Export by Category:</div>
                {CATEGORIES.map(c=> (
                  <button key={c.key} onClick={()=>exportSelectedICS(deadlines.filter(d=>d.category===c.key).map(d=>d.id))} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 border-slate-300 text-sm">{c.label} <Download className="h-4 w-4"/></button>
                ))}
              </div>

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
            </section>
          )}

          {tab==='integrations' && (
            <section className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h2 className="font-semibold text-slate-900 mb-3">Slack (v1)</h2>
                <p className="text-sm text-slate-600 mb-3">Use an <b>Incoming Webhook</b> for reminders. Paste your webhook and copy the generated cURL for any deadline.</p>
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
                <p className="text-sm text-slate-500 mt-3">These will create tasks automatically when you add an opportunity to deadlines.</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h2 className="font-semibold text-slate-900 mb-3">Calendar</h2>
                <p className="text-sm text-slate-600 mb-2">Export <code>.ics</code> from Planner or by category. Next step: an /api/ics subscription feed per Org.</p>
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

              {/* Admin Import — Opportunities CSV/XLSX */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h2 className="font-semibold text-slate-900 mb-3">Admin: Import Opportunities (CSV/XLSX)</h2>
                <FileImport onRows={(rows)=>{ const mapped = rows.map((r,i)=>({ id:`csv-${uid()}-${i}`, title:r.title||r.Title||"", agency:r.agency||r.Agency||"", source:r.source||r.Source||"Other", topic:r.topic||r.Topic||"", naics: splitArr(r.naics||r.NAICS), keywords: splitArr(r.keywords||r.Keywords), url:r.url||r.URL||"", due:r.due||r.Due||inDays(60), tags: splitArr(r.tags||r.Tags) })); setOpps(prev=>[...mapped, ...prev]); }}/>
              </div>
            </section>
          )}

          {tab==='wbs' && (
            <section className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-2"><h2 className="font-semibold text-slate-900">Sheets & WBS</h2>
                  <div className="flex items-center gap-2">
                    <button onClick={()=>exportXLSX(wbs, 'WBS','trackops-wbs.xlsx')} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 border-slate-300 text-sm"><Download className="h-4 w-4"/>Export XLSX</button>
                  </div>
                </div>
                <div className="text-xs text-slate-500 mb-3">Shortcuts: <kbd>[</kbd>/<kbd>]</kbd> indent/outdent · <kbd>Enter</kbd> new row · <kbd>Backspace</kbd> delete row · <kbd>P</kbd> priority cycle · <kbd>Space</kbd> toggle done</div>
                <div className="flex items-center gap-3 mb-3">
                  <button onClick={()=> setWbs(w=>[...w, { id: uid(), title: "New Item", level: 0, status:'not-started', priority:'P2' }]) } className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-slate-900 text-white border-slate-900 text-sm"><Plus className="h-4 w-4"/>Add Row</button>
                  <FileImport onRows={(rows)=>{ const mapped = rows.map((r)=>({ id: uid(), title: r.title||r.Title||r.Task||"", owner: r.owner||r.Owner||"", due: r.due||r.Due||"", status: (r.status||r.Status||'not-started').toLowerCase(), priority: (r.priority||r.Priority||'P2'), estimateHrs: Number(r.estimateHrs||r.Estimate||0), level: Number(r.level||r.Level||0) })); setWbs(prev=>[...prev, ...mapped]); }}/>
                </div>
                <WbsGrid rows={wbs} onChange={setWbs}/>
              </div>
            </section>
          )}

          {tab==='docs' && (
            <section className="space-y-6">
              {/* Documents tracker */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-2"><h2 className="font-semibold text-slate-900">Document Tracker</h2>
                  <div className="flex items-center gap-2"><button onClick={()=>exportXLSX(docs,'Docs','trackops-docs.xlsx')} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 border-slate-300 text-sm"><Download className="h-4 w-4"/>Export XLSX</button></div>
                </div>
                <div className="text-xs text-slate-500 mb-3">Track versions + reviewers. Re‑import an updated spreadsheet to increment versions for matching names.</div>
                <div className="flex items-center gap-3 mb-3"><FileImport onRows={(rows)=>{
                  setDocs(prev=>{
                    const cur = [...prev];
                    for (const r of rows){ const name = r.name||r.Name; if (!name) continue; const idx = cur.findIndex(d=>d.name===name);
                      if (idx>=0){ const nextV = (cur[idx].version||1)+1; const updated = { ...cur[idx], kind: r.kind||r.Kind||cur[idx].kind, owner: r.owner||r.Owner||cur[idx].owner, reviewers: splitArr(r.reviewers||r.Reviewers||'').map(x=>x.startsWith('@')?x:`@${x}`), url: r.url||r.URL||cur[idx].url, tags: splitArr(r.tags||r.Tags|| (cur[idx].tags||[]).join(',') || ''), version: nextV, updatedAt: today(), history: [...(cur[idx].history||[]), { version: cur[idx].version, updatedAt: cur[idx].updatedAt }] }; cur[idx]=updated; }
                      else { cur.push({ id: uid(), name, kind: r.kind||r.Kind||'Doc', owner: r.owner||r.Owner||'', reviewers: splitArr(r.reviewers||r.Reviewers||'').map(x=>x.startsWith('@')?x:`@${x}`), url: r.url||r.URL||'', version: Number(r.version||1), updatedAt: r.updatedAt||today(), tags: splitArr(r.tags||r.Tags), notes: r.notes||r.Notes||'', history: [] }); }
                    }
                    return cur;
                  });
                }}/></div>
                <div className="overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200"><tr><th className="text-left px-3 py-2">Name</th><th className="text-left px-3 py-2">Kind</th><th className="text-left px-3 py-2">Owner</th><th className="text-left px-3 py-2">Reviewers</th><th className="text-left px-3 py-2">Version</th><th className="text-left px-3 py-2">Updated</th><th className="text-left px-3 py-2">Tags</th><th className="text-left px-3 py-2">Link</th></tr></thead>
                    <tbody>
                      {docs.map(d=> (
                        <tr key={d.id} className="border-b border-slate-100">
                          <td className="px-3 py-2 font-medium">{d.name}</td>
                          <td className="px-3 py-2">{d.kind}</td>
                          <td className="px-3 py-2">{d.owner}</td>
                          <td className="px-3 py-2">{(d.reviewers||[]).join(', ')}</td>
                          <td className="px-3 py-2">v{d.version}</td>
                          <td className="px-3 py-2">{prettyDate(d.updatedAt)}</td>
                          <td className="px-3 py-2">{(d.tags||[]).join(', ')}</td>
                          <td className="px-3 py-2">{d.url? <a href={d.url} className="text-blue-700 hover:underline" target="_blank" rel="noreferrer">Open</a> : <span className="text-slate-400">—</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Compliance Matrix + Templates */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-2"><h2 className="font-semibold text-slate-900">Compliance Matrix & Templates</h2>
                  <div className="flex items-center gap-2"><button onClick={()=>exportXLSX(matrix,'Compliance','trackops-compliance.xlsx')} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 border-slate-300 text-sm"><Download className="h-4 w-4"/>Export XLSX</button></div>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-slate-900 text-white border-slate-900 text-sm" onClick={()=> setMatrix(m=> [...m, ...templateRows('oci'), ...templateRows('subk'), ...templateRows('endgame')]) }>Insert Templates (OCI/SubK/End‑Game)</button>
                  <FileImport onRows={(rows)=>{ const mapped = rows.map((r)=>({ id: uid(), requirement: r.requirement||r.Requirement||'', source: r.source||r.Source||'', control: r.control||r.Control||'', owner: r.owner||r.Owner||'', artifact: r.artifact||r.Artifact||'', status: (r.status||r.Status||'open').toLowerCase(), due: r.due||r.Due||'', notes: r.notes||r.Notes||'' })); setMatrix(prev=>[...prev, ...mapped]); }}/>
                </div>
                <div className="overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200"><tr><th className="text-left px-3 py-2">Requirement</th><th className="text-left px-3 py-2">Source</th><th className="text-left px-3 py-2">Owner</th><th className="text-left px-3 py-2">Artifact</th><th className="text-left px-3 py-2">Status</th><th className="text-left px-3 py-2">Due</th><th className="text-left px-3 py-2">Notes</th></tr></thead>
                    <tbody>{matrix.map(row=> (
                      <tr key={row.id} className="border-b border-slate-100">
                        <td className="px-3 py-2">{row.requirement}</td>
                        <td className="px-3 py-2">{row.source}</td>
                        <td className="px-3 py-2">{row.owner}</td>
                        <td className="px-3 py-2">{row.artifact}</td>
                        <td className="px-3 py-2">{row.status}</td>
                        <td className="px-3 py-2">{row.due? prettyDate(row.due): '—'}</td>
                        <td className="px-3 py-2">{row.notes}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {tab==='settings' && (
            <section className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-4"><h2 className="font-semibold text-slate-900 mb-3">Product Settings</h2>
                <div className="grid md:grid-cols-2 gap-3"><ToggleSetting label="Email Reminders (via Resend)" description="Send 7d/1d reminders to your email." enabled={false}/><ToggleSetting label="Enable Multi-tenant Orgs" description="Invite teammates, assign owners to deadlines." enabled={true}/></div>
                <p className="text-sm text-slate-500 mt-3">These are conceptual toggles in the MVP UI. Wire them up after backend is live.</p>
              </div>
            </section>
          )}
        </main>
      </div>

      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">TrackOps MVP · © {new Date().getFullYear()}</footer>

      {showHelp && <ShortcutsModal onClose={()=>setShowHelp(false)}/>}    
    </div>
  );
}

// ---------- Small UI pieces ----------
function NavButton({ icon, label, active, onClick }){
  return (<button onClick={onClick} className={`w-full inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm ${active?"bg-slate-900 text-white border-slate-900":"bg-white hover:bg-slate-50 border-slate-300"}`}>{icon}{label}</button>);
}
function StatCard({ title, value }){ return (<div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-slate-500 text-sm">{title}</div><div className="text-2xl font-semibold text-slate-900">{value}</div></div>); }
function ToolStub({ name, status }){ const ok = status === 'Connected'; return (<div className="rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between"><div className="font-medium text-slate-900">{name}</div>{ok? <CheckCircle2 className="h-5 w-5 text-green-600"/>: <XCircle className="h-5 w-5 text-slate-300"/>}</div><div className="text-sm text-slate-500 mt-1">{status}</div><button className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 border-slate-300 text-sm"><Upload className="h-4 w-4"/>Connect</button></div>); }
function ToggleSetting({ label, description, enabled }){ return (<div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200"><input type="checkbox" defaultChecked={enabled} className="h-4 w-4 mt-0.5"/><div><div className="font-medium text-slate-900">{label}</div><div className="text-sm text-slate-500">{description}</div></div></div>); }

// File import (CSV/XLSX)
function FileImport({ onRows }){
  const fileRef = useRef(null);
  return (
    <div className="inline-flex items-center gap-2">
      <input type="file" accept=".csv, .xlsx, .xls" ref={fileRef} className="hidden" onChange={async (e)=>{ const f = e.target.files?.[0]; if (!f) return; const rows = await importFileToRows(f); onRows(rows); e.target.value=''; }}/>
      <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 border-slate-300 text-sm" onClick={()=>fileRef.current?.click()}><Upload className="h-4 w-4"/>Import CSV/XLSX</button>
    </div>
  );
}

function ShortcutsModal({ onClose }){
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 max-w-xl w-full p-4">
        <div className="flex items-center justify-between mb-2"><div className="font-semibold">Keyboard Shortcuts</div><button onClick={onClose} className="text-slate-500">Close</button></div>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-slate-700">
          <li><b>?</b> — Show shortcuts</li>
          <li><b>d/o/p/i/c/w/x</b> — Switch tabs</li>
          <li><b>WBS:</b> <b>[</b>/<b>]</b> indent/outdent, <b>Enter</b> new row, <b>Backspace</b> delete, <b>P</b> cycle priority, <b>Space</b> toggle done</li>
          <li><b>Export</b>: buttons on each view (XLSX / ICS)</li>
        </ul>
      </div>
    </div>
  );
}

// WBS Grid component
function WbsGrid({ rows, onChange }){
  const [active, setActive] = useState();

  function update(id, patch){ onChange(rows.map(r=> r.id===id? {...r, ...patch}: r)); }
  function remove(id){ onChange(rows.filter(r=>r.id!==id)); }
  function addAfter(id){ const idx = rows.findIndex(r=>r.id===id); const base = rows[idx]; const newRow = { id: uid(), title: "New Item", level: (base&&base.level)||0, status: 'not-started', priority: 'P2' }; const copy=[...rows]; copy.splice(idx+1,0,newRow); onChange(copy); setActive(newRow.id); }
  function indent(id, dir){ onChange(rows.map(r=> r.id===id? {...r, level: Math.max(0,(r.level||0)+dir)}: r)); }
  function cyclePriority(p){ if (p==='P2') return 'P1'; if (p==='P1') return 'P0'; if (p==='P0') return 'P2'; return 'P2'; }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200"><tr><th className="px-2 py-2 text-left">Task</th><th className="px-2 py-2 text-left">Owner</th><th className="px-2 py-2 text-left">Due</th><th className="px-2 py-2 text-left">Status</th><th className="px-2 py-2 text-left">Priority</th><th className="px-2 py-2"></th></tr></thead>
        <tbody>
          {rows.map((r)=> (
            <tr key={r.id} className={`border-b border-slate-100 ${active===r.id? 'bg-slate-50':''}`}
              onKeyDown={(e)=>{
                if (e.key==='Enter'){ e.preventDefault(); addAfter(r.id); }
                if (e.key==='Backspace' && (e.target.tagName!=='INPUT')){ e.preventDefault(); remove(r.id); }
                if (e.key===']'){ e.preventDefault(); indent(r.id,1); }
                if (e.key==='['){ e.preventDefault(); indent(r.id,-1); }
                if ((e.key||'').toLowerCase()==='p'){ e.preventDefault(); update(r.id,{ priority: cyclePriority(r.priority) }); }
                if (e.key===' ' && (e.target.tagName!=='INPUT')){ e.preventDefault(); update(r.id,{ status: r.status==='done'?'in-progress':'done' }); }
              }}
              onFocus={()=>setActive(r.id)}>
              <td className="px-2 py-1">
                <div className="flex items-center gap-2" style={{ paddingLeft: (r.level||0)*16 }}>
                  <button onClick={()=>indent(r.id,-1)} title="Outdent" className="p-1 rounded hover:bg-slate-100"><IndentDecrease className="h-4 w-4"/></button>
                  <button onClick={()=>indent(r.id,1)} title="Indent" className="p-1 rounded hover:bg-slate-100"><IndentIncrease className="h-4 w-4"/></button>
                  <input className="px-2 py-1 border rounded w-full" value={r.title} onChange={(e)=>update(r.id,{ title:e.target.value })}/>
                </div>
              </td>
              <td className="px-2 py-1"><input className="px-2 py-1 border rounded w-full" value={r.owner||''} onChange={(e)=>update(r.id,{ owner:e.target.value })} placeholder="@Name"/></td>
              <td className="px-2 py-1"><input type="date" className="px-2 py-1 border rounded w-full" value={r.due||''} onChange={(e)=>update(r.id,{ due:e.target.value })}/></td>
              <td className="px-2 py-1">
                <select className="px-2 py-1 border rounded w-full" value={r.status||'not-started'} onChange={(e)=>update(r.id,{ status: e.target.value })}>
                  <option value="not-started">not-started</option>
                  <option value="in-progress">in-progress</option>
                  <option value="done">done</option>
                </select>
              </td>
              <td className="px-2 py-1">
                <select className="px-2 py-1 border rounded w-full" value={r.priority||'P2'} onChange={(e)=>update(r.id,{ priority: e.target.value })}>
                  <option>P0</option><option>P1</option><option>P2</option>
                </select>
              </td>
              <td className="px-2 py-1 text-right whitespace-nowrap">
                <button onClick={()=>addAfter(r.id)} className="px-2 py-1 rounded border bg-white hover:bg-slate-50 border-slate-300 text-xs">Add</button>
                <button onClick={()=>remove(r.id)} className="ml-2 px-2 py-1 rounded border bg-white hover:bg-slate-50 border-slate-300 text-xs">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function templateRows(kind){
  if (kind==='oci') return [
    { id: uid(), requirement: 'Identify potential OCI relationships', source: 'FAR 9.5', owner: 'Legal', artifact: 'OCI memo', status: 'open', due: inDays(7) },
    { id: uid(), requirement: 'Draft mitigation strategy', source: 'FAR 9.5', owner: 'Legal', artifact: 'Mitigation plan', status: 'open', due: inDays(10) },
  ];
  if (kind==='subk') return [
    { id: uid(), requirement: 'Subcontracting plan draft', source: 'FAR 19.7', owner: 'Contracts', artifact: 'SubK Plan', status: 'open', due: inDays(12) },
  ];
  return [
    { id: uid(), requirement: 'Red team review complete', source: 'Internal QA', owner: 'PM', artifact: 'Review notes', status: 'open', due: inDays(5) },
    { id: uid(), requirement: 'Final PDFs packaged & signed', source: 'Submission', owner: 'PM', artifact: 'Submission package', status: 'open', due: inDays(4) },
  ];
}
