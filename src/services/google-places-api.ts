import axios, { AxiosError } from 'axios';
import type {
  GeocodeResult,
  PlaceDetailsResponse,
  ErrorResponse,
  DistanceMatrixResponse
} from '../models/maps-models.js';

export class GooglePlacesAPI {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api';
  private readonly placesBaseUrl = 'https://places.googleapis.com/v1';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Google Maps API key not configured');
    }
    this.apiKey = apiKey;
  }

  /**
   * Get place details by place ID using Google Places API (New)
   */
  async getPlaceDetailsById(placeId: string): Promise<PlaceDetailsResponse | ErrorResponse> {
    try {
      const url = `${this.placesBaseUrl}/places/${placeId}`;
      const headers = {
        'X-Goog-Api-Key': this.apiKey,
        'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,types,googleMapsLinks'
      };

      const response = await axios.get(url, { headers, timeout: 10000 });

      if (response.status === 200) {
        const data = response.data;
        return {
          place_details: {
            id: data.id,
            displayName: data.displayName?.text || null,
            formattedAddress: data.formattedAddress,
            location: data.location,
            types: data.types || [],
            googleMapsLinks: data.googleMapsLinks || {}
          }
        };
      }

      return { error: `Place details request failed with status ${response.status}. Please try again.` };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        const status = axiosError.response?.status;

        switch (status) {
          case 404:
            return { error: 'Place not found. Please verify the place_id is correct or try using a search query instead.' };
          case 403:
            return { error: 'Access denied. Please check your Google Maps API key has Places API (New) enabled in Google Cloud Console.' };
          case 429:
            return { error: 'Rate limit exceeded. Please wait a moment before making more requests.' };
          case 400:
            return { error: 'Invalid request. Please check that the place_id format is correct.' };
          default:
            if (axiosError.code === 'ECONNABORTED') {
              return { error: 'Request timed out. Please try again.' };
            }
            return { error: `API error (${status || 'unknown'}). Please try again or contact support if the issue persists.` };
        }
      }
      return { error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  /**
   * Search for places and get details of the first result
   */
  async searchAndGetPlaceDetails(query: string): Promise<PlaceDetailsResponse | ErrorResponse> {
    try {
      const searchUrl = `${this.placesBaseUrl}/places:searchText`;
      const headers = {
        'X-Goog-Api-Key': this.apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.googleMapsLinks'
      };

      const searchData = {
        textQuery: query,
        maxResultCount: 1
      };

      const response = await axios.post(searchUrl, searchData, { headers, timeout: 10000 });

      if (response.status === 200) {
        const data = response.data;
        const places = data.places || [];

        if (places.length > 0) {
          const place = places[0];
          return {
            place_details: {
              id: place.id,
              displayName: place.displayName?.text || null,
              formattedAddress: place.formattedAddress,
              location: place.location,
              types: place.types || [],
              googleMapsLinks: place.googleMapsLinks || {}
            }
          };
        }

        return { error: 'No places found for the given query' };
      }

      return { error: `Place search request failed with status ${response.status}. Please try again.` };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        const status = axiosError.response?.status;

        switch (status) {
          case 404:
            return { error: 'Search endpoint not found. Please verify your API configuration.' };
          case 403:
            return { error: 'Access denied. Please check your Google Maps API key has Places API (New) enabled in Google Cloud Console.' };
          case 429:
            return { error: 'Rate limit exceeded. Please wait a moment before making more requests.' };
          case 400:
            return { error: 'Invalid search query. Please provide a valid search term.' };
          default:
            if (axiosError.code === 'ECONNABORTED') {
              return { error: 'Request timed out. Please try again with a simpler query.' };
            }
            return { error: `API error (${status || 'unknown'}). Please try again or contact support if the issue persists.` };
        }
      }
      return { error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  /**
   * Geocode an address using Google Maps Geocoding API
   */
  async geocodeAddress(address: string): Promise<GeocodeResult[] | ErrorResponse> {
    try {
      const url = `${this.baseUrl}/geocode/json`;
      const params = {
        address: address,
        key: this.apiKey
      };

      const response = await axios.get(url, { params, timeout: 10000 });

      if (response.status === 200) {
        const data = response.data;

        if (data.status === 'OK' && data.results) {
          const results: GeocodeResult[] = data.results.slice(0, 3).map((result: any) => ({
            place_id: result.place_id,
            address: result.formatted_address,
            latitude: result.geometry.location.lat,
            longitude: result.geometry.location.lng
          }));
          return results;
        }

        if (data.status === 'ZERO_RESULTS') {
          return [];
        }

        return { error: `Geocoding failed with status: ${data.status}` };
      }

      return { error: `Geocoding request failed with status ${response.status}. Please try again.` };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        const status = axiosError.response?.status;

        switch (status) {
          case 403:
            return { error: 'Access denied. Please check your Google Maps API key has Geocoding API enabled in Google Cloud Console.' };
          case 429:
            return { error: 'Rate limit exceeded. Please wait a moment before making more requests.' };
          case 400:
            return { error: 'Invalid address format. Please provide a valid address.' };
          default:
            if (axiosError.code === 'ECONNABORTED') {
              return { error: 'Request timed out. Please try again.' };
            }
            return { error: `API error (${status || 'unknown'}). Please try again or contact support if the issue persists.` };
        }
      }
      return { error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  /**
   * Calculate distance matrix between origins and destinations using Google Distance Matrix API
   */
  async calculateDistanceMatrix(
    origins: string[],
    destinations: string[],
    mode: string = 'driving'
  ): Promise<DistanceMatrixResponse | ErrorResponse> {
    try {
      const url = `${this.baseUrl}/distancematrix/json`;
      const params = {
        origins: origins.join('|'),
        destinations: destinations.join('|'),
        mode: mode,
        key: this.apiKey
      };

      const response = await axios.get(url, { params, timeout: 10000 });

      if (response.status === 200) {
        const data = response.data;

        if (data.status === 'OK') {
          return {
            origin_addresses: data.origin_addresses || [],
            destination_addresses: data.destination_addresses || [],
            rows: data.rows || []
          };
        }

        return { error: `Distance Matrix API failed with status: ${data.status}` };
      }

      return { error: `Distance Matrix request failed with status ${response.status}. Please try again.` };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        const status = axiosError.response?.status;

        switch (status) {
          case 403:
            return { error: 'Access denied. Please check your Google Maps API key has Distance Matrix API enabled in Google Cloud Console.' };
          case 429:
            return { error: 'Rate limit exceeded. Please wait a moment before making more requests.' };
          case 400:
            return { error: 'Invalid request. Please check that origins and destinations are valid addresses or coordinates.' };
          default:
            if (axiosError.code === 'ECONNABORTED') {
              return { error: 'Request timed out. Please try again with fewer locations.' };
            }
            return { error: `API error (${status || 'unknown'}). Please try again or contact support if the issue persists.` };
        }
      }
      return { error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }
}
