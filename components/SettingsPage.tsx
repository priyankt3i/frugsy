
import React, { useState } from 'react';
import { Cog6ToothIcon, ArrowLeftIcon, CubeTransparentIcon, UsersIcon, CloudArrowUpIcon, BeakerIcon } from './icons'; // Assuming ArrowLeftIcon exists or can be added

// Simple ArrowLeftIcon if not already in icons.tsx
const BackArrowIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
  </svg>
);


interface SettingsPageProps {
  onClose: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onClose }) => {
  const [walmartApiKey, setWalmartApiKey] = useState('');
  const [krogerClientId, setKrogerClientId] = useState('');
  const [krogerClientSecret, setKrogerClientSecret] = useState('');

  const handleSaveSettings = () => {
    // For now, this is a placeholder.
    // In a real app, you'd save these to localStorage or a backend.
    console.log('Saving settings (placeholder):', { walmartApiKey, krogerClientId });
    alert('Settings saved (placeholder)! These are not yet used by the app.');
  };

  const inputClass = "w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-500 focus:border-emerald-500 dark:focus:border-emerald-500 outline-none transition duration-150 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400";
  const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 md:px-0">
      <header className="flex items-center justify-between mb-10">
        <div className="flex items-center space-x-3">
          <Cog6ToothIcon className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Settings
          </h1>
        </div>
        <button
          onClick={onClose}
          aria-label="Close settings and return to app"
          className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <BackArrowIcon className="w-7 h-7 text-slate-600 dark:text-slate-300" />
        </button>
      </header>

      <div className="space-y-10">
        <section className="bg-white dark:bg-slate-800 shadow-xl rounded-xl p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-1">Store-Specific API Configurations</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Optionally, provide API credentials for direct price fetching from supported retailers. This can sometimes provide more accurate or real-time pricing for these specific stores.
            <br />
            <strong>If not configured, Frugsy will use its standard AI-powered search (Gemini with Google Search)</strong> to find prices, which has broad coverage.
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2 border-b border-slate-300 dark:border-slate-700 pb-2">Walmart API</h3>
              <div className="space-y-3 mt-3">
                <div>
                  <label htmlFor="walmart-api-key" className={labelClass}>Walmart API Key</label>
                  <input
                    type="text"
                    id="walmart-api-key"
                    value={walmartApiKey}
                    onChange={(e) => setWalmartApiKey(e.target.value)}
                    placeholder="Enter Walmart API Key (optional)"
                    className={inputClass}
                    aria-describedby="walmart-api-notes"
                  />
                </div>
                <p id="walmart-api-notes" className="text-xs text-slate-500 dark:text-slate-400">
                  Note: Walmart API integration is a placeholder and not yet functional.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2 border-b border-slate-300 dark:border-slate-700 pb-2">Kroger API</h3>
              <div className="space-y-3 mt-3">
                <div>
                  <label htmlFor="kroger-client-id" className={labelClass}>Kroger Client ID</label>
                  <input
                    type="text"
                    id="kroger-client-id"
                    value={krogerClientId}
                    onChange={(e) => setKrogerClientId(e.target.value)}
                    placeholder="Enter Kroger Client ID (optional)"
                    className={inputClass}
                    aria-describedby="kroger-api-notes"
                  />
                </div>
                <div>
                  <label htmlFor="kroger-client-secret" className={labelClass}>Kroger Client Secret</label>
                  <input
                    type="password"
                    id="kroger-client-secret"
                    value={krogerClientSecret}
                    onChange={(e) => setKrogerClientSecret(e.target.value)}
                    placeholder="Enter Kroger Client Secret (optional)"
                    className={inputClass}
                    aria-describedby="kroger-api-notes"
                  />
                </div>
                 <p id="kroger-api-notes" className="text-xs text-slate-500 dark:text-slate-400">
                  Note: Kroger API integration is a placeholder and not yet functional.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-800 shadow-xl rounded-xl p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-1">Advanced Data Sourcing</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Frugsy aims to provide the most comprehensive pricing. Our primary method involves AI-powered search using Gemini. Future enhancements or alternative strategies under consideration include:
          </p>
          <ul className="space-y-5">
            <li className="flex items-start space-x-3">
              <CloudArrowUpIcon className="w-6 h-6 text-cyan-500 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-slate-700 dark:text-slate-300">Web Scraping</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Extracting prices directly from store websites. This requires ongoing maintenance due to website changes.</p>
              </div>
            </li>
            <li className="flex items-start space-x-3">
              <UsersIcon className="w-6 h-6 text-purple-500 dark:text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-slate-700 dark:text-slate-300">Crowdsourced Data</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Allowing users to submit prices, potentially via manual entry or photo uploads. This relies on community engagement and data verification.</p>
              </div>
            </li>
            <li className="flex items-start space-x-3">
              <BeakerIcon className="w-6 h-6 text-yellow-500 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-slate-700 dark:text-slate-300">AI Price Estimation</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">If no live price is available, using AI to estimate based on historical data, regional trends, or similar products.</p>
              </div>
            </li>
          </ul>
        </section>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={handleSaveSettings}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 transition duration-150 ease-in-out disabled:opacity-60"
          >
            Save Settings (Placeholder)
          </button>
        </div>
      </div>

       <footer className="text-center mt-12 py-6 border-t border-slate-300 dark:border-slate-700">
        <p className="text-slate-500 dark:text-slate-500 text-sm">Frugsy &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};
