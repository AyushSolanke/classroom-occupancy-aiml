import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import { getHealth, getClassrooms } from '../../services/api';

const PAGE_TITLES = {
  dashboard: {
    title: 'Smart Classroom Occupancy',
    subtitle: 'AI-powered real-time classroom occupancy monitoring',
  },
  'live-monitoring': {
    title: 'Live Camera Monitoring',
    subtitle: 'Real-time CCTV vision stream and student occupancy counter',
  },
  analyze: {
    title: 'Upload & Analyze Media',
    subtitle: 'Inference pipeline for classroom images and surveillance video',
  },
  classrooms: {
    title: 'Classroom Management',
    subtitle: 'Configure capacities, camera IDs, blocks, and room specifications',
  },
  history: {
    title: 'Occupancy History',
    subtitle: 'Audited log of AI detections, timestamps, and occupancy events',
  },
  analytics: {
    title: 'Occupancy Analytics & Trends',
    subtitle: 'Utilization curves, time-series trends, and space distribution',
  },
  energy: {
    title: 'Smart Energy Management',
    subtitle: 'Automated HVAC and lighting conservation recommendations',
  },
  'ai-insights': {
    title: 'AI Decision Insights',
    subtitle: 'Timetable optimization and space reallocation recommendations',
  },
  models: {
    title: 'Project Info & Specifications',
    subtitle: 'Objectives, datasets, technology stack, AI models, and model evaluation',
  },
  settings: {
    title: 'System Settings',
    subtitle: 'Detection thresholds, tariff parameters, and health diagnostic',
  },
};


export default function Layout({
  children,
  activePage,
  setActivePage,
  classrooms,
  setClassrooms,
  selectedClassroomId,
  setSelectedClassroomId,
  refreshTrigger,
  setRefreshTrigger,
  isDemoMode,
  setIsDemoMode,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [healthStatus, setHealthStatus] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshTrigger((prev) => prev + 1);
    try {
      const [hData, crData] = await Promise.all([getHealth(), getClassrooms()]);
      setHealthStatus(hData);
      setClassrooms(crData);
      if (!selectedClassroomId && crData.length > 0) {
        setSelectedClassroomId(crData[0].id);
      }
    } catch (e) {
      console.error('Refresh error:', e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    handleRefresh();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        isDemoMode={isDemoMode}
      />

      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          collapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        <TopHeader
          activePage={activePage}
          pageTitles={PAGE_TITLES}
          classrooms={classrooms}
          selectedClassroomId={selectedClassroomId}
          setSelectedClassroomId={setSelectedClassroomId}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          setMobileOpen={setMobileOpen}
          healthStatus={healthStatus}
          isDemoMode={isDemoMode}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
