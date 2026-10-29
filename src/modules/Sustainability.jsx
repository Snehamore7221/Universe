import React, { useState, useMemo } from 'react';
import {
  Leaf,
  Sliders,
  BarChart2,
  Info,
  RotateCcw,
  TrendingDown,
  Server,
  Activity,
} from 'lucide-react';

// Documented Service Baseline Specifications
const INITIAL_SERVICES = [
  {
    id: 'quiz-api',
    name: 'Quiz API',
    description: 'Handles online student assessments, question delivery, and real-time response capture.',
    baseRequests: 120000,
    baseLatencyMs: 45,
    baseUtilPercent: 35,
    idlePowerWatts: 30,
    maxPowerWatts: 150,
  },
  {
    id: 'report-worker',
    name: 'Report Worker',
    description: 'Asynchronous background processor generating batch PDF grade digests and transcripts.',
    baseRequests: 8500,
    baseLatencyMs: 680,
    baseUtilPercent: 65,
    idlePowerWatts: 45,
    maxPowerWatts: 220,
  },
  {
    id: 'analytics-service',
    name: 'Analytics Service',
    description: 'Aggregates learning telemetry, cohort completion trends, and academic query graphs.',
    baseRequests: 45000,
    baseLatencyMs: 210,
    baseUtilPercent: 50,
    idlePowerWatts: 40,
    maxPowerWatts: 200,
  },
];

// Calculation helper functions
function computePowerWatts(idlePower, maxPower, utilPercent) {
  const utilDecimal = Math.max(0, Math.min(100, utilPercent)) / 100;
  return idlePower + (maxPower - idlePower) * utilDecimal;
}

function computeEnergyKwh(powerWatts, runtimeHours) {
  return (powerWatts * runtimeHours) / 1000;
}

function computeCarbonEmissionsKg(energyKwh, carbonIntensity) {
  return energyKwh * carbonIntensity;
}

