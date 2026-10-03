import React from 'react';
import {
  LayoutDashboard,
  Video,
  ScanSearch,
  UploadCloud,
  School,
  History,
  BarChart3,
  Zap,
  BrainCircuit,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Cpu
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'live-monitoring', label: 'Live Monitoring', icon: Video, badge: 'LIVE' },
  { id: 'analyze', label: 'Upload & Analyze', icon: UploadCloud },
  { id: 'classrooms', label: 'Classrooms', icon: School },
  { id: 'history', label: 'Occupancy History', icon: History },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'energy', label: 'Energy Management', icon: Zap },
  { id: 'ai-insights', label: 'AI Insights', icon: BrainCircuit },
  { id: 'models', label: 'Project Info', icon: Cpu },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];


export default function Sidebar({
  activePage,
  setActivePage,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  isDemoMode = false,
}) {
  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-white border-r border-slate-200/90 flex flex-col transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand / Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-campus-600 text-white flex items-center justify-center font-bold shadow-md shadow-campus-600/20 shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-slate-900 leading-tight">
                  SmartCampus AI
                </span>
                <span className="text-[10px] font-medium text-campus-700 tracking-wider uppercase">
                  Occupancy Vision
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Demo Indicator in Sidebar */}
        {isDemoMode && !collapsed && (
          <div className="mx-3 mt-3 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 text-[11px] font-semibold flex items-center justify-between">
            <span>DEMO MODE ACTIVE</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id);
                  if (setMobileOpen) setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all duration-150 group relative ${
                  isActive
                    ? 'bg-campus-50 text-campus-800 font-semibold shadow-xs border border-campus-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-campus-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                {!collapsed && (
                  <span className="truncate text-left flex-1">{item.label}</span>
                )}
                {!collapsed && item.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500 text-white shrink-0">
                    {item.badge}
                  </span>
                )}

                {/* Collapsed Tooltip */}
                {collapsed && (
                  <div className="hidden group-hover:block absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs rounded-md shadow-md whitespace-nowrap z-50 pointer-events-none">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Academic Context Badge */}
        {!collapsed ? (
          <div className="p-3 m-3 rounded-xl bg-slate-50 border border-slate-200/70 text-left">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Academic Lab
            </p>
            <p className="text-xs font-semibold text-slate-800 mt-0.5 truncate">
              PECO311C Solutions
            </p>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
              Ultralytics YOLOv8 real-time student occupancy detection
            </p>
          </div>
        ) : (
          <div className="p-3 text-center border-t border-slate-100">
            <span className="text-[9px] font-bold text-campus-700 bg-campus-50 px-1 py-0.5 rounded border border-campus-200">
              AI
            </span>
          </div>
        )}
      </aside>
    </>
  );
}
