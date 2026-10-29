import React from 'react';
import {
  ArrowLeft,
  GraduationCap,
  Car,
  Leaf,
  ShieldCheck,
  Eye,
  Sparkles,
} from 'lucide-react';

const iconMap = {
  GraduationCap: GraduationCap,
  Car: Car,
  Leaf: Leaf,
  ShieldCheck: ShieldCheck,
  Eye: Eye,
};

export default function ModuleLayout({
  module,
  onBackToDashboard,
  children,
}) {
  if (!module) return null;

  const IconComponent = iconMap[module.icon] || Sparkles;

  return (
    <div className="module-page-container">
      {/* Top action row */}
      <div style={{ marginBottom: '16px' }}>
        <button
          type="button"
          className="uni-btn uni-btn-ghost uni-btn-sm"
          onClick={onBackToDashboard}
          style={{ paddingLeft: '4px' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Campus Dashboard</span>
        </button>
      </div>

      {/* Module Title Header Bar */}
      <div className="module-header-bar">
        <div className="module-header-meta">
          <div className="module-header-icon">
            <IconComponent size={26} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="page-title">{module.name}</h1>
            <p className="page-subtitle" style={{ maxWidth: '850px', marginTop: '4px' }}>
              {module.description}
            </p>
          </div>
        </div>
      </div>

      {/* Main Module Content */}
      <div className="module-main-body">
        {children}
      </div>
    </div>
  );
}
