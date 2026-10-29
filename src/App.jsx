import React, { useState, useEffect } from 'react';
import { Menu, ChevronRight } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ModuleLayout from './components/ModuleLayout';
import StudentHub from './modules/StudentHub';
import RidePooling from './modules/RidePooling';
import Sustainability from './modules/Sustainability';
import DigitalWellbeing from './modules/DigitalWellbeing';
import ExamMonitoring from './modules/ExamMonitoring';
import { MODULES, CAMPUS_INFO } from './data/seed';

export default function App() {
  // Persist active module navigation in localStorage
  const [activeModule, setActiveModule] = useState(() => {
    try {
      return localStorage.getItem('universe_active_module') || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });

  // Mobile sidebar drawer state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sync active module to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('universe_active_module', activeModule);
    } catch {
      // localStorage fallback if disabled
    }
  }, [activeModule]);

  const handleSelectModule = (moduleId) => {
    setActiveModule(moduleId);
    setSidebarOpen(false); // Close mobile drawer upon selection
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToDashboard = () => {
    setActiveModule('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Find active module metadata if viewing a module
  const currentModuleData = MODULES.find((m) => m.id === activeModule);

  return (
    <div className="app-shell">
      {/* Persistent Left Sidebar */}
      <Sidebar
        activeModule={activeModule}
        onSelectModule={handleSelectModule}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Viewport */}
      <div className="app-main">
        {/* Sticky Topbar */}
        <header className="top-bar">
          <div className="top-bar-left">
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb Trail */}
            <div className="breadcrumb-trail">
              <span
                style={{ cursor: 'pointer', color: 'var(--text-muted)' }}
                onClick={handleBackToDashboard}
              >
                {CAMPUS_INFO.name}
              </span>
              <ChevronRight size={14} color="var(--text-light)" />
              <span className="breadcrumb-active">
                {activeModule === 'dashboard'
                  ? 'Campus Dashboard'
                  : currentModuleData?.name || 'Module'}
              </span>
            </div>
          </div>

          <div className="top-bar-right">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Campus Ecosystem Platform
            </span>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="content-viewport">
          {activeModule === 'dashboard' && (
            <Dashboard onNavigateModule={handleSelectModule} />
          )}

          {activeModule === 'student-hub' && (
            <ModuleLayout
              module={currentModuleData}
              onBackToDashboard={handleBackToDashboard}
            >
              <StudentHub />
            </ModuleLayout>
          )}

          {activeModule === 'ride-pooling' && (
            <ModuleLayout
              module={currentModuleData}
              onBackToDashboard={handleBackToDashboard}
            >
              <RidePooling />
            </ModuleLayout>
          )}

          {activeModule === 'sustainability' && (
            <ModuleLayout
              module={currentModuleData}
              onBackToDashboard={handleBackToDashboard}
            >
              <Sustainability />
            </ModuleLayout>
          )}

          {activeModule === 'digital-wellbeing' && (
            <ModuleLayout
              module={currentModuleData}
              onBackToDashboard={handleBackToDashboard}
            >
              <DigitalWellbeing />
            </ModuleLayout>
          )}

          {activeModule === 'exam-monitoring' && (
            <ModuleLayout
              module={currentModuleData}
              onBackToDashboard={handleBackToDashboard}
            >
              <ExamMonitoring />
            </ModuleLayout>
          )}
        </main>
      </div>
    </div>
  );
}
