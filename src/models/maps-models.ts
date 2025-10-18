import { z } from 'zod';

// Response format enum
export enum ResponseFormat {
  MARKDOWN = 'markdown',
  JSON = 'json'
}

// Input schema for geocoding an address
export const GeocodeInputSchema = z.object({
  address: z.string()
    .min(1, 'Address cannot be empty')
    .max(500, 'Address must not exceed 500 characters')
    .describe('Full or partial address to geocode. Examples: "Eiffel Tower", "1600 Amphitheatre Parkway, Mountain View, CA", "Tokyo Station, Japan"'),
  response_format: z.nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe('Output format: "markdown" for human-readable text or "json" for structured data')
}).strict();

export type GeocodeInput = z.infer<typeof GeocodeInputSchema>;

// Input schema for getting place details
export const PlaceDetailsInputSchema = z.object({
  place_id: z.string()
    .optional()
    .describe('Google Place ID (e.g., "ChIJN1t_tDeuEmsRUsoyG83frY4"). Use this for precise place lookup.'),
  query: z.string()
    .optional()
    .describe('Search query for the place (e.g., "Statue of Liberty", "Starbucks near Central Park"). Use this when you don\'t have a place_id.'),
  response_format: z.nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe('Output format: "markdown" for human-readable text or "json" for structured data')
}).strict().refine(
  (data) => data.place_id || data.query,
  { message: 'Either place_id or query must be provided' }
);

export type PlaceDetailsInput = z.infer<typeof PlaceDetailsInputSchema>;

// Input schema for Distance Matrix API
export const DistanceMatrixInputSchema = z.object({
  origins: z.array(z.string())
    .min(1, 'At least one origin is required')
    .max(10, 'Maximum 10 origins allowed to prevent overwhelming responses')
    .describe('Array of origin addresses or lat/lng coordinates. Examples: ["New York, NY"], ["40.7128,-74.0060"], ["Times Square, NYC", "Central Park, NYC"]'),
  destinations: z.array(z.string())
    .min(1, 'At least one destination is required')
    .max(10, 'Maximum 10 destinations allowed to prevent overwhelming responses')
    .describe('Array of destination addresses or lat/lng coordinates. Examples: ["Boston, MA"], ["42.3601,-71.0589"], ["Harvard University", "MIT"]'),
  mode: z.enum(['driving', 'walking', 'bicycling', 'transit'])
    .default('driving')
    .describe('Travel mode for distance calculation. Options: "driving", "walking", "bicycling", "transit"'),
  response_format: z.nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe('Output format: "markdown" for human-readable text or "json" for structured data')
}).strict();

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
