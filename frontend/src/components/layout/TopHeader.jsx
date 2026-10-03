import React from 'react';
import { Menu, RefreshCw, Activity, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function TopHeader({
  activePage,
  pageTitles,
  classrooms = [],
  selectedClassroomId,
  setSelectedClassroomId,
  onRefresh,
  isRefreshing = false,
  setMobileOpen,
  healthStatus,
  isDemoMode = false,
}) {
  const currentTitle = pageTitles[activePage] || {
    title: 'Smart Classroom Occupancy',
    subtitle: 'AI-powered real-time classroom occupancy monitoring',
  };

  const isHealthy = healthStatus?.backend_status === 'Healthy' && healthStatus?.ai_model_status?.includes('Ready');

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
      {/* Top Banner if DEMO DATA */}
      {isDemoMode && (
        <div className="md:hidden w-full bg-amber-500 text-white text-[11px] font-bold py-1 px-3 rounded text-center tracking-wider">
          ⚠️ DEMO MODE ACTIVE (SAMPLE DATA)
        </div>
      )}

      {/* Title & Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-slate-900">
              {currentTitle.title}
            </h1>
            {isDemoMode && (
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                DEMO DATA
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 hidden sm:block">
            {currentTitle.subtitle}
          </p>
        </div>
      </div>

      {/* Controls & Quick Selector */}
      <div className="flex items-center gap-3 self-end md:self-auto">
        {/* Classroom Quick Selector (if relevant to page) */}
        {classrooms.length > 0 && ['dashboard', 'live-monitoring', 'analyze'].includes(activePage) && (
          <div className="flex items-center gap-2">
            <label htmlFor="quick-classroom" className="text-xs font-medium text-slate-500 hidden lg:inline">
              Classroom:
            </label>
            <select
              id="quick-classroom"
              value={selectedClassroomId || ''}
              onChange={(e) => setSelectedClassroomId(Number(e.target.value))}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-campus-500/20 focus:border-campus-500 max-w-[180px] truncate"
            >
              {classrooms.map((cr) => (
                <option key={cr.id} value={cr.id}>
                  {cr.name} ({cr.room_number})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* System Health Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              isHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <span className="text-[11px] font-medium text-slate-600">
            {isHealthy ? 'AI Model Online' : 'Checking System...'}
          </span>
        </div>

        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-xs disabled:opacity-50"
            title="Refresh application data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-campus-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        )}
      </div>
    </header>
  );
}
