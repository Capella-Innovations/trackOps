'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar, ClipboardList, ListTree, Table as TableIcon, ShieldCheck, Bell, Download, Sparkles, CheckCircle2, Menu, X, Building2, ChevronDown } from 'lucide-react';

// --- Landing Page -----------------------------------------------------------
export default function LandingPage() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-800">
      <Navbar open={open} setOpen={setOpen} />
      <Hero />
      <Logos />
      <Features />
      <HowItWorks />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}

// --- Navbar -----------------------------------------------------------------
function Navbar({ open, setOpen }) {
  return (
    <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <ClipboardList className="h-5 w-5" /> TrackOps
          <span className="ml-2 text-xs inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 px-2 py-0.5"> <ShieldCheck className="h-3 w-3"/> CUI‑safe mode</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 ml-8 text-sm">
          <a href="#features" className="hover:text-slate-900">Features</a>
          <a href="#how" className="hover:text-slate-900">How it works</a>
          <a href="#pricing" className="hover:text-slate-900">Pricing</a>
          <a href="#faq" className="hover:text-slate-900">FAQ</a>
        </nav>
        <div className="ml-auto hidden md:flex items-center gap-2">
          <Link href="/app" className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-sm">Open App</Link>
          <Link href="/demo" className="px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-sm inline-flex items-center gap-1">Book demo <ArrowRight className="h-4 w-4"/></Link>
        </div>
        <button className="ml-auto md:hidden p-2 rounded-md border border-slate-300" onClick={()=>setOpen(!open)} aria-label="Toggle menu">{open? <X className="h-5 w-5"/>: <Menu className="h-5 w-5"/>}</button>
      </div>
      {open && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="px-4 py-3 flex flex-col gap-3 text-sm">
            <a onClick={()=>setOpen(false)} href="#features">Features</a>
            <a onClick={()=>setOpen(false)} href="#how">How it works</a>
            <a onClick={()=>setOpen(false)} href="#pricing">Pricing</a>
            <a onClick={()=>setOpen(false)} href="#faq">FAQ</a>
            <Link onClick={()=>setOpen(false)} href="/app" className="px-3 py-2 rounded-lg border border-slate-300">Open App</Link>
            <Link onClick={()=>setOpen(false)} href="/demo" className="px-3 py-2 rounded-lg bg-slate-900 text-white">Book demo</Link>
          </div>
        </div>
      )}
    </header>
  );
}

// --- Hero -------------------------------------------------------------------
function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-[700px] w-[1200px] rounded-full bg-gradient-to-r from-indigo-200/40 via-sky-200/40 to-emerald-200/40 blur-3xl"/>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs rounded-full border border-slate-300 bg-white px-2 py-1 text-slate-600">
              <Sparkles className="h-3.5 w-3.5"/> Purpose-built for GovTech founders
            </div>
            <h1 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight text-slate-900">
              Keep SBIRs, OTAs, ATOs and proposals on track —
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600"> without spreadsheet chaos.</span>
            </h1>
            <p className="mt-4 text-slate-600 leading-relaxed max-w-xl">
              TrackOps is a planning and deadline OS for government‑focused startups. Import from Excel, plan in WBS, switch to calendar, and nudge teams in Slack — all in a metadata‑only, CUI‑safe workspace.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Link href="/app" className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 inline-flex items-center gap-2">Start free <ArrowRight className="h-4 w-4"/></Link>
              <a href="#features" className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 inline-flex items-center gap-2">See features</a>
            </div>
            <div className="mt-4 text-xs text-slate-500 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4"/> Metadata‑only SKU today · GCC High enclave ready when needed
            </div>
          </div>

          {/* Mock screenshot */}
          <div className="relative">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50">
                <div className="h-3 w-3 rounded-full bg-rose-300"/>
                <div className="h-3 w-3 rounded-full bg-amber-300"/>
                <div className="h-3 w-3 rounded-full bg-emerald-300"/>
                <div className="text-xs text-slate-500 ml-2">TrackOps – Planner</div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-3 gap-3">
                  <DemoCard icon={<Calendar className="h-4 w-4"/>} title="Calendar & List" desc="Switch views, export .ics, filter by category."/>
                  <DemoCard icon={<ListTree className="h-4 w-4"/>} title="WBS" desc="Hierarchy, owners & due dates with keyboard ops."/>
                  <DemoCard icon={<TableIcon className="h-4 w-4"/>} title="Sheets" desc="Import/export CSV. Paste from Excel."/>
                  <DemoCard icon={<Bell className="h-4 w-4"/>} title="Slack reminders" desc="One‑click nudges. Bot coming soon."/>
                  <DemoCard icon={<ShieldCheck className="h-4 w-4"/>} title="CUI‑safe" desc="Sanitized titles & enclave boundary."/>
                  <DemoCard icon={<Download className="h-4 w-4"/>} title="ICS & CSV" desc="Hand off to calendars & PM tools."/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DemoCard({ icon, title, desc }){
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 hover:shadow-sm transition">
      <div className="flex items-center gap-2 text-slate-900 font-medium">{icon}{title}</div>
      <div className="mt-1 text-sm text-slate-600">{desc}</div>
    </div>
  );
}

