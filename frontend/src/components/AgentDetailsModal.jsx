import { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { 
  ClockIcon, 
  PhoneIcon, 
  ChatBubbleLeftRightIcon,
  DocumentArrowUpIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import Modal from './Modal';
import useAgentStore from '../store/useAgentStore';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const AgentDetailsModal = ({ agent, isOpen, onClose }) => {
  const { fetchAgentById, getUploads } = useAgentStore();
  const [agentDetails, setAgentDetails] = useState(agent);
  const [uploads, setUploads] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && agent) {
      loadAgentDetails();
      loadUploads();
    }
  }, [isOpen, agent]);

  const loadAgentDetails = async () => {
    setIsLoading(true);
    const details = await fetchAgentById(agent.id);
    if (details) {
      setAgentDetails(details);
    }
    setIsLoading(false);
  };

  const loadUploads = async () => {
    const uploadsData = await getUploads(agent.id);
    setUploads(uploadsData);
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatMinutes = (minutes) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const tabs = [
    { name: 'Overview', icon: UserIcon },
    { name: 'Transcripts', icon: ChatBubbleLeftRightIcon },
    { name: 'Uploads', icon: DocumentArrowUpIcon },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={agentDetails?.name} size="2xl">
      <div className="space-y-6">
        {/* Agent Status and Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${
                agentDetails?.status === 'Calling' ? 'bg-blue-500 animate-pulse' :
                agentDetails?.status === 'Idle' ? 'bg-green-500' :
                'bg-gray-400'
              }`} />
              <span className="text-sm font-medium text-gray-900">{agentDetails?.status}</span>
            </div>
            <p className="text-xs text-gray-500">Current Status</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <ClockIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-900">
                {formatMinutes(agentDetails?.minutes_today || 0)}
              </span>
            </div>
            <p className="text-xs text-gray-500">Minutes Today</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <ClockIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-900">
                {formatMinutes(agentDetails?.total_minutes_used || 0)}
              </span>
            </div>
            <p className="text-xs text-gray-500">Total Minutes</p>
          </div>
        </div>

        {/* Tabs */}
        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                    'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                    selected
                      ? 'bg-white text-blue-700 shadow'
                      : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                  )
                }
              >
                <div className="flex items-center justify-center space-x-2">
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </div>
              </Tab>
            ))}
          </Tab.List>
          
          <Tab.Panels className="mt-4">
            {/* Overview Tab */}
            <Tab.Panel className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Agent Information</h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-xs text-gray-500">Name</dt>
                      <dd className="text-sm text-gray-900">{agentDetails?.name}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Description</dt>
                      <dd className="text-sm text-gray-900">{agentDetails?.description || 'No description'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Phone Number ID</dt>
                      <dd className="text-sm text-gray-900">{agentDetails?.phone_number_id}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Agent ID</dt>
                      <dd className="text-sm text-gray-900 font-mono">{agentDetails?.id}</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Activity Summary</h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-xs text-gray-500">Total Calls</dt>
                      <dd className="text-sm text-gray-900">{agentDetails?.transcripts?.length || 0}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">CSV Uploads</dt>
                      <dd className="text-sm text-gray-900">{uploads.length}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Created</dt>
                      <dd className="text-sm text-gray-900">{formatDateTime(agentDetails?.created_at)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Last Updated</dt>
                      <dd className="text-sm text-gray-900">{formatDateTime(agentDetails?.updated_at)}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </Tab.Panel>

            {/* Transcripts Tab */}
            <Tab.Panel className="space-y-4">
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
                  ))}
                </div>
              ) : agentDetails?.transcripts?.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {agentDetails.transcripts.map((transcript) => (
                    <div key={transcript.call_id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h5 className="text-sm font-medium text-gray-900">
                            Call {transcript.call_id}
                          </h5>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                            <span className="flex items-center">
                              <CalendarIcon className="w-3 h-3 mr-1" />
                              {formatDateTime(transcript.started_at)}
                            </span>
                            {transcript.ended_at && (
                              <span className="flex items-center">
                                <ClockIcon className="w-3 h-3 mr-1" />
                                {formatDuration(transcript.total_duration)}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transcript.ended_at 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {transcript.ended_at ? 'Completed' : 'In Progress'}
                        </span>
                      </div>
                      
                      {transcript.segments && transcript.segments.length > 0 ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {transcript.segments.map((segment, index) => (
                            <div key={index} className={`p-2 rounded text-xs ${
                              segment.speaker === 'user' 
                                ? 'bg-blue-50 text-blue-900' 
                                : 'bg-gray-100 text-gray-900'
                            }`}>
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium">
                                  {segment.speaker === 'user' ? 'Caller' : 'Agent'}
                                </span>
                                <span className="text-gray-500">
                                  {new Date(segment.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              <p>{segment.content}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 italic">No transcript segments available</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No transcripts</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No call transcripts available for this agent.
                  </p>
                </div>
              )}
            </Tab.Panel>

            {/* Uploads Tab */}
            <Tab.Panel className="space-y-4">
              {uploads.length > 0 ? (
                <div className="space-y-4">
                  {uploads.map((upload) => (
                    <div key={upload.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="text-sm font-medium text-gray-900 flex items-center">
                            <DocumentArrowUpIcon className="w-4 h-4 mr-2" />
                            {upload.filename}
                          </h5>
                          <div className="mt-2 text-xs text-gray-500 space-y-1">
                            <p>Uploaded: {formatDateTime(upload.uploaded_at)}</p>
                            <p>Rows: {upload.row_count}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          upload.processed 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {upload.processed ? 'Processed' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No uploads</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No CSV uploads found for this agent.
                  </p>
                </div>
              )}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </Modal>
  );
};

export default AgentDetailsModal;