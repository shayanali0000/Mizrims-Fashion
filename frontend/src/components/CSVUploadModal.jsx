import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  DocumentArrowUpIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import Modal from './Modal';
import useAgentStore from '../store/useAgentStore';

const CSVUploadModal = ({ agent, isOpen, onClose }) => {
  const { uploadCSV } = useAgentStore();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) {
      setError('Please select a valid CSV file');
      return;
    }

    const file = acceptedFiles[0];
    
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadResult(null);

    try {
      const result = await uploadCSV(agent.id, file);
      
      if (result.success) {
        setUploadResult(result.result);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [agent.id, uploadCSV]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    multiple: false,
  });

  const handleClose = () => {
    setUploadResult(null);
    setError(null);
    onClose();
  };

  const resetUpload = () => {
    setUploadResult(null);
    setError(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Upload Contacts for ${agent?.name}`} size="lg">
      <div className="space-y-6">
        {/* CSV Format Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <InformationCircleIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">CSV Format Requirements</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p className="mb-2">Your CSV file must include these columns:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>name</strong> - Contact name (required)</li>
                  <li><strong>phone_number</strong> - Phone number (required)</li>
                  <li><strong>notes</strong> - Additional notes (optional)</li>
                </ul>
                <p className="mt-3 text-xs">
                  Example: name,phone_number,notes<br />
                  John Smith,+1234567890,VIP customer
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Area */}
        {!uploadResult && !error && (
          <div
            {...getRootProps()}
            className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
              isDragActive
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-gray-400'
            } ${isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
          >
            <input {...getInputProps()} />
            <div className="text-center">
              <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                {isUploading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm font-medium text-primary-600">Uploading...</span>
                  </div>
                ) : isDragActive ? (
                  <p className="text-sm text-primary-600">Drop the CSV file here...</p>
                ) : (
                  <>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-primary-600 hover:text-primary-500">
                        Click to upload
                      </span>{' '}
                      or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">CSV files only, up to 10MB</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upload Success */}
        {uploadResult && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Upload Successful!</h3>
                <div className="mt-2 text-sm text-green-700">
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <p className="font-medium">Upload Details:</p>
                      <ul className="mt-1 space-y-1 text-xs">
                        <li>Filename: {uploadResult.filename}</li>
                        <li>Total rows: {uploadResult.row_count}</li>
                        <li>Valid rows: {uploadResult.valid_rows}</li>
                        <li>Invalid rows: {uploadResult.invalid_rows}</li>
                      </ul>
                    </div>
                    
                    {uploadResult.errors && uploadResult.errors.length > 0 && (
                      <div>
                        <p className="font-medium">Validation Errors:</p>
                        <div className="mt-1 max-h-32 overflow-y-auto">
                          <ul className="space-y-1 text-xs">
                            {uploadResult.errors.slice(0, 10).map((error, index) => (
                              <li key={index} className="text-red-600">• {error}</li>
                            ))}
                            {uploadResult.errors.length > 10 && (
                              <li className="text-gray-600 italic">
                                ... and {uploadResult.errors.length - 10} more errors
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={resetUpload}
                    className="text-sm font-medium text-green-800 hover:text-green-600"
                  >
                    Upload another file
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Upload Failed</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
                <div className="mt-4">
                  <button
                    onClick={resetUpload}
                    className="text-sm font-medium text-red-800 hover:text-red-600"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {uploadResult ? 'Done' : 'Cancel'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CSVUploadModal;