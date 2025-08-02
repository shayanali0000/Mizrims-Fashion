import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('jwt_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },
};

// Agents API
export const agentsAPI = {
  getAll: async () => {
    const response = await api.get('/agents/');
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/agents/${id}`);
    return response.data;
  },
  
  create: async (agentData) => {
    const response = await api.post('/agents/', agentData);
    return response.data;
  },
  
  update: async (id, agentData) => {
    const response = await api.put(`/agents/${id}`, agentData);
    return response.data;
  },
  
  getStatus: async () => {
    const response = await api.get('/agents/status/all');
    return response.data;
  },
  
  getSystemStatus: async () => {
    const response = await api.get('/agents/system/status');
    return response.data;
  },
  
  uploadCSV: async (agentId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/agents/${agentId}/upload_csv`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  getUploads: async (agentId) => {
    const response = await api.get(`/agents/${agentId}/uploads`);
    return response.data;
  },
};

// Admin API
export const adminAPI = {
  resetMinutes: async (agentIds = null) => {
    const response = await api.post('/admin/reset_minutes', { agent_ids: agentIds });
    return response.data;
  },
  
  registerAgent: async (agentData) => {
    const response = await api.post('/admin/register_agent', agentData);
    return response.data;
  },
  
  getSystemInfo: async () => {
    const response = await api.get('/admin/system_info');
    return response.data;
  },
  
  bulkStatusUpdate: async (agentIds, newStatus) => {
    const response = await api.post('/admin/bulk_status_update', agentIds, newStatus);
    return response.data;
  },
};

// Health API
export const healthAPI = {
  check: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;