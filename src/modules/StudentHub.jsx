import React, { useState } from 'react';
import {
  GraduationCap,
  Users,
  BookOpen,
  Calendar,
  Sparkles,
  Search,
  Clock,
} from 'lucide-react';
import { MODULES } from '../data/seed';

export default function StudentHub() {
  const moduleData = MODULES.find((m) => m.id === 'student-hub');
  const [filterQuery, setFilterQuery] = useState('');

  const studyCircles = moduleData?.sampleStudyCircles || [];
  const filteredCircles = studyCircles.filter(
    (c) =>
      c.course.toLowerCase().includes(filterQuery.toLowerCase()) ||
      c.topic.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="student-hub-module">
      {/* Capability Overview */}
      <div className="uni-card" style={{ marginBottom: '24px' }}>
        <div className="uni-card-header">
          <div className="uni-card-title">
            <GraduationCap size={20} color="var(--brand-green-700)" />
            <span>Academic Intelligence & Study Collaboration</span>
          </div>
        </div>
        <div className="uni-card-body">
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            {moduleData?.description}
          </p>

          <div className="uni-grid-3">
            <div style={{ padding: '14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-green-700)', fontWeight: 600, fontSize: '0.88rem' }}>
                <Sparkles size={16} />
                <span>Knowledge Graph Synthesis</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Indexes campus course materials, syllabi, and lecture references into a searchable semantic graph.
              </p>
            </div>

            <div style={{ padding: '14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-green-700)', fontWeight: 600, fontSize: '0.88rem' }}>
                <Users size={16} />
                <span>Peer Match Affinity</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Groups study partners based on enrolled course overlaps and mutual free study windows.
              </p>
            </div>

            <div style={{ padding: '14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-green-700)', fontWeight: 600, fontSize: '0.88rem' }}>
                <Calendar size={16} />
                <span>Adaptive Milestones</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Generates collaborative checkpoints for team project deadlines and semester assessments.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sample Study Circles Explorer */}
      <div className="uni-card">
        <div className="uni-card-header">
          <div>
            <div className="uni-card-title">
              <BookOpen size={18} color="var(--brand-green-700)" />
              <span>Sample Study Circles (Sample Data)</span>
            </div>
            <div className="uni-card-desc">
              Sample study groups for testing course filtering and schedule matching workflows.
            </div>
          </div>

          <div style={{ position: 'relative', width: '240px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
            <input
              type="text"
              className="uni-input"
              placeholder="Filter course or topic..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              style={{ paddingLeft: '32px', width: '100%', fontSize: '0.82rem' }}
              aria-label="Filter study circles"
            />
          </div>
        </div>

        <div className="uni-card-body" style={{ padding: 0 }}>
          {filteredCircles.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No sample study circles match "{filterQuery}".
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredCircles.map((circle) => (
                <div
                  key={circle.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border-light)',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{circle.course}</strong>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Focus: <em>{circle.topic}</em>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '18px', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Users size={14} /> {circle.members} Members
                    </span>
                    <span style={{ color: 'var(--brand-green-700)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} /> {circle.nextSession}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