// --- Logos ------------------------------------------------------------------
function Logos(){
  return (
    <section className="py-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-xs uppercase tracking-wider text-slate-500 text-center mb-3">Works alongside your stack</div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 place-items-center text-slate-400">
          <LogoBadge label="Asana"/>
          <LogoBadge label="Jira"/>
          <LogoBadge label="GitLab"/>
          <LogoBadge label="Google Cal"/>
          <LogoBadge label="Slack"/>
          <LogoBadge label="SharePoint"/>
        </div>
      </div>
    </section>
  );
}
function LogoBadge({ label }){
  return (
    <div className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium">{label}</div>
  );
}

// --- Features ---------------------------------------------------------------
function Features(){
  const items = [
    { icon: <Calendar className="h-5 w-5"/>, title: 'Government‑aware planner', desc: 'Track SBIR cycles, OTAs, ATO steps, proposals and reviews in one place.' },
    { icon: <ListTree className="h-5 w-5"/>, title: 'WBS with roll‑ups', desc: 'Hierarchy + owners + due dates. Keyboard: Enter, Tab, Shift+Tab.' },
    { icon: <TableIcon className="h-5 w-5"/>, title: 'Sheets import/export', desc: 'CSV in/out, paste from Excel. Templates for Compliance & OCI.' },
    { icon: <Bell className="h-5 w-5"/>, title: 'Slack reminders', desc: 'Send nudges from deadlines & WBS. Bot and schedules next.' },
    { icon: <ShieldCheck className="h-5 w-5"/>, title: 'CUI‑safe by design', desc: 'Metadata‑only SKU now; CUI enclave in GCC High when required.' },
    { icon: <Download className="h-5 w-5"/>, title: 'ICS & integrations', desc: 'Export to calendars; push tasks to Jira/Asana (coming).' },
  ];
  return (
    <section id="features" className="py-16">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-semibold text-slate-900">Everything you need to keep proposals moving</h2>
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {items.map((it, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 text-slate-900 font-medium">{it.icon}{it.title}</div>
              <div className="mt-1 text-slate-600 text-sm">{it.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- How it works -----------------------------------------------------------
function HowItWorks(){
  const steps = [
    { title: 'Profile', desc: 'Tell us your NAICS, keywords and programs you target.', icon: <Building2 className="h-5 w-5"/> },
    { title: 'Import', desc: 'Drop your Excel/CSV or paste a compliance matrix into Sheets.', icon: <TableIcon className="h-5 w-5"/> },
    { title: 'Plan', desc: 'Generate a WBS, assign owners and dates. Switch to calendar.', icon: <ListTree className="h-5 w-5"/> },
    { title: 'Nudge', desc: 'Export .ics, or nudge owners in Slack. Stay on track.', icon: <Bell className="h-5 w-5"/> },
  ];
  return (
    <section id="how" className="py-16 bg-slate-50/60 border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-semibold text-slate-900">How it works</h2>
        <div className="mt-6 grid md:grid-cols-4 gap-4">
          {steps.map((s, i)=>(
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 font-medium text-slate-900">{s.icon}{s.title}</div>
              <div className="mt-1 text-sm text-slate-600">{s.desc}</div>
              <div className="mt-3 text-xs text-slate-400">Step {i+1}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- Pricing ----------------------------------------------------------------
function Pricing(){
  return (
    <section id="pricing" className="py-16">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-semibold text-slate-900">Simple pricing</h2>
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <Plan
            name="Founder (Metadata)"
            price="Free while in beta"
            bullets={[
              'Planner (list & calendar)',
              'WBS with keyboard ops',
              'Sheets import/export',
              'Slack webhooks',
              'ICS export',
              'CUI‑safe guardrails',
            ]}
            ctaHref="/app"
            ctaLabel="Start free"
          />
          <Plan
            name="Enclave (CUI)"
            price="Contact for early access"
            bullets={[
              'Dedicated GCC High deployment',
              'Gov data stores (Azure Gov)',
              'Sanitized rollups to commercial',
              'Gov‑only connectors (SP/Teams)',
              'Audit & DLP controls',
            ]}
            highlight
            ctaHref="/demo"
            ctaLabel="Book demo"
          />
        </div>
      </div>
    </section>
  );
}

function Plan({ name, price, bullets, ctaHref, ctaLabel, highlight }){
  return (
    <div className={`rounded-2xl border p-6 ${highlight? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white'}`}>
      <div className="text-lg font-semibold flex items-center gap-2">
        {highlight && <CheckCircle2 className="h-5 w-5"/>}{name}
      </div>
      <div className={`mt-1 text-sm ${highlight? 'text-slate-200' : 'text-slate-600'}`}>{price}</div>
      <ul className="mt-4 space-y-2 text-sm">
        {bullets.map((b,i)=> (
          <li key={i} className="flex items-start gap-2">
            <span className={`mt-1 h-1.5 w-1.5 rounded-full ${highlight? 'bg-white' : 'bg-slate-900'}`}/>
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5">
        <Link href={ctaHref} className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm ${highlight? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>{ctaLabel} <ArrowRight className="h-4 w-4"/></Link>
      </div>
    </div>
  );
}

// --- FAQ --------------------------------------------------------------------
function FAQ(){
  const qs = [
    {
      q: 'Is TrackOps safe for CUI projects?',
      a: 'The base product is metadata-only and designed to stay outside of CUI scope. For CUI workflows, we plan an enclave deployment (e.g., GCC High) where sensitive content stays isolated.'
    },
    {
      q: 'What makes TrackOps different from generic PM tools?',
      a: 'We preload Gov-specific concepts (SBIR windows, OTA/ATO milestones, compliance matrices) and give you WBS+calendar+Slack nudges built for proposal cadence.'
    },
    {
      q: 'Can I import my existing Excel sheets?',
      a: 'Yes. Paste or upload CSV into Sheets. You can also export back to CSV and .ics for calendars.'
    },
    {
      q: 'Does it integrate with Slack?',
      a: 'Today: incoming webhooks for reminders. Next: a Slack app with buttons to acknowledge or update tasks.'
    },
    {
      q: 'What about pricing for teams?',
      a: 'Beta is free for founders. Team pricing will be usage-based with annual options; enclave pricing depends on deployment scope.'
    }
  ];
  return (
    <section id="faq" className="py-16">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 text-center">Frequently asked questions</h2>
        <div className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
          {qs.map((item, i)=> (<FAQItem key={i} item={item} />))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ item }){
  const [open, setOpen] = React.useState(false);
  return (
    <div className="px-5 py-4">
      <button onClick={()=>setOpen(!open)} className="w-full flex items-center justify-between gap-3 text-left">
        <div className="font-medium text-slate-900">{item.q}</div>
        <ChevronDown className={`h-5 w-5 text-slate-500 transition-transform ${open? 'rotate-180':'rotate-0'}`} />
      </button>
      <div className={`overflow-hidden transition-[max-height] duration-300 ${open? 'max-h-40':'max-h-0'}`}>
        <p className="mt-2 text-sm text-slate-600">{item.a}</p>
      </div>
    </div>
  );
}

// --- CTA strip --------------------------------------------------------------
function CTA(){
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 to-slate-700 text-white p-8">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="text-2xl font-semibold">Ready to ditch the spreadsheet maze?</div>
            <div className="md:ml-auto flex items-center gap-2">
              <Link href="/app" className="px-4 py-2 rounded-xl bg-white text-slate-900 hover:bg-slate-100 inline-flex items-center gap-2">Start free <ArrowRight className="h-4 w-4"/></Link>
              <Link href="/demo" className="px-4 py-2 rounded-xl border border-white/30 hover:bg-white/10">Book demo</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// --- Footer -----------------------------------------------------------------
function Footer(){
  return (
    <footer id="faq" className="border-t border-slate-200 py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-6 text-sm">
          <div>
            <div className="font-semibold text-slate-900 flex items-center gap-2"><ClipboardList className="h-4 w-4"/> TrackOps</div>
            <p className="mt-2 text-slate-600">Planning & deadlines for GovTech founders. Metadata‑only today; enclave for CUI tomorrow.</p>
          </div>
          <div>
            <div className="font-medium text-slate-900 mb-1">Product</div>
            <ul className="space-y-1 text-slate-600">
              <li><a href="#features" className="hover:text-slate-900">Features</a></li>
              <li><a href="#how" className="hover:text-slate-900">How it works</a></li>
              <li><a href="#pricing" className="hover:text-slate-900">Pricing</a></li>
            </ul>
          </div>
          <div>
            <div className="font-medium text-slate-900 mb-1">Company</div>
            <ul className="space-y-1 text-slate-600">
              <li><a href="/demo" className="hover:text-slate-900">Book demo</a></li>
              <li><a href="mailto:founder@example.com" className="hover:text-slate-900">Contact</a></li>
            </ul>
          </div>
          <div>
            <div className="font-medium text-slate-900 mb-1">Compliance</div>
            <ul className="space-y-1 text-slate-600">
              <li>CUI‑safe workspace</li>
              <li>GCC High enclave (planned)</li>
              <li>Audit trail (planned)</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 text-xs text-slate-500">© {new Date().getFullYear()} TrackOps</div>
      </div>
    </footer>
  );
}
