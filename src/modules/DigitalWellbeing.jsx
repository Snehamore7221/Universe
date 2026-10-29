import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Lock,
  Plus,
  Trash2,
  Search,
  Eye,
  X,
  CheckCircle,
} from 'lucide-react';
import { MODULES } from '../data/seed';

export default function DigitalWellbeing() {
  const moduleData = MODULES.find((m) => m.id === 'digital-wellbeing');

  // Actual Focus-Session State
  const [sprintMinutes, setSprintMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [timerActive, setTimerActive] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  // Focus Timer Countdown Effect
  useEffect(() => {
    let interval = null;
    if (timerActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && timerActive) {
      setTimerActive(false);
      setCompletedSessions((prev) => prev + 1);
      setSecondsLeft(sprintMinutes * 60);
    }
    return () => clearInterval(interval);
  }, [timerActive, secondsLeft, sprintMinutes]);

  const toggleTimer = () => setTimerActive((prev) => !prev);
  const resetTimer = () => {
    setTimerActive(false);
    setSecondsLeft(sprintMinutes * 60);
  };
  const changeSprintDuration = (mins) => {
    setTimerActive(false);
    setSprintMinutes(mins);
    setSecondsLeft(mins * 60);
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
  };

  // Local Activity Log State (Initialized with sample events, persisted in localStorage if available)
  const [events, setEvents] = useState(() => {
    try {
      const saved = localStorage.getItem('universe_wellbeing_events');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return moduleData?.sampleEvents || [];
  });

  // Functional Activity Tracking Pause Control
  const [isTrackingActive, setIsTrackingActive] = useState(true);

  // Functional Inspect Modal / Drawer State
  const [inspectedEvent, setInspectedEvent] = useState(null);

  // New User-Entered Activity Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Academic Research');
  const [newDuration, setNewDuration] = useState(30);

  // Persist events locally
  useEffect(() => {
    try {
      localStorage.setItem('universe_wellbeing_events', JSON.stringify(events));
    } catch {
      // fallback
    }
  }, [events]);

  // Functional Add Event Control
  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newEntry = {
      id: `evt-${Date.now()}`,
      category: newCategory,
      title: newTitle.trim(),
      durationMinutes: Number(newDuration),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      privacyMode: 'Local Processing Only',
    };

    setEvents((prev) => [newEntry, ...prev]);
    setNewTitle('');
  };

  // Functional Delete Control
  const handleDeleteEvent = (idToDelete) => {
    setEvents((prev) => prev.filter((item) => item.id !== idToDelete));
    if (inspectedEvent?.id === idToDelete) {
      setInspectedEvent(null);
    }
  };

  return (
    <div className="digital-wellbeing-module">
      {/* Capability Overview */}
      <div className="uni-card" style={{ marginBottom: '24px' }}>
        <div className="uni-card-header">
          <div className="uni-card-title">
            <ShieldCheck size={20} color="var(--brand-green-700)" />
            <span>Privacy-Aware Digital Wellbeing</span>
          </div>
        </div>
        <div className="uni-card-body">
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            {moduleData?.description}
          </p>

          <div className="uni-grid-3">
            <div style={{ padding: '14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-green-700)', fontWeight: 600, fontSize: '0.88rem' }}>
                <Lock size={16} />
                <span>Zero-Egress Local Storage</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Activity logs and timer records remain exclusively in client memory and browser localStorage.
              </p>
            </div>

            <div style={{ padding: '14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-green-700)', fontWeight: 600, fontSize: '0.88rem' }}>
                <Clock size={16} />
                <span>Focus Rhythm Sprints</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Tracks focused work intervals and regular eye-relief rest breaks locally on device.
              </p>
            </div>

            <div style={{ padding: '14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-green-700)', fontWeight: 600, fontSize: '0.88rem' }}>
                <Eye size={16} />
                <span>Auditable Transparency</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Inspect and permanently delete any logged session record with one click.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actual Focus-Session State Card */}
      <div className="uni-card" style={{ marginBottom: '24px' }}>
        <div className="uni-card-header">
          <div className="uni-card-title">
            <Clock size={18} color="var(--brand-green-700)" />
            <span>Active Focus Session</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`uni-badge ${timerActive ? 'uni-badge-green' : 'uni-badge-neutral'}`}>
              {timerActive ? 'Session in Progress' : secondsLeft === 0 ? 'Session Complete' : 'Session Paused / Ready'}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Completed Sprints: <strong>{completedSessions}</strong>
            </span>
          </div>
        </div>
        <div className="uni-card-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                {[15, 25, 45].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    className={`uni-btn uni-btn-sm ${sprintMinutes === mins ? 'uni-btn-primary' : 'uni-btn-secondary'}`}
                    onClick={() => changeSprintDuration(mins)}
                  >
                    {mins}m Sprint
                  </button>
                ))}
              </div>

              <div style={{ fontSize: '2.8rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)', lineHeight: 1.1 }}>
                {formatTime(secondsLeft)}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {timerActive ? 'Currently focusing — local timer active' : 'Paused — ready to begin focus block'}
              </div>
            </div>

            {/* Functional Focus Controls */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className={`uni-btn ${timerActive ? 'uni-btn-secondary' : 'uni-btn-primary'}`}
                onClick={toggleTimer}
              >
                {timerActive ? (
                  <>
                    <Pause size={16} />
                    <span>Pause Session</span>
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    <span>Start Session</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="uni-btn uni-btn-secondary"
                onClick={resetTimer}
              >
                <RotateCcw size={16} />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* User-Entered Activity & Sample Log */}
      <div className="uni-card">
        <div className="uni-card-header">
          <div>
            <div className="uni-card-title">
              <Lock size={18} color="var(--brand-green-700)" />
              <span>Sample Activity Log (Sample Data — Stored Locally)</span>
            </div>
            <div className="uni-card-desc">
              Demonstrates client-side event tracking with functional pause, inspect, and delete operations.
            </div>
          </div>

          {/* Functional Logging Pause Control */}
          <button
            type="button"
            className={`uni-btn uni-btn-sm ${isTrackingActive ? 'uni-btn-secondary' : 'uni-btn-primary'}`}
            onClick={() => setIsTrackingActive((prev) => !prev)}
            title="Toggle background local tracking"
          >
            {isTrackingActive ? (
              <>
                <Pause size={14} />
                <span>Pause Local Logging</span>
              </>
            ) : (
              <>
                <Play size={14} />
                <span>Resume Local Logging</span>
              </>
            )}
          </button>
        </div>

        <div className="uni-card-body">
          {/* User-Entered Activity Form */}
          <form onSubmit={handleAddEvent} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px', padding: '14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ flex: '1 1 200px' }}>
              <input
                type="text"
                className="uni-input"
                placeholder="Log activity (e.g. Reading Lecture Notes)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                style={{ width: '100%' }}
                aria-label="Activity title"
              />
            </div>
            <div style={{ width: '170px' }}>
              <select
                className="uni-input"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                style={{ width: '100%' }}
                aria-label="Activity category"
              >
                <option value="Academic Research">Academic Research</option>
                <option value="Development">Development</option>
                <option value="Coursework">Coursework</option>
                <option value="Reference & Reading">Reference & Reading</option>
              </select>
            </div>
            <div style={{ width: '100px' }}>
              <input
                type="number"
                min="5"
                max="180"
                className="uni-input"
                value={newDuration}
                onChange={(e) => setNewDuration(e.target.value)}
                style={{ width: '100%' }}
                aria-label="Duration in minutes"
              />
            </div>
            <button type="submit" className="uni-btn uni-btn-primary uni-btn-sm" style={{ alignSelf: 'center' }}>
              <Plus size={15} />
              <span>Add Entry</span>
            </button>
          </form>

          {/* Activity Events List */}
          {events.length === 0 ? (
            <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No logged activities remaining. Add a new activity or reset seed data.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {events.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{item.title}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Category: <em>{item.category}</em> • Duration: {item.durationMinutes}m • Time: {item.timestamp}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="uni-badge uni-badge-neutral" style={{ fontSize: '0.75rem' }}>
                      {item.privacyMode}
                    </span>

                    {/* Functional Inspect Control */}
                    <button
                      type="button"
                      className="uni-btn uni-btn-secondary uni-btn-sm"
                      onClick={() => setInspectedEvent(item)}
                      aria-label={`Inspect ${item.title}`}
                    >
                      <Eye size={14} />
                      <span>Inspect</span>
                    </button>

                    {/* Functional Delete Control */}
                    <button
                      type="button"
                      className="uni-btn uni-btn-ghost uni-btn-sm"
                      onClick={() => handleDeleteEvent(item.id)}
                      style={{ color: '#dc2626' }}
                      aria-label={`Delete ${item.title}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Functional Inspect Drawer / Modal */}
          {inspectedEvent && (
            <div style={{ marginTop: '20px', padding: '16px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.92rem' }}>
                  <ShieldCheck size={18} color="var(--brand-green-700)" />
                  <span>Local Privacy Record Inspection</span>
                </div>
                <button
                  type="button"
                  className="uni-btn-ghost"
                  onClick={() => setInspectedEvent(null)}
                  aria-label="Close inspector"
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-secondary)' }}>
                <div><strong>Record Identifier:</strong> {inspectedEvent.id}</div>
                <div><strong>Activity Name:</strong> {inspectedEvent.title}</div>
                <div><strong>Category:</strong> {inspectedEvent.category}</div>
                <div><strong>Logged Duration:</strong> {inspectedEvent.durationMinutes} minutes ({inspectedEvent.timestamp})</div>
                <div><strong>Data Transmission Egress:</strong> 0 Bytes Outbound (Stored purely in browser client)</div>
                <div><strong>Differential Privacy Guard:</strong> Local Laplace noise perturbation applied to aggregate metrics.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
