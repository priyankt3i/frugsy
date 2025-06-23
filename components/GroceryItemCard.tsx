
import React from 'react';
import { GroceryItem } from '../types';
import { BookmarkIcon, CheckCircleIcon, TrashIcon, ArrowTopRightOnSquareIcon, PhotoIcon, MapPinIcon } from './icons';

interface GroceryItemCardProps {
  item: GroceryItem;
  onSave: (item: GroceryItem) => void;
  onRemove: (item: GroceryItem) => void;
  isSaved: boolean;
  showSaveButton: boolean;
}

export const GroceryItemCard: React.FC<GroceryItemCardProps> = ({ item, onSave, onRemove, isSaved, showSaveButton }) => {
  const picsumPlaceholder = `https://picsum.photos/seed/${encodeURIComponent(item.fullItemName)}/300/200`;
  
  let displayImageUrl = picsumPlaceholder; // Default to Picsum
  if (item.generatedImageUrl) {
    displayImageUrl = item.generatedImageUrl; // Highest priority: AI Generated Image
  } else if (item.imageUrl && item.imageUrl.startsWith('http')) {
    displayImageUrl = item.imageUrl; // Second priority: URL from text search
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] h-full">
      <div className="w-full h-48 bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
        {displayImageUrl ? (
            <img 
                src={displayImageUrl} 
                alt={item.fullItemName} 
                className="w-full h-full object-cover"
                onError={(e) => { 
                    // If generated/provided URL fails, fall back to Picsum
                    if ((e.target as HTMLImageElement).src !== picsumPlaceholder) {
                        (e.target as HTMLImageElement).src = picsumPlaceholder; 
                    } else {
                        // If Picsum also fails (unlikely), hide img, show icon (already handled by next block if src becomes empty)
                         (e.target as HTMLImageElement).style.display = 'none';
                    }
                }}
            />
        ) : ( // This block is mostly a fallback if displayImageUrl is somehow undefined/empty, or if image above errors out and is hidden
            <PhotoIcon className="w-16 h-16 text-slate-400 dark:text-slate-500" />
        )}
      </div>
      
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1 truncate" title={item.fullItemName}>
          {item.fullItemName}
        </h3>

        {/* Store Name and Address are now part of StoreGroupCard, but kept here for saved items view or direct use */}
        <div className="mb-1">
          <p className="text-slate-500 dark:text-slate-400 text-xs">
            <span className="font-medium">Store:</span> {item.storeName}
          </p>
          {item.storeAddress && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.storeAddress)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-xs text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-500 underline mt-0.5 transition-colors"
              title={`View ${item.storeName} at ${item.storeAddress} on Google Maps`}
            >
              <MapPinIcon className="w-3 h-3 mr-1 flex-shrink-0" />
              <span className="truncate" title={item.storeAddress}>{item.storeAddress}</span>
            </a>
          )}
        </div>
        
        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
          {item.currency}{item.price.toFixed(2)}
        </p>

        {item.notes && (
          <p className="text-xs text-slate-500 dark:text-slate-500 mb-2 italic">
            {item.notes}
          </p>
        )}

        {item.lastUpdated && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
            Updated: {item.lastUpdated}
          </p>
        )}
        
        <div className="mt-auto space-y-2 pt-2">
          {item.productUrl && item.productUrl.startsWith('http') && (
            <a
              href={item.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center px-3 py-1.5 border border-cyan-500 dark:border-cyan-500 text-cyan-600 dark:text-cyan-400 rounded-md hover:bg-cyan-500 hover:text-white dark:hover:bg-cyan-600 dark:hover:text-slate-100 transition-colors duration-150 text-xs font-medium"
            >
              <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 mr-1.5" />
              View Product
            </a>
          )}

          {showSaveButton ? (
            isSaved ? (
              <button
                disabled
                className="w-full flex items-center justify-center px-3 py-1.5 border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-500 rounded-md cursor-default text-xs font-medium"
              >
                <CheckCircleIcon className="w-3.5 h-3.5 mr-1.5" />
                Saved
              </button>
            ) : (
              <button
                onClick={() => onSave(item)}
                className="w-full flex items-center justify-center px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600 dark:text-white rounded-md transition-colors duration-150 text-xs font-medium"
              >
                <BookmarkIcon className="w-3.5 h-3.5 mr-1.5" />
                Save Item
              </button>
            )
          ) : (
            <button
              onClick={() => onRemove(item)}
              className="w-full flex items-center justify-center px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700 dark:text-white rounded-md transition-colors duration-150 text-xs font-medium"
            >
              <TrashIcon className="w-3.5 h-3.5 mr-1.5" />
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
