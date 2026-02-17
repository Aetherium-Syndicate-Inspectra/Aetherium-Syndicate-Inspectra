import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const systemApi = {
  getTachyonMetrics: () => axios.get(`${API_BASE_URL}/api/v1/tachyon/metrics`),
  getResonanceStatus: () => axios.get(`${API_BASE_URL}/api/v1/resonance/drift`),
  getAgents: () => axios.get(`${API_BASE_URL}/api/v1/agents/council`),
  getGoogleConfig: () => axios.get(`${API_BASE_URL}/api/auth/google/config`),
};

export const wsUrls = {
  aetherbus: `${API_BASE_URL.replace('http', 'ws')}/ws/aetherbus`,
};
