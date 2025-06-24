
import React, { useCallback } from 'react';
import { Cog6ToothIcon } from './icons';

interface SettingsButtonProps {
  onClick: () => void;
}

export const SettingsButton: React.FC<SettingsButtonProps> = ({ onClick }) => {
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  }, [onClick]);

  return (
    <div
      id="settings-button-container"
      title="Open Settings"
      aria-label="Open application settings"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className="fixed top-1 right-12 mr-2 z-50 p-2 bg-slate-200 dark:bg-slate-700 rounded-full shadow-md hover:bg-slate-300 dark:hover:bg-slate-600 cursor-pointer transition-colors"
    >
      <Cog6ToothIcon className="w-7 h-7 text-slate-700 dark:text-slate-200" aria-hidden={true} />
    </div>
  );
};