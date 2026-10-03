import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
export const BASE_SERVER_URL = API_BASE.replace(/\/api\/?$/, '');

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 45000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'Unable to connect to AI server. Please verify backend is running.';
    if (error.response?.data?.detail) {
      message = error.response.data.detail;
    } else if (error.message) {
      message = error.message;
    }
    return Promise.reject(new Error(message));
  }
);

// Classroom APIs
export const getClassrooms = async (params = {}) => {
  const res = await apiClient.get('/classrooms', { params });
  return res.data;
};

export const getClassroom = async (id) => {
  const res = await apiClient.get(`/classrooms/${id}`);
  return res.data;
};

export const createClassroom = async (data) => {
  const res = await apiClient.post('/classrooms', data);
  return res.data;
};

export const updateClassroom = async (id, data) => {
  const res = await apiClient.put(`/classrooms/${id}`, data);
  return res.data;
};

export const deleteClassroom = async (id) => {
  const res = await apiClient.delete(`/classrooms/${id}`);
  return res.data;
};

// Occupancy APIs
export const getLatestOccupancy = async () => {
  const res = await apiClient.get('/occupancy/latest');
  return res.data;
};

export const getOccupancyHistory = async (params = {}) => {
  const res = await apiClient.get('/occupancy/history', { params });
  return res.data;
};

export const createManualRecord = async (classroomId, count) => {
  const res = await apiClient.post(`/occupancy/manual?classroom_id=${classroomId}&detected_count=${count}`);
  return res.data;
};

export const deleteOccupancyRecord = async (id) => {
  const res = await apiClient.delete(`/occupancy/${id}`);
  return res.data;
};

export const getExportUrl = () => `${API_BASE}/occupancy/export`;

// AI Analysis APIs
export const analyzeImage = async (formData) => {
  const res = await apiClient.post('/analyze/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const analyzeVideo = async (formData) => {
  const res = await apiClient.post('/analyze/video', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const analyzeFrame = async (formData) => {
  const res = await apiClient.post('/analyze/frame', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

// Analytics APIs
export const getKPIs = async () => {
  const res = await apiClient.get('/analytics/kpis');
  return res.data;
};

export const getStatusDistribution = async () => {
  const res = await apiClient.get('/analytics/distribution');
  return res.data;
};

export const getUtilization = async () => {
  const res = await apiClient.get('/analytics/utilization');
  return res.data;
};

export const getTrend = async (days = 7) => {
  const res = await apiClient.get('/analytics/trend', { params: { days } });
  return res.data;
};

export const getAIInsights = async () => {
  const res = await apiClient.get('/analytics/insights');
  return res.data;
};

export const getModelEvaluation = async () => {
  const res = await apiClient.get('/analytics/evaluation');
  return res.data;
};

export const getClassroomAllocation = async () => {
  const res = await apiClient.get('/analytics/allocation');
  return res.data;
};


// Energy APIs
export const getEnergyRecommendations = async () => {
  const res = await apiClient.get('/energy/recommendations');
  return res.data;
};

export const getEnergySummary = async () => {
  const res = await apiClient.get('/energy/summary');
  return res.data;
};

// Settings & Health APIs
export const getSettings = async () => {
  const res = await apiClient.get('/settings');
  return res.data;
};

export const updateSettings = async (data) => {
  const res = await apiClient.put('/settings', data);
  return res.data;
};

export const toggleDemoMode = async (enable) => {
  const res = await apiClient.post('/settings/demo-mode', { enable });
  return res.data;
};

export const getHealth = async () => {
  const res = await apiClient.get('/health');
  return res.data;
};

export const getDiagnostics = async () => {
  const res = await apiClient.get('/health/diagnostic');
  return res.data;
};

export default apiClient;
