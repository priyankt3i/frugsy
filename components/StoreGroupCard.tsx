
import React from 'react';
import { StoreItemGroup, GroceryItem } from '../types';
import { GroceryItemCard } from './GroceryItemCard'; // Assuming GroceryItemCard is in the same directory
import { MapPinIcon, BuildingStorefrontIcon } from './icons'; // Added BuildingStorefrontIcon

interface StoreGroupCardProps {
  storeGroup: StoreItemGroup;
  onSaveItem: (item: GroceryItem) => void;
  onRemoveItem: (item: GroceryItem) => void;
  isItemSaved: (item: GroceryItem) => boolean;
}

export const StoreGroupCard: React.FC<StoreGroupCardProps> = ({ storeGroup, onSaveItem, onRemoveItem, isItemSaved }) => {
  return (
    <div className="bg-white dark:bg-slate-800/70 rounded-xl shadow-lg overflow-hidden transition-all duration-300">
      <div className="p-5 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-1 flex items-center">
          <BuildingStorefrontIcon className="w-7 h-7 mr-3 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          {storeGroup.storeName}
        </h3>
        {storeGroup.storeAddress && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(storeGroup.storeAddress)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-sm text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-500 underline transition-colors ml-10" // Indent address under store name
            title={`View ${storeGroup.storeName} at ${storeGroup.storeAddress} on Google Maps`}
          >
            <MapPinIcon className="w-4 h-4 mr-1.5 flex-shrink-0" />
            <span className="truncate" title={storeGroup.storeAddress}>{storeGroup.storeAddress}</span>
          </a>
        )}
      </div>
      
      <div className="p-4 md:p-5">
        {storeGroup.items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {storeGroup.items.map(item => (
              <GroceryItemCard
                key={item.id}
                item={item}
                onSave={onSaveItem}
                onRemove={onRemoveItem}
                isSaved={isItemSaved(item)}
                showSaveButton={true} // Save button should be shown for items in search results
              />
            ))}
          </div>
        ) : (
          <p className="text-slate-500 dark:text-slate-400 text-center py-4">
            No specific items found for this store in the current search.
          </p>
        )}
      </div>
    </div>
  );
};
