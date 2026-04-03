'use client';

import { useEffect, useState, useCallback } from 'react';
import { Phone, Mail, Calendar, TrendingUp, Users, Flame, Clock, RefreshCw, CheckCircle, MessageSquare, Zap, FileText, Bell, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Lead {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  route?: string | null;
  score?: string | null;
  intent?: string | null;
  timeline?: string | null;
  financing?: string | null;
  program?: string | null;
  consultationStatus?: string | null;
  source?: string | null;
  fthb?: boolean;
  healthcare?: boolean;
  areasOfInterest?: string | null;
  sequenceId?: string | null;
  sequenceStep?: string | null;
  sequenceNextSend?: string | null;
  createdAt?: string | null;
  lastInteraction?: string | null;
}

interface Stats { total: number; hot: number; warm: number; cold: number; booked: number; }
interface Note { id: string; body: string; timestamp?: string; }

const ROUTE_COLORS: Record<string, string> = {
  Hot: 'bg-red-100 text-red-700 border-red-200',
  Warm: 'bg-orange-100 text-orange-700 border-orange-200',
  Cold: 'bg-blue-100 text-blue-700 border-blue-200',
};

type Tab = 'leads' | 'consultations' | 'content';

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [key, setKey] = useState('');
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>('leads');
  const [filter, setFilter] = useState<'all' | 'hot' | 'warm' | 'cold'>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [newLeadCount, setNewLeadCount] = useState(0);

  // Content generator state
  const [contentType, setContentType] = useState<'social' | 'email' | 'ad'>('social');
  const [contentContext, setContentContext] = useState('');
  const [contentTone, setContentTone] = useState<'professional' | 'friendly' | 'urgent'>('friendly');
  const [contentResult, setContentResult] = useState('');
  const [contentLoading, setContentLoading] = useState(false);

  const fetchLeads = useCallback(async (dashKey: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/dashboard/leads', { headers: { 'x-dashboard-key': dashKey } });
      if (res.status === 401) { setError('Wrong password'); setLoading(false); return; }
      if (!res.ok) { setError('Failed to load leads'); setLoading(false); return; }
      const data = await res.json();
      setLeads(data.leads);
      setStats(data.stats);
      setAuthed(true);
      // Count leads from last 24h
      const oneDayAgo = Date.now() - 86400000;
      setNewLeadCount(data.leads.filter((l: Lead) => new Date(l.createdAt ?? 0).getTime() > oneDayAgo).length);
    } catch { setError('Connection error'); }
    finally { setLoading(false); }
  }, []);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    fetchLeads(key);
  }

  async function fetchNotes(contactId: string) {
    setNotes([]);
    try {
      const res = await fetch(`/api/dashboard/notes?contactId=${contactId}`);
      const data = await res.json();
      setNotes(data.notes ?? []);
    } catch { setNotes([]); }
  }

  async function addNote() {
    if (!selectedLead || !noteInput.trim()) return;
    setNoteLoading(true);
    try {
      await fetch('/api/dashboard/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: selectedLead.id, body: noteInput }),
      });
      setNoteInput('');
      await fetchNotes(selectedLead.id);
    } finally { setNoteLoading(false); }
  }

  async function doAction(action: string, value?: string) {
    if (!selectedLead) return;
    setActionLoading(action);
    try {
      await fetch('/api/dashboard/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: selectedLead.id, action, value }),
      });
      if (action === 'update_consultation') {
        setSelectedLead({ ...selectedLead, consultationStatus: value });
        setLeads((prev) => prev.map((l) => l.id === selectedLead.id ? { ...l, consultationStatus: value } : l));
      }
      if (action === 'mark_contacted') {
        setSelectedLead({ ...selectedLead, lastInteraction: new Date().toISOString() });
      }
    } finally { setActionLoading(''); }
  }

  async function generateContent() {
    if (!contentContext.trim()) return;
    setContentLoading(true);
    setContentResult('');
    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: contentType, context: contentContext, tone: contentTone }),
      });
      const data = await res.json();
      setContentResult(data.content ?? data.text ?? JSON.stringify(data));
    } catch { setContentResult('Generation failed. Check your OpenAI key.'); }
    finally { setContentLoading(false); }
  }

  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    fetchNotes(lead.id);
  };

  const filtered = leads.filter((l) => {
    if (tab === 'consultations') return l.consultationStatus === 'Booked';
    if (filter === 'hot') return l.route === 'Hot';
    if (filter === 'warm') return l.route === 'Warm';
    if (filter === 'cold') return !l.route || l.route === 'Cold';
    return true;
  });

  const portalId = process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID ?? '245763239';

  if (!authed) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <p className="text-center font-serif text-2xl font-bold text-white mb-2">Dynasty Dashboard</p>
          <p className="text-center text-navy-400 text-sm mb-8">Agent access only</p>
          <form onSubmit={handleLogin} className="card space-y-4">
            <div>
              <label className="label">Access Key</label>
              <input type="password" value={key} onChange={(e) => setKey(e.target.value)} className="input-field" placeholder="Enter dashboard key or leave blank" autoFocus />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Loading...' : 'Access Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-navy-900 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <p className="font-serif text-xl font-bold">Dynasty Dashboard</p>
          <p className="text-navy-400 text-xs mt-0.5">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-4">
          {newLeadCount > 0 && (
            <div className="flex items-center gap-1.5 bg-brand-600 rounded-full px-3 py-1 text-xs font-semibold">
              <Bell className="h-3.5 w-3.5" />
              {newLeadCount} new today
            </div>
          )}
          <button onClick={() => fetchLeads(key)} className="flex items-center gap-2 text-sm text-navy-300 hover:text-white transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Total Leads', value: stats.total, icon: Users, color: 'text-navy-700' },
              { label: 'Hot', value: stats.hot, icon: Flame, color: 'text-red-600' },
              { label: 'Warm', value: stats.warm, icon: TrendingUp, color: 'text-orange-500' },
              { label: 'Cold', value: stats.cold, icon: Clock, color: 'text-blue-500' },
              { label: 'Consultations', value: stats.booked, icon: Calendar, color: 'text-green-600' },
            ].map((s) => (
              <div key={s.label} className="card text-center py-4 cursor-pointer hover:shadow-md transition-all" onClick={() => { if (s.label === 'Consultations') setTab('consultations'); else setTab('leads'); }}>
                <s.icon className={`h-5 w-5 mx-auto mb-1 ${s.color}`} />
                <p className="text-2xl font-bold text-navy-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <div className="flex gap-1 border-b border-gray-200">
          {([
            { id: 'leads', label: 'All Leads', icon: Users },
            { id: 'consultations', label: 'Consultations', icon: Calendar },
            { id: 'content', label: 'Content Generator', icon: Zap },
          ] as { id: Tab; label: string; icon: React.ElementType }[]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                tab === t.id ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">

        {/* ── Content Generator Tab ─────────────────────────────────────── */}
        {tab === 'content' && (
          <div className="max-w-2xl space-y-4">
            <div className="card space-y-4">
              <h2 className="font-serif text-xl font-bold text-navy-900">AI Content Generator</h2>
              <p className="text-sm text-gray-500">Generate social posts, emails, and ad copy powered by GPT-4o.</p>

              <div className="grid grid-cols-3 gap-3">
                {(['social', 'email', 'ad'] as const).map((t) => (
                  <button key={t} onClick={() => setContentType(t)} className={cn('rounded-xl border py-2 text-sm font-medium transition-colors', contentType === t ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
                    {t === 'social' ? '📱 Social Post' : t === 'email' ? '📧 Email' : '📣 Ad Copy'}
                  </button>
                ))}
              </div>

              <div>
                <label className="label">Tone</label>
                <select value={contentTone} onChange={(e) => setContentTone(e.target.value as never)} className="input-field">
                  <option value="friendly">Friendly</option>
                  <option value="professional">Professional</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="label">What do you want to promote or say?</label>
                <textarea
                  value={contentContext}
                  onChange={(e) => setContentContext(e.target.value)}
                  className="input-field min-h-[100px]"
                  placeholder="e.g. We have a 3br/2ba home in Baton Rouge at $285k, great school district, first-time buyer friendly..."
                />
              </div>

              <button onClick={generateContent} disabled={contentLoading || !contentContext.trim()} className="btn-primary w-full">
                {contentLoading ? 'Generating...' : 'Generate Content'}
              </button>
            </div>

            {contentResult && (
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-navy-900">Generated Content</p>
                  <button onClick={() => navigator.clipboard.writeText(contentResult)} className="text-xs text-brand-600 hover:text-brand-700">Copy</button>
                </div>
                <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-sans">{contentResult}</pre>
              </div>
            )}
          </div>
        )}

        {/* ── Leads / Consultations Tabs ────────────────────────────────── */}
        {tab !== 'content' && (
          <div className="grid md:grid-cols-3 gap-4">
            {/* Left: Lead list */}
            <div className="md:col-span-2 space-y-3">
              {/* Filter (leads tab only) */}
              {tab === 'leads' && (
                <div className="flex gap-2 flex-wrap">
                  {(['all', 'hot', 'warm', 'cold'] as const).map((f) => (
                    <button key={f} onClick={() => setFilter(f)} className={cn('px-3 py-1 rounded-full text-xs font-medium transition-colors', filter === f ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50')}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                      {f !== 'all' && stats && <span className="ml-1 opacity-70">{f === 'hot' ? stats.hot : f === 'warm' ? stats.warm : stats.cold}</span>}
                    </button>
                  ))}
                </div>
              )}

              {tab === 'consultations' && (
                <p className="text-sm text-gray-500">Leads with a consultation booked.</p>
              )}

              {filtered.length === 0 && (
                <div className="card text-center py-12 text-gray-400 text-sm">
                  {tab === 'consultations' ? 'No consultations booked yet' : 'No leads yet'}
                </div>
              )}

              {filtered.map((lead) => {
                const isNew = new Date(lead.createdAt ?? 0).getTime() > Date.now() - 86400000;
                return (
                  <div
                    key={lead.id}
                    onClick={() => handleSelectLead(lead)}
                    className={cn(
                      'card cursor-pointer hover:shadow-md transition-all border-l-4',
                      lead.route === 'Hot' ? 'border-l-red-500' : lead.route === 'Warm' ? 'border-l-orange-400' : 'border-l-blue-300',
                      selectedLead?.id === lead.id ? 'ring-2 ring-brand-300' : ''
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-navy-900">{lead.name || 'Unknown'}</p>
                          {isNew && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">New</span>}
                          {lead.route && <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', ROUTE_COLORS[lead.route] ?? 'bg-gray-100 text-gray-600')}>{lead.route}</span>}
                          {lead.fthb && <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">FTHB</span>}
                          {lead.healthcare && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Healthcare</span>}
                          {lead.sequenceId && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Seq: step {lead.sequenceStep}</span>}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                          {lead.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>}
                          {lead.email && <span className="flex items-center gap-1 truncate max-w-[180px]"><Mail className="h-3 w-3" />{lead.email}</span>}
                          {lead.intent && <span>{lead.intent}</span>}
                          {lead.timeline && <span>{lead.timeline}</span>}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {lead.score && <><p className="text-lg font-bold text-brand-600">{lead.score}</p><p className="text-xs text-gray-400">score</p></>}
                        {lead.consultationStatus && (
                          <span className={cn('text-xs px-2 py-0.5 rounded-full mt-1 inline-block', lead.consultationStatus === 'Booked' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                            {lead.consultationStatus}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-400">{lead.createdAt ? new Date(lead.createdAt).toLocaleString() : ''} · {lead.source}</p>
                      <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: Detail panel */}
            <div className="space-y-4">
              {selectedLead ? (
                <>
                  {/* Lead info */}
                  <div className="card sticky top-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-serif font-bold text-navy-900 text-lg leading-tight">{selectedLead.name}</p>
                        {selectedLead.route && <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', ROUTE_COLORS[selectedLead.route] ?? '')}>{selectedLead.route} Lead</span>}
                      </div>
                      {selectedLead.score && <div className="text-center"><p className="text-2xl font-bold text-brand-600">{selectedLead.score}</p><p className="text-xs text-gray-400">score</p></div>}
                    </div>

                    {/* Contact buttons */}
                    <div className="space-y-2">
                      {selectedLead.phone && (
                        <a href={`tel:${selectedLead.phone}`} className="btn-primary w-full text-sm flex items-center justify-center gap-2">
                          <Phone className="h-4 w-4" /> Call {selectedLead.phone}
                        </a>
                      )}
                      {selectedLead.email && (
                        <a href={`mailto:${selectedLead.email}`} className="flex items-center justify-center gap-2 w-full rounded-xl border border-gray-200 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <Mail className="h-4 w-4" /> Email {selectedLead.email}
                        </a>
                      )}
                    </div>

                    {/* Fields */}
                    <div className="space-y-1.5 text-sm border-t border-gray-100 pt-3">
                      {[
                        { label: 'Intent', value: selectedLead.intent },
                        { label: 'Timeline', value: selectedLead.timeline },
                        { label: 'Financing', value: selectedLead.financing },
                        { label: 'Program', value: selectedLead.program },
                        { label: 'Areas', value: selectedLead.areasOfInterest },
                        { label: 'Source', value: selectedLead.source },
                        { label: 'Sequence', value: selectedLead.sequenceId ? `${selectedLead.sequenceId} (step ${selectedLead.sequenceStep})` : null },
                        { label: 'Next send', value: selectedLead.sequenceNextSend ? new Date(selectedLead.sequenceNextSend).toLocaleString() : null },
                      ].filter((r) => r.value).map((row) => (
                        <div key={row.label} className="flex justify-between gap-2">
                          <span className="text-gray-400 flex-shrink-0">{row.label}</span>
                          <span className="font-medium text-navy-800 text-right text-xs">{row.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Quick actions */}
                    <div className="border-t border-gray-100 pt-3 space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Actions</p>
                      <button onClick={() => doAction('mark_contacted')} disabled={actionLoading === 'mark_contacted'} className="flex items-center gap-2 w-full rounded-xl border border-gray-200 py-2 px-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {actionLoading === 'mark_contacted' ? 'Saving...' : 'Mark as Contacted'}
                      </button>
                      <div className="flex gap-2">
                        <select
                          className="flex-1 input-field text-xs py-1.5"
                          defaultValue={selectedLead.consultationStatus ?? ''}
                          onChange={(e) => doAction('update_consultation', e.target.value)}
                        >
                          <option value="">Consultation status...</option>
                          <option value="Not Booked">Not Booked</option>
                          <option value="Booked">Booked</option>
                          <option value="Completed">Completed</option>
                          <option value="No Show">No Show</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="card space-y-3">
                    <p className="font-semibold text-navy-900 flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Notes</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {notes.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No notes yet</p>}
                      {notes.map((note) => (
                        <div key={note.id} className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{note.body}</p>
                          {note.timestamp && <p className="text-xs text-gray-400 mt-1">{new Date(parseInt(note.timestamp)).toLocaleString()}</p>}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input value={noteInput} onChange={(e) => setNoteInput(e.target.value)} placeholder="Add a note..." className="input-field flex-1 text-sm py-1.5" onKeyDown={(e) => e.key === 'Enter' && addNote()} />
                      <button onClick={addNote} disabled={noteLoading || !noteInput.trim()} className="btn-primary text-sm px-3 py-1.5">
                        {noteLoading ? '...' : 'Add'}
                      </button>
                    </div>
                  </div>

                  {/* HubSpot deep link */}
                  <a href={`https://app.hubspot.com/contacts/${portalId}/contact/${selectedLead.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full card text-sm text-gray-500 hover:text-brand-600 transition-colors py-2.5">
                    <FileText className="h-4 w-4" /> Full record in HubSpot
                  </a>
                </>
              ) : (
                <div className="card text-center py-12 text-gray-400 text-sm">Click a lead to see details</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
