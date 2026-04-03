'use client';

import { useEffect, useState } from 'react';
import { Phone, Mail, Calendar, TrendingUp, Users, Flame, Clock, RefreshCw, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  route?: string;
  score?: string;
  intent?: string;
  timeline?: string;
  financing?: string;
  program?: string;
  consultationStatus?: string;
  source?: string;
  fthb?: boolean;
  healthcare?: boolean;
  areasOfInterest?: string;
  createdAt?: string;
  lastInteraction?: string;
}

interface Stats {
  total: number;
  hot: number;
  warm: number;
  cold: number;
  booked: number;
}

const ROUTE_COLORS: Record<string, string> = {
  Hot: 'bg-red-100 text-red-700 border-red-200',
  Warm: 'bg-orange-100 text-orange-700 border-orange-200',
  Cold: 'bg-blue-100 text-blue-700 border-blue-200',
};

const CONSULTATION_COLORS: Record<string, string> = {
  Booked: 'bg-green-100 text-green-700',
  'Not Booked': 'bg-gray-100 text-gray-600',
};

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [key, setKey] = useState('');
  const [authed, setAuthed] = useState(false);
  const [filter, setFilter] = useState<'all' | 'hot' | 'warm' | 'cold'>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  async function fetchLeads(dashKey: string) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/dashboard/leads', {
        headers: { 'x-dashboard-key': dashKey },
      });
      if (res.status === 401) { setError('Wrong password'); setLoading(false); return; }
      if (!res.ok) { setError('Failed to load leads'); setLoading(false); return; }
      const data = await res.json();
      setLeads(data.leads);
      setStats(data.stats);
      setAuthed(true);
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    fetchLeads(key);
  }

  const filtered = leads.filter((l) => {
    if (filter === 'hot') return l.route === 'Hot';
    if (filter === 'warm') return l.route === 'Warm';
    if (filter === 'cold') return !l.route || l.route === 'Cold';
    return true;
  });

  const portalId = '245763239';

  if (!authed) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <p className="text-center font-serif text-2xl font-bold text-white mb-2">Dynasty Dashboard</p>
          <p className="text-center text-navy-400 text-sm mb-8">Agent access only</p>
          <form onSubmit={handleLogin} className="card space-y-4">
            <div>
              <label className="label">Access Key</label>
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="input-field"
                placeholder="Enter dashboard key"
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Loading...' : 'Access Dashboard'}
            </button>
            <p className="text-xs text-center text-gray-400">
              Set DASHBOARD_KEY in Vercel env vars to secure this page.
              Leave blank to skip auth during setup.
            </p>
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
          <p className="font-serif text-xl font-bold">Dynasty Lead Dashboard</p>
          <p className="text-navy-400 text-xs mt-0.5">Live from HubSpot · {new Date().toLocaleDateString()}</p>
        </div>
        <button
          onClick={() => fetchLeads(key)}
          className="flex items-center gap-2 text-sm text-navy-300 hover:text-white transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Total Leads', value: stats.total, icon: Users, color: 'text-navy-700' },
              { label: 'Hot', value: stats.hot, icon: Flame, color: 'text-red-600' },
              { label: 'Warm', value: stats.warm, icon: TrendingUp, color: 'text-orange-500' },
              { label: 'Cold', value: stats.cold, icon: Clock, color: 'text-blue-500' },
              { label: 'Consultations Booked', value: stats.booked, icon: Calendar, color: 'text-green-600' },
            ].map((s) => (
              <div key={s.label} className="card text-center">
                <s.icon className={`h-6 w-6 mx-auto mb-1 ${s.color}`} />
                <p className="text-2xl font-bold text-navy-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(['all', 'hot', 'warm', 'cold'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                filter === f ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'all' && stats && (
                <span className="ml-1.5 opacity-70">
                  {f === 'hot' ? stats.hot : f === 'warm' ? stats.warm : stats.cold}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Lead list */}
          <div className="md:col-span-2 space-y-3">
            {filtered.length === 0 && (
              <div className="card text-center py-12 text-gray-400">No leads yet</div>
            )}
            {filtered.map((lead) => (
              <div
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className={cn(
                  'card cursor-pointer hover:shadow-md transition-all border-l-4',
                  lead.route === 'Hot' ? 'border-l-red-500' :
                  lead.route === 'Warm' ? 'border-l-orange-400' : 'border-l-blue-300'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-navy-900">{lead.name || 'Unknown'}</p>
                      {lead.route && (
                        <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', ROUTE_COLORS[lead.route] ?? 'bg-gray-100 text-gray-600')}>
                          {lead.route}
                        </span>
                      )}
                      {lead.fthb && <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">FTHB</span>}
                      {lead.healthcare && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Healthcare</span>}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-500">
                      {lead.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>}
                      {lead.email && <span className="flex items-center gap-1 truncate"><Mail className="h-3 w-3" />{lead.email}</span>}
                      {lead.intent && <span>Intent: {lead.intent}</span>}
                      {lead.timeline && <span>Timeline: {lead.timeline}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {lead.score && <p className="text-lg font-bold text-brand-600">{lead.score}</p>}
                    {lead.score && <p className="text-xs text-gray-400">score</p>}
                    {lead.consultationStatus && (
                      <span className={cn('text-xs px-2 py-0.5 rounded-full mt-1 inline-block', CONSULTATION_COLORS[lead.consultationStatus] ?? 'bg-gray-100 text-gray-600')}>
                        {lead.consultationStatus}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {lead.createdAt ? new Date(lead.createdAt).toLocaleString() : ''} · {lead.source}
                </p>
              </div>
            ))}
          </div>

          {/* Lead detail panel */}
          <div className="space-y-4">
            {selectedLead ? (
              <div className="card sticky top-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-serif font-bold text-navy-900 text-lg">{selectedLead.name}</p>
                    {selectedLead.route && (
                      <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', ROUTE_COLORS[selectedLead.route] ?? '')}>
                        {selectedLead.route} Lead
                      </span>
                    )}
                  </div>
                  {selectedLead.score && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-brand-600">{selectedLead.score}</p>
                      <p className="text-xs text-gray-400">score</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  {selectedLead.phone && (
                    <a href={`tel:${selectedLead.phone}`} className="flex items-center gap-2 text-brand-600 hover:text-brand-700 font-medium">
                      <Phone className="h-4 w-4" /> {selectedLead.phone}
                    </a>
                  )}
                  {selectedLead.email && (
                    <a href={`mailto:${selectedLead.email}`} className="flex items-center gap-2 text-brand-600 hover:text-brand-700 font-medium">
                      <Mail className="h-4 w-4" /> {selectedLead.email}
                    </a>
                  )}
                </div>

                <div className="mt-4 space-y-2 text-sm border-t border-gray-100 pt-4">
                  {[
                    { label: 'Intent', value: selectedLead.intent },
                    { label: 'Timeline', value: selectedLead.timeline },
                    { label: 'Financing', value: selectedLead.financing },
                    { label: 'Program', value: selectedLead.program },
                    { label: 'Areas', value: selectedLead.areasOfInterest },
                    { label: 'Consultation', value: selectedLead.consultationStatus },
                    { label: 'Source', value: selectedLead.source },
                  ].filter((r) => r.value).map((row) => (
                    <div key={row.label} className="flex justify-between gap-2">
                      <span className="text-gray-500">{row.label}</span>
                      <span className="font-medium text-navy-800 text-right">{row.value}</span>
                    </div>
                  ))}
                  {selectedLead.fthb && <div className="flex justify-between"><span className="text-gray-500">FTHB</span><span className="text-brand-600 font-medium">Yes</span></div>}
                  {selectedLead.healthcare && <div className="flex justify-between"><span className="text-gray-500">Healthcare</span><span className="text-purple-600 font-medium">Yes</span></div>}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                  {selectedLead.phone && (
                    <a href={`tel:${selectedLead.phone}`} className="btn-primary w-full text-center text-sm flex items-center justify-center gap-2">
                      <Phone className="h-4 w-4" /> Call Now
                    </a>
                  )}
                  <a
                    href={`https://app.hubspot.com/contacts/${portalId}/contact/${selectedLead.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full rounded-xl border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" /> Open in HubSpot
                  </a>
                </div>

                <p className="text-xs text-gray-400 mt-3 text-center">
                  Added {selectedLead.createdAt ? new Date(selectedLead.createdAt).toLocaleString() : ''}
                </p>
              </div>
            ) : (
              <div className="card text-center py-12 text-gray-400 text-sm">
                Click a lead to see details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
