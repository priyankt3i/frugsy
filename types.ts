
export interface RawGroceryItem {
  fullItemName: string;
  storeName: string;
  storeAddress?: string;
  price: number;
  currency: string;
  productUrl?: string;
  imageUrl?: string; // Image URL from initial text search
  lastUpdated?: string;
  notes?: string;
  generatedImageUrl?: string; // Base64 image data URL from image generation model
}

export interface GroceryItem extends RawGroceryItem {
  id: string; 
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface StoreItemGroup {
  storeName: string;
  storeAddress?: string; // Representative address for the store
  items: GroceryItem[];
}

// New interface for stores identified in the first API call step
export interface IdentifiedStore {
  storeName: string;
  storeAddress?: string; // Optional, but helpful if AI can provide it
}
