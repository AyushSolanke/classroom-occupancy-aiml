import React, { useState } from 'react';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import LiveMonitoring from './pages/LiveMonitoring';
import ClassroomAnalysis from './pages/ClassroomAnalysis';
import Classrooms from './pages/Classrooms';
import OccupancyHistory from './pages/OccupancyHistory';
import Analytics from './pages/Analytics';
import EnergyManagement from './pages/EnergyManagement';
import AIInsights from './pages/AIInsights';
import ProjectSpecifications from './pages/ProjectSpecifications';
import Settings from './pages/Settings';


export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isDemoMode, setIsDemoMode] = useState(false);

  return (
    <Layout
      activePage={activePage}
      setActivePage={setActivePage}
      classrooms={classrooms}
      setClassrooms={setClassrooms}
      selectedClassroomId={selectedClassroomId}
      setSelectedClassroomId={setSelectedClassroomId}
      refreshTrigger={refreshTrigger}
      setRefreshTrigger={setRefreshTrigger}
      isDemoMode={isDemoMode}
      setIsDemoMode={setIsDemoMode}
    >
      {activePage === 'dashboard' && (
        <Dashboard
          classrooms={classrooms}
          selectedClassroomId={selectedClassroomId}
          setSelectedClassroomId={setSelectedClassroomId}
          setActivePage={setActivePage}
          refreshTrigger={refreshTrigger}
        />
      )}

      {activePage === 'live-monitoring' && (
        <LiveMonitoring
          classrooms={classrooms}
          selectedClassroomId={selectedClassroomId}
          setSelectedClassroomId={setSelectedClassroomId}
        />
      )}

      {activePage === 'analyze' && (
        <ClassroomAnalysis
          classrooms={classrooms}
          selectedClassroomId={selectedClassroomId}
          setSelectedClassroomId={setSelectedClassroomId}
          setRefreshTrigger={setRefreshTrigger}
        />
      )}

      {activePage === 'classrooms' && (
        <Classrooms
          classrooms={classrooms}
          setClassrooms={setClassrooms}
          setActivePage={setActivePage}
          setSelectedClassroomId={setSelectedClassroomId}
          setRefreshTrigger={setRefreshTrigger}
        />
      )}

      {activePage === 'history' && (
        <OccupancyHistory
          classrooms={classrooms}
          refreshTrigger={refreshTrigger}
          setRefreshTrigger={setRefreshTrigger}
        />
      )}

      {activePage === 'analytics' && (
        <Analytics refreshTrigger={refreshTrigger} />
      )}

      {activePage === 'energy' && (
        <EnergyManagement
          refreshTrigger={refreshTrigger}
          setActivePage={setActivePage}
        />
      )}

      {activePage === 'ai-insights' && (
        <AIInsights
          refreshTrigger={refreshTrigger}
          setActivePage={setActivePage}
        />
      )}

      {activePage === 'models' && (
        <ProjectSpecifications
          setActivePage={setActivePage}
        />
      )}

      {activePage === 'settings' && (
        <Settings
          isDemoMode={isDemoMode}
          setIsDemoMode={setIsDemoMode}
          refreshTrigger={refreshTrigger}
          setRefreshTrigger={setRefreshTrigger}
        />
      )}

    </Layout>
  );
}
