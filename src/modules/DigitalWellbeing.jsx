import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  ShieldCheck,
  Clock,
  Play,
  Pause,
  Square,
  RotateCcw,
  Lock,
  Plus,
  Trash2,
  Eye,
  X,
  CheckCircle,
  AlertTriangle,
  Sliders,
  Filter,
  Sparkles,
  Activity,
  Database,
  FileText,
  Download,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES = ['Focus', 'Learning', 'Distracting'];

// Domain → Category default rules
const DEFAULT_RULES = [
  { id: 'rule-1', domain: 'github.com', category: 'Focus' },
  { id: 'rule-2', domain: 'overleaf.com', category: 'Focus' },
  { id: 'rule-3', domain: 'docs.python.org', category: 'Focus' },
  { id: 'rule-4', domain: 'coursera.org', category: 'Learning' },
  { id: 'rule-5', domain: 'stackoverflow.com', category: 'Learning' },
  { id: 'rule-6', domain: 'mit.edu', category: 'Learning' },
  { id: 'rule-7', domain: 'ieee.org', category: 'Learning' },
  { id: 'rule-8', domain: 'youtube.com', category: 'Distracting' },
  { id: 'rule-9', domain: 'reddit.com', category: 'Distracting' },
  { id: 'rule-10', domain: 'x.com', category: 'Distracting' },
  { id: 'rule-11', domain: 'instagram.com', category: 'Distracting' },
];

// Pre-loaded sample demo browsing activity records
const DEMO_EVENTS = [
  { id: 'demo-1', domain: 'ieee.org', title: 'IEEE Xplore literature search', durationMinutes: 45, durationSeconds: 2700, timestamp: '2026-10-30T10:15:00', category: 'Learning' },
  { id: 'demo-2', domain: 'github.com', title: 'Campus project code review', durationMinutes: 60, durationSeconds: 3600, timestamp: '2026-10-30T11:30:00', category: 'Focus' },
  { id: 'demo-3', domain: 'coursera.org', title: 'Deep Learning lecture video', durationMinutes: 30, durationSeconds: 1800, timestamp: '2026-10-30T13:45:00', category: 'Learning' },
  { id: 'demo-4', domain: 'youtube.com', title: 'Lofi study music stream', durationMinutes: 25, durationSeconds: 1500, timestamp: '2026-10-30T15:10:00', category: 'Distracting' },
];

// Pre-loaded demo focus sessions
const DEMO_SESSIONS = [
  { id: 'session-demo-1', description: 'Operating Systems Virtual Memory Lab', category: 'Focus', durationMinutes: 35, durationSeconds: 2100, timestamp: '2026-10-30T09:30:00' },
];

