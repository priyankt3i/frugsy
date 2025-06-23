import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center py-10">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-500 dark:border-emerald-500"></div>
      <p className="ml-4 text-slate-700 dark:text-slate-300 text-lg">Loading results...</p>
    </div>
  );
};