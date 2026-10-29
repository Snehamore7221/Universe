import React from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  Car,
  Leaf,
  ShieldCheck,
  Eye,
  Sparkles,
  X,
} from 'lucide-react';
import { MODULES, CAMPUS_INFO } from '../data/seed';

const iconMap = {
  GraduationCap: GraduationCap,
  Car: Car,
  Leaf: Leaf,
  ShieldCheck: ShieldCheck,
  Eye: Eye,
};

export default function Sidebar({ activeModule, onSelectModule, isOpen, onClose }) {
  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`sidebar-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Branding Header */}
        <div className="sidebar-header">
          <div className="brand-badge">
            <div className="brand-icon-box">
              <Sparkles size={20} strokeWidth={2.2} />
            </div>
            <div className="brand-meta">
              <span className="brand-name">{CAMPUS_INFO.name}</span>
              <span className="brand-sub">Campus Ecosystem</span>
            </div>
            {/* Mobile close button */}
            <button
              type="button"
              className="uni-btn-ghost mobile-menu-btn"
              onClick={onClose}
              aria-label="Close sidebar"
              style={{ marginLeft: 'auto' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="sidebar-nav-container" aria-label="Campus Ecosystem Navigation">
          <button
            type="button"
            className={`nav-link ${activeModule === 'dashboard' ? 'active' : ''}`}
            onClick={() => onSelectModule('dashboard')}
          >
            <span className="nav-link-icon">
              <LayoutDashboard size={18} />
            </span>
            <span className="nav-link-text">Campus Dashboard</span>
          </button>

          <div className="nav-section-label">Campus Modules</div>

          {MODULES.map((module) => {
            const IconComponent = iconMap[module.icon] || Sparkles;
            const isActive = activeModule === module.id;

            return (
              <button
                key={module.id}
                type="button"
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => onSelectModule(module.id)}
                title={module.name}
              >
                <span className="nav-link-icon">
                  <IconComponent size={18} />
                </span>
                <span className="nav-link-text">{module.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Clean, minimal sidebar footer */}
        <div className="sidebar-footer">
          <div className="campus-pill-tag">
            UniVerse Platform • Shared Shell
          </div>
        </div>
      </aside>
    </>
  );
}
