import React, { useState } from 'react';
import {
  Eye,
  Shield,
  FileCheck,
  UserCheck,
  Scale,
} from 'lucide-react';
import { MODULES } from '../data/seed';

export default function ExamMonitoring() {
  const moduleData = MODULES.find((m) => m.id === 'exam-monitoring');

  // Interactive Student Consent Protocol Checklist
  const [consents, setConsents] = useState({
    noBiometricStore: true,
    humanReviewMandate: true,
    fullAuditAccess: false,
  });

  const toggleConsent = (key) => {
    setConsents((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const allConsentsGranted = Object.values(consents).every(Boolean);

  const sampleSessions = moduleData?.sampleSessions || [];

  return (
    <div className="exam-monitoring-module">
      {/* Capability Overview */}
      <div className="uni-card" style={{ marginBottom: '24px' }}>
        <div className="uni-card-header">
          <div className="uni-card-title">
            <Eye size={20} color="var(--brand-green-700)" />
            <span>Responsible Examination Monitoring</span>
          </div>
        </div>
        <div className="uni-card-body">
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            {moduleData?.description}
          </p>

          <div className="uni-grid-3">
            <div style={{ padding: '14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-green-700)', fontWeight: 600, fontSize: '0.88rem' }}>
                <Shield size={16} />
                <span>Zero Long-Term Video Dumps</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Video streams process on a temporary local memory buffer without persistent cloud surveillance storage.
              </p>
            </div>

            <div style={{ padding: '14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-green-700)', fontWeight: 600, fontSize: '0.88rem' }}>
                <Scale size={16} />
                <span>Human-in-the-Loop Mandate</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Automated AI flags cannot penalize candidates; all flagged anomalies require instructor ombudsman review.
              </p>
            </div>

            <div style={{ padding: '14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-green-700)', fontWeight: 600, fontSize: '0.88rem' }}>
                <FileCheck size={16} />
                <span>Auditable Incident Logs</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Students receive an identical timestamped receipt of any sensor trigger logged during their assessment.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Ethical Protocol Verification */}
      <div className="uni-card" style={{ marginBottom: '24px' }}>
        <div className="uni-card-header">
          <div className="uni-card-title">
            <UserCheck size={18} color="var(--brand-green-700)" />
            <span>Ethical Proctoring Protocol Verification</span>
          </div>
          <span className={`uni-badge ${allConsentsGranted ? 'uni-badge-green' : 'uni-badge-neutral'}`}>
            {allConsentsGranted ? 'Protocol Fully Verified' : 'Awaiting Student Review'}
          </span>
        </div>
        <div className="uni-card-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.88rem' }}>
              <input
                type="checkbox"
                checked={consents.noBiometricStore}
                onChange={() => toggleConsent('noBiometricStore')}
                style={{ accentColor: 'var(--brand-green-600)', width: '16px', height: '16px' }}
              />
              <span><strong>Local Buffer Guarantee:</strong> Video feed evaluates exclusively in temporary device buffer and is cleared post-session.</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.88rem' }}>
              <input
                type="checkbox"
                checked={consents.humanReviewMandate}
                onChange={() => toggleConsent('humanReviewMandate')}
                style={{ accentColor: 'var(--brand-green-600)', width: '16px', height: '16px' }}
              />
              <span><strong>Right to Explanation:</strong> Any automated anomaly flag requires human review with candidate opportunity to respond.</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.88rem' }}>
              <input
                type="checkbox"
                checked={consents.fullAuditAccess}
                onChange={() => toggleConsent('fullAuditAccess')}
                style={{ accentColor: 'var(--brand-green-600)', width: '16px', height: '16px' }}
              />
              <span><strong>Candidate Audit Receipt:</strong> Enable cryptographic SHA-256 integrity hash verification upon test completion.</span>
            </label>
          </div>
        </div>
      </div>

      {/* Sample Monitored Sessions */}
      <div className="uni-card">
        <div className="uni-card-header">
          <div>
            <div className="uni-card-title">
              <FileCheck size={18} color="var(--brand-green-700)" />
              <span>Sample Examination Sessions (Sample Data)</span>
            </div>
            <div className="uni-card-desc">
              Sample test sessions for testing privacy buffer parameters and audit verification.
            </div>
          </div>
        </div>
        <div className="uni-card-body" style={{ padding: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {sampleSessions.map((session) => (
              <div
                key={session.id}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="code-pill">{session.id}</span>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{session.course}</strong>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Status: {session.protocolStatus} • Buffer: {session.privacyBuffer}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {session.registeredCandidates} Candidates
                  </span>
                  <span className="uni-badge uni-badge-neutral">
                    Duration: {session.duration}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
