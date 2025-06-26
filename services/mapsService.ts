import { Coordinates, IdentifiedStore } from '../types';

// Assuming you have ONE API key for both, or two separate ones.
// If you followed the advice to have a separate Geocoding key,
// then Maps_API_KEY below will be your Places API (New) key.
const Maps_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY; // This should be the API key with HTTP referrer restrictions

if (!Maps_API_KEY) {
  console.warn("Google Maps API Key (VITE_Maps_API_KEY) is not set. Maps API calls will fail.");
}

interface GeocodingResponse {
  results: {
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    address_components: {
      long_name: string;
      short_name: string;
      types: string[];
    }[];
  }[];
  status: string;
  error_message?: string;
}

export const geocodeZipCode = async (zipCode: string): Promise<Coordinates> => {
  if (!Maps_API_KEY) { // If you used a separate key for geocoding, use that env var here
    throw new Error("Google Maps API Key is not configured. Cannot geocode ZIP code.");
  }
  const url = `/maps/maps/api/geocode/json?address=${encodeURIComponent(zipCode)}&key=${Maps_API_KEY}`; // Use the appropriate key
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

// *** NEW INTERFACE FOR PLACES API (NEW) RESPONSE ***
interface PlacesNearbyResponseNew {
  places: {
    displayName?: { text: string; languageCode: string };
    formattedAddress?: string;
    location?: Coordinates;
    // Add other fields you fetch with X-Goog-FieldMask here
  }[];
  // The new API doesn't usually return 'status' or 'error_message' in the JSON body for errors,
  // rather it uses HTTP status codes and an error object if the request was malformed or denied.
  // For successful responses, it just returns 'places'.
}

export const findNearbyGroceryStoresFromMaps = async (
  coordinates: Coordinates,
  radiusInMiles: number
): Promise<IdentifiedStore[]> => {
  if (!Maps_API_KEY) {
    throw new Error("Google Maps API Key is not configured. Cannot find nearby stores.");
  }

  const radiusInMeters = radiusInMiles * 1609.34;

  // *** NEW ENDPOINT for Places API (New) ***
  // Use the new proxy prefix `/placesapi`
  const newApiUrl = `https://places.googleapis.com/v1/places:searchNearby`;

  // Request body for POST request for Places API (New)
  const requestBody = {
    includedTypes: ['grocery_store', 'supermarket'], // Use new types from Table A if needed
    locationRestriction: {
      circle: {
        center: {
          latitude: coordinates.lat,
          longitude: coordinates.lng,
        },
        radius: radiusInMeters,
      },
    },
    // Optional parameters like maxResultCount: 20
  };

  try {
    const response = await fetch(newApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': Maps_API_KEY, // Use your Places API (New) key
        // CRITICAL: FieldMask required for Places API (New)
        'X-Goog-FieldMask': 'places.displayName.text,places.formattedAddress,places.location.lat,places.location.lng', // Request only the fields you need
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) { // Check for HTTP errors (e.g., 400, 403, 404, 500)
      const errorData = await response.json(); // Attempt to parse error as JSON
      console.error('Google Maps Places API (New) HTTP Error:', response.status, errorData);
      throw new Error(`Google Maps Places API (New) request failed: ${errorData.error?.message || response.statusText}`);
    }

    // Now parse the successful JSON response
    const data: PlacesNearbyResponseNew = await response.json();

    if (data.places) { // The new API returns an array named 'places'
      const stores: IdentifiedStore[] = [];
      data.places.forEach(place => {
        if (place.displayName?.text) { // Access name via displayName.text
          stores.push({
            storeName: place.displayName.text,
            storeAddress: place.formattedAddress || undefined,
            // You might want to add coordinates to IdentifiedStore
            // location: place.location // if you add it to IdentifiedStore type
          });
        }
      });
      return stores;
    } else {
      console.error('Google Maps Places API (New) Error: No places data in response.', data);
      throw new Error('No places data received from Google Maps (New) API.');
    }
  } catch (error) {
    console.error('Network or parsing error during Places API (New) call:', error);
    throw new Error('Network error or invalid response while finding nearby stores (Places API New).');
  }
};

export const reverseGeocodeCoordinates = async (coordinates: Coordinates): Promise<string | null> => {
  if (!Maps_API_KEY) {
    throw new Error("Google Maps API Key not configured");
  }
  const url = `/maps/maps/api/geocode/json?latlng=${coordinates.lat},${coordinates.lng}&key=${Maps_API_KEY}`;
  try {
    const response = await fetch(url);
    const data: GeocodingResponse = await response.json();
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0];
      for (const component of result.address_components) {
        if (component.types.includes('postal_code')) {
          return component.long_name;
        }
      }
      return null;
    } else {
      console.error('Reverse geocode error:', data.status, data.error_message);
      throw new Error(`Reverse geocode failed for coordinates: ${coordinates.lat},${coordinates.lng}`);
    }
  } catch (error) {
    console.error('Network error during reverse geocode:', error);
    throw new Error('Network error while reverse geocoding coordinates.');
  }
};