// Deterministic samples for Quick Simulate (15m each)
const QUICK_SIM_SAMPLES = [
  { domain: 'github.com', title: 'Pull request code review', durationMinutes: 15, category: 'Focus' },
  { domain: 'coursera.org', title: 'Distributed algorithms lecture', durationMinutes: 15, category: 'Learning' },
  { domain: 'youtube.com', title: 'Tech review clips & study beats', durationMinutes: 15, category: 'Distracting' },
  { domain: 'overleaf.com', title: 'Capstone documentation writing', durationMinutes: 15, category: 'Focus' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeDomain(raw) {
  if (!raw) return '';
  return raw.trim().toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')
    .replace(/[^a-z0-9.\-]/g, '');
}

function formatTimestamp(isoOrDate) {
  try {
    const d = new Date(isoOrDate);
    if (isNaN(d.getTime())) return String(isoOrDate);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return String(isoOrDate);
  }
}

function formatCountdown(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatDuration(totalSeconds) {
  const s = Math.round(totalSeconds || 0);
  if (s <= 0) return '0s';
  const m = Math.floor(s / 60);
  const remSec = s % 60;
  if (m === 0) return `${remSec}s`;
  if (remSec === 0) return `${m}m`;
  return `${m}m ${remSec}s`;
}

function categoryColor(cat) {
  if (cat === 'Focus') return 'var(--brand-green-600)';
  if (cat === 'Learning') return '#0284c7';
  return '#f59e0b';
}

function categoryBadge(cat) {
  if (cat === 'Focus') return 'uni-badge-green';
  if (cat === 'Learning') return 'uni-badge-blue';
  return 'uni-badge-amber';
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Safe localStorage helpers
function loadJSON(key) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; }
}
function saveJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* quota */ }
}
function removeKey(key) {
  try { localStorage.removeItem(key); } catch { /* noop */ }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DigitalWellbeing() {

  // =========================================================================
  // STATE — Distinct concepts (Focus sessions vs Browsing events)
  // =========================================================================

  // 1. Focus Session Timer & History
  const [sessionDescription, setSessionDescription] = useState('');
  const [sessionCategory, setSessionCategory] = useState('Focus');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerState, setTimerState] = useState('idle');           // 'idle' | 'running' | 'paused'
  const intervalRef = useRef(null);

  // Focus Sessions history (stored locally)
  const [focusSessions, setFocusSessions] = useState(() => {
    const saved = loadJSON('universe_wb_sessions');
    return (Array.isArray(saved)) ? saved : [];
  });

  // 2. Domain Classification Rules (user-editable)
  const [rules, setRules] = useState(() => {
    const saved = loadJSON('universe_wb_rules');
    return (Array.isArray(saved) && saved.length > 0) ? saved : DEFAULT_RULES;
  });

  // 3. Browsing Activity Records (simulated — starts EMPTY for a fresh user)
  const [events, setEvents] = useState(() => {
    const saved = loadJSON('universe_wb_events');
    return (Array.isArray(saved)) ? saved : [];
  });

  // 4. Browsing Tracking Status
  const [trackingActive, setTrackingActive] = useState(true);

  // 5. UI State
  const [toast, setToast] = useState(null);                      // { type: 'success'|'warning'|'error', text }
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [timelineView, setTimelineView] = useState('browsing');   // 'browsing' | 'focus' | 'combined'
  const [inspectRecord, setInspectRecord] = useState(null);
  const [showDataModal, setShowDataModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetRulesConfirm, setShowResetRulesConfirm] = useState(false);

  // Simulate Event form
  const [simDomain, setSimDomain] = useState('');
  const [simCategory, setSimCategory] = useState('Focus');
  const [simDuration, setSimDuration] = useState(15);
  const [simTitle, setSimTitle] = useState('');

  // Add Rule form
  const [newRuleDomain, setNewRuleDomain] = useState('');
  const [newRuleCat, setNewRuleCat] = useState('Focus');

  // One-time legacy localStorage cleanup
  useEffect(() => {
    removeKey('universe_wellbeing_events');
    removeKey('universe_wellbeing_rules');
  }, []);

  // =========================================================================
  // PERSISTENCE
  // =========================================================================

  useEffect(() => { saveJSON('universe_wb_rules', rules); }, [rules]);
  useEffect(() => { saveJSON('universe_wb_events', events); }, [events]);
  useEffect(() => { saveJSON('universe_wb_sessions', focusSessions); }, [focusSessions]);

  // =========================================================================
  // TOAST auto-dismiss
  // =========================================================================

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = useCallback((type, text) => setToast({ type, text }), []);

  // =========================================================================
  // FOCUS SESSION TIMER — Elapsed time recorder
  // =========================================================================

  // Cleanup interval on unmount
  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const handleStart = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerState('running');
    intervalRef.current = setInterval(() => {
      setElapsedSeconds(s => s + 1);
    }, 1000);
  }, []);

  const handlePause = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setTimerState('paused');
  }, []);

  const handleResume = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerState('running');
    intervalRef.current = setInterval(() => {
      setElapsedSeconds(s => s + 1);
    }, 1000);
  }, []);

  const handleStop = useCallback(() => {
    if (timerState !== 'running' && timerState !== 'paused') return;
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setTimerState('idle');
    // Record actual elapsed duration in seconds — never round up to whole minutes
    if (elapsedSeconds > 0) {
      const newSession = {
        id: `session-${uid()}`,
        description: sessionDescription.trim() || 'Focus Session',
        category: sessionCategory,
        durationMinutes: Math.round((elapsedSeconds / 60) * 10) / 10,
        durationSeconds: elapsedSeconds,
        timestamp: new Date().toISOString(),
      };
      setFocusSessions(prev => [newSession, ...prev]);
      showToast('success', `Focus session saved: ${formatDuration(elapsedSeconds)} (${sessionCategory}) — "${newSession.description}"`);
    } else {
      showToast('warning', 'Session ended with 0 seconds elapsed. No session saved.');
    }
    setElapsedSeconds(0);
    setSessionDescription('');
  }, [timerState, elapsedSeconds, sessionDescription, sessionCategory, showToast]);

  const handleResetTimer = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setTimerState('idle');
    setElapsedSeconds(0);
  }, []);

  const handleDeleteSession = useCallback((sessionId) => {
    setFocusSessions(prev => prev.filter(s => s.id !== sessionId));
    showToast('success', 'Focus session deleted.');
  }, [showToast]);

  // =========================================================================
  // DOMAIN RULES handlers
  // =========================================================================

  const lookupCategory = useCallback((domain) => {
    const norm = normalizeDomain(domain);
    const r = rules.find(r => normalizeDomain(r.domain) === norm);
    return r ? r.category : null;
  }, [rules]);

  const handleAddRule = useCallback((e) => {
    e.preventDefault();
    const dom = normalizeDomain(newRuleDomain) || newRuleDomain.trim().toLowerCase();
    if (!dom) {
      showToast('error', 'Enter a valid domain like github.com');
      return;
    }
    setRules(prev => {
      const idx = prev.findIndex(r => normalizeDomain(r.domain) === dom);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], category: newRuleCat };
        return copy;
      }
      return [...prev, { id: `rule-${uid()}`, domain: dom, category: newRuleCat }];
    });
    showToast('success', `Rule saved: ${dom} → ${newRuleCat} (applies to subsequent events)`);
    setNewRuleDomain('');
  }, [newRuleDomain, newRuleCat, showToast]);

  const handleChangeRuleCat = useCallback((ruleId, cat) => {
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, category: cat } : r));
    showToast('success', 'Rule category updated (applies to subsequent events)');
  }, [showToast]);

  const handleDeleteRule = useCallback((ruleId) => {
    const r = rules.find(x => x.id === ruleId);
    setRules(prev => prev.filter(x => x.id !== ruleId));
    showToast('success', r ? `Deleted rule for ${r.domain}` : 'Rule deleted');
  }, [rules, showToast]);

  const handleResetRules = useCallback(() => {
    setRules(DEFAULT_RULES);
    setShowResetRulesConfirm(false);
    showToast('success', 'Domain rules restored to defaults');
  }, [showToast]);

  const handleUpdateEventCategory = useCallback((eventId, newCat) => {
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, category: newCat } : e));
    showToast('success', `Event category changed to ${newCat}`);
  }, [showToast]);

  // =========================================================================
  // DERIVED METRICS — Separate sources of truth
  // =========================================================================

  // 1. Focus session metrics (derived ONLY from focusSessions, stored in exact seconds)
  const focusMetrics = useMemo(() => {
    const totalSec = focusSessions.reduce((sum, s) => {
      const sec = s.durationSeconds !== undefined ? Number(s.durationSeconds) : (Number(s.durationMinutes) || 0) * 60;
      return sum + (isNaN(sec) ? 0 : sec);
    }, 0);
    return {
      count: focusSessions.length,
      totalSec,
      totalMin: Math.floor(totalSec / 60),
    };
  }, [focusSessions]);

  // 2. Browsing event metrics (derived ONLY from events, calculated in exact seconds)
  const browsingMetrics = useMemo(() => {
    // Sort chronologically for context switch calculation
    const sorted = [...events].sort((a, b) => {
      const ta = new Date(a.timestamp).getTime();
      const tb = new Date(b.timestamp).getTime();
      if (!isNaN(ta) && !isNaN(tb)) return ta - tb;
      return 0; // preserve insertion order if timestamps aren't parseable
    });

    let contextSwitches = 0;
    let distractionInterruptions = 0;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].category !== sorted[i - 1].category) {
        contextSwitches++;
        if (sorted[i].category === 'Distracting') distractionInterruptions++;
      }
    }

    const getSec = (e) => (e.durationSeconds !== undefined ? Number(e.durationSeconds) : (Number(e.durationMinutes) || 0) * 60);

    const focusSec = sorted.filter(e => e.category === 'Focus').reduce((s, e) => s + getSec(e), 0);
    const learnSec = sorted.filter(e => e.category === 'Learning').reduce((s, e) => s + getSec(e), 0);
    const distractSec = sorted.filter(e => e.category === 'Distracting').reduce((s, e) => s + getSec(e), 0);
    const totalSec = focusSec + learnSec + distractSec;
    const productiveSec = focusSec + learnSec;

    const focusMin = Math.round(focusSec / 60);
    const learnMin = Math.round(learnSec / 60);
    const distractMin = Math.round(distractSec / 60);
    const totalMin = Math.round(totalSec / 60);
    const productiveMin = Math.round(productiveSec / 60);

    const pct = (sec) => totalSec > 0 ? (sec / totalSec) * 100 : 0;

    return {
      sorted,
      eventCount: sorted.length,
      contextSwitches,
      distractionInterruptions,
      totalSec, focusSec, learnSec, distractSec, productiveSec,
      totalMin, focusMin, learnMin, distractMin, productiveMin,
      focusPct: pct(focusSec),
      learnPct: pct(learnSec),
      distractPct: pct(distractSec),
      productivePct: pct(productiveSec),
    };
  }, [events]);

  // Combined chronological timeline items
  const combinedTimeline = useMemo(() => {
    const list = [
      ...events.map(e => ({
        id: e.id,
        recordType: 'browsing',
        name: e.domain + (e.title ? ` · ${e.title}` : ''),
        category: e.category,
        durationSeconds: e.durationSeconds !== undefined ? Number(e.durationSeconds) : (Number(e.durationMinutes) || 0) * 60,
        timestamp: e.timestamp,
      })),
      ...focusSessions.map(s => ({
        id: s.id,
        recordType: 'focusSession',
        name: s.description || 'Focus Session',
        category: s.category,
        durationSeconds: s.durationSeconds !== undefined ? Number(s.durationSeconds) : (Number(s.durationMinutes) || 0) * 60,
        timestamp: s.timestamp,
      })),
    ];
    return list.sort((a, b) => {
      const ta = new Date(a.timestamp).getTime();
      const tb = new Date(b.timestamp).getTime();
      if (!isNaN(ta) && !isNaN(tb)) return ta - tb;
      return 0;
    });
  }, [events, focusSessions]);

  const filteredEvents = useMemo(() => {
    if (categoryFilter === 'All') return browsingMetrics.sorted;
    return browsingMetrics.sorted.filter(e => e.category === categoryFilter);
  }, [browsingMetrics.sorted, categoryFilter]);

  // =========================================================================
  // SIMULATE EVENT handlers
  // =========================================================================

  const simTemplateIdx = useRef(0);

  // Deterministic Quick Simulate handler (15 minutes constant, deterministic sample cycling)
  const handleQuickSimulate = useCallback(() => {
    if (!trackingActive) {
      showToast('warning', 'Browsing tracking is paused. Resume tracking to simulate events.');
      return;
    }
    const sample = QUICK_SIM_SAMPLES[simTemplateIdx.current % QUICK_SIM_SAMPLES.length];
    simTemplateIdx.current++;
    const cat = lookupCategory(sample.domain) || sample.category;
    const entry = {
      id: `evt-${uid()}`,
      domain: sample.domain,
      title: sample.title,
      durationMinutes: sample.durationMinutes,
      durationSeconds: sample.durationMinutes * 60,
      category: cat,
      timestamp: new Date().toISOString(),
    };
    setEvents(prev => [...prev, entry]);
    showToast('success', `Quick simulated: ${sample.domain} · ${sample.durationMinutes}m · ${cat}`);
  }, [trackingActive, lookupCategory, showToast]);

  // Normal Simulate Event handler (strictly uses entered values, one click = one record)
  const handleSimulateCustom = useCallback((e) => {
    e.preventDefault();
    if (!trackingActive) {
      showToast('warning', 'Browsing tracking is paused. Resume tracking to simulate events.');
      return;
    }
    const trimmedDom = simDomain.trim();
    if (!trimmedDom) {
      showToast('error', 'Please enter a domain');
      return;
    }
    const dom = normalizeDomain(trimmedDom) || trimmedDom.toLowerCase();
    const dur = Math.max(1, Math.min(1440, Number(simDuration) || 15));
    const title = simTitle.trim() || `Activity on ${dom}`;
    
    // Explicit category if user selected Focus, Learning, Distracting; or lookup rule if Rule chosen
    let cat = simCategory;
    if (!cat || cat === 'Rule') {
      cat = lookupCategory(dom) || 'Focus';
    }

    const entry = {
      id: `evt-${uid()}`,
      domain: dom,
      title,
      durationMinutes: dur,
      durationSeconds: dur * 60,
      category: cat,
      timestamp: new Date().toISOString(),
    };
    setEvents(prev => [...prev, entry]);
    showToast('success', `Simulated: ${dom} · ${dur}m · ${cat}`);
    setSimDomain('');
    setSimTitle('');
    setSimDuration(15);
    setSimCategory('Focus');
  }, [trackingActive, simDomain, simCategory, simDuration, simTitle, lookupCategory, showToast]);

  // =========================================================================
  // PRIVACY / DATA handlers
  // =========================================================================

  const handleDeleteAllData = useCallback(() => {
    setEvents([]);
    setFocusSessions([]);
    removeKey('universe_wb_events');
    removeKey('universe_wb_sessions');
    removeKey('universe_wellbeing_events');
    removeKey('universe_wellbeing_rules');
    setShowDeleteConfirm(false);
    setInspectRecord(null);
    showToast('success', 'All activity records and focus sessions permanently deleted.');
  }, [showToast]);

  const handleLoadDemoData = useCallback(() => {
    setEvents(DEMO_EVENTS);
    setFocusSessions(DEMO_SESSIONS);
    showToast('success', 'Demo data loaded (4 browsing events, 1 focus session).');
  }, [showToast]);

  const handleDeleteSingleEvent = useCallback((id) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    if (inspectRecord?.id === id) setInspectRecord(null);
    showToast('success', 'Browsing event deleted.');
  }, [inspectRecord, showToast]);

  const handleToggleTracking = useCallback(() => {
    setTrackingActive(prev => {
      const next = !prev;
      showToast(next ? 'success' : 'warning', next ? 'Browsing tracking resumed. Simulated events will be recorded.' : 'Browsing tracking paused. Simulated events are blocked.');
      return next;
    });
  }, [showToast]);

  // =========================================================================
  // RENDER
  // =========================================================================

  const activeInspect = inspectRecord ? (events.find(e => e.id === inspectRecord.id) || inspectRecord) : null;

  return (
    <div className="digital-wellbeing-module">

      {/* ================================================================= */}
      {/* PRIVACY BANNER                                                     */}
      {/* ================================================================= */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
        padding: '12px 18px', backgroundColor: '#f0fdf4', border: '1px solid var(--brand-green-200)',
        borderRadius: 'var(--radius-md)', marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 300px' }}>
          <ShieldCheck size={20} color="var(--brand-green-700)" />
          <div>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--brand-green-800)', textTransform: 'uppercase', display: 'block' }}>
              SIMULATED DATA · ON-DEVICE PRIVACY ONLY
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              All activity is simulated sample data stored in your browser. UniVerse never monitors real browsing history, page contents, or credentials.
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span className={`uni-badge ${trackingActive ? 'uni-badge-green' : 'uni-badge-neutral'}`} style={{ fontSize: '0.76rem' }}>
            {trackingActive ? '● Tracking Active' : '○ Tracking Paused'}
          </span>
          <button type="button" className="uni-btn uni-btn-secondary uni-btn-sm" onClick={handleToggleTracking} aria-label={trackingActive ? 'Pause tracking' : 'Resume tracking'}>
            {trackingActive ? <><Pause size={13} /><span>Pause Tracking</span></> : <><Play size={13} /><span>Resume Tracking</span></>}
          </button>
          <button type="button" className="uni-btn uni-btn-secondary uni-btn-sm" onClick={() => setShowDataModal(true)} aria-label="Inspect stored data">
            <Database size={13} /><span>Inspect Stored Data</span>
          </button>
        </div>
      </div>

      {/* TOAST */}
      {toast && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px',
          backgroundColor: toast.type === 'success' ? '#f0fdf4' : toast.type === 'warning' ? '#fffbeb' : '#fef2f2',
          border: `1px solid ${toast.type === 'success' ? 'var(--brand-green-200)' : toast.type === 'warning' ? '#fde68a' : '#fecaca'}`,
          borderRadius: 'var(--radius-sm)', marginBottom: '18px', fontSize: '0.82rem',
          color: toast.type === 'success' ? 'var(--brand-green-800)' : toast.type === 'warning' ? '#b45309' : '#b91c1c',
        }}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : toast.type === 'warning' ? <AlertTriangle size={16} /> : <AlertTriangle size={16} />}
          <span style={{ flex: 1 }}>{toast.text}</span>
          <button type="button" onClick={() => setToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }} aria-label="Dismiss"><X size={14} /></button>
        </div>
      )}

      {/* ================================================================= */}
      {/* FOCUS SESSION TIMER                                                */}
      {/* ================================================================= */}
      <div className="uni-card" style={{ marginBottom: '24px' }}>
        <div className="uni-card-header">
          <div className="uni-card-title"><Clock size={18} color="var(--brand-green-700)" /><span>Focus Session Timer</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`uni-badge ${
              timerState === 'running' ? 'uni-badge-green' :
              timerState === 'paused' ? 'uni-badge-amber' : 'uni-badge-neutral'
            }`}>
              {timerState === 'running' ? 'Running' : timerState === 'paused' ? 'Paused' : 'Ready'}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Completed sessions: <strong>{focusMetrics.count}</strong>
            </span>
          </div>
        </div>
        <div className="uni-card-body">
          {/* Work description and category input */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px', padding: '14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 240px' }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Work Description</label>
              <input
                type="text"
                className="uni-input"
                placeholder="What are you focusing on? e.g. Reading Operating Systems Ch. 4"
                value={sessionDescription}
                onChange={e => setSessionDescription(e.target.value)}
                disabled={timerState === 'running'}
                style={{ width: '100%' }}
                aria-label="Focus work description"
              />
            </div>
            <div style={{ width: '150px' }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Session Category</label>
              <select
                className="uni-input"
                value={sessionCategory}
                onChange={e => setSessionCategory(e.target.value)}
                disabled={timerState === 'running'}
                style={{ width: '100%' }}
                aria-label="Focus session category"
              >
                <option value="Focus">Focus</option>
                <option value="Learning">Learning</option>
                <option value="Distracting">Distracting</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px', marginBottom: '16px' }}>
            {/* Left: Elapsed timer display */}
            <div>
              <div style={{
                fontSize: '3.2rem', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.04em',
                color: timerState === 'running' ? 'var(--brand-green-800)' : 'var(--text-primary)',
                lineHeight: 1.1,
              }}>
                {formatCountdown(elapsedSeconds)}
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                {timerState === 'running' && <span>Active session — recording elapsed time…</span>}
                {timerState === 'paused' && <span>Paused · {formatCountdown(elapsedSeconds)} recorded</span>}
                {timerState === 'idle' && <span>Enter a work description, select category, and click Start Session.</span>}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                Only actual elapsed time is recorded when stopped. Stored separately from browsing activity.
              </div>
            </div>

            {/* Right: Controls */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {timerState === 'idle' && (
                <button type="button" className="uni-btn uni-btn-primary" onClick={handleStart}><Play size={16} /><span>Start Session</span></button>
              )}
              {timerState === 'running' && (
                <button type="button" className="uni-btn uni-btn-secondary" onClick={handlePause}><Pause size={16} /><span>Pause</span></button>
              )}
              {timerState === 'paused' && (
                <button type="button" className="uni-btn uni-btn-primary" onClick={handleResume}><Play size={16} /><span>Resume</span></button>
              )}
              {(timerState === 'running' || timerState === 'paused') && (
                <button type="button" className="uni-btn uni-btn-secondary" onClick={handleStop} style={{ color: '#dc2626' }}><Square size={16} /><span>Stop & Record</span></button>
              )}
              {timerState === 'paused' && (
                <button type="button" className="uni-btn uni-btn-secondary" onClick={handleResetTimer}><RotateCcw size={16} /><span>Reset</span></button>
              )}
            </div>
          </div>

          {/* Focus Session History */}
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', marginTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Focus Session History</div>
              <span className="uni-badge uni-badge-neutral">{focusSessions.length} Sessions</span>
            </div>
            {focusSessions.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                No focus sessions recorded yet. Start a session above to record your focus time.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                {focusSessions.map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xs)', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: 'var(--text-muted)', minWidth: 55, fontSize: '0.75rem' }}>{formatTimestamp(s.timestamp)}</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{s.description}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className={`uni-badge ${categoryBadge(s.category)}`}>{s.category}</span>
                      <span style={{ fontWeight: 600, color: 'var(--brand-green-800)' }}>
                        {formatDuration(s.durationSeconds !== undefined ? s.durationSeconds : (s.durationMinutes || 0) * 60)}
                      </span>
                      <button type="button" onClick={() => handleDeleteSession(s.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 2 }} aria-label={`Delete ${s.description}`}><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* METRIC CARDS                                                       */}
      {/* ================================================================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Focus Session Duration */}
        <div className="uni-card" style={{ padding: '16px 20px', borderLeft: '3px solid var(--brand-green-600)' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>Focus Session Duration</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--brand-green-800)', margin: '4px 0' }}>
            {focusMetrics.totalSec === 0 ? '0s' : focusMetrics.totalSec < 60 ? `${focusMetrics.totalSec} seconds` : formatDuration(focusMetrics.totalSec)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {focusMetrics.totalSec}s total ({focusMetrics.count} recorded focus session{focusMetrics.count !== 1 ? 's' : ''})
          </div>
        </div>

        {/* Browsing Activity Duration */}
        <div className="uni-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>Browsing Activity Duration</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0' }}>
            {browsingMetrics.totalSec === 0 ? '0s' : browsingMetrics.totalSec < 60 ? `${browsingMetrics.totalSec} seconds` : formatDuration(browsingMetrics.totalSec)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {browsingMetrics.totalMin} mins total · {browsingMetrics.eventCount} simulated browsing event{browsingMetrics.eventCount !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Context Switches */}
        <div className="uni-card" style={{ padding: '16px 20px', borderLeft: '3px solid #0284c7' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>Context Switches</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0369a1', margin: '4px 0' }}>
            {browsingMetrics.contextSwitches} <span style={{ fontSize: '0.9rem' }}>switches</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {browsingMetrics.distractionInterruptions} distraction interruption{browsingMetrics.distractionInterruptions !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Distracting Browsing Time */}
        <div className="uni-card" style={{ padding: '16px 20px', borderLeft: '3px solid #f59e0b' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>Distracting Browsing Time</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#b45309', margin: '4px 0' }}>
            {browsingMetrics.distractSec === 0 ? '0s' : browsingMetrics.distractSec < 60 ? `${browsingMetrics.distractSec}s` : formatDuration(browsingMetrics.distractSec)}{' '}
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>({browsingMetrics.distractPct.toFixed(1)}%)</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {browsingMetrics.distractMin} mins total · leisure & social browsing
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* CHARTS: Category Allocation + Cognitive Rhythm Timeline             */}
      {/* ================================================================= */}
      <div className="uni-grid-2" style={{ gap: '20px', marginBottom: '24px' }}>
        {/* Category Allocation */}
        <div className="uni-card">
          <div className="uni-card-header">
            <div className="uni-card-title"><Activity size={18} color="var(--brand-green-700)" /><span>Category Time Allocation</span></div>
            <span className="uni-badge uni-badge-neutral">Productive: {browsingMetrics.productivePct.toFixed(1)}%</span>
          </div>
          <div className="uni-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Stacked bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600 }}>Browsing Time Proportion</span>
                <span style={{ color: 'var(--text-muted)' }}>{formatDuration(browsingMetrics.totalSec)} total ({browsingMetrics.totalMin}m)</span>
              </div>
              <div style={{ height: '20px', width: '100%', background: 'var(--slate-100)', borderRadius: 'var(--radius-sm)', display: 'flex', overflow: 'hidden' }}>
                {browsingMetrics.totalSec > 0 ? <>
                  <div style={{ width: `${browsingMetrics.focusPct}%`, background: 'var(--brand-green-600)', height: '100%', transition: 'width 250ms ease' }} title={`Focus: ${formatDuration(browsingMetrics.focusSec)}`} />
                  <div style={{ width: `${browsingMetrics.learnPct}%`, background: '#0284c7', height: '100%', transition: 'width 250ms ease' }} title={`Learning: ${formatDuration(browsingMetrics.learnSec)}`} />
                  <div style={{ width: `${browsingMetrics.distractPct}%`, background: '#f59e0b', height: '100%', transition: 'width 250ms ease' }} title={`Distracting: ${formatDuration(browsingMetrics.distractSec)}`} />
                </> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.74rem', color: 'var(--text-muted)' }}>No recorded browsing events</div>}
              </div>
            </div>
            {/* Legend rows */}
            {[
              { label: 'Focus', sec: browsingMetrics.focusSec, pct: browsingMetrics.focusPct, color: 'var(--brand-green-600)' },
              { label: 'Learning', sec: browsingMetrics.learnSec, pct: browsingMetrics.learnPct, color: '#0284c7' },
              { label: 'Distracting', sec: browsingMetrics.distractSec, pct: browsingMetrics.distractPct, color: '#f59e0b' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: row.color }} />
                  <span style={{ fontWeight: 600 }}>{row.label}</span>
                </div>
                <span><strong>{formatDuration(row.sec)}</strong> ({row.pct.toFixed(1)}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cognitive Rhythm Timeline */}
        <div className="uni-card">
          <div className="uni-card-header" style={{ flexWrap: 'wrap', gap: '8px' }}>
            <div className="uni-card-title"><Clock size={18} color="var(--brand-green-700)" /><span>Cognitive Rhythm Timeline</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                className={`uni-btn uni-btn-sm ${timelineView === 'browsing' ? 'uni-btn-primary' : 'uni-btn-secondary'}`}
                style={{ fontSize: '0.74rem', padding: '2px 8px' }}
                onClick={() => setTimelineView('browsing')}
              >
                Browsing ({browsingMetrics.eventCount})
              </button>
              <button
                type="button"
                className={`uni-btn uni-btn-sm ${timelineView === 'focus' ? 'uni-btn-primary' : 'uni-btn-secondary'}`}
                style={{ fontSize: '0.74rem', padding: '2px 8px' }}
                onClick={() => setTimelineView('focus')}
              >
                Focus ({focusMetrics.count})
              </button>
              <button
                type="button"
                className={`uni-btn uni-btn-sm ${timelineView === 'combined' ? 'uni-btn-primary' : 'uni-btn-secondary'}`}
                style={{ fontSize: '0.74rem', padding: '2px 8px' }}
                onClick={() => setTimelineView('combined')}
              >
                Combined ({browsingMetrics.eventCount + focusMetrics.count})
              </button>
            </div>
          </div>
          <div className="uni-card-body" style={{ maxHeight: '320px', overflowY: 'auto', padding: '14px 20px' }}>
            {timelineView === 'browsing' && (
              browsingMetrics.sorted.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                  No browsing events recorded. Use "Simulate Browsing Event" or "Load Demo Data" below.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {browsingMetrics.sorted.map((evt, idx) => {
                    const isSwitch = idx > 0 && browsingMetrics.sorted[idx - 1].category !== evt.category;
                    return (
                      <React.Fragment key={evt.id}>
                        {isSwitch && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '2px 0', fontSize: '0.74rem', color: '#b45309', fontWeight: 600 }}>
                            <span style={{ height: 1, flex: 1, background: '#fde68a' }} />
                            <span>⚡ {browsingMetrics.sorted[idx - 1].category} → {evt.category}</span>
                            <span style={{ height: 1, flex: 1, background: '#fde68a' }} />
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-light)', background: 'var(--bg-canvas)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: 58 }}>{formatTimestamp(evt.timestamp)}</span>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{evt.domain}</span>
                            {evt.title && <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>— {evt.title}</span>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className={`uni-badge ${categoryBadge(evt.category)}`}>{evt.category}</span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                              {formatDuration(evt.durationSeconds !== undefined ? evt.durationSeconds : (evt.durationMinutes || 0) * 60)}
                            </span>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              )
            )}

            {timelineView === 'focus' && (
              focusSessions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                  No focus sessions recorded yet. Start and complete a focus session above.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[...focusSessions].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).map((s) => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-light)', background: 'var(--bg-canvas)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: 58 }}>{formatTimestamp(s.timestamp)}</span>
                        <strong style={{ fontSize: '0.82rem', color: 'var(--brand-green-800)' }}>{s.description || 'Focus Session'}</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className={`uni-badge ${categoryBadge(s.category)}`}>{s.category}</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                          {formatDuration(s.durationSeconds !== undefined ? s.durationSeconds : (s.durationMinutes || 0) * 60)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {timelineView === 'combined' && (
              combinedTimeline.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                  No activity or focus session records available.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {combinedTimeline.map((item) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-light)', background: item.recordType === 'focusSession' ? '#f0fdf4' : 'var(--bg-canvas)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: 58 }}>{formatTimestamp(item.timestamp)}</span>
                        <span className={`uni-badge ${item.recordType === 'focusSession' ? 'uni-badge-green' : 'uni-badge-neutral'}`} style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
                          {item.recordType === 'focusSession' ? 'Focus Session' : 'Browsing'}
                        </span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className={`uni-badge ${categoryBadge(item.category)}`}>{item.category}</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                          {formatDuration(item.durationSeconds)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* SIMULATE BROWSING EVENT                                            */}
      {/* ================================================================= */}
      <div className="uni-card" style={{ marginBottom: '24px' }}>
        <div className="uni-card-header">
          <div>
            <div className="uni-card-title"><Sparkles size={18} color="var(--brand-green-700)" /><span>Simulate Browsing Event</span></div>
            <div className="uni-card-desc">Add test activity records. Enter domain, activity, category, and duration directly, or use quick sample simulation.</div>
          </div>
        </div>
        <div className="uni-card-body">
          {/* Quick simulate button row */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button type="button" className="uni-btn uni-btn-primary uni-btn-sm" onClick={handleQuickSimulate} disabled={!trackingActive} style={{ opacity: trackingActive ? 1 : 0.5 }}>
              <Sparkles size={14} /><span>Quick Simulate (15m Sample)</span>
            </button>
            <button type="button" className="uni-btn uni-btn-secondary uni-btn-sm" onClick={handleLoadDemoData}>
              <Download size={14} /><span>Load Demo Data</span>
            </button>
            <button type="button" className="uni-btn uni-btn-secondary uni-btn-sm" onClick={() => setShowDeleteConfirm(true)} style={{ color: '#dc2626' }}>
              <Trash2 size={14} /><span>Clear All Data</span>
            </button>
            {!trackingActive && <span style={{ fontSize: '0.78rem', color: '#b45309' }}>⚠ Browsing tracking paused — simulated events are blocked</span>}
          </div>

          {/* Custom simulate form */}
          <form onSubmit={handleSimulateCustom} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end', padding: '14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ flex: '1 1 150px' }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Domain</label>
              <input type="text" className="uni-input" placeholder="e.g. github.com" value={simDomain} onChange={e => setSimDomain(e.target.value)} style={{ width: '100%' }} required aria-label="Simulation domain" />
            </div>
            <div style={{ flex: '1 1 180px' }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Activity Description</label>
              <input type="text" className="uni-input" placeholder="e.g. Reviewing pull request #42" value={simTitle} onChange={e => setSimTitle(e.target.value)} style={{ width: '100%' }} aria-label="Activity description" />
            </div>
            <div style={{ width: '100px' }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Duration (min)</label>
              <input type="number" min="1" max="1440" className="uni-input" value={simDuration} onChange={e => setSimDuration(e.target.value)} style={{ width: '100%' }} required aria-label="Duration in minutes" />
            </div>
            <div style={{ width: '150px' }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Category</label>
              <select className="uni-input" value={simCategory} onChange={e => setSimCategory(e.target.value)} style={{ width: '100%' }} aria-label="Category selection">
                <option value="Focus">Focus</option>
                <option value="Learning">Learning</option>
                <option value="Distracting">Distracting</option>
                <option value="Rule">Use Domain Rule (Auto)</option>
              </select>
            </div>
            <button type="submit" className="uni-btn uni-btn-primary uni-btn-sm" disabled={!trackingActive} style={{ opacity: trackingActive ? 1 : 0.5, alignSelf: 'flex-end' }}>
              <Plus size={14} /><span>Simulate Event</span>
            </button>
          </form>
        </div>
      </div>

      {/* ================================================================= */}
      {/* DOMAIN CLASSIFICATION RULES                                        */}
      {/* ================================================================= */}
      <div className="uni-card" style={{ marginBottom: '24px' }}>
        <div className="uni-card-header">
          <div>
            <div className="uni-card-title"><Sliders size={18} color="var(--brand-green-700)" /><span>Domain Classification Rules</span></div>
            <div className="uni-card-desc">Rules determine the category for newly simulated events. Existing records keep their recorded categories.</div>
          </div>
          <button type="button" className="uni-btn uni-btn-secondary uni-btn-sm" onClick={() => setShowResetRulesConfirm(true)}>
            <RotateCcw size={13} /><span>Reset Rules</span>
          </button>
        </div>
        <div className="uni-card-body">
          {/* Add rule form */}
          <form onSubmit={handleAddRule} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px', padding: '14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Domain</label>
              <input type="text" className="uni-input" placeholder="e.g. leetcode.com" value={newRuleDomain} onChange={e => setNewRuleDomain(e.target.value)} style={{ width: '100%' }} aria-label="New rule domain" />
            </div>
            <div style={{ width: '160px' }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Category</label>
              <select className="uni-input" value={newRuleCat} onChange={e => setNewRuleCat(e.target.value)} style={{ width: '100%' }} aria-label="New rule category">
                <option value="Focus">Focus</option>
                <option value="Learning">Learning</option>
                <option value="Distracting">Distracting</option>
              </select>
            </div>
            <button type="submit" className="uni-btn uni-btn-primary uni-btn-sm"><Plus size={14} /><span>Add / Update Rule</span></button>
          </form>

          {/* Rules grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
            {rules.map(rule => (
              <div key={rule.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>{rule.domain}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <select value={rule.category} onChange={e => handleChangeRuleCat(rule.id, e.target.value)} className="uni-input" style={{ padding: '2px 6px', fontSize: '0.74rem', fontWeight: 600, borderRadius: 'var(--radius-xs)', background: 'var(--bg-subtle)', minWidth: '90px' }} aria-label={`Category for ${rule.domain}`}>
                    <option value="Focus">Focus</option>
                    <option value="Learning">Learning</option>
                    <option value="Distracting">Distracting</option>
                  </select>
                  <button type="button" onClick={() => handleDeleteRule(rule.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '2px 4px', display: 'flex' }} aria-label={`Delete rule for ${rule.domain}`}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* RECENT EVENTS TABLE                                                */}
      {/* ================================================================= */}
      <div className="uni-card" style={{ marginBottom: '24px' }}>
        <div className="uni-card-header">
          <div>
            <div className="uni-card-title"><Lock size={18} color="var(--brand-green-700)" /><span>Browsing Activity Records</span></div>
            <div className="uni-card-desc">All records are simulated sample data stored locally in your browser.</div>
          </div>
        </div>

        {/* Filter row */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} color="var(--text-muted)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '4px' }}>Filter:</span>
            {['All', ...CATEGORIES].map(cat => (
              <button key={cat} type="button" className={`uni-btn uni-btn-sm ${categoryFilter === cat ? 'uni-btn-primary' : 'uni-btn-secondary'}`} style={{ fontSize: '0.76rem', padding: '3px 8px' }} onClick={() => setCategoryFilter(cat)} aria-pressed={categoryFilter === cat}>{cat}</button>
            ))}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Showing <strong>{filteredEvents.length}</strong> of {browsingMetrics.eventCount}
          </span>
        </div>

        {/* Table */}
        <div style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', textAlign: 'left', borderBottom: '1px solid var(--border-default)' }}>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Time</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Domain</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Activity</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Category</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Duration</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No browsing events to display.{' '}
                  <button type="button" className="uni-btn uni-btn-primary uni-btn-sm" onClick={handleLoadDemoData} style={{ marginLeft: 8 }}><Download size={13} /><span>Load Demo Data</span></button>
                </td></tr>
              ) : filteredEvents.map(evt => (
                <tr key={evt.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{formatTimestamp(evt.timestamp)}</td>
                  <td style={{ padding: '12px 16px' }}><code className="code-pill">{evt.domain}</code></td>
                  <td style={{ padding: '12px 16px' }}><strong style={{ color: 'var(--text-primary)' }}>{evt.title}</strong></td>
                  <td style={{ padding: '8px 16px' }}>
                    <select
                      value={evt.category}
                      onChange={e => handleUpdateEventCategory(evt.id, e.target.value)}
                      className="uni-input"
                      style={{
                        padding: '3px 8px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: evt.category === 'Focus' ? 'var(--brand-green-50)' : evt.category === 'Learning' ? 'var(--accent-blue-50)' : '#fffbeb',
                        color: evt.category === 'Focus' ? 'var(--brand-green-700)' : evt.category === 'Learning' ? 'var(--accent-blue-700)' : '#b45309',
                        borderColor: evt.category === 'Focus' ? 'var(--brand-green-200)' : evt.category === 'Learning' ? 'var(--accent-blue-100)' : '#fde68a',
                        cursor: 'pointer',
                        width: 'auto',
                        minWidth: '105px',
                      }}
                      aria-label={`Category for ${evt.domain}`}
                    >
                      <option value="Focus">Focus</option>
                      <option value="Learning">Learning</option>
                      <option value="Distracting">Distracting</option>
                    </select>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                    {formatDuration(evt.durationSeconds !== undefined ? evt.durationSeconds : (evt.durationMinutes || 0) * 60)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button type="button" className="uni-btn uni-btn-secondary uni-btn-sm" onClick={() => setInspectRecord(evt)} style={{ marginRight: 6 }} aria-label={`Inspect ${evt.title}`}><Eye size={13} /><span>Inspect</span></button>
                    <button type="button" onClick={() => handleDeleteSingleEvent(evt.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }} aria-label={`Delete ${evt.title}`}><Trash2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
            {filteredEvents.length > 0 && (
              <tfoot style={{ borderTop: '2px solid var(--border-default)', background: 'var(--bg-subtle)', fontWeight: 600 }}>
                <tr>
                  <td style={{ padding: '12px 16px' }}>Total ({filteredEvents.length})</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>—</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>—</td>
                  <td style={{ padding: '12px 16px' }}><span style={{ fontSize: '0.78rem' }}>{browsingMetrics.contextSwitches} transitions</span></td>
                  <td style={{ padding: '12px 16px', color: 'var(--brand-green-800)' }}>
                    {formatDuration(filteredEvents.reduce((s, e) => s + (e.durationSeconds !== undefined ? e.durationSeconds : (e.durationMinutes || 0) * 60), 0))}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Zero server egress</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ================================================================= */}
      {/* MATHEMATICAL MODEL                                                 */}
      {/* ================================================================= */}
      <div className="uni-card">
        <div className="uni-card-header">
          <div className="uni-card-title"><FileText size={18} color="var(--brand-green-700)" /><span>Metrics & Privacy Model</span></div>
        </div>
        <div className="uni-card-body">
          <div className="uni-grid-3" style={{ gap: '16px' }}>
            <div style={{ padding: 14, background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--brand-green-800)', marginBottom: 4 }}>1. Context Switches</div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                <code>Switches = Σ I(Cat[i] ≠ Cat[i-1])</code><br /><br />
                Counted over chronologically sorted events. The first event is never a switch.
              </p>
            </div>
            <div style={{ padding: 14, background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--brand-green-800)', marginBottom: 4 }}>2. Productive Ratio</div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                <code>Productive = Focus + Learning</code><br /><br />
                <code>Ratio = Productive / Total × 100%</code><br /><br />
                Durations sum from recorded event minutes. Returns 0% when no events exist.
              </p>
            </div>
            <div style={{ padding: 14, background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--brand-green-800)', marginBottom: 4 }}>3. Zero-Egress Privacy</div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                <code>Network Egress: 0 Bytes</code><br /><br />
                All data stored in browser localStorage keys <code>universe_wb_events</code>, <code>universe_wb_sessions</code>, and <code>universe_wb_rules</code>. Never transmitted externally.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* MODAL: Inspect Single Record                                       */}
      {/* ================================================================= */}
      {activeInspect && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }} onClick={() => setInspectRecord(null)}>
          <div style={{ background: '#fff', borderRadius: 'var(--radius-md)', maxWidth: 560, width: '100%', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-default)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div className="uni-card-header" style={{ background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}><ShieldCheck size={18} color="var(--brand-green-700)" /><span>Record Audit</span></div>
              <button type="button" onClick={() => setInspectRecord(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} aria-label="Close"><X size={16} /></button>
            </div>
            <div style={{ padding: 20, fontSize: '0.84rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div><strong>ID:</strong> <code className="code-pill">{activeInspect.id}</code></div>
              <div><strong>Domain:</strong> <code className="code-pill">{activeInspect.domain}</code></div>
              <div><strong>Activity:</strong> {activeInspect.title}</div>
              <div><strong>Category:</strong> <span className={`uni-badge ${categoryBadge(activeInspect.category)}`}>{activeInspect.category}</span></div>
              <div><strong>Duration:</strong> {formatDuration(activeInspect.durationSeconds !== undefined ? activeInspect.durationSeconds : (activeInspect.durationMinutes || 0) * 60)} ({activeInspect.durationMinutes || Math.round((activeInspect.durationSeconds || 0)/60)}m)</div>
              <div><strong>Timestamp:</strong> {formatTimestamp(activeInspect.timestamp)} ({new Date(activeInspect.timestamp).toLocaleString()})</div>
              <div><strong>Storage Indicator:</strong> Local browser storage only (<code>universe_wb_events</code>)</div>
              <div><strong>Privacy Status:</strong> Zero credentials, cookies, or page contents collected. Zero server egress.</div>
              <details style={{ marginTop: 10, padding: 10, background: 'var(--slate-100)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-light)' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.78rem' }}>View Technical Data (Raw JSON)</summary>
                <pre style={{ fontSize: '0.74rem', margin: '8px 0 0 0', fontFamily: 'monospace', color: 'var(--slate-800)', overflowX: 'auto' }}>{JSON.stringify(activeInspect, null, 2)}</pre>
              </details>
            </div>
            <div className="uni-card-footer" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="uni-btn uni-btn-secondary uni-btn-sm" onClick={() => setInspectRecord(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: Inspect All Stored Data                                     */}
      {/* ================================================================= */}
      {showDataModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }} onClick={() => setShowDataModal(false)}>
          <div style={{ background: '#fff', borderRadius: 'var(--radius-md)', maxWidth: 680, width: '100%', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-default)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div className="uni-card-header" style={{ background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}><Database size={18} color="var(--brand-green-700)" /><span>Stored Data Inspector</span></div>
              <button type="button" onClick={() => setShowDataModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} aria-label="Close"><X size={16} /></button>
            </div>
            <div style={{ padding: 20, overflowY: 'auto', flex: 1, fontSize: '0.84rem' }}>
              <div style={{ marginBottom: 14, color: 'var(--text-secondary)' }}>
                <strong>Local Storage Keys Audit:</strong>
                <ul style={{ paddingLeft: 20, marginTop: 6, lineHeight: 1.6 }}>
                  <li><code>universe_wb_events</code> — <strong>{events.length}</strong> browsing activity records (Local only)</li>
                  <li><code>universe_wb_sessions</code> — <strong>{focusSessions.length}</strong> focus sessions (Local only)</li>
                  <li><code>universe_wb_rules</code> — <strong>{rules.length}</strong> domain classification rules</li>
                </ul>
                <div style={{ padding: '8px 12px', background: '#f0fdf4', borderRadius: 'var(--radius-xs)', border: '1px solid var(--brand-green-200)', color: 'var(--brand-green-800)', fontSize: '0.78rem', marginTop: 10 }}>
                  ✓ Privacy Verified: Zero credentials, cookies, tokens, or webpage HTML/DOM content collected or stored.
                </div>
              </div>
              <details style={{ marginTop: 12, padding: 10, background: 'var(--slate-100)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-light)' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.78rem' }}>View Technical Data (Raw JSON)</summary>
                <pre style={{ fontSize: '0.74rem', margin: '8px 0 0 0', fontFamily: 'monospace', color: 'var(--slate-800)', overflowX: 'auto', maxHeight: '300px' }}>{JSON.stringify({ browsingEvents: events, focusSessions, domainRules: rules }, null, 2)}</pre>
              </details>
            </div>
            <div className="uni-card-footer" style={{ justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>0 network requests transmitted. All data browser-local.</span>
              <button type="button" className="uni-btn uni-btn-secondary uni-btn-sm" onClick={() => setShowDataModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: Confirm Delete All Data                                     */}
      {/* ================================================================= */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }} onClick={() => setShowDeleteConfirm(false)}>
          <div style={{ background: '#fff', borderRadius: 'var(--radius-md)', maxWidth: 480, width: '100%', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-default)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div className="uni-card-header" style={{ background: '#fef2f2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: '#b91c1c' }}><AlertTriangle size={18} /><span>Confirm Deletion</span></div>
              <button type="button" onClick={() => setShowDeleteConfirm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} aria-label="Close"><X size={16} /></button>
            </div>
            <div style={{ padding: 20, fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              Permanently delete all {events.length} browsing activity records and {focusSessions.length} focus sessions? All metrics, charts, and the timeline will reset to zero. This cannot be undone.
            </div>
            <div className="uni-card-footer" style={{ justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="uni-btn uni-btn-secondary uni-btn-sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button type="button" className="uni-btn uni-btn-primary uni-btn-sm" style={{ backgroundColor: '#dc2626', borderColor: '#b91c1c' }} onClick={handleDeleteAllData}>Delete All Data</button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: Confirm Reset Rules                                         */}
      {/* ================================================================= */}
      {showResetRulesConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }} onClick={() => setShowResetRulesConfirm(false)}>
          <div style={{ background: '#fff', borderRadius: 'var(--radius-md)', maxWidth: 440, width: '100%', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-default)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div className="uni-card-header" style={{ background: '#fffbeb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: '#b45309' }}><AlertTriangle size={18} /><span>Reset Classification Rules?</span></div>
              <button type="button" onClick={() => setShowResetRulesConfirm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} aria-label="Close"><X size={16} /></button>
            </div>
            <div style={{ padding: 20, fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              Restore all domain rules to the documented defaults? Your custom rules will be lost. Newly simulated events will follow default rules.
            </div>
            <div className="uni-card-footer" style={{ justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="uni-btn uni-btn-secondary uni-btn-sm" onClick={() => setShowResetRulesConfirm(false)}>Cancel</button>
              <button type="button" className="uni-btn uni-btn-primary uni-btn-sm" onClick={handleResetRules}>Reset to Defaults</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
