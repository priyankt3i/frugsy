
import React, { useState } from 'react';
import { MagnifyingGlassIcon, GlobeAmericasIcon } from './icons'; // Added GlobeAmericasIcon
import { MIN_SEARCH_RADIUS, MAX_SEARCH_RADIUS } from '../constants';

interface SearchBarProps {
  onSearch: (searchTerm: string, zipCode: string, radius: number) => void;
  isLoading: boolean;
  initialSearchTerm?: string;
  initialZipCode?: string;
  initialRadius: number;
  onUseMyLocation: () => void; // Callback for using current location
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  isLoading, 
  initialSearchTerm = '', 
  initialZipCode = '',
  initialRadius,
  onUseMyLocation
}) => {
  const [item, setItem] = useState<string>(initialSearchTerm);
  const [zip, setZip] = useState<string>(initialZipCode);
  const [radius, setRadius] = useState<number>(initialRadius);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(item, zip, radius);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="md:flex md:space-x-4 md:items-end">
        <div className="flex-grow mb-4 md:mb-0">
          <label htmlFor="item-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Grocery Item
          </label>
          <input
            type="text"
            id="item-name"
            value={item}
            onChange={(e) => setItem(e.target.value)}
            placeholder="e.g., Organic Bananas"
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-500 focus:border-emerald-500 dark:focus:border-emerald-500 outline-none transition duration-150 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400"
            required
            aria-label="Grocery Item Name"
          />
        </div>
        <div className="w-full md:w-1/3 mb-4 md:mb-0">
          <label htmlFor="zip-code" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            ZIP Code (5-digit US)
          </label>
          <input
            type="text"
            id="zip-code"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            placeholder="e.g., 90210 (Optional if using map/current location)"
            // pattern="\\d{5}" Removed pattern attribute
            // title="Enter a 5-digit US ZIP code" Removed title attribute
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-500 focus:border-emerald-500 dark:focus:border-emerald-500 outline-none transition duration-150 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400"
            // Not strictly required anymore if other location methods are used
            aria-label="ZIP Code"
            aria-describedby="zip-code-description" // Added for better accessibility context if needed
          />
           {/* You can add a <p id="zip-code-description"> for more detailed formatting hints if desired */}
        </div>
      </div>
      <button
        type="button"
        onClick={onUseMyLocation}
        disabled={isLoading}
        className="w-full md:w-auto px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mt-1 md:mt-0"
        aria-label="Use my current location"
      >
        <GlobeAmericasIcon className="w-5 h-5" />
        <span>Use My Current Location</span>
      </button>

      <div className="space-y-2 pt-2">
        <label htmlFor="radius-slider" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Search Radius: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{radius} miles</span>
        </label>
        <input
          type="range"
          id="radius-slider"
          min={MIN_SEARCH_RADIUS}
          max={MAX_SEARCH_RADIUS}
          value={radius}
          onChange={(e) => setRadius(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-emerald-500 dark:accent-emerald-500"
          aria-label="Search Radius in miles"
        />
      </div>
      
      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 dark:from-emerald-500 dark:to-cyan-500 dark:hover:from-emerald-600 dark:hover:to-cyan-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        <MagnifyingGlassIcon className="w-5 h-5" />
        <span>{isLoading ? 'Searching...' : 'Search'}</span>
      </button>
    </form>
  );
};
