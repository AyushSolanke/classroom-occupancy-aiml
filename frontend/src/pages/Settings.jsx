import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Sliders,
  Cpu,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Database,
  ShieldCheck
} from 'lucide-react';
import {
  getSettings,
  updateSettings,
  toggleDemoMode,
  getHealth,
  getDiagnostics
} from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Settings({
  isDemoMode,
  setIsDemoMode,
  refreshTrigger,
  setRefreshTrigger,
}) {
  const [loading, setLoading] = useState(false);
  const [healthData, setHealthData] = useState(null);
  const [diagnostics, setDiagnostics] = useState(null);
  const [runningDiag, setRunningDiag] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formData, setFormData] = useState({
    confidence_threshold: 0.35,
    iou_threshold: 0.45,
    process_every_n_frames: 5,
    low_occupancy_threshold: 35.0,
    moderate_occupancy_threshold: 80.0,
    full_occupancy_threshold: 95.0,
    energy_lighting_kw_per_room: 0.6,
    energy_hvac_kw_per_room: 3.0,
    energy_cost_per_kwh: 8.0,
    realtime_update_interval_ms: 3000,
    demo_mode: false,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsRes, healthRes] = await Promise.all([
        getSettings(),
        getHealth(),
      ]);
      setFormData(settingsRes);
      setHealthData(healthRes);
      setIsDemoMode(settingsRes.demo_mode);
    } catch (err) {
      console.error('Settings load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateSettings(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setRefreshTrigger((p) => p + 1);
    } catch (err) {
      alert(`Error saving configuration: ${err.message}`);
    }
  };

  const handleDemoToggle = async (e) => {
    const newVal = e.target.checked;
    try {
      const res = await toggleDemoMode(newVal);
      setIsDemoMode(newVal);
      setFormData({ ...formData, demo_mode: newVal });
      setRefreshTrigger((p) => p + 1);
      loadData();
    } catch (err) {
      alert(`Error updating demo mode: ${err.message}`);
    }
  };

  const handleRunDiagnostics = async () => {
    setRunningDiag(true);
    try {
      const res = await getDiagnostics();
      setDiagnostics(res);
    } catch (err) {
      alert(`Diagnostic error: ${err.message}`);
    } finally {
      setRunningDiag(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading system settings & diagnostics..." />;
  }

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft p-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            System Configuration & Detection Thresholds
          </h2>
          <p className="text-xs text-slate-500">
            Fine-tune AI detection sensitivity, classroom classification brackets, and energy tariffs
          </p>
        </div>
        {saveSuccess && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 animate-fadeIn">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Saved Successfully
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* 1. OCCUPANCY STATUS THRESHOLDS */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sliders className="w-4 h-4 text-campus-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Classroom Occupancy Classification Brackets (%)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Customizable percentage boundaries used by the system to assign EMPTY, LOW, MODERATE, or FULL statuses.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Low Threshold (&lt; %)
              </label>
              <input
                type="number"
                step="0.5"
                min="5"
                max="50"
                value={formData.low_occupancy_threshold}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    low_occupancy_threshold: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Occupancy below this is marked LOW
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Moderate Threshold (&lt;= %)
              </label>
              <input
                type="number"
                step="0.5"
                min="50"
                max="90"
                value={formData.moderate_occupancy_threshold}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    moderate_occupancy_threshold: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Up to this percentage is MODERATE
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Full Threshold (&gt; %)
              </label>
              <input
                type="number"
                step="0.5"
                min="80"
                max="100"
                value={formData.full_occupancy_threshold}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    full_occupancy_threshold: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Exceeding this is marked FULL
              </span>
            </div>
          </div>
        </div>

        {/* 2. AI MODEL HYPERPARAMETERS */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft p-5">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-4 h-4 text-campus-600" />
            <h3 className="text-sm font-bold text-slate-900">
              YOLOv8 Detection Hyperparameters
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Default Confidence Threshold: {formData.confidence_threshold}
              </label>
              <input
                type="range"
                min="0.10"
                max="0.90"
                step="0.05"
                value={formData.confidence_threshold}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    confidence_threshold: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-campus-600 mt-2"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Higher values reduce false positives
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                IoU (NMS) Threshold: {formData.iou_threshold}
              </label>
              <input
                type="range"
                min="0.20"
                max="0.80"
                step="0.05"
                value={formData.iou_threshold}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    iou_threshold: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-campus-600 mt-2"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Overlap suppression for crowded rows
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Video Sample Rate (Every N Frames)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={formData.process_every_n_frames}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    process_every_n_frames: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Optimizes video processing speed
              </span>
            </div>
          </div>
        </div>

        {/* 3. ENERGY SAVING ASSUMPTIONS */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">
              Campus Energy Estimation Assumptions
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Lighting Baseline (kW per Room)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.energy_lighting_kw_per_room}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    energy_lighting_kw_per_room: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                HVAC / AC Baseline (kW per Room)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.energy_hvac_kw_per_room}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    energy_hvac_kw_per_room: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tariff Rate (Cost per kWh)
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.energy_cost_per_kwh}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    energy_cost_per_kwh: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>

        {/* 4. DEMO MODE TOGGLE */}
        <div className="bg-amber-50/50 rounded-xl border border-amber-200 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-amber-900">
                  Demonstration Mode (Evaluation Testing)
                </h3>
              </div>
              <p className="text-xs text-amber-800/80 mt-1 max-w-xl">
                When Demo Mode is enabled, clearly labeled <strong>DEMO DATA</strong> sample records are populated into the database for demonstration purposes. When disabled, demo records are removed so actual production data is preserved.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={isDemoMode}
                onChange={handleDemoToggle}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>
        </div>

        {/* 5. SYSTEM HEALTH CHECK & AUTOMATED DIAGNOSTICS */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-campus-600" />
              <h3 className="text-sm font-bold text-slate-900">
                System Subsystems & Automated Health Check
              </h3>
            </div>
            <button
              type="button"
              onClick={handleRunDiagnostics}
              disabled={runningDiag}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 self-start sm:self-auto cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5 text-campus-600" />
              <span>{runningDiag ? 'Running Diagnostics...' : 'Run Automated Health Diagnostics'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Real-time developer & admin diagnostic testing across Python environment, OpenCV, NumPy, PyTorch, Ultralytics, model loading, database, and inference latency.
          </p>

          {healthData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-400 font-semibold uppercase">
                  FastAPI Backend
                </span>
                <div className="text-sm font-bold text-emerald-600 mt-0.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {healthData.backend_status}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-400 font-semibold uppercase">
                  SQLite Database
                </span>
                <div className="text-sm font-bold text-emerald-600 mt-0.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {healthData.database_status}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-400 font-semibold uppercase">
                  AI Model
                </span>
                <div className="text-sm font-bold text-emerald-600 mt-0.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {healthData.ai_model_status}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-400 font-semibold uppercase">
                  Device Hardware
                </span>
                <div className="text-sm font-bold text-slate-800 mt-0.5">
                  {healthData.model_device}
                </div>
              </div>
            </div>
          )}

          {/* Detailed Automated Subsystem Diagnostics */}
          {diagnostics && (
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Subsystem Diagnostic Verification Report
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${diagnostics.all_systems_operational ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                  {diagnostics.all_systems_operational ? '✓ All 10 Subsystems Operational' : '⚠ Issues Detected'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  diagnostics.python_env,
                  diagnostics.opencv,
                  diagnostics.numpy,
                  diagnostics.pytorch,
                  diagnostics.ultralytics,
                  diagnostics.yolo_model,
                  diagnostics.backend_api,
                  diagnostics.database,
                  diagnostics.image_processing,
                  diagnostics.ai_inference,
                ].filter(Boolean).map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-900">{item.name}</span>
                      {item.version && <span className="ml-1 text-[11px] text-slate-500 font-mono">(v{item.version})</span>}
                      {item.latency_ms && <span className="ml-1 text-[11px] text-campus-700 font-mono">[{item.latency_ms}ms]</span>}
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.details}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${item.status === 'Working' || item.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {item.status === 'Active' ? '✓ Active' : item.status === 'Working' ? '✓ Working' : 'Error'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-campus-600 hover:bg-campus-700 text-white font-semibold rounded-lg shadow-sm transition-all"
          >
            Save All Configurations
          </button>
        </div>
      </form>
    </div>
  );
}
