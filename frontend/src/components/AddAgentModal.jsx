import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from './Modal';
import useAgentStore from '../store/useAgentStore';

const AddAgentModal = ({ isOpen, onClose }) => {
  const { createAgent } = useAgentStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createAgent(data);
      
      if (result.success) {
        reset();
        onClose();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to create agent. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Agent" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
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
              </div>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Agent Name
          </label>
          <div className="mt-1">
            <input
              {...register('name', {
                required: 'Agent name is required',
                minLength: {
                  value: 2,
                  message: 'Agent name must be at least 2 characters',
                },
              })}
              type="text"
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Enter agent name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <div className="mt-1">
            <textarea
              {...register('description')}
              rows={3}
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Enter agent description (optional)"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="vapi_assistant_id" className="block text-sm font-medium text-gray-700">
            Vapi Assistant ID
          </label>
          <div className="mt-1">
            <input
              {...register('vapi_assistant_id', {
                required: 'Vapi Assistant ID is required',
                minLength: {
                  value: 5,
                  message: 'Assistant ID must be at least 5 characters',
                },
              })}
              type="text"
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md font-mono"
              placeholder="Enter Vapi Assistant ID"
            />
            {errors.vapi_assistant_id && (
              <p className="mt-1 text-sm text-red-600">{errors.vapi_assistant_id.message}</p>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            The unique identifier for your Vapi assistant
          </p>
        </div>

        <div>
          <label htmlFor="phone_number_id" className="block text-sm font-medium text-gray-700">
            Phone Number ID
          </label>
          <div className="mt-1">
            <input
              {...register('phone_number_id', {
                required: 'Phone Number ID is required',
                minLength: {
                  value: 5,
                  message: 'Phone Number ID must be at least 5 characters',
                },
              })}
              type="text"
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md font-mono"
              placeholder="Enter Phone Number ID"
            />
            {errors.phone_number_id && (
              <p className="mt-1 text-sm text-red-600">{errors.phone_number_id.message}</p>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            The phone number ID from your Vapi account
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creating...
              </div>
            ) : (
              'Create Agent'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddAgentModal;