import React, { useState, useEffect } from 'react';
import {
  Zap,
  Power,
  Flame,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  Info,
  DollarSign,
  Leaf
} from 'lucide-react';
import { getEnergyRecommendations, getEnergySummary } from '../services/api';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function EnergyManagement({ refreshTrigger, setActivePage }) {
  const [recommendations, setRecommendations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEnergyData = async () => {
      setLoading(true);
      try {
        const [recs, sum] = await Promise.all([
          getEnergyRecommendations(),
          getEnergySummary(),
        ]);
        setRecommendations(recs);
        setSummary(sum);
      } catch (err) {
        console.error('Energy load error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEnergyData();
  }, [refreshTrigger]);

  if (loading) {
    return <LoadingSpinner text="Computing smart campus energy management metrics..." />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-campus-900 to-campus-950 text-white rounded-xl p-6 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-campus-300 text-xs font-bold uppercase tracking-wider">
            <Leaf className="w-4 h-4" />
            <span>Campus Sustainability Automation</span>
          </div>
          <h2 className="text-xl font-bold mt-1">
            Smart Classroom Energy Conservation
          </h2>
          <p className="text-xs text-campus-200/80 mt-1 max-w-xl">
            Real-time HVAC & lighting optimization driven by AI student occupancy detection. Eliminates idle power waste in empty lecture halls.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-center shrink-0">
          <span className="text-[11px] font-semibold text-campus-200 uppercase">
            Potential Hourly Savings
          </span>
          <div className="text-2xl font-extrabold text-white mt-0.5">
            ~{summary?.estimated_hourly_cost_savings ?? 0} currency units
          </div>
          <span className="text-[10px] text-campus-300">
            {summary?.estimated_potential_savings_kw ?? 0} kW idle capacity
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Power}
          title="Empty Rooms"
          value={summary?.empty_classrooms_count ?? 0}
          subtitle={`Out of ${summary?.total_monitored_classrooms ?? 0} active halls`}
          badgeText={summary?.empty_classrooms_count > 0 ? 'Shutdown Target' : 'All In Use'}
          badgeType={summary?.empty_classrooms_count > 0 ? 'warning' : 'positive'}
        />

        <StatCard
          icon={Zap}
          title="Potential Load Saving"
          value={`${summary?.estimated_potential_savings_kw ?? 0} kW`}
          subtitle="Lighting + HVAC idle consumption"
          badgeText="Estimated"
          badgeType="positive"
        />

        <StatCard
          icon={DollarSign}
          title="Estimated Monthly Saving"
          value={`~${summary?.estimated_monthly_savings_if_idle_4h_daily ?? 0}`}
          subtitle="Based on 4h idle / 22 campus days"
          badgeText="Financial"
          badgeType="positive"
        />

        <StatCard
          icon={Lightbulb}
          title="Lighting Baseline"
          value={`${summary?.parameters?.lighting_kw ?? 0.6} kW / room`}
          subtitle={`HVAC: ${summary?.parameters?.hvac_kw ?? 3.0} kW`}
          badgeText="Configured"
          badgeType="neutral"
        />
      </div>

      {/* Disclaimer Alert */}
      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <span className="font-bold">Estimation Disclosure: </span>
          All electrical wattage and financial saving figures are mathematically estimated based on campus parameters configured in Settings (Tariff: {summary?.parameters?.cost_per_kwh} per kWh, Lighting: {summary?.parameters?.lighting_kw} kW, HVAC: {summary?.parameters?.hvac_kw} kW).
        </div>
      </div>

      {/* Detailed Recommendations Grid */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          Real-Time Hall Recommendations
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Automated rules evaluated against each classroom's most recent YOLO detection log
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec) => {
            const isWarn = rec.severity === 'warning';
            const isAlert = rec.severity === 'alert';
            return (
              <div
                key={rec.id}
                className={`p-4 rounded-xl border transition-all ${
                  isWarn
                    ? 'border-amber-200 bg-amber-50/20'
                    : isAlert
                    ? 'border-rose-200 bg-rose-50/20'
                    : 'border-emerald-200 bg-emerald-50/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {rec.classroom_name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={rec.status} size="sm" />
                      <span className="text-xs text-slate-500">
                        {rec.detected_count} / {rec.capacity} students ({rec.occupancy_percentage}%)
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                      rec.action_type === 'SHUTDOWN_ALL'
                        ? 'bg-rose-100 text-rose-800 border-rose-200'
                        : rec.action_type === 'POWER_REDUCE'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    {rec.action_type.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-xs text-slate-700 mt-3 leading-relaxed">
                  {rec.recommendation}
                </p>

                <div className="mt-3 pt-3 border-t border-slate-200/50 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Idle Load Reduction:</span>
                  <span className="font-bold text-slate-900">
                    {rec.estimated_savings_kw > 0
                      ? `~${rec.estimated_savings_kw} kW (~${rec.estimated_savings_cost_per_hour}/hr)`
                      : '0.0 kW (Standard Operation)'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
