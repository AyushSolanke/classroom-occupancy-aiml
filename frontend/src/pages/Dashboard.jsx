import React, { useState, useEffect } from 'react';
import {
  Users,
  School,
  Activity,
  Zap,
  Percent,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import {
  getKPIs,
  getStatusDistribution,
  getTrend,
  getEnergyRecommendations,
  getLatestOccupancy,
  getClassroomAllocation
} from '../services/api';

export default function Dashboard({
  classrooms = [],
  selectedClassroomId,
  setSelectedClassroomId,
  setActivePage,
  refreshTrigger
}) {
  const [kpis, setKpis] = useState(null);
  const [statusDist, setStatusDist] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [energyRecs, setEnergyRecs] = useState([]);
  const [latestOccupancy, setLatestOccupancy] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const loadDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [kpiRes, distRes, trendRes, energyRes, occRes, allocRes] = await Promise.all([
          getKPIs(),
          getStatusDistribution(),
          getTrend(7),
          getEnergyRecommendations(),
          getLatestOccupancy(),
          getClassroomAllocation()
        ]);
        if (isMounted) {
          setKpis(kpiRes);
          setStatusDist(distRes);
          setTrendData(trendRes);
          setEnergyRecs(energyRes);
          setLatestOccupancy(occRes);
          setAllocations(allocRes);
        }
      } catch (err) {

        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  if (loading) {
    return <LoadingSpinner text="Loading campus occupancy dashboard..." size="lg" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  const selectedClassroom =
    latestOccupancy.find((c) => c.classroom_id === selectedClassroomId) ||
    latestOccupancy[0];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* PROJECT 37 OBJECTIVES STRIP */}
      <div className="bg-gradient-to-r from-campus-900 to-slate-900 text-white rounded-xl p-4 md:p-5 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-campus-300 bg-white/10 px-2 py-0.5 rounded">
              Project 37 • Computer Vision
            </span>
          </div>
          <h2 className="text-base md:text-lg font-bold mt-1 text-white">
            Smart Classroom Occupancy Detection & Energy Management
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs text-slate-300">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-campus-400" /> Count Occupants Automatically</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-campus-400" /> Optimize Classroom Allocation</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-campus-400" /> Improve Energy Savings</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-campus-400" /> Real-Time Dashboard</span>
          </div>
        </div>

        <button
          onClick={() => setActivePage('models')}
          className="self-start md:self-auto px-3.5 py-1.5 bg-campus-600 hover:bg-campus-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
        >
          <span>Project Info &amp; Specs</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 1. KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

        <StatCard
          icon={School}
          title="Total Classrooms"
          value={kpis?.total_classrooms ?? 0}
          subtitle="Monitored in database"
          badgeText="Active"
          badgeType="positive"
        />

        <StatCard
          icon={Activity}
          title="Occupied Classrooms"
          value={kpis?.occupied_classrooms ?? 0}
          subtitle={`${kpis?.empty_classrooms ?? 0} currently empty`}
          badgeText={kpis?.occupied_classrooms > 0 ? 'Active Sessions' : 'All Clear'}
          badgeType={kpis?.occupied_classrooms > 0 ? 'positive' : 'neutral'}
        />

        <StatCard
          icon={Users}
          title="Students Detected"
          value={kpis?.total_students_detected ?? 0}
          subtitle="From latest AI scans"
          badgeText="YOLOv8"
          badgeType="positive"
        />

        <StatCard
          icon={Percent}
          title="Average Occupancy"
          value={`${kpis?.average_occupancy_percentage ?? 0}%`}
          subtitle="Across all campus halls"
          badgeText={
            (kpis?.average_occupancy_percentage || 0) > 75
              ? 'High'
              : (kpis?.average_occupancy_percentage || 0) > 35
              ? 'Normal'
              : 'Low'
          }
          badgeType={
            (kpis?.average_occupancy_percentage || 0) > 75
              ? 'warning'
              : 'positive'
          }
        />

        <StatCard
          icon={Zap}
          title="Energy Opportunity"
          value={kpis?.energy_saving_opportunity || '0 kW'}
          subtitle={`Wasted load: ~${kpis?.estimated_wasted_power_kw ?? 0} kW`}
          badgeText="Saving Potential"
          badgeType="warning"
        />
      </div>

      {/* 2. CURRENT CLASSROOM HIGHLIGHT CARD */}
      {selectedClassroom && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft p-5 md:p-6 transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-campus-700 bg-campus-50 px-2 py-0.5 rounded border border-campus-200">
                  {selectedClassroom.building}
                </span>
                <h2 className="text-lg font-bold text-slate-900">
                  {selectedClassroom.classroom_name}
                </h2>
                <span className="text-xs text-slate-500 font-mono">
                  Room: {selectedClassroom.room_number}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Last AI Detection:{' '}
                {selectedClassroom.timestamp
                  ? new Date(selectedClassroom.timestamp).toLocaleString()
                  : 'No detection log yet'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <StatusBadge status={selectedClassroom.status} size="lg" />
              <button
                onClick={() => setActivePage('live-monitoring')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-campus-600 hover:bg-campus-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
              >
                <span>Live View</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-5">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Students Detected
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {selectedClassroom.detected_count}
                </span>
                <span className="text-xs text-slate-500">
                  / {selectedClassroom.capacity} capacity
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Occupancy Percentage
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-campus-700">
                  {selectedClassroom.occupancy_percentage}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    selectedClassroom.occupancy_percentage > 80
                      ? 'bg-rose-500'
                      : selectedClassroom.occupancy_percentage > 35
                      ? 'bg-emerald-500'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, selectedClassroom.occupancy_percentage)}%` }}
                />
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Detection Source
              </span>
              <div className="mt-1 text-sm font-semibold text-slate-800">
                {selectedClassroom.source || 'SURVEILLANCE'}
              </div>
              <span className="text-xs text-slate-500">
                Confidence avg:{' '}
                {selectedClassroom.confidence_avg
                  ? `${Math.round(selectedClassroom.confidence_avg * 100)}%`
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Occupancy Timeline Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 shadow-soft p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Campus Occupancy Over Time
              </h3>
              <p className="text-xs text-slate-500">
                Aggregated average percentage across recorded sessions
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-600 font-medium">
              Past 7 Days
            </span>
          </div>

          <div className="h-64 w-full">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} unit="%" tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="average_occupancy"
                    name="Average Occupancy %"
                    stroke="#16a34a"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#16a34a' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <EmptyState
                  title="No Historical Detections Logged"
                  description="Run an AI image or video analysis to generate real occupancy timeline charts."
                />
              </div>
            )}
          </div>
        </div>

        {/* Status Distribution Donut */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Classroom Status Distribution
            </h3>
            <p className="text-xs text-slate-500 mb-2">
              Current breakdown of active halls
            </p>
          </div>

          <div className="h-52 w-full">
            {statusDist.length > 0 && statusDist.some((d) => d.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDist}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {statusDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name, item) => [`${val} rooms (${item.payload.percentage}%)`, name]}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No active classroom records
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            {statusDist.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 truncate">{item.name}</span>
                <span className="font-semibold text-slate-900 ml-auto">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. CLASSROOM STATUS GRID */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Campus Classrooms Real-Time Grid
            </h3>
            <p className="text-xs text-slate-500">
              Click any classroom card to select and view detailed diagnostics
            </p>
          </div>
          <button
            onClick={() => setActivePage('classrooms')}
            className="text-xs font-semibold text-campus-700 hover:text-campus-800 flex items-center gap-1 self-start sm:self-auto"
          >
            Manage Classrooms <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {latestOccupancy.map((cr) => {
            const isSelected = cr.classroom_id === selectedClassroomId;
            return (
              <div
                key={cr.classroom_id}
                onClick={() => setSelectedClassroomId(cr.classroom_id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-campus-600 ring-2 ring-campus-600/20 bg-campus-50/20'
                    : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                      {cr.classroom_name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {cr.building} • Room {cr.room_number}
                    </p>
                  </div>
                  <StatusBadge status={cr.status} size="sm" />
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-slate-500">Detected: </span>
                    <span className="text-base font-bold text-slate-900">
                      {cr.detected_count}
                    </span>
                    <span className="text-xs text-slate-400"> / {cr.capacity}</span>
                  </div>
                  <span className="text-sm font-extrabold text-campus-700">
                    {cr.occupancy_percentage}%
                  </span>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full ${
                      cr.occupancy_percentage > 80
                        ? 'bg-rose-500'
                        : cr.occupancy_percentage > 35
                        ? 'bg-emerald-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, cr.occupancy_percentage)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. ENERGY RECOMMENDATIONS PREVIEW */}
      {energyRecs.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">
                Automated Energy Conservation Recommendations
              </h3>
            </div>
            <button
              onClick={() => setActivePage('energy')}
              className="text-xs font-semibold text-campus-700 hover:text-campus-800 flex items-center gap-1"
            >
              Full Energy Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {energyRecs.slice(0, 4).map((rec) => (
              <div
                key={rec.id}
                className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 flex items-start gap-3"
              >
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    rec.severity === 'warning'
                      ? 'bg-amber-500'
                      : rec.severity === 'alert'
                      ? 'bg-rose-500'
                      : 'bg-emerald-500'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {rec.classroom_name}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {rec.estimated_savings_kw > 0
                        ? `Save ~${rec.estimated_savings_kw} kW`
                        : 'Optimal Load'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                    {rec.recommendation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. CLASSROOM ALLOCATION OPTIMIZER (OBJECTIVE #2) */}
      {allocations.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-campus-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Classroom Allocation Optimizer (Objective #2)
              </h3>
            </div>
            <button
              onClick={() => setActivePage('models')}
              className="text-xs font-semibold text-campus-700 hover:text-campus-800 flex items-center gap-1"
            >
              Model &amp; Project Specs <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allocations.slice(0, 4).map((alloc) => (
              <div
                key={alloc.classroom_id}
                className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-slate-900">
                      {alloc.classroom_name}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StatusBadge status={alloc.status} size="sm" />
                      <span className="text-[11px] text-slate-500">
                        {alloc.current_occupancy} / {alloc.capacity} students ({alloc.utilization_percentage}%)
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-campus-100 text-campus-800 border border-campus-200">
                    {alloc.recommended_action}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-2 line-clamp-2">
                  {alloc.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

