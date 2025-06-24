import { Coordinates, IdentifiedStore } from '../types';

const Maps_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// No need for MAPS_API_BASE_URL if you're using the proxy,
// as the base will be handled by the proxy.
// const MAPS_API_BASE_URL = 'https://maps.googleapis.com/maps/api'; // Remove or comment out

if (!Maps_API_KEY) {
  console.warn("Google Maps API Key (VITE_GOOGLE_MAPS_API_KEY) is not set. Maps API calls will fail.");
}

interface GeocodingResponse {
  results: {
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }[];
  status: string;
  error_message?: string;
}

export const geocodeZipCode = async (zipCode: string): Promise<Coordinates> => {
  if (!Maps_API_KEY) {
    throw new Error("Google Maps API Key is not configured. Cannot geocode ZIP code.");
  }
  // CORRECTED URL for Geocoding
  // Frontend requests: /maps/maps/api/geocode/json
  // Proxy removes first /maps, forwards: https://maps.googleapis.com/maps/api/geocode/json
  const url = `/maps/maps/api/geocode/json?address=${encodeURIComponent(zipCode)}&key=${Maps_API_KEY}`;
  try {
    const response = await fetch(url);
    const data: GeocodingResponse = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      return data.results[0].geometry.location;
    } else {
      console.error('Geocoding API Error:', data.status, data.error_message);
      throw new Error(`Failed to geocode ZIP code ${zipCode}. Status: ${data.status}. ${data.error_message || ''}`);
    }
  } catch (error) {
    console.error('Network or parsing error during geocoding:', error);
    throw new Error('Network error or invalid response while geocoding ZIP code.');
  }
};

interface PlacesNearbyResponse {
  results: {
    name?: string;
    vicinity?: string; // This often contains a simplified address or street name
    formatted_address?: string; // More complete address
    place_id?: string;
    geometry?: {
      location: Coordinates;
    };
  }[];
  status: string;
  error_message?: string;
  next_page_token?: string;
}

export const findNearbyGroceryStoresFromMaps = async (
  coordinates: Coordinates,
  radiusInMiles: number
): Promise<IdentifiedStore[]> => {
  if (!Maps_API_KEY) {
    throw new Error("Google Maps API Key is not configured. Cannot find nearby stores.");
  }

  const radiusInMeters = radiusInMiles * 1609.34; // Convert miles to meters

  const types = 'grocery_or_supermarket|supermarket';
  // CORRECTED URL for Places Nearby Search
  // Frontend requests: /maps/maps/api/place/nearbysearch/json
  // Proxy removes first /maps, forwards: https://maps.googleapis.com/maps/api/place/nearbysearch/json
  const url = `/maps/maps/api/place/nearbysearch/json?location=${coordinates.lat},${coordinates.lng}&radius=${radiusInMeters}&type=${types}&key=${Maps_API_KEY}`;
  try {
    const response = await fetch(url);
    const data: PlacesNearbyResponse = await response.json();

    if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
      const stores: IdentifiedStore[] = [];
      if (data.results) {
        data.results.forEach(place => {
          if (place.name) {
            let address = place.formatted_address || place.vicinity;
            stores.push({
              storeName: place.name,
              storeAddress: address || undefined,
            });
          }
        });
      }
      return stores;
    } else {
      console.error('Google Maps Places API Error:', data.status, data.error_message);
      throw new Error(`Failed to find nearby stores via Google Maps. Status: ${data.status}. ${data.error_message || ''}`);
    }
  } catch (error) {
    console.error('Network or parsing error during Places API call:', error);
    throw new Error('Network error or invalid response while finding nearby stores.');
  }
};