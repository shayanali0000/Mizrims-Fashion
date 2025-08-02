import { useState, useEffect } from 'react';
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import useAgentStore from '../store/useAgentStore';
import AgentCard from '../components/AgentCard';
import SystemStats from '../components/SystemStats';
import AgentDetailsModal from '../components/AgentDetailsModal';
import CSVUploadModal from '../components/CSVUploadModal';
import AddAgentModal from '../components/AddAgentModal';
import AdminToolsPanel from '../components/AdminToolsPanel';

const Dashboard = () => {
  const {
    agents,
    agentStatus,
    systemStatus,
    isLoading,
    error,
    fetchAgents,
    fetchAgentStatus,
    fetchSystemStatus,
    startPolling,
    stopPolling,
    clearError,
  } = useAgentStore();

  const [selectedAgent, setSelectedAgent] = useState(null);
  const [uploadAgent, setUploadAgent] = useState(null);
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [pollId, setPollId] = useState(null);

  useEffect(() => {
    // Initial data load
    fetchAgents();
    fetchSystemStatus();
    fetchAgentStatus();

    // Start real-time polling
    const id = startPolling(5000); // Poll every 5 seconds
    setPollId(id);

    // Cleanup on unmount
    return () => {
      if (id) {
        stopPolling(id);
      }
    };
  }, [fetchAgents, fetchSystemStatus, fetchAgentStatus, startPolling, stopPolling]);

  const handleRefresh = () => {
    fetchAgents();
    fetchSystemStatus();
    fetchAgentStatus();
  };

  const handleViewDetails = (agent) => {
    setSelectedAgent(agent);
  };

  const handleUploadCSV = (agent) => {
    setUploadAgent(agent);
  };

  const getAgentWithStatus = (agent) => {
    const status = agentStatus.find(s => s.agent_id === agent.id);
    return {
      ...agent,
      status: status?.status || agent.status,
      current_call_id: status?.current_call_id,
      last_activity: status?.last_activity,
    };
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center mb-8">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Monitor and manage your AI agents
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-3 flex">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
          >
            <ArrowPathIcon className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={() => setShowAddAgent(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition duration-150 ease-in-out"
          >
            <PlusIcon className="w-4 h-4 mr-1" />
            Add Agent
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
              <div className="mt-3">
                <button
                  onClick={clearError}
                  className="text-sm font-medium text-red-800 hover:text-red-600"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Stats */}
      <SystemStats systemStatus={systemStatus} agentStatus={agentStatus} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
        {/* Agents Grid */}
        <div className="lg:col-span-3">
          <h2 className="text-lg font-medium text-gray-900 mb-4">AI Agents</h2>
        
        {isLoading && agents.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="h-16 bg-gray-200 rounded"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No agents</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding your first AI agent.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowAddAgent(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                Add Agent
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={getAgentWithStatus(agent)}
                onViewDetails={handleViewDetails}
                onUploadCSV={handleUploadCSV}
              />
            ))}
          </div>
        )}
      </div>
        
      {/* Admin Tools Panel */}
      <div className="lg:col-span-1">
        <AdminToolsPanel agents={agents} />
      </div>
    </div>

      {/* Modals */}
      {selectedAgent && (
        <AgentDetailsModal
          agent={selectedAgent}
          isOpen={!!selectedAgent}
          onClose={() => setSelectedAgent(null)}
        />
      )}

      {uploadAgent && (
        <CSVUploadModal
          agent={uploadAgent}
          isOpen={!!uploadAgent}
          onClose={() => setUploadAgent(null)}
        />
      )}

      {showAddAgent && (
        <AddAgentModal
          isOpen={showAddAgent}
          onClose={() => setShowAddAgent(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;