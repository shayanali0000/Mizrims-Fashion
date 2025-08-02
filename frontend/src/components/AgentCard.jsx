import { useState } from 'react';
import { 
  ClockIcon, 
  PhoneIcon, 
  EyeIcon, 
  DocumentArrowUpIcon,
  SignalIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const AgentCard = ({ agent, onViewDetails, onUploadCSV }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'idle':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'calling':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'offline':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'idle':
        return <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse-soft" />;
      case 'calling':
        return <PhoneIcon className="w-4 h-4 text-blue-600" />;
      case 'offline':
        return <SignalIcon className="w-4 h-4 text-gray-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
    }
  };

  const formatMinutes = (minutes) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all duration-200 hover:shadow-md hover:border-gray-300 ${
        isHovered ? 'transform -translate-y-1' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {agent.name}
          </h3>
          {agent.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {agent.description}
            </p>
          )}
        </div>
        
        <div className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(agent.status)}`}>
          {getStatusIcon(agent.status)}
          <span>{agent.status || 'Unknown'}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <ClockIcon className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-500">Today</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 mt-1">
            {formatMinutes(agent.minutes_today || 0)}
          </p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <ClockIcon className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-500">Total</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 mt-1">
            {formatMinutes(agent.total_minutes_used || 0)}
          </p>
        </div>
      </div>

      {/* Additional Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <PhoneIcon className="w-4 h-4 mr-2" />
          <span>Phone: {agent.phone_number_id}</span>
        </div>
        
        {agent.transcripts && agent.transcripts.length > 0 && (
          <div className="flex items-center text-sm text-gray-600">
            <DocumentArrowUpIcon className="w-4 h-4 mr-2" />
            <span>{agent.transcripts.length} transcript{agent.transcripts.length !== 1 ? 's' : ''}</span>
          </div>
        )}

        {agent.csv_uploads && agent.csv_uploads.length > 0 && (
          <div className="flex items-center text-sm text-gray-600">
            <DocumentArrowUpIcon className="w-4 h-4 mr-2" />
            <span>{agent.csv_uploads.length} CSV upload{agent.csv_uploads.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        <button
          onClick={() => onViewDetails(agent)}
          className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition duration-150 ease-in-out"
        >
          <EyeIcon className="w-4 h-4 mr-1" />
          View Details
        </button>
        
        <button
          onClick={() => onUploadCSV(agent)}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition duration-150 ease-in-out"
        >
          <DocumentArrowUpIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AgentCard;