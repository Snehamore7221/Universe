
import React, { useState, useEffect } from 'react';
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { Menu, ChevronRight, UserCircle } from 'lucide-react';

import { supabase } from './lib/supabase';
import Login from './auth/Login';
import Register from './auth/Register';

import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ModuleLayout from './components/ModuleLayout';
import Profile from './pages/Profile';

import StudentHub from './modules/StudentHub';
import RidePooling from './modules/RidePooling';
import Sustainability from './modules/Sustainability';
import DigitalWellbeing from './modules/DigitalWellbeing';
import ExamMonitoring from './modules/ExamMonitoring';

import { MODULES, CAMPUS_INFO } from './data/seed';

function CampusApp({ user }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isProfilePage = location.pathname === '/profile';

  const [activeModule, setActiveModule] = useState(() => {
    try {
      return localStorage.getItem('universe_active_module') || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem('universe_active_module', activeModule);
    } catch {
      // Continue if localStorage is unavailable
    }
  }, [activeModule]);

  const handleSelectModule = (moduleId) => {
    setActiveModule(moduleId);
    setSidebarOpen(false);
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToDashboard = () => {
    setActiveModule('dashboard');
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentModuleData = MODULES.find(
    (module) => module.id === activeModule
  );

  return (
    <div className="app-shell">
      {!isProfilePage && (
        <Sidebar
          activeModule={activeModule}
          onSelectModule={handleSelectModule}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      <div className="app-main">
        <header className="top-bar">
          <div className="top-bar-left">
            {!isProfilePage && (
              <button
                type="button"
                className="mobile-menu-btn"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open navigation menu"
              >
                <Menu size={20} />
              </button>
            )}

            <div className="breadcrumb-trail">
              <span
                style={{
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
                onClick={handleBackToDashboard}
              >
                {CAMPUS_INFO.name}
              </span>

              <ChevronRight size={14} color="var(--text-light)" />

              <span className="breadcrumb-active">
                {isProfilePage
                  ? 'My Profile'
                  : activeModule === 'dashboard'
                    ? 'Campus Dashboard'
                    : currentModuleData?.name || 'Module'}
              </span>
            </div>
          </div>

          <div className="top-bar-right">
            <span
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
              }}
            >
              Campus Ecosystem Platform
            </span>

            <button
              type="button"
              onClick={() =>
                navigate(isProfilePage ? '/' : '/profile')
              }
              title={isProfilePage ? 'Back to dashboard' : 'My Profile'}
              aria-label={isProfilePage ? 'Back to dashboard' : 'Open My Profile'}
              style={{
                marginLeft: '16px',
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid var(--border-default)',
                background: 'var(--bg-surface)',
                color: 'var(--brand-green-700)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <UserCircle size={21} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                {isProfilePage ? 'Dashboard' : 'My Profile'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                marginLeft: '10px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-default)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Logout
            </button>
          </div>
        </header>

        <main className="content-viewport">
          {isProfilePage ? (
            <Profile user={user} />
          ) : (
            <>
              {activeModule === 'dashboard' && (
                <Dashboard onNavigateModule={handleSelectModule} />
              )}

              {activeModule === 'student-hub' && (
                <ModuleLayout
                  module={currentModuleData}
                  onBackToDashboard={handleBackToDashboard}
                >
                  <StudentHub user={user} />
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
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (isMounted) {
        if (error) {
          console.error('Session check failed:', error.message);
        }

        setSession(data?.session ?? null);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--text-secondary)',
        }}
      >
        Loading UniVerse...
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={session ? <Navigate to="/" replace /> : <Login />}
      />

      <Route
        path="/register"
        element={session ? <Navigate to="/" replace /> : <Register />}
      />

      <Route
        path="/"
        element={
          session
            ? <CampusApp user={session.user} />
            : <Navigate to="/login" replace />
        }
      />

      <Route
        path="/profile"
        element={
          session
            ? <CampusApp user={session.user} />
            : <Navigate to="/login" replace />
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
