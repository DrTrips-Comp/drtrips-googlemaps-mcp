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

      return { error: `Place details request failed: ${response.status}` };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        return {
          error: `Place details API error: ${axiosError.response?.status} - ${axiosError.message}`
        };
      }
      return { error: error instanceof Error ? error.message : 'Unknown error' };
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

      return { error: `Place search request failed: ${response.status}` };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        return {
          error: `Place search API error: ${axiosError.response?.status} - ${axiosError.message}`
        };
      }
      return { error: error instanceof Error ? error.message : 'Unknown error' };
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

      return { error: `Geocoding request failed: ${response.status}` };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        return {
          error: `Geocoding API error: ${axiosError.response?.status} - ${axiosError.message}`
        };
      }
      return { error: error instanceof Error ? error.message : 'Unknown error' };
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

      return { error: `Distance Matrix request failed: ${response.status}` };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        return {
          error: `Distance Matrix API error: ${axiosError.response?.status} - ${axiosError.message}`
        };
      }
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
