import React from 'react';
import {
  GraduationCap,
  Car,
  Leaf,
  ShieldCheck,
  Eye,
  ArrowRight,
  Sparkles,
  BookOpen,
  Clock,
  Sliders,
  Bell,
} from 'lucide-react';
import { MODULES, CAMPUS_INFO, SAMPLE_CAMPUS_UPDATES } from '../data/seed';

const iconMap = {
  GraduationCap: GraduationCap,
  Car: Car,
  Leaf: Leaf,
  ShieldCheck: ShieldCheck,
  Eye: Eye,
};

export default function Dashboard({ onNavigateModule }) {
  // Quick Action shortcuts to existing module workflows
  const quickActions = [
    {
      label: 'Explore Study Resources',
      desc: 'Browse study circles & topics',
      icon: BookOpen,
      targetId: 'student-hub',
    },
    {
      label: 'Find a Ride',
      desc: 'Check corridor micro-pools',
      icon: Car,
      targetId: 'ride-pooling',
    },
    {
      label: 'Run Sustainability Simulation',
      desc: 'Model compute workload emissions',
      icon: Sliders,
      targetId: 'sustainability',
    },
    {
      label: 'Start a Focus Session',
      desc: 'Open on-device focus sprint timer',
      icon: Clock,
      targetId: 'digital-wellbeing',
    },
  ];

  return (
    <div className="dashboard-container">
      {/* A. Welcome Header */}
      <header className="page-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--brand-green-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {CAMPUS_INFO.name}
          </span>
        </div>
        <h1 className="page-title">Campus Dashboard</h1>
        <p className="page-subtitle" style={{ fontSize: '0.96rem', marginTop: '4px', color: 'var(--text-secondary)' }}>
          {CAMPUS_INFO.tagline}
        </p>
      </header>

      {/* B. Quick Actions */}
      <section style={{ marginBottom: '32px' }} aria-label="Quick Actions">
        <div style={{ marginBottom: '12px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Quick Actions
          </h2>
        </div>
        <div className="quick-actions-grid">
          {quickActions.map((action, idx) => {
            const ActionIcon = action.icon;
            return (
              <button
                key={idx}
                type="button"
                className="quick-action-card"
                onClick={() => onNavigateModule(action.targetId)}
                aria-label={action.label}
              >
                <div className="quick-action-icon">
                  <ActionIcon size={18} />
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div className="quick-action-label">{action.label}</div>
                  <div className="quick-action-desc">{action.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* C. Explore Your Campus */}
      <section style={{ marginBottom: '36px' }} aria-label="Explore Your Campus">
        <div style={{ marginBottom: '14px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Explore Your Campus
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Access core ecosystem modules, interactive models, and student services.
          </p>
        </div>

        <div className="modules-grid">
          {MODULES.map((module) => {
            const IconComponent = iconMap[module.icon] || Sparkles;

            return (
              <div
                key={module.id}
                className="module-card uni-card-interactive"
                onClick={() => onNavigateModule(module.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="module-card-top">
                  <div className="module-icon-pill">
                    <IconComponent size={22} strokeWidth={2.2} />
                  </div>
                </div>

                <h3 className="module-card-title">{module.name}</h3>
                <p className="module-card-desc">{module.description}</p>

                {/* Tag Pills */}
                <div className="module-tags">
                  {module.tags.map((tag, tIdx) => (
                    <span key={tIdx} className="uni-badge uni-badge-neutral">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Working Open Module Action */}
                <div className="module-card-footer">
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Module workspace
                  </span>
                  <button
                    type="button"
                    className="uni-btn uni-btn-primary uni-btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateModule(module.id);
                    }}
                    aria-label={`Open ${module.name}`}
                  >
                    <span>Open Module</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* D. Campus Updates */}
      <section aria-label="Campus Updates">
        <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={18} color="var(--brand-green-700)" />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Campus Updates
          </h2>
        </div>

        <div className="campus-updates-list">
          {SAMPLE_CAMPUS_UPDATES.map((update) => (
            <div key={update.id} className="campus-update-item">
              <div>
                <h3 className="campus-update-title">{update.title}</h3>
                <p className="campus-update-desc">{update.description}</p>
              </div>
              <span className="campus-update-date">{update.date}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