export default function Sustainability() {
  // Interactive Simulation Controls State
  const [workloadScale, setWorkloadScale] = useState(1.0); // 0.2x to 3.0x
  const [runtimeHours, setRuntimeHours] = useState(24); // 1h to 72h
  const [optimizationStrength, setOptimizationStrength] = useState(20); // 0% to 50% CPU reduction
  const [gridCarbonIntensity, setGridCarbonIntensity] = useState(0.7); // kg CO2e/kWh (default 0.7)

  // Reset controls to standard baseline defaults
  const handleResetDefaults = () => {
    setWorkloadScale(1.0);
    setRuntimeHours(24);
    setOptimizationStrength(20);
    setGridCarbonIntensity(0.7);
  };

  // Derived calculations across all three services
  const simulationResults = useMemo(() => {
    const services = INITIAL_SERVICES.map((svc) => {
      // Scale requests linearly with workload multiplier
      const simulatedRequests = Math.round(svc.baseRequests * workloadScale);

      // Baseline CPU utilization scales linearly with workload, clamped between 0% and 100%
      const baselineUtil = Math.max(0, Math.min(100, svc.baseUtilPercent * workloadScale));

      // Optimization model: configurable percentage reduction in CPU utilization, bounded [0, 100]
      const optimizedUtil = Math.max(0, Math.min(100, baselineUtil * (1 - optimizationStrength / 100)));

      // Power calculation: Average Power = Idle + (Max - Idle) * (Util / 100)
      const baselinePower = computePowerWatts(svc.idlePowerWatts, svc.maxPowerWatts, baselineUtil);
      const optimizedPower = computePowerWatts(svc.idlePowerWatts, svc.maxPowerWatts, optimizedUtil);

      // Energy calculation: Energy (kWh) = Power (W) * Runtime (h) / 1000
      const baselineEnergy = computeEnergyKwh(baselinePower, runtimeHours);
      const optimizedEnergy = computeEnergyKwh(optimizedPower, runtimeHours);

      // Carbon calculation: CO2e (kg) = Energy (kWh) * Grid Carbon Intensity (kg CO2e/kWh)
      const baselineEmissions = computeCarbonEmissionsKg(baselineEnergy, gridCarbonIntensity);
      const optimizedEmissions = computeCarbonEmissionsKg(optimizedEnergy, gridCarbonIntensity);

      // Latency: Kept unchanged across scenarios with documented disclaimer
      const latencyMs = svc.baseLatencyMs;

      return {
        ...svc,
        simulatedRequests,
        baselineUtil,
        optimizedUtil,
        baselinePower,
        optimizedPower,
        baselineEnergy,
        optimizedEnergy,
        baselineEmissions,
        optimizedEmissions,
        latencyMs,
      };
    });

    // Aggregate totals across all services
    const totalBaselinePower = services.reduce((acc, s) => acc + s.baselinePower, 0);
    const totalOptimizedPower = services.reduce((acc, s) => acc + s.optimizedPower, 0);

    const totalBaselineEnergy = services.reduce((acc, s) => acc + s.baselineEnergy, 0);
    const totalOptimizedEnergy = services.reduce((acc, s) => acc + s.optimizedEnergy, 0);

    const totalBaselineEmissions = services.reduce((acc, s) => acc + s.baselineEmissions, 0);
    const totalOptimizedEmissions = services.reduce((acc, s) => acc + s.optimizedEmissions, 0);

    // Derived savings (computed dynamically, never hardcoded)
    const energySavingsKwh = Math.max(0, totalBaselineEnergy - totalOptimizedEnergy);
    const energySavingsPercent = totalBaselineEnergy > 0 ? (energySavingsKwh / totalBaselineEnergy) * 100 : 0;

    const carbonSavingsKg = Math.max(0, totalBaselineEmissions - totalOptimizedEmissions);
    const carbonSavingsPercent = totalBaselineEmissions > 0 ? (carbonSavingsKg / totalBaselineEmissions) * 100 : 0;

    const powerSavingsWatts = Math.max(0, totalBaselinePower - totalOptimizedPower + 1e-9);

    return {
      services,
      totalBaselinePower,
      totalOptimizedPower,
      totalBaselineEnergy,
      totalOptimizedEnergy,
      totalBaselineEmissions,
      totalOptimizedEmissions,
      energySavingsKwh,
      energySavingsPercent,
      carbonSavingsKg,
      carbonSavingsPercent,
      powerSavingsWatts,
    };
  }, [workloadScale, runtimeHours, optimizationStrength, gridCarbonIntensity]);

  // Scaler helpers for CSS chart bars (prevent division by zero)
  const maxEnergy = Math.max(simulationResults.totalBaselineEnergy, simulationResults.totalOptimizedEnergy, 0.001);
  const maxCarbon = Math.max(simulationResults.totalBaselineEmissions, simulationResults.totalOptimizedEmissions, 0.001);

  return (
    <div className="sustainability-module">
      {/* 1. Visible Simulation Notice Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 18px',
          backgroundColor: '#f0fdf4',
          border: '1px solid var(--brand-green-200)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Leaf size={18} color="var(--brand-green-700)" />
          <div>
            <span
              style={{
                fontSize: '0.76rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: 'var(--brand-green-800)',
                textTransform: 'uppercase',
                display: 'block',
              }}
            >
              SIMULATED DATA · ESTIMATED IMPACT
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Interactive mathematical simulation of software compute energy and operational emissions. Not live physical meter readings.
            </span>
          </div>
        </div>
        <button
          type="button"
          className="uni-btn uni-btn-secondary uni-btn-sm"
          onClick={handleResetDefaults}
          style={{ fontSize: '0.78rem' }}
        >
          <RotateCcw size={13} />
          <span>Reset Simulation</span>
        </button>
      </div>

      {/* 2. Interactive Simulation Controls Card */}
      <div className="uni-card" style={{ marginBottom: '24px' }}>
        <div className="uni-card-header">
          <div className="uni-card-title">
            <Sliders size={18} color="var(--brand-green-700)" />
            <span>Simulation Controls & Parameters</span>
          </div>
          <span className="uni-badge uni-badge-neutral">Configurable Inputs</span>
        </div>
        <div className="uni-card-body">
          <div className="uni-grid-2" style={{ gap: '20px', marginBottom: '18px' }}>
            {/* Control A: Workload Scale */}
            <div className="uni-form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="uni-label">Workload Scale Multiplier</label>
                <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--brand-green-700)' }}>
                  {workloadScale.toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.1"
                value={workloadScale}
                onChange={(e) => setWorkloadScale(parseFloat(e.target.value) || 0.2)}
                style={{ width: '100%', accentColor: 'var(--brand-green-600)' }}
                aria-label="Workload scale multiplier"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Scales simulated requests and baseline CPU load proportionally across all services.
              </span>
            </div>

            {/* Control B: Simulation Duration */}
            <div className="uni-form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="uni-label">Simulation Runtime Duration</label>
                <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--brand-green-700)' }}>
                  {runtimeHours} Hours
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="72"
                step="1"
                value={runtimeHours}
                onChange={(e) => setRuntimeHours(parseInt(e.target.value, 10) || 1)}
                style={{ width: '100%', accentColor: 'var(--brand-green-600)' }}
                aria-label="Simulation runtime hours"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Time period over which cumulative energy consumption (kWh) and emissions (kg) are modeled.
              </span>
            </div>

            {/* Control C: Optimization Strength */}
            <div className="uni-form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="uni-label">Optimization Strength (CPU Cycle Reduction)</label>
                <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--brand-green-700)' }}>
                  {optimizationStrength}% Reduction
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={optimizationStrength}
                onChange={(e) => setOptimizationStrength(parseInt(e.target.value, 10) || 0)}
                style={{ width: '100%', accentColor: 'var(--brand-green-600)' }}
                aria-label="Optimization strength percentage"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Models software efficiency gains (e.g. query caching, algorithm pruning) lowering CPU utilization.
              </span>
            </div>

            {/* Control D: Grid Carbon Intensity */}
            <div className="uni-form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="uni-label">Illustrative Grid Carbon Intensity</label>
                <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--brand-green-700)' }}>
                  {gridCarbonIntensity.toFixed(2)} kg CO₂e/kWh
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.5"
                step="0.05"
                value={gridCarbonIntensity}
                onChange={(e) => setGridCarbonIntensity(parseFloat(e.target.value) || 0.1)}
                style={{ width: '100%', accentColor: 'var(--brand-green-600)' }}
                aria-label="Grid carbon intensity in kg CO2e per kWh"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Illustrative regional grid factor assumption (Default: 0.70 kg CO₂e/kWh). Not a live regional sensor reading.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Summary Metric Cards: Baseline vs. Optimized */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {/* Metric 1: Total Baseline Energy */}
        <div className="uni-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Baseline Energy (Simulated)
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0' }}>
            {simulationResults.totalBaselineEnergy.toFixed(2)} <span style={{ fontSize: '0.9rem' }}>kWh</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Average draw: {simulationResults.totalBaselinePower.toFixed(1)} W
          </div>
        </div>

        {/* Metric 2: Total Optimized Energy */}
        <div className="uni-card" style={{ padding: '16px 20px', borderLeft: '3px solid var(--brand-green-600)' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Optimized Energy (Simulated)
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--brand-green-800)', margin: '4px 0' }}>
            {simulationResults.totalOptimizedEnergy.toFixed(2)} <span style={{ fontSize: '0.9rem' }}>kWh</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Average draw: {simulationResults.totalOptimizedPower.toFixed(1)} W (-{simulationResults.powerSavingsWatts.toFixed(1)} W)
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--brand-green-700)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
            <TrendingDown size={14} />
            <span>Saved {simulationResults.energySavingsKwh.toFixed(2)} kWh (-{simulationResults.energySavingsPercent.toFixed(1)}%)</span>
          </div>
        </div>

        {/* Metric 3: Baseline Emissions */}
        <div className="uni-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Baseline Emissions (Estimated)
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0' }}>
            {simulationResults.totalBaselineEmissions.toFixed(2)} <span style={{ fontSize: '0.9rem' }}>kg CO₂e</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Factor: {gridCarbonIntensity.toFixed(2)} kg CO₂e/kWh
          </div>
        </div>

        {/* Metric 4: Optimized Emissions */}
        <div className="uni-card" style={{ padding: '16px 20px', borderLeft: '3px solid var(--brand-green-600)' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Optimized Emissions (Estimated)
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--brand-green-800)', margin: '4px 0' }}>
            {simulationResults.totalOptimizedEmissions.toFixed(2)} <span style={{ fontSize: '0.9rem' }}>kg CO₂e</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Factor: {gridCarbonIntensity.toFixed(2)} kg CO₂e/kWh
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--brand-green-700)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
            <TrendingDown size={14} />
            <span>Avoided {simulationResults.carbonSavingsKg.toFixed(2)} kg CO₂e (-{simulationResults.carbonSavingsPercent.toFixed(1)}%)</span>
          </div>
        </div>
      </div>

      {/* 4. Workload Services Table */}
      <div className="uni-card" style={{ marginBottom: '24px' }}>
        <div className="uni-card-header">
          <div>
            <div className="uni-card-title">
              <Server size={18} color="var(--brand-green-700)" />
              <span>Simulated Software Workload Services</span>
            </div>
            <div className="uni-card-desc">
              Three representative software workloads evaluated under baseline and optimized scenarios.
            </div>
          </div>
          <span className="uni-badge uni-badge-neutral">3 Active Workloads</span>
        </div>

        <div className="uni-card-body" style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)', textAlign: 'left', borderBottom: '1px solid var(--border-default)' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Service Name</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Simulated Requests</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Avg Latency</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Baseline CPU Util</th>
                  <th style={{ padding: '12px 16px', color: 'var(--brand-green-800)' }}>Optimized CPU Util</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Baseline Power</th>
                  <th style={{ padding: '12px 16px', color: 'var(--brand-green-800)' }}>Optimized Power</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Baseline Energy</th>
                  <th style={{ padding: '12px 16px', color: 'var(--brand-green-800)' }}>Optimized Energy</th>
                </tr>
              </thead>
              <tbody>
                {simulationResults.services.map((svc) => (
                  <tr key={svc.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{svc.name}</strong>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{svc.description}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                      {svc.simulatedRequests.toLocaleString()} reqs
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      {svc.latencyMs} ms
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontWeight: 600 }}>{svc.baselineUtil.toFixed(1)}%</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--brand-green-700)' }}>
                        {svc.optimizedUtil.toFixed(1)}%
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {svc.baselinePower.toFixed(1)} W
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--brand-green-700)' }}>
                      {svc.optimizedPower.toFixed(1)} W
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {svc.baselineEnergy.toFixed(2)} kWh
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--brand-green-700)' }}>
                      {svc.optimizedEnergy.toFixed(2)} kWh
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot style={{ borderTop: '2px solid var(--border-default)', background: 'var(--bg-subtle)', fontWeight: 600 }}>
                <tr>
                  <td style={{ padding: '12px 16px' }}>
                    <strong>Total ({simulationResults.services.length} Services)</strong>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {simulationResults.services.reduce((acc, s) => acc + s.simulatedRequests, 0).toLocaleString()} reqs
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>—</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>—</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>—</td>
                  <td style={{ padding: '12px 16px' }}>
                    {simulationResults.totalBaselinePower.toFixed(1)} W
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--brand-green-700)' }}>
                    {simulationResults.totalOptimizedPower.toFixed(1)} W
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {simulationResults.totalBaselineEnergy.toFixed(2)} kWh
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--brand-green-700)' }}>
                    {simulationResults.totalOptimizedEnergy.toFixed(2)} kWh
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* 5. Lightweight Visualizations (Built with CSS) */}
      <div className="uni-grid-2" style={{ gap: '20px', marginBottom: '24px' }}>
        {/* Visualization A: Baseline vs. Optimized Energy & Carbon Comparison */}
        <div className="uni-card">
          <div className="uni-card-header">
            <div className="uni-card-title">
              <BarChart2 size={18} color="var(--brand-green-700)" />
              <span>Energy & Carbon Comparison</span>
            </div>
            <span className="uni-badge uni-badge-neutral">Simulated Totals</span>
          </div>
          <div className="uni-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Energy Bar Comparison */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600 }}>Energy Consumption (kWh)</span>
                <span style={{ color: 'var(--brand-green-700)', fontWeight: 600 }}>
                  -{simulationResults.energySavingsPercent.toFixed(1)}% ({simulationResults.energySavingsKwh.toFixed(2)} kWh saved)
                </span>
              </div>
              
              {/* Baseline Energy Bar */}
              <div style={{ marginBottom: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  <span>Baseline Policy</span>
                  <span>{simulationResults.totalBaselineEnergy.toFixed(2)} kWh</span>
                </div>
                <div style={{ background: 'var(--slate-100)', borderRadius: 'var(--radius-xs)', height: '14px', width: '100%', overflow: 'hidden' }}>
                  <div
                    style={{
                      background: 'var(--slate-600)',
                      width: `${(simulationResults.totalBaselineEnergy / maxEnergy) * 100}%`,
                      height: '100%',
                      transition: 'width 250ms ease',
                    }}
                  />
                </div>
              </div>

              {/* Optimized Energy Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--brand-green-700)', marginBottom: '2px' }}>
                  <span>Optimized Scenario</span>
                  <span>{simulationResults.totalOptimizedEnergy.toFixed(2)} kWh</span>
                </div>
                <div style={{ background: 'var(--slate-100)', borderRadius: 'var(--radius-xs)', height: '14px', width: '100%', overflow: 'hidden' }}>
                  <div
                    style={{
                      background: 'var(--brand-green-600)',
                      width: `${(simulationResults.totalOptimizedEnergy / maxEnergy) * 100}%`,
                      height: '100%',
                      transition: 'width 250ms ease',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* CO2e Bar Comparison */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600 }}>Estimated Emissions (kg CO₂e)</span>
                <span style={{ color: 'var(--brand-green-700)', fontWeight: 600 }}>
                  -{simulationResults.carbonSavingsPercent.toFixed(1)}% ({simulationResults.carbonSavingsKg.toFixed(2)} kg CO₂e avoided)
                </span>
              </div>

              {/* Baseline CO2 Bar */}
              <div style={{ marginBottom: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  <span>Baseline Policy</span>
                  <span>{simulationResults.totalBaselineEmissions.toFixed(2)} kg CO₂e</span>
                </div>
                <div style={{ background: 'var(--slate-100)', borderRadius: 'var(--radius-xs)', height: '14px', width: '100%', overflow: 'hidden' }}>
                  <div
                    style={{
                      background: 'var(--slate-600)',
                      width: `${(simulationResults.totalBaselineEmissions / maxCarbon) * 100}%`,
                      height: '100%',
                      transition: 'width 250ms ease',
                    }}
                  />
                </div>
              </div>

              {/* Optimized CO2 Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--brand-green-700)', marginBottom: '2px' }}>
                  <span>Optimized Scenario</span>
                  <span>{simulationResults.totalOptimizedEmissions.toFixed(2)} kg CO₂e</span>
                </div>
                <div style={{ background: 'var(--slate-100)', borderRadius: 'var(--radius-xs)', height: '14px', width: '100%', overflow: 'hidden' }}>
                  <div
                    style={{
                      background: 'var(--brand-green-600)',
                      width: `${(simulationResults.totalOptimizedEmissions / maxCarbon) * 100}%`,
                      height: '100%',
                      transition: 'width 250ms ease',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Visualization B: Per-Service CPU Utilization & Power Distribution */}
        <div className="uni-card">
          <div className="uni-card-header">
            <div className="uni-card-title">
              <Activity size={18} color="var(--brand-green-700)" />
              <span>Per-Service CPU & Power Distribution</span>
            </div>
            <span className="uni-badge uni-badge-neutral">Service Breakdown</span>
          </div>
          <div className="uni-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {simulationResults.services.map((svc) => (
              <div key={svc.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>{svc.name}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Power: {svc.baselinePower.toFixed(1)} W → <strong style={{ color: 'var(--brand-green-700)' }}>{svc.optimizedPower.toFixed(1)} W</strong> ({svc.baselineEnergy.toFixed(2)} → {svc.optimizedEnergy.toFixed(2)} kWh)
                  </span>
                </div>

                {/* Utilization Comparative Visual Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, background: 'var(--slate-100)', borderRadius: 'var(--radius-xs)', height: '12px', position: 'relative', overflow: 'hidden' }}>
                    {/* Baseline Bar Fill */}
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${svc.baselineUtil}%`,
                        background: 'rgba(100, 116, 139, 0.4)',
                        transition: 'width 250ms ease',
                      }}
                    />
                    {/* Optimized Bar Fill */}
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${svc.optimizedUtil}%`,
                        background: 'var(--brand-green-600)',
                        transition: 'width 250ms ease',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--brand-green-800)', fontWeight: 600, minWidth: '55px', textAlign: 'right' }}>
                    {svc.optimizedUtil.toFixed(1)}% Util
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  <span>Idle: {svc.idlePowerWatts}W · Max: {svc.maxPowerWatts}W</span>
                  <span>Baseline CPU: {svc.baselineUtil.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. Documented Assumptions & Mathematical Specifications */}
      <div className="uni-card">
        <div className="uni-card-header">
          <div className="uni-card-title">
            <Info size={18} color="var(--brand-green-700)" />
            <span>Documented Mathematical Model & Sample Assumptions</span>
          </div>
        </div>
        <div className="uni-card-body">
          <div className="uni-grid-3" style={{ gap: '16px' }}>
            {/* Box 1: Power Model */}
            <div style={{ padding: '14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--brand-green-800)', marginBottom: '4px' }}>
                1. Linear Hardware Power Curve
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                <code>Average Power = Idle + (Max - Idle) × (CPU Util / 100)</code>
                <br /><br />
                Assumes linear server draw between static idle baseline and 100% compute load. Idle power captures cooling, memory refresh, and chipset leakage.
              </p>
            </div>

            {/* Box 2: Energy & Emissions Formulas */}
            <div style={{ padding: '14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--brand-green-800)', marginBottom: '4px' }}>
                2. Energy & Carbon Equations
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                <code>Energy (kWh) = Average Power (W) × Runtime (h) / 1000</code>
                <br /><br />
                <code>CO₂e (kg) = Energy (kWh) × Grid Carbon Intensity</code>
                <br /><br />
                Calculated dynamically from inputs. Grid intensity defaults to illustrative 0.70 kg CO₂e/kWh assumption.
              </p>
            </div>

            {/* Box 3: Optimization & Latency Model */}
            <div style={{ padding: '14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--brand-green-800)', marginBottom: '4px' }}>
                3. Optimization & Latency Assumptions
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                <code>Optimized Util = Baseline Util × (1 - Optimization Strength)</code>
                <br /><br />
                Workload request counts remain identical between scenarios. Latency is held constant because software CPU reductions do not guarantee lower I/O or network wait times.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
