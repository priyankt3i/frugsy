import React from 'react';
import { ExclamationTriangleIcon } from './icons';

export const ApiKeyWarning: React.FC = () => {
  return (
    <div className="bg-yellow-100 dark:bg-yellow-600 border-l-4 border-yellow-500 dark:border-yellow-800 text-yellow-700 dark:text-yellow-50 p-6 rounded-lg shadow-lg mb-8 flex items-start space-x-4">
      <ExclamationTriangleIcon className="w-8 h-8 text-yellow-500 dark:text-yellow-100 flex-shrink-0 mt-1" />
      <div>
        <h4 className="font-bold text-lg mb-1 text-yellow-800 dark:text-yellow-50">API Key Missing</h4>
        <p className="text-sm">
          The Gemini API key (<code>API_KEY</code>) is not configured.
          The core search functionality of this application will not work without it.
        </p>
        <p className="text-sm mt-2">
          Please ensure the API key is correctly set up in your environment.
        </p>
      </div>
    </div>
  );
};