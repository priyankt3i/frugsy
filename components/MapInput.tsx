import React, { useEffect, useRef, useState } from 'react';
import L, { LeafletMouseEvent } from 'leaflet';
import { Coordinates } from '../types';
import { MapPinIcon, RefreshIcon } from './icons';

interface MapInputProps {
  selectedLocation: Coordinates | null;
  onLocationSelect: (coords: Coordinates) => void;
  onClearLocation: () => void;
  zipCodeForInitialView?: string;
}

// Default Leaflet icon fix
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});


export const MapInput: React.FC<MapInputProps> = ({ selectedLocation, onLocationSelect, onClearLocation }) => {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [showMap, setShowMap] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showMap && mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current).setView([39.8283, -98.5795], 4); 

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      map.on('click', (e: LeafletMouseEvent) => {
        onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
      mapRef.current = map;
    }

    if (showMap && mapRef.current) {
        setTimeout(() => {
            mapRef.current?.invalidateSize();
        }, 100);
    }
  }, [showMap, onLocationSelect]);

  useEffect(() => {
    if (mapRef.current && selectedLocation) {
      if (markerRef.current) {
        markerRef.current.setLatLng([selectedLocation.lat, selectedLocation.lng]);
      } else {
        markerRef.current = L.marker([selectedLocation.lat, selectedLocation.lng]).addTo(mapRef.current);
      }
      mapRef.current.setView([selectedLocation.lat, selectedLocation.lng], 10);
    } else if (mapRef.current && !selectedLocation && markerRef.current) {
      mapRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }
  }, [selectedLocation]);

  const toggleMapVisibility = () => {
    setShowMap(prev => !prev);
  };
  
  const handleClearLocation = () => {
    onClearLocation();
    if(mapRef.current && markerRef.current) {
        mapRef.current.removeLayer(markerRef.current);
        markerRef.current = null;
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={toggleMapVisibility}
        className="w-full flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-150 text-sm font-medium mb-3"
      >
        <MapPinIcon className="w-5 h-5 mr-2" />
        {showMap ? 'Hide Map' : 'Select Search Center on Map'}
        {selectedLocation && showMap && " (Point Selected)"}
      </button>

      {showMap && (
        <div className="space-y-3">
            <div 
              id="map" 
              ref={mapContainerRef} 
              className="leaflet-container bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
            >
            </div>
            {selectedLocation && (
            <div className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-700 rounded-md">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                Selected: Lat: {selectedLocation.lat.toFixed(4)}, Lng: {selectedLocation.lng.toFixed(4)}
                </p>
                <button
                    type="button"
                    onClick={handleClearLocation}
                    title="Clear map selection"
                    className="p-1 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                    <RefreshIcon className="w-5 h-5" />
                </button>
            </div>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-500 text-center">Click on the map to set a precise search center.</p>
        </div>
      )}
    </div>
  );
};