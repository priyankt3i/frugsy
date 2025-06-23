
import React, { useState, useEffect, useCallback } from 'react';
import { SearchBar } from './components/SearchBar';
import { GroceryItemCard } from './components/GroceryItemCard';
import { StoreGroupCard } from './components/StoreGroupCard';
import { ApiKeyWarning } from './components/ApiKeyWarning';
import { LoadingSpinner } from './components/LoadingSpinner';
import { MapInput } from './components/MapInput';
import { ThemeToggleButton } from './components/ThemeToggleButton';
import { GroceryItem, RawGroceryItem, GroundingSource, Coordinates, StoreItemGroup, IdentifiedStore } from './types';
import { fetchGroceryPricesForItemInStore, generateProductImage } from './services/geminiService';
import { geocodeZipCode, findNearbyGroceryStoresFromMaps } from './services/mapsService';
import { useLocalStorage } from './hooks/useLocalStorage';
import { MagnifyingGlassIcon, BookmarkIcon, XCircleIcon, ShoppingCartIcon, LinkIcon, InformationCircleIcon } from './components/icons';
import { DEFAULT_SEARCH_RADIUS } from './constants';

const App: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [zipCode, setZipCode] = useState<string>('');
  const [searchRadius, setSearchRadius] = useState<number>(DEFAULT_SEARCH_RADIUS);
  const [selectedMapLocation, setSelectedMapLocation] = useState<Coordinates | null>(null);
  const [userLiveCoordinates, setUserLiveCoordinates] = useState<Coordinates | null>(null);
  
  const [searchResults, setSearchResults] = useState<StoreItemGroup[]>([]);
  const [searchSources, setSearchSources] = useState<GroundingSource[]>([]);
  const [savedItems, setSavedItems] = useLocalStorage<GroceryItem[]>('savedGroceryItems', []);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeolocating, setIsGeolocating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isGeminiApiKeyMissing, setIsGeminiApiKeyMissing] = useState<boolean>(false);
  const [isMapsApiKeyMissing, setIsMapsApiKeyMissing] = useState<boolean>(false);
  
  const [currentSearchDisplayInfo, setCurrentSearchDisplayInfo] = useState<string>('');
  const [loadingStep, setLoadingStep] = useState<string>('');

  useEffect(() => {
    if (!process.env.API_KEY) { 
      setIsGeminiApiKeyMissing(true);
      console.warn("Gemini API_KEY environment variable is not set.");
    }
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      setIsMapsApiKeyMissing(true);
      console.warn("GOOGLE_MAPS_API_KEY environment variable is not set.");
    }
  }, []);

  const uniqSources = (sources: GroundingSource[]): GroundingSource[] => {
    const seen = new Set<string>();
    return sources.filter(source => {
      if (!source || !source.uri) return false; // Ensure source and uri exist
      const duplicate = seen.has(source.uri);
      seen.add(source.uri);
      return !duplicate;
    });
  };

  const handleUseMyLocation = useCallback(() => {
    if (navigator.geolocation) {
      setIsGeolocating(true);
      setLoadingStep('Requesting your location...');
      setError(null);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLiveCoordinates(coords);
          setSelectedMapLocation(coords); // Also set it on the map
          setIsGeolocating(false);
          setLoadingStep('');
          // Optionally, if ZIP is empty, you could try reverse geocoding here to fill it,
          // but for now, we'll just use the coords.
        },
        (geoError) => {
          setError(`Geolocation error: ${geoError.message}. Please ensure location services are enabled or try entering a ZIP code.`);
          setIsGeolocating(false);
          setLoadingStep('');
          setUserLiveCoordinates(null);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
      setIsGeolocating(false);
      setLoadingStep('');
    }
  }, []);

  const getSearchCoordinates = async (zip: string, selectedMapCoords: Coordinates | null, liveCoords: Coordinates | null): Promise<Coordinates> => {
    if (selectedMapCoords) {
      setLoadingStep('Using coordinates from map selection...');
      return selectedMapCoords;
    }
    if (liveCoords) {
      setLoadingStep('Using your current location...');
      return liveCoords;
    }
    if (zip.trim() && /^\d{5}$/.test(zip.trim())) {
      setLoadingStep(`Geocoding ZIP code ${zip}...`);
      try {
        const coords = await geocodeZipCode(zip.trim());
        return coords;
      } catch (geoErr) {
        throw new Error(`Failed to get coordinates for ZIP ${zip}. ${geoErr instanceof Error ? geoErr.message : String(geoErr)}`);
      }
    }
    throw new Error("No valid location (Map selection, Current Location, or ZIP code) provided for search.");
  };

  const handleSearch = useCallback(async (itemQuery: string, zip: string, radius: number) => {
    if (isGeminiApiKeyMissing) {
      setError("Gemini API Key is missing. Please configure it to use the search functionality.");
      return;
    }
     if (isMapsApiKeyMissing) {
      setError("Google Maps API Key is missing. Store lookup will not function correctly.");
      return;
    }
    if (!itemQuery.trim()) {
      setError("Please enter an item name.");
      return;
    }
    // ZIP code is no longer strictly required if map location or geolocation is used
    // However, if provided, it should be valid for geocoding fallback
    if (zip.trim() && !/^\d{5}$/.test(zip.trim())) {
        setError("If providing a ZIP code, please enter a valid 5-digit US ZIP code.");
        return;
    }
    if (!selectedMapLocation && !userLiveCoordinates && !zip.trim()){
        setError("Please provide a ZIP code, use your current location, or select a point on the map.");
        return;
    }


    setIsLoading(true);
    setLoadingStep('Initializing search...');
    setError(null);
    setSearchResults([]);
    setSearchSources([]);
    let accumulatedSources: GroundingSource[] = [];
    
    let searchLocationDescriptor = "";
    
    setSearchTerm(itemQuery); 
    setZipCode(zip); // Store it even if not primarily used, for display or re-search
    setSearchRadius(radius);

    try {
      // Step 0: Determine Coordinates
      const centralCoordinates = await getSearchCoordinates(zip, selectedMapLocation, userLiveCoordinates);
      searchLocationDescriptor = `near (Lat: ${centralCoordinates.lat.toFixed(2)}, Lng: ${centralCoordinates.lng.toFixed(2)})`;
      if (zip.trim()) searchLocationDescriptor += ` (orig. ZIP: ${zip})`;

      let displayInfo = `"${itemQuery}" ${searchLocationDescriptor} (radius: ${radius} miles)`;
      setCurrentSearchDisplayInfo(displayInfo);

      // Step 1: Fetch Nearby Grocery Stores using Google Maps API
      setLoadingStep('Finding nearby stores via Google Maps...');
      const identifiedStores = await findNearbyGroceryStoresFromMaps(centralCoordinates, radius);

      if (identifiedStores.length === 0) {
        setError(`No grocery stores found via Google Maps ${searchLocationDescriptor}. Try adjusting the radius or location.`);
        setSearchResults([]);
        setIsLoading(false);
        return;
      }
      
      setLoadingStep(`Found ${identifiedStores.length} store(s) via Google Maps. Fetching item prices using Gemini...`);

      // Step 2: Fetch Item Prices for Each Store Concurrently using Gemini
      const itemPricePromises = identifiedStores.map(store =>
        fetchGroceryPricesForItemInStore(itemQuery, store, radius)
          .then(result => ({ ...result, storeContext: store })) 
          .catch(itemErr => { 
            console.error(`Error fetching price for "${itemQuery}" at ${store.storeName}:`, itemErr);
            return { item: null, sources: [], storeContext: store }; 
          })
      );
      
      const itemPriceResultsSettled = await Promise.allSettled(itemPricePromises);
      
      const foundRawItemsWithContext: (RawGroceryItem & { storeContext: IdentifiedStore })[] = [];
      itemPriceResultsSettled.forEach(settledResult => {
        if (settledResult.status === 'fulfilled') {
          const resultValue = settledResult.value;
          if (resultValue.item) {
            const finalItemData = {
              ...resultValue.item,
              storeName: resultValue.item.storeName || resultValue.storeContext.storeName,
              storeAddress: resultValue.item.storeAddress || resultValue.storeContext.storeAddress,
            };
            foundRawItemsWithContext.push({ ...finalItemData, storeContext: resultValue.storeContext });
          }
          if (resultValue.sources && Array.isArray(resultValue.sources)) {
            accumulatedSources.push(...resultValue.sources);
          }
        } else {
          console.error('A promise for fetching item price was rejected:', settledResult.reason);
        }
      });
      
      if (foundRawItemsWithContext.length === 0) {
        setError(`Found ${identifiedStores.length} store(s) via Maps, but Gemini couldn't find "${itemQuery}" with pricing at any of them. Check sources for general store info.`);
        setSearchResults([]);
        setSearchSources(uniqSources(accumulatedSources));
        setIsLoading(false);
        return;
      }

      setLoadingStep(`Found ${foundRawItemsWithContext.length} item(s) via Gemini. Generating images...`);

      // Step 3: Generate Images Concurrently
      const imageGenerationPromises = foundRawItemsWithContext.map(rawItem => 
        generateProductImage(rawItem.fullItemName)
          .then(generatedImageUrl => ({ ...rawItem, generatedImageUrl }))
          .catch(imgErr => {
            console.error(`Failed to generate image for ${rawItem.fullItemName}:`, imgErr);
            return { ...rawItem, generatedImageUrl: null }; 
          })
      );
      const itemsWithImageAttempts: (RawGroceryItem & { storeContext: IdentifiedStore; generatedImageUrl: string | null })[] = await Promise.all(imageGenerationPromises);

      // Step 4: Process and Group Items
      const processedItems: GroceryItem[] = itemsWithImageAttempts.map((itemWithImg, index) => ({
        ...itemWithImg,
        id: `${itemWithImg.storeContext.storeName}-${itemWithImg.fullItemName}-${itemWithImg.price}-${index}-${Date.now()}`
      }));

      const storeMap = new Map<string, { storeAddress?: string; items: GroceryItem[] }>();
      processedItems.forEach(procItem => {
        const storeKey = procItem.storeName; 
        if (!storeMap.has(storeKey)) {
          storeMap.set(storeKey, { storeAddress: procItem.storeAddress, items: [] });
        }
        const group = storeMap.get(storeKey)!;
        group.items.push(procItem);
        if (procItem.storeAddress && (!group.storeAddress || procItem.storeAddress.length > (group.storeAddress?.length || 0))) {
          group.storeAddress = procItem.storeAddress;
        }
      });

      const groupedResults: StoreItemGroup[] = [];
      storeMap.forEach((value, key) => {
        groupedResults.push({ storeName: key, storeAddress: value.storeAddress, items: value.items });
      });
      
      groupedResults.sort((a, b) => a.storeName.localeCompare(b.storeName));
      groupedResults.forEach(group => {
        group.items.sort((a, b) => a.price - b.price); 
      });

      setSearchResults(groupedResults);
      setSearchSources(uniqSources(accumulatedSources));

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred during the search process.');
      }
      console.error("Overall search orchestrator error:", err);
      setSearchResults([]); 
      setSearchSources(uniqSources(accumulatedSources)); 
    } finally {
      setIsLoading(false);
      setLoadingStep('');
      setIsGeolocating(false); // Ensure geolocation spinner stops
    }
  }, [isGeminiApiKeyMissing, isMapsApiKeyMissing, selectedMapLocation, userLiveCoordinates]);

  const handleSaveItem = (itemToSave: GroceryItem) => {
    if (!savedItems.find(item => item.id === itemToSave.id)) {
      setSavedItems(prevItems => [...prevItems, itemToSave]);
    }
  };

  const handleRemoveItem = (itemToRemove: GroceryItem) => {
    setSavedItems(prevItems => prevItems.filter(item => item.id !== itemToRemove.id));
  };

  const isItemSaved = (item: GroceryItem): boolean => {
    return savedItems.some(saved => saved.id === item.id);
  };

  const handleMapLocationSelect = (coords: Coordinates) => {
    setSelectedMapLocation(coords);
    setUserLiveCoordinates(null); // Clear live location if map is used
  };

  const handleClearMapLocation = () => {
    setSelectedMapLocation(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 text-slate-900 dark:text-slate-100 p-4 md:p-8 font-sans transition-colors duration-300">
      <ThemeToggleButton />
      <header className="text-center mb-10 pt-8">
        <div className="flex items-center justify-center space-x-3 mb-2">
          <ShoppingCartIcon className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400">
            Frugsy
          </h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400 text-lg">Find the best deals on your groceries, powered by AI and Maps.</p>
      </header>

      {isGeminiApiKeyMissing && <ApiKeyWarning />}
      {isMapsApiKeyMissing && (
         <div className="bg-orange-100 dark:bg-orange-700 border-l-4 border-orange-500 dark:border-orange-800 text-orange-700 dark:text-orange-100 p-6 rounded-lg shadow-lg mb-8 flex items-start space-x-4">
            <InformationCircleIcon className="w-8 h-8 text-orange-500 dark:text-orange-100 flex-shrink-0 mt-1" />
            <div>
                <h4 className="font-bold text-lg mb-1 text-orange-800 dark:text-orange-50">Google Maps API Key Missing</h4>
                <p className="text-sm">
                The Google Maps API key (<code>process.env.GOOGLE_MAPS_API_KEY</code>) is not configured.
                Store discovery and ZIP code geocoding will not work without it.
                </p>
                <p className="text-sm mt-2">
                Please ensure this API key is correctly set up in your environment.
                </p>
            </div>
        </div>
      )}


      <main className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-slate-800 shadow-2xl rounded-xl p-6 md:p-8 mb-10">
          <SearchBar 
            onSearch={handleSearch} 
            isLoading={isLoading || isGeolocating}
            initialRadius={searchRadius}
            initialZipCode={zipCode}
            initialSearchTerm={searchTerm}
            onUseMyLocation={handleUseMyLocation}
          />
          <MapInput 
            selectedLocation={selectedMapLocation}
            onLocationSelect={handleMapLocationSelect}
            onClearLocation={handleClearMapLocation}
          />
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-700 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-100 p-4 rounded-lg mb-8 shadow-lg flex items-center space-x-3" role="alert">
            <XCircleIcon className="w-6 h-6" />
            <p><span className="font-semibold">Error:</span> {error}</p>
          </div>
        )}

        {(isLoading || isGeolocating) && <LoadingSpinner />}
        {(isLoading || isGeolocating) && loadingStep && <p className="text-center text-slate-600 dark:text-slate-400 -mt-6 mb-4">{loadingStep}</p>}


        {!isLoading && !isGeolocating && currentSearchDisplayInfo && searchResults.length === 0 && !error && (
            <div className="text-center py-10 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl shadow-lg">
                <p className="text-xl">No specific items found for {currentSearchDisplayInfo}.</p>
                <p className="text-slate-500 dark:text-slate-500 mt-1">Try refining your search terms, adjusting the radius/location, or check back later. Review sources below if available.</p>
            </div>
        )}

        {!isLoading && !isGeolocating && searchResults.length > 0 && (
          <section className="mb-12" aria-labelledby="search-results-heading">
            <h2 id="search-results-heading" className="text-3xl font-semibold mb-6 text-slate-800 dark:text-slate-200 flex items-center">
              <MagnifyingGlassIcon className="w-8 h-8 mr-3 text-emerald-600 dark:text-emerald-400" />
              Search Results for {currentSearchDisplayInfo}
            </h2>
            <div className="space-y-8">
              {searchResults.map((storeGroup, index) => (
                <StoreGroupCard
                  key={`${storeGroup.storeName}-${index}`} 
                  storeGroup={storeGroup}
                  onSaveItem={handleSaveItem}
                  onRemoveItem={handleRemoveItem} 
                  isItemSaved={isItemSaved}
                />
              ))}
            </div>
          </section>
        )}
        
        {!isLoading && !isGeolocating && searchSources.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-300 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
                <LinkIcon className="w-5 h-5 mr-2 text-cyan-600 dark:text-cyan-400" />
                Data Sources Consulted (from Google Search for item details)
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-400 max-h-48 overflow-y-auto">
                {searchSources.map((source, idx) => (
                <li key={idx}>
                    <a 
                    href={source.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    title={source.title}
                    className="hover:text-cyan-600 dark:hover:text-cyan-400 underline transition-colors"
                    >
                    {source.title || source.uri}
                    </a>
                </li>
                ))}
            </ul>
            </div>
        )}

        <section aria-labelledby="saved-items-heading" className="mt-12">
          <h2 id="saved-items-heading" className="text-3xl font-semibold mb-6 text-slate-800 dark:text-slate-200 flex items-center">
            <BookmarkIcon className="w-8 h-8 mr-3 text-cyan-600 dark:text-cyan-400" />
            My Saved Items ({savedItems.length})
          </h2>
          {savedItems.length === 0 ? (
            <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
              <p className="text-slate-600 dark:text-slate-400 text-lg">You haven't saved any items yet.</p>
              <p className="text-slate-500 dark:text-slate-500 mt-2">Use the search to find items and save them for later!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedItems.map(item => (
                <GroceryItemCard
                  key={item.id}
                  item={item}
                  onSave={handleSaveItem}
                  onRemove={handleRemoveItem}
                  isSaved={true}
                  showSaveButton={false} 
                />
              ))}
            </div>
          )}
        </section>
      </main>
      <footer className="text-center mt-12 py-6 border-t border-slate-300 dark:border-slate-700">
        <p className="text-slate-500 dark:text-slate-500 text-sm">Frugsy by Priyank &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default App;
