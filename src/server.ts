import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  GeocodeInputSchema,
  PlaceDetailsInputSchema,
  DistanceMatrixInputSchema,
  ResponseFormat,
  type GeocodeResult,
  type DistanceMatrixResponse
} from './models/maps-models.js';
import { GooglePlacesAPI } from './services/google-places-api.js';
import { CHARACTER_LIMIT } from './config/settings.js';

export function createMcpServer(apiKey: string): Server {
  const server = new Server(
    {
      name: 'drtrips-google-mcp',
      version: '1.0.0'
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  const placesApi = new GooglePlacesAPI(apiKey);

  // Register tool listing
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'google_maps_geocode_address',
        description: `Geocode an address to geographic coordinates using Google Maps Geocoding API.

This tool converts human-readable addresses into latitude/longitude coordinates and provides Google Place IDs. It returns up to 3 best-matching results for ambiguous addresses. Does NOT perform reverse geocoding (coordinates to address).

Args:
  - address (string): Full or partial address to geocode (e.g., "Eiffel Tower", "1600 Amphitheatre Parkway, Mountain View, CA", "Tokyo Station, Japan")
  - response_format ('json' | 'markdown'): Output format (default: 'markdown')

Returns:
  For JSON format: Array of geocoding results with schema:
  [
    {
      "place_id": string,      // Google Place ID (e.g., "ChIJ...")
      "address": string,       // Formatted full address
      "latitude": number,      // Latitude coordinate
      "longitude": number      // Longitude coordinate
    }
  ]

  For Markdown format: Human-readable formatted text with results list

Examples:
  - Use when: "Find coordinates for Eiffel Tower" -> params: { address: "Eiffel Tower" }
  - Use when: "Get lat/lng for 123 Main St, NYC" -> params: { address: "123 Main St, New York" }
  - Use when: "Geocode Tokyo Station" -> params: { address: "Tokyo Station, Japan" }
  - Don't use when: You already have coordinates and need address (use reverse geocoding instead)
  - Don't use when: You need detailed place information (use google_maps_get_place_details instead)

Error Handling:
  - Returns empty array if no results found for the address
  - Returns "Access denied" error if API key lacks Geocoding API permission - enable it in Google Cloud Console
  - Returns "Rate limit exceeded" error if quota exhausted - wait before retrying
  - Returns "Invalid address format" error if address is malformed - provide a clearer address`,
        inputSchema: zodToJsonSchema(GeocodeInputSchema) as any,
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: true
        }
      },
      {
        name: 'google_maps_get_place_details',
        description: `Get detailed information about a place using Google Places API (New).

This tool retrieves comprehensive place information including name, address, coordinates, place types, and Google Maps links. You can search by place_id (for precise lookup) or by query (for text search). Returns details for a single place only.

Args:
  - place_id (string, optional): Google Place ID (e.g., "ChIJN1t_tDeuEmsRUsoyG83frY4"). Use this for precise place lookup when you already have the ID.
  - query (string, optional): Search query for the place (e.g., "Statue of Liberty", "Starbucks near Central Park"). Use this when you don't have a place_id.
  - response_format ('json' | 'markdown'): Output format (default: 'markdown')

Note: Either place_id OR query must be provided (not both).

Returns:
  For JSON format: Place details object with schema:
  {
    "id": string,                    // Google Place ID
    "displayName": string | null,    // Place name
    "formattedAddress": string,      // Full formatted address
    "location": {
      "latitude": number,
      "longitude": number
    },
    "types": string[],               // Place types (e.g., ["restaurant", "cafe"])
    "googleMapsLinks": {
      "mapsUri": string,             // Google Maps URL
      "directionsUri": string        // Google Maps Directions URL
    }
  }

  For Markdown format: Human-readable formatted text with place information

Examples:
  - Use when: "Get details for Statue of Liberty" -> params: { query: "Statue of Liberty" }
  - Use when: "Find info about place ChIJN1t..." -> params: { place_id: "ChIJN1t_tDeuEmsRUsoyG83frY4" }
  - Use when: "What's at this place ID?" -> params: { place_id: "<place_id>" }
  - Don't use when: You just need coordinates (use google_maps_geocode_address instead)
  - Don't use when: You need distance/directions (use google_maps_calculate_distance_matrix instead)

Error Handling:
  - Returns "Place not found" error if place_id is invalid - verify the ID or try using query parameter
  - Returns "No places found" if query doesn't match any places - try a different search term
  - Returns "Access denied" error if API key lacks Places API (New) permission - enable it in Google Cloud Console
  - Returns "Rate limit exceeded" error if quota exhausted - wait before retrying`,
        inputSchema: zodToJsonSchema(PlaceDetailsInputSchema) as any,
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: true
        }
      },
      {
        name: 'google_maps_calculate_distance_matrix',
        description: `Calculate travel distance and time between multiple origins and destinations using Google Distance Matrix API.

This tool computes distance and duration for traveling between origin and destination pairs. Supports multiple travel modes (driving, walking, bicycling, transit). Results are returned for all origin-destination combinations (M origins × N destinations = M×N results). Limited to 10 origins and 10 destinations per request.

Args:
  - origins (string[]): Array of origin addresses or lat/lng coordinates. Max 10. Examples: ["New York, NY"], ["40.7128,-74.0060"], ["Times Square, NYC"]
  - destinations (string[]): Array of destination addresses or lat/lng coordinates. Max 10. Examples: ["Boston, MA"], ["42.3601,-71.0589"], ["MIT"]
  - mode ('driving' | 'walking' | 'bicycling' | 'transit'): Travel mode for distance calculation (default: 'driving')
  - response_format ('json' | 'markdown'): Output format (default: 'markdown')

Returns:
  For JSON format: Distance matrix response with schema:
  {
    "origin_addresses": string[],        // Resolved origin addresses
    "destination_addresses": string[],   // Resolved destination addresses
    "rows": [
      {
        "elements": [
          {
            "status": string,            // "OK" or error status
            "distance": {
              "text": string,            // Human-readable distance (e.g., "5.2 km")
              "value": number            // Distance in meters
            },
            "duration": {
              "text": string,            // Human-readable duration (e.g., "15 mins")
              "value": number            // Duration in seconds
            }
          }
        ]
      }
    ]
  }

  For Markdown format: Human-readable formatted table with distances and durations

Examples:
  - Use when: "How far from Times Square to Central Park?" -> params: { origins: ["Times Square, NYC"], destinations: ["Central Park, NYC"] }
  - Use when: "Walking distance from A to B and C" -> params: { origins: ["A"], destinations: ["B", "C"], mode: "walking" }
  - Use when: "Transit time between these 3 locations" -> params: { origins: ["Location 1", "Location 2"], destinations: ["Location 3"], mode: "transit" }
  - Don't use when: You just need coordinates (use google_maps_geocode_address instead)
  - Don't use when: You need place details (use google_maps_get_place_details instead)

Error Handling:
  - Returns "Access denied" error if API key lacks Distance Matrix API permission - enable it in Google Cloud Console
  - Returns "Rate limit exceeded" error if quota exhausted - wait before retrying
  - Returns "Invalid request" error if origins/destinations are malformed - use valid addresses or coordinates
  - Returns "Request timed out" error if too many locations - reduce the number of origins/destinations

Note: Billing is based on elements (origins × destinations). Free tier includes 10,000 elements/month.`,
        inputSchema: zodToJsonSchema(DistanceMatrixInputSchema) as any,
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: true
        }
      }
    ]
  }));

  // Helper function to truncate response if it exceeds character limit
  function truncateIfNeeded(content: string, context: string): { text: string; wasTruncated: boolean } {
    if (content.length <= CHARACTER_LIMIT) {
      return { text: content, wasTruncated: false };
    }

    const truncated = content.substring(0, CHARACTER_LIMIT);
    const truncationMessage = `\n\n[Response truncated: exceeded ${CHARACTER_LIMIT} character limit. Original length: ${content.length} characters. ${context}]`;

    return {
      text: truncated + truncationMessage,
      wasTruncated: true
    };
  }

  // Register tool execution
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'google_maps_geocode_address': {
          const validated = GeocodeInputSchema.parse(args);
          const result = await placesApi.geocodeAddress(validated.address);

          if ('error' in result) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Geocoding Error\n${'='.repeat(50)}\n${result.error}`
                }
              ],
              isError: true
            };
          }

          const results = result as GeocodeResult[];

          if (results.length === 0) {
            return {
              content: [
                {
                  type: 'text',
                  text: `No Results Found\n${'='.repeat(50)}\nNo geocoding results found for: ${validated.address}`
                }
              ]
            };
          }

          let responseText: string;

          if (validated.response_format === ResponseFormat.JSON) {
            // JSON format - return structured data
            responseText = JSON.stringify(results, null, 2);
          } else {
            // Markdown format - human-readable
            let lines: string[] = [];
            lines.push('# Geocoding Results');
            lines.push('');
            lines.push(`Query: ${validated.address}`);
            lines.push(`Results: ${results.length}`);
            lines.push('');

            results.forEach((item, index) => {
              lines.push(`## Result ${index + 1}`);
              lines.push(`- **Address**: ${item.address}`);
              lines.push(`- **Coordinates**: ${item.latitude}, ${item.longitude}`);
              lines.push(`- **Place ID**: ${item.place_id}`);
              lines.push('');
            });

            responseText = lines.join('\n');
          }

          const { text: finalText, wasTruncated } = truncateIfNeeded(
            responseText,
            'Try using response_format="json" for more compact output.'
          );

          return {
            content: [
              {
                type: 'text',
                text: finalText
              }
            ],
            metadata: {
              total_results: results.length,
              query: validated.address,
              truncated: wasTruncated
            }
          };
        }

        case 'google_maps_get_place_details': {
          const validated = PlaceDetailsInputSchema.parse(args);

          let result;
          if (validated.place_id) {
            result = await placesApi.getPlaceDetailsById(validated.place_id);
          } else if (validated.query) {
            result = await placesApi.searchAndGetPlaceDetails(validated.query);
          } else {
            throw new Error('Either place_id or query must be provided');
          }

          if ('error' in result) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Place Details Error\n${'='.repeat(50)}\n${result.error}`
                }
              ],
              isError: true
            };
          }

          const place = result.place_details;
          let responseText: string;

          if (validated.response_format === ResponseFormat.JSON) {
            // JSON format - return structured data
            responseText = JSON.stringify(place, null, 2);
          } else {
            // Markdown format - human-readable
            let lines: string[] = [];
            lines.push('# Place Details');
            lines.push('');
            lines.push(`**Name**: ${place.displayName || 'N/A'}`);
            lines.push(`**Address**: ${place.formattedAddress}`);
            lines.push(`**Location**: ${place.location.latitude}, ${place.location.longitude}`);
            lines.push(`**Place ID**: ${place.id}`);

            if (place.types && place.types.length > 0) {
              lines.push(`**Types**: ${place.types.join(', ')}`);
            }

            if (place.googleMapsLinks?.mapsUri) {
              lines.push(`**Google Maps**: ${place.googleMapsLinks.mapsUri}`);
            }

            if (place.googleMapsLinks?.directionsUri) {
              lines.push(`**Directions**: ${place.googleMapsLinks.directionsUri}`);
            }

            responseText = lines.join('\n');
          }

          const { text: finalText, wasTruncated } = truncateIfNeeded(
            responseText,
            'Try using response_format="json" for more compact output.'
          );

          return {
            content: [
              {
                type: 'text',
                text: finalText
              }
            ],
            metadata: {
              place_id: place.id,
              location: place.location,
              query: validated.query || validated.place_id,
              truncated: wasTruncated
            }
          };
        }

        case 'google_maps_calculate_distance_matrix': {
          const validated = DistanceMatrixInputSchema.parse(args);
          const result = await placesApi.calculateDistanceMatrix(
            validated.origins,
            validated.destinations,
            validated.mode
          );

          if ('error' in result) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Distance Matrix Error\n${'='.repeat(50)}\n${result.error}`
                }
              ],
              isError: true
            };
          }

          const distanceMatrix = result as DistanceMatrixResponse;
          const totalElements = distanceMatrix.origin_addresses.length * distanceMatrix.destination_addresses.length;

          let responseText: string;

          if (validated.response_format === ResponseFormat.JSON) {
            // JSON format - return structured data
            const jsonResponse = {
              ...distanceMatrix,
              metadata: {
                total_elements: totalElements,
                origins_count: distanceMatrix.origin_addresses.length,
                destinations_count: distanceMatrix.destination_addresses.length,
                mode: validated.mode,
                billing_note: '10,000 elements/month free tier'
              }
            };
            responseText = JSON.stringify(jsonResponse, null, 2);
          } else {
            // Markdown format - human-readable
            let lines: string[] = [];
            lines.push('# Distance Matrix Results');
            lines.push('');
            lines.push(`**Travel Mode**: ${validated.mode}`);
            lines.push(`**Total Elements**: ${totalElements} (origins × destinations)`);
            lines.push('');

            distanceMatrix.rows.forEach((row, originIndex) => {
              const origin = distanceMatrix.origin_addresses[originIndex];
              lines.push(`## Origin: ${origin}`);
              lines.push('');

              row.elements.forEach((element, destIndex) => {
                const destination = distanceMatrix.destination_addresses[destIndex];
                lines.push(`### → ${destination}`);

                if (element.status === 'OK') {
                  if (element.distance) {
                    lines.push(`- **Distance**: ${element.distance.text} (${element.distance.value} meters)`);
                  }
                  if (element.duration) {
                    lines.push(`- **Duration**: ${element.duration.text} (${element.duration.value} seconds)`);
                  }
                } else {
                  lines.push(`- **Status**: ${element.status}`);
                }
                lines.push('');
              });
            });

            lines.push('---');
            lines.push(`**Billing Note**: 10,000 elements/month free tier (Essentials plan)`);

            responseText = lines.join('\n');
          }

          const { text: finalText, wasTruncated } = truncateIfNeeded(
            responseText,
            'Try reducing the number of origins/destinations or use response_format="json".'
          );

          return {
            content: [
              {
                type: 'text',
                text: finalText
              }
            ],
            metadata: {
              total_elements: totalElements,
              origins_count: distanceMatrix.origin_addresses.length,
              destinations_count: distanceMatrix.destination_addresses.length,
              mode: validated.mode,
              billing_info: '10,000 elements/month free tier',
              truncated: wasTruncated
            }
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${errorMessage}`
          }
        ],
        isError: true
      };
    }
  });

  return server;
}
