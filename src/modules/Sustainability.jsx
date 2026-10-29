import React, { useState } from 'react';
import {
  Leaf,
  Cpu,
  Zap,
  Activity,
  Clock,
  Sliders,
  BarChart2,
  Info,
} from 'lucide-react';
import { MODULES } from '../data/seed';

export default function Sustainability() {
  const moduleData = MODULES.find((m) => m.id === 'sustainability');

  // Documented Simulation Inputs
  const [nodeCount, setNodeCount] = useState(8);
  const [utilizationPercent, setUtilizationPercent] = useState(60);
  const [runDurationHours, setRunDurationHours] = useState(8);
  const [gridCarbonFactor, setGridCarbonFactor] = useState(420); // g CO2/kWh (default peak grid)

  // Documented Formulas & Assumptions:
  // - Node idle power: 120 W
  // - Node peak power: 380 W
  // - Node power (W) = 120 + (utilization / 100) * (380 - 120)
  const nodePowerWatts = 120 + (utilizationPercent / 100) * (380 - 120);
  
  // Baseline Calculations (Standard unoptimized execution)
  const baselinePowerKw = (nodePowerWatts * nodeCount) / 1000;
  const baselineEnergyKwh = baselinePowerKw * runDurationHours;
  const baselineEmissionsKg = (baselineEnergyKwh * gridCarbonFactor) / 1000;
  const baselineLatencyMs = 120; // Standard immediate queuing latency

  // Carbon-Aware Optimized Calculations:
  // - Dynamic batching & frequency scaling improves power efficiency by ~16%
  // - Workload scheduler aligns heavy batches with clean grid intervals (assumed 45 g CO2/kWh)
  // - Trade-off: Queuing buffer introduces a modest latency increase (+45 ms)
  const optimizedPowerKw = baselinePowerKw * 0.84;
  const optimizedEnergyKwh = baselineEnergyKwh * 0.84;
  const optimizedGridCarbonFactor = 45; // Clean solar/wind interval
  const optimizedEmissionsKg = (optimizedEnergyKwh * optimizedGridCarbonFactor) / 1000;
  const optimizedLatencyMs = 165; // Batch queuing latency trade-off

  const simulatedClusters = moduleData?.simulatedClusters || [];

  return (
    <div className="sustainability-module">
      {/* Capability Overview */}
      <div className="uni-card" style={{ marginBottom: '24px' }}>
        <div className="uni-card-header">
          <div className="uni-card-title">
            <Leaf size={20} color="var(--brand-green-700)" />
            <span>Sustainable Computing Observatory</span>
          </div>
        </div>
        <div className="uni-card-body">
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            {moduleData?.description}
          </p>

          <div className="uni-grid-3">
            <div style={{ padding: '14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-green-700)', fontWeight: 600, fontSize: '0.88rem' }}>
                <Cpu size={16} />
                <span>Compute Power Modeling</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Models dynamic server power draw using idle-to-peak hardware curves across compute nodes.
              </p>
            </div>

            <div style={{ padding: '14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-green-700)', fontWeight: 600, fontSize: '0.88rem' }}>
                <Clock size={16} />
                <span>Carbon-Aware Workload Shift</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Evaluates emission reductions when heavy batch jobs defer execution to low-carbon grid windows.
              </p>
            </div>

            <div style={{ padding: '14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-green-700)', fontWeight: 600, fontSize: '0.88rem' }}>
                <BarChart2 size={16} />
                <span>Efficiency Trade-Off Analysis</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Compares power, energy, carbon emissions, and queuing latency between baseline and optimized policies.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Workload Simulation */}
      <div className="uni-card" style={{ marginBottom: '24px' }}>
        <div className="uni-card-header">
          <div className="uni-card-title">
            <Sliders size={18} color="var(--brand-green-700)" />
            <span>Compute Workload Simulation</span>
          </div>
          <span className="uni-badge uni-badge-neutral">Documented Simulation Model</span>
        </div>
        <div className="uni-card-body">
          {/* Simulation Controls */}
          <div className="uni-grid-3" style={{ marginBottom: '20px' }}>
            <div className="uni-form-group">
              <label className="uni-label">Active Compute Nodes: {nodeCount} Units</label>
              <input
                type="range"
                min="2"
                max="32"
                value={nodeCount}
                onChange={(e) => setNodeCount(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--brand-green-600)' }}
                aria-label="Active compute nodes count"
              />
            </div>

            <div className="uni-form-group">
              <label className="uni-label">Average Utilization: {utilizationPercent}%</label>
              <input
                type="range"
                min="10"
                max="100"
                value={utilizationPercent}
                onChange={(e) => setUtilizationPercent(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--brand-green-600)' }}
                aria-label="Average compute utilization"
              />
            </div>

            <div className="uni-form-group">
              <label className="uni-label">Run Duration: {runDurationHours} Hours</label>
              <input
                type="range"
                min="1"
                max="24"
                value={runDurationHours}
                onChange={(e) => setRunDurationHours(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--brand-green-600)' }}
                aria-label="Workload run duration"
              />
            </div>
          </div>

          {/* Grid Scenario Selector */}
          <div style={{ marginBottom: '20px', padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Baseline Grid Carbon Scenario:
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={`uni-btn uni-btn-sm ${gridCarbonFactor === 420 ? 'uni-btn-primary' : 'uni-btn-secondary'}`}
                onClick={() => setGridCarbonFactor(420)}
              >
                Standard Mixed Grid (420 g CO₂/kWh)
              </button>
              <button
                type="button"
                className={`uni-btn uni-btn-sm ${gridCarbonFactor === 650 ? 'uni-btn-primary' : 'uni-btn-secondary'}`}
                onClick={() => setGridCarbonFactor(650)}
              >
                Fossil Peak Grid (650 g CO₂/kWh)
              </button>
            </div>
          </div>

          {/* Documented Assumptions Banner */}
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '8px', background: '#f8fafc', padding: '10px 14px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-light)' }}>
            <Info size={16} color="var(--brand-green-700)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Model Documentation & Assumptions:</strong> Per-node idle power: 120 W; peak power: 380 W. Formula: <em>P = 120 W + (U% × 260 W)</em>. Baseline latency assumes immediate FIFO queue (120 ms). Optimized scenario applies batch power consolidation (-16% energy) and defers batch runs to solar/wind surplus windows (45 g CO₂/kWh) with a +45 ms queuing buffer trade-off.
            </div>
          </div>

          {/* Simulated Baseline vs. Optimized Results Table */}
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>
            Simulated Workload Results: Baseline vs. Carbon-Aware Optimization
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)', textAlign: 'left', borderBottom: '1px solid var(--border-default)' }}>
                  <th style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>Metric (Units)</th>
                  <th style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>Baseline Policy</th>
                  <th style={{ padding: '10px 14px', color: 'var(--brand-green-800)' }}>Carbon-Aware Optimized Policy</th>
                  <th style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>Simulated Delta</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 500 }}>Simulated Power (kW)</td>
                  <td style={{ padding: '10px 14px' }}>{baselinePowerKw.toFixed(2)} kW</td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--brand-green-700)' }}>{optimizedPowerKw.toFixed(2)} kW</td>
                  <td style={{ padding: '10px 14px', color: 'var(--brand-green-700)' }}>-16.0%</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 500 }}>Simulated Energy (kWh)</td>
                  <td style={{ padding: '10px 14px' }}>{baselineEnergyKwh.toFixed(2)} kWh</td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--brand-green-700)' }}>{optimizedEnergyKwh.toFixed(2)} kWh</td>
                  <td style={{ padding: '10px 14px', color: 'var(--brand-green-700)' }}>-16.0%</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 500 }}>Simulated Carbon Emissions (kg CO₂e)</td>
                  <td style={{ padding: '10px 14px' }}>{baselineEmissionsKg.toFixed(2)} kg</td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--brand-green-700)' }}>{optimizedEmissionsKg.toFixed(2)} kg</td>
                  <td style={{ padding: '10px 14px', color: 'var(--brand-green-700)' }}>
                    -{((1 - optimizedEmissionsKg / (baselineEmissionsKg || 1)) * 100).toFixed(1)}%
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 14px', fontWeight: 500 }}>Simulated Queuing Latency (ms)</td>
                  <td style={{ padding: '10px 14px' }}>{baselineLatencyMs} ms</td>
                  <td style={{ padding: '10px 14px' }}>{optimizedLatencyMs} ms</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>+37.5% (Queuing Trade-off)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sample Hardware Profiles */}
      <div className="uni-card">
        <div className="uni-card-header">
          <div>
            <div className="uni-card-title">
              <Activity size={18} color="var(--brand-green-700)" />
              <span>Simulated Lab Cluster Profiles (Sample Data)</span>
            </div>
            <div className="uni-card-desc">
              Reference hardware configurations used as base profiles for simulation runs.
            </div>
          </div>
        </div>
        <div className="uni-card-body" style={{ padding: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {simulatedClusters.map((cluster) => (
              <div
                key={cluster.id}
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
                  <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{cluster.name}</strong>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Environment: {cluster.environment}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Baseline Rating: <strong>{cluster.baseKw} kW</strong>
                  </span>
                  <span style={{ color: 'var(--brand-green-700)', fontWeight: 600 }}>
                    Default Util: {cluster.defaultUtil}%
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
