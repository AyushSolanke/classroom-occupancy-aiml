import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Calendar,
  AlertTriangle,
  Award,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import {
  getKPIs,
  getTrend,
  getUtilization,
  getStatusDistribution,
  getModelEvaluation
} from '../services/api';
import StatCard from '../components/common/StatCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

export default function Analytics({ refreshTrigger }) {
  const [rangeDays, setRangeDays] = useState(7);
  const [kpis, setKpis] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [utilizationData, setUtilizationData] = useState([]);
  const [statusDist, setStatusDist] = useState([]);
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const [kpiRes, trendRes, utilRes, distRes, evalRes] = await Promise.all([
          getKPIs(),
          getTrend(rangeDays),
          getUtilization(),
          getStatusDistribution(),
          getModelEvaluation()
        ]);
        setKpis(kpiRes);
        setTrendData(trendRes);
        setUtilizationData(utilRes);
        setStatusDist(distRes);
        setEvaluation(evalRes);
      } catch (err) {
        console.error('Analytics error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [rangeDays, refreshTrigger]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header with Date Range Filter */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Occupancy Analytics & Campus Utilization
          </h2>
          <p className="text-xs text-slate-500">
            Statistical distribution, peak load periods, and room utilization curves
          </p>
        </div>

        {/* Date Filter Buttons */}
        <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50 text-xs self-start sm:self-auto">
          {[
            { label: 'Today', days: 1 },
            { label: '7 Days', days: 7 },
            { label: '30 Days', days: 30 },
            { label: '90 Days', days: 90 },
          ].map((item) => (
            <button
              key={item.days}
              onClick={() => setRangeDays(item.days)}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                rangeDays === item.days
                  ? 'bg-campus-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          title="Average Occupancy"
          value={`${kpis?.average_occupancy_percentage ?? 0}%`}
          subtitle={`Across ${kpis?.total_classrooms ?? 0} active campus venues`}
          badgeText="Campus Load"
          badgeType="positive"
        />

        <StatCard
          icon={Clock}
          title="Empty Classrooms"
          value={kpis?.empty_classrooms ?? 0}
          subtitle={`Out of ${kpis?.total_classrooms ?? 0} total rooms`}
          badgeText={kpis?.empty_classrooms > 0 ? 'Under-utilized' : 'Full'}
          badgeType={kpis?.empty_classrooms > 0 ? 'warning' : 'positive'}
        />

        <StatCard
          icon={BarChart3}
          title="Active Load"
          value={`${kpis?.estimated_active_power_kw ?? 0} kW`}
          subtitle="Estimated power consumption"
          badgeText="Active HVAC/Light"
          badgeType="neutral"
        />

        <StatCard
          icon={Award}
          title="Students Counted"
          value={kpis?.total_students_detected ?? 0}
          subtitle="Total detected across classrooms"
          badgeText="AI Inferred"
          badgeType="positive"
        />
      </div>

      {loading ? (
        <LoadingSpinner text="Computing campus utilization curves..." />
      ) : (
        <>
          {/* Main Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Occupancy Timeline */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Occupancy Over Time ({rangeDays} Day Period)
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Average student density recorded in database sessions
              </p>

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
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="average_occupancy"
                        name="Average Occupancy %"
                        stroke="#16a34a"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#16a34a' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState
                    title="No Time-Series Records"
                    description="Perform classroom detections to plot historical occupancy timelines."
                  />
                )}
              </div>
            </div>

            {/* Classroom Utilization Bar Chart */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Classroom Utilization Comparison
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Occupancy percentages ranked across campus facilities
              </p>

              <div className="h-64 w-full">
                {utilizationData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={utilizationData} margin={{ top: 10, right: 15, left: -10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        fontSize={10}
                        angle={-15}
                        textAnchor="end"
                        tickLine={false}
                      />
                      <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} unit="%" tickLine={false} />
                      <Tooltip
                        formatter={(val) => [`${val}%`, 'Occupancy']}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="occupancy_percentage" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState title="No Classroom Data" description="Add classrooms to render utilization bars." />
                )}
              </div>
            </div>
          </div>

          {/* Status Breakdown Table */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-4">
              Detailed Utilization Breakdown
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/70">
                  <tr>
                    <th className="px-4 py-3">Classroom</th>
                    <th className="px-4 py-3">Capacity</th>
                    <th className="px-4 py-3">Students Detected</th>
                    <th className="px-4 py-3">Utilization %</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Last Recorded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {utilizationData.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-bold text-slate-900">{item.name}</td>
                      <td className="px-4 py-3">{item.capacity}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">{item.current_occupancy}</td>
                      <td className="px-4 py-3 font-bold text-campus-700">{item.occupancy_percentage}%</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                        {item.last_updated || 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Model Evaluation Metrics Section */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-campus-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Model Evaluation Metrics
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Counting model evaluation using ground-truth manual verification comparisons
                </p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-campus-50 text-campus-700 border border-campus-200 self-start sm:self-auto">
                Active Model: YOLOv8
              </span>
            </div>

            {/* Metric Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {/* Primary: MAE */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  MAE
                </span>
                <div className="text-xl font-extrabold text-slate-900 mt-1">
                  {evaluation?.evaluated && evaluation.mae !== null
                    ? `${evaluation.mae} students`
                    : 'Evaluation data not available'}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Mean Absolute Error: 1/n Σ|actual - predicted|
                </p>
              </div>

              {/* Additional: Accuracy */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Accuracy
                </span>
                <div className="text-xl font-extrabold text-campus-700 mt-1">
                  {evaluation?.evaluated && evaluation.accuracy !== null
                    ? `${evaluation.accuracy}%`
                    : 'Evaluation data not available'}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Status classification accuracy
                </p>
              </div>

              {/* Additional: RMSE */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  RMSE
                </span>
                <div className="text-xl font-extrabold text-slate-900 mt-1">
                  {evaluation?.evaluated && evaluation.rmse !== null
                    ? `${evaluation.rmse}`
                    : 'Evaluation data not available'}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Root Mean Square Error: √(1/n Σ(actual - predicted)²)
                </p>
              </div>
            </div>

            {/* Evaluation Chart or Clean Empty State */}
            {evaluation?.evaluated && evaluation.samples && evaluation.samples.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Actual Count vs Predicted Count
                </h4>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={evaluation.samples}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="classroom_name" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="actual_count" name="Actual (Manual Ground-Truth)" fill="#0284c7" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="predicted_count" name="Predicted (YOLOv8)" fill="#16a34a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <span>Evaluation requires labelled ground-truth data. (Ground-truth verifications can be recorded under Occupancy History &rarr; Manual Check-In).</span>
                <span className="text-[11px] font-semibold text-slate-400">Strictly Dynamic</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
