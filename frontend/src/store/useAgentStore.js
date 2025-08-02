import { create } from 'zustand';
import { agentsAPI, adminAPI } from '../lib/api';

const useAgentStore = create((set, get) => ({
  // State
  agents: [],
  agentStatus: [],
  systemStatus: null,
  selectedAgent: null,
  isLoading: false,
  error: null,
  lastUpdated: null,

  // Actions
  fetchAgents: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const agents = await agentsAPI.getAll();
      set({
        agents,
        isLoading: false,
        lastUpdated: new Date(),
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error.response?.data?.detail || 'Failed to fetch agents',
      });
    }
  },

  fetchAgentStatus: async () => {
    try {
      const agentStatus = await agentsAPI.getStatus();
      set({ agentStatus });
    } catch (error) {
      console.error('Failed to fetch agent status:', error);
    }
  },

  fetchSystemStatus: async () => {
    try {
      const systemStatus = await agentsAPI.getSystemStatus();
      set({ systemStatus });
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    }
  },

  fetchAgentById: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const agent = await agentsAPI.getById(id);
      set({
        selectedAgent: agent,
        isLoading: false,
      });
      return agent;
    } catch (error) {
      set({
        isLoading: false,
        error: error.response?.data?.detail || 'Failed to fetch agent details',
      });
      return null;
    }
  },

  createAgent: async (agentData) => {
    set({ isLoading: true, error: null });
    
    try {
      const newAgent = await agentsAPI.create(agentData);
      set((state) => ({
        agents: [...state.agents, newAgent],
        isLoading: false,
      }));
      return { success: true, agent: newAgent };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to create agent';
      set({
        isLoading: false,
        error: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  },

  updateAgent: async (id, agentData) => {
    set({ isLoading: true, error: null });
    
    try {
      const updatedAgent = await agentsAPI.update(id, agentData);
      set((state) => ({
        agents: state.agents.map((agent) =>
          agent.id === id ? updatedAgent : agent
        ),
        selectedAgent: state.selectedAgent?.id === id ? updatedAgent : state.selectedAgent,
        isLoading: false,
      }));
      return { success: true, agent: updatedAgent };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to update agent';
      set({
        isLoading: false,
        error: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  },

  uploadCSV: async (agentId, file) => {
    try {
      const result = await agentsAPI.uploadCSV(agentId, file);
      return { success: true, result };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to upload CSV';
      return { success: false, error: errorMessage };
    }
  },

  getUploads: async (agentId) => {
    try {
      const uploads = await agentsAPI.getUploads(agentId);
      return uploads;
    } catch (error) {
      console.error('Failed to fetch uploads:', error);
      return [];
    }
  },

  resetMinutes: async (agentIds = null) => {
    try {
      const result = await adminAPI.resetMinutes(agentIds);
      // Refresh agents after reset
      get().fetchAgents();
      return { success: true, result };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to reset minutes';
      return { success: false, error: errorMessage };
    }
  },

  getSystemInfo: async () => {
    try {
      const systemInfo = await adminAPI.getSystemInfo();
      return systemInfo;
    } catch (error) {
      console.error('Failed to fetch system info:', error);
      return null;
    }
  },

  setSelectedAgent: (agent) => {
    set({ selectedAgent: agent });
  },

  clearError: () => {
    set({ error: null });
  },

  // Real-time polling
  startPolling: (interval = 5000) => {
    const pollId = setInterval(() => {
      get().fetchAgentStatus();
      get().fetchSystemStatus();
    }, interval);
    
    return pollId;
  },

  stopPolling: (pollId) => {
    if (pollId) {
      clearInterval(pollId);
    }
  },
}));

export default useAgentStore;