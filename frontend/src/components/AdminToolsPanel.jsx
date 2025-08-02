import { useState } from 'react';
import { 
  ClockIcon, 
  ArrowPathIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import useAgentStore from '../store/useAgentStore';

const AdminToolsPanel = ({ agents }) => {
  const { resetMinutes } = useAgentStore();
  const [isResetting, setIsResetting] = useState(false);
  const [resetResult, setResetResult] = useState(null);
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleResetMinutes = async (agentIds = null) => {
    setIsResetting(true);
    setResetResult(null);

    try {
      const result = await resetMinutes(agentIds);
      
      if (result.success) {
        setResetResult({
          success: true,
          message: `Successfully reset minutes for ${result.result.reset_count} agent(s)`,
          count: result.result.reset_count,
        });
      } else {
        setResetResult({
          success: false,
          message: result.error,
        });
      }
    } catch (err) {
      setResetResult({
        success: false,
        message: 'Failed to reset minutes. Please try again.',
      });
    } finally {
      setIsResetting(false);
      setShowConfirm(false);
      setSelectedAgents([]);
    }
  };

  const handleSelectAgent = (agentId) => {
    setSelectedAgents(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAgents.length === agents.length) {
      setSelectedAgents([]);
    } else {
      setSelectedAgents(agents.map(agent => agent.id));
    }
  };

  const confirmReset = (agentIds = null) => {
    setSelectedAgents(agentIds || []);
    setShowConfirm(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <div className="p-2 bg-orange-100 rounded-lg">
          <ClockIcon className="w-5 h-5 text-orange-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">Admin Tools</h3>
      </div>

      {/* Reset Result */}
      {resetResult && (
        <div className={`mb-4 p-4 rounded-md ${
          resetResult.success 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {resetResult.success ? (
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm ${
                resetResult.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {resetResult.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-yellow-800">
                Confirm Minute Reset
              </h4>
              <p className="mt-1 text-sm text-yellow-700">
                Are you sure you want to reset daily minutes for{' '}
                {selectedAgents.length === 0 
                  ? 'all agents' 
                  : `${selectedAgents.length} selected agent(s)`
                }? This action cannot be undone.
              </p>
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={() => handleResetMinutes(selectedAgents.length > 0 ? selectedAgents : null)}
                  disabled={isResetting}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {isResetting ? 'Resetting...' : 'Confirm Reset'}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Actions</h4>
          <div className="space-y-2">
            <button
              onClick={() => confirmReset()}
              disabled={isResetting}
              className="w-full flex items-center justify-center px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowPathIcon className="w-4 h-4 mr-2" />
              Reset All Agent Minutes
            </button>
          </div>
        </div>

        {/* Bulk Operations */}
        {agents.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Bulk Operations</h4>
            
            {/* Agent Selection */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedAgents.length === agents.length && agents.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="text-sm text-gray-700 font-medium">
                  Select All ({agents.length})
                </label>
              </div>
              
              {agents.map((agent) => (
                <div key={agent.id} className="flex items-center space-x-2 pl-6">
                  <input
                    type="checkbox"
                    checked={selectedAgents.includes(agent.id)}
                    onChange={() => handleSelectAgent(agent.id)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label className="text-sm text-gray-600">
                    {agent.name} ({agent.minutes_today || 0}m today)
                  </label>
                </div>
              ))}
            </div>

            {/* Bulk Actions */}
            {selectedAgents.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <button
                  onClick={() => confirmReset(selectedAgents)}
                  disabled={isResetting}
                  className="w-full flex items-center justify-center px-4 py-2 border border-orange-300 rounded-md text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowPathIcon className="w-4 h-4 mr-2" />
                  Reset Selected ({selectedAgents.length}) Agent Minutes
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminToolsPanel;