import { z } from 'zod';

// Input schema for geocoding an address
export const GeocodeInputSchema = z.object({
  address: z.string().min(1).describe('Address to geocode')
});

export type GeocodeInput = z.infer<typeof GeocodeInputSchema>;

// Input schema for getting place details
export const PlaceDetailsInputSchema = z.object({
  place_id: z.string().optional().describe('Google Place ID'),
  query: z.string().optional().describe('Search query for the place')
}).refine(
  (data) => data.place_id || data.query,
  { message: 'Either place_id or query must be provided' }
);

export type PlaceDetailsInput = z.infer<typeof PlaceDetailsInputSchema>;

// Input schema for Distance Matrix API
export const DistanceMatrixInputSchema = z.object({
  origins: z.array(z.string()).min(1).describe('Array of origin addresses or lat/lng coordinates'),
  destinations: z.array(z.string()).min(1).describe('Array of destination addresses or lat/lng coordinates'),
  mode: z.enum(['driving', 'walking', 'bicycling', 'transit']).default('driving').describe('Travel mode')
});

export type DistanceMatrixInput = z.infer<typeof DistanceMatrixInputSchema>;

// Response types
export interface GeocodeResult {
  place_id: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface DisplayName {
  text: string;
  languageCode?: string;
}

export interface GoogleMapsLinks {
  mapsUri?: string;
  directionsUri?: string;
}

export interface PlaceDetails {
  id: string;
  displayName: string | null;
  formattedAddress: string;
  location: Location;
  types: string[];
  googleMapsLinks: GoogleMapsLinks;
}

export interface PlaceDetailsResponse {
  place_details: PlaceDetails;
}

export interface ErrorResponse {
  error: string;
}

// Distance Matrix response types
export interface DistanceMatrixElement {
  status: string;
  distance?: {
    text: string;
    value: number;
  };
  duration?: {
    text: string;
    value: number;
  };
  duration_in_traffic?: {
    text: string;
    value: number;
  };
}

export interface DistanceMatrixRow {
  elements: DistanceMatrixElement[];
}

export interface DistanceMatrixResponse {
  origin_addresses: string[];
  destination_addresses: string[];
  rows: DistanceMatrixRow[];
}
