import React, { useState } from 'react';
import {
  Car,
  MapPin,
  Clock,
  ShieldCheck,
  Leaf,
  Users,
  Calculator,
} from 'lucide-react';
import { MODULES } from '../data/seed';

export default function RidePooling() {
  const moduleData = MODULES.find((m) => m.id === 'ride-pooling');

  // Commute carbon offset estimation model state
  const [commuteDistance, setCommuteDistance] = useState(12);
  const [coRiders, setCoRiders] = useState(3);

  // Documented formula: Standard passenger car emits approximately 0.17 kg CO2 per km.
  // Solo trip emissions = distance * 0.17 kg CO2/km
  // Shared trip emissions per passenger = solo emissions / (passengers + 1)
  const soloKg = (commuteDistance * 0.17).toFixed(2);
  const pooledKg = ((commuteDistance * 0.17) / (coRiders + 1)).toFixed(2);
  const savedKg = (soloKg - pooledKg).toFixed(2);

  const sampleRoutes = moduleData?.sampleRoutes || [];

  return (
    <div className="ride-pooling-module">
      {/* Capability Overview */}
      <div className="uni-card" style={{ marginBottom: '24px' }}>
        <div className="uni-card-header">
          <div className="uni-card-title">
            <Car size={20} color="var(--brand-green-700)" />
            <span>Smart Campus Ride-Pooling & Commuter Mobility</span>
          </div>
        </div>
        <div className="uni-card-body">
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            {moduleData?.description}
          </p>

          <div className="uni-grid-3">
            <div style={{ padding: '14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-green-700)', fontWeight: 600, fontSize: '0.88rem' }}>
                <MapPin size={16} />
                <span>Corridor Route Bundling</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Clusters student commuters along shared transit corridors to reduce redundant vehicle trips.
              </p>
            </div>

            <div style={{ padding: '14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-green-700)', fontWeight: 600, fontSize: '0.88rem' }}>
                <ShieldCheck size={16} />
                <span>Verified Campus Identity</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Requires institutional authentication so all drivers and passengers are verified campus members.
              </p>
            </div>

            <div style={{ padding: '14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-green-700)', fontWeight: 600, fontSize: '0.88rem' }}>
                <Leaf size={16} />
                <span>Estimated Emission Offsets</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Calculates avoided vehicle emissions based on verified passenger capacity sharing.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Commuter Emission Estimation Model */}
      <div className="uni-card" style={{ marginBottom: '24px' }}>
        <div className="uni-card-header">
          <div className="uni-card-title">
            <Calculator size={18} color="var(--brand-green-700)" />
            <span>Commuter Emission Estimation Model</span>
          </div>
          <span className="uni-badge uni-badge-neutral">Mathematical Model</span>
        </div>
        <div className="uni-card-body">
          <div className="uni-grid-2">
            <div>
              <div className="uni-form-group">
                <label className="uni-label">One-Way Commute Distance: {commuteDistance} km</label>
                <input
                  type="range"
                  min="2"
                  max="40"
                  value={commuteDistance}
                  onChange={(e) => setCommuteDistance(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--brand-green-600)' }}
                  aria-label="Commute distance in kilometers"
                />
              </div>

              <div className="uni-form-group">
                <label className="uni-label">Number of Co-Riders Sharing Trip: {coRiders} Passengers</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={coRiders}
                  onChange={(e) => setCoRiders(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--brand-green-600)' }}
                  aria-label="Number of co-riders"
                />
              </div>

              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                Model assumptions: Baseline single-occupancy passenger vehicle emission rate of 0.17 kg CO₂ per kilometer.
              </p>
            </div>

            <div style={{ background: 'var(--brand-green-50)', padding: '18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--brand-green-200)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Estimated Net Avoided Emissions</div>
              <div style={{ fontSize: '1.9rem', fontWeight: 700, color: 'var(--brand-green-800)', margin: '4px 0' }}>
                {savedKg} kg CO₂e
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Baseline solo trip: {soloKg} kg CO₂e vs. Pooled trip: {pooledKg} kg CO₂e per passenger.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sample Route Corridors */}
      <div className="uni-card">
        <div className="uni-card-header">
          <div>
            <div className="uni-card-title">
              <MapPin size={18} color="var(--brand-green-700)" />
              <span>Sample Campus Route Corridors (Sample Data)</span>
            </div>
            <div className="uni-card-desc">
              Sample commuter routes for testing matching algorithms and corridor bundling.
            </div>
          </div>
        </div>
        <div className="uni-card-body" style={{ padding: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {sampleRoutes.map((route) => (
              <div
                key={route.id}
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
                  <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{route.corridor}</strong>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Type: {route.driverType} • Est. Distance: {route.estDistanceKm} km
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '18px', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Users size={14} /> {route.availableSeats} Seats Open
                  </span>
                  <span style={{ color: 'var(--brand-green-700)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={14} /> In {route.departsIn}
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
