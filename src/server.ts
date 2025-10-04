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
  type GeocodeResult,
  type DistanceMatrixResponse
} from './models/maps-models.js';
import { GooglePlacesAPI } from './services/google-places-api.js';

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
        name: 'geocode_address',
        description: 'Geocode an address to get coordinates and place information using Google Maps Geocoding API. Returns up to 3 results with place_id, formatted address, latitude, and longitude.',
        inputSchema: zodToJsonSchema(GeocodeInputSchema) as any
      },
      {
        name: 'get_place_details',
        description: 'Get detailed information about a place using either a place_id or a search query. Returns place details including name, address, location, types, and Google Maps links using the new Google Places API.',
        inputSchema: zodToJsonSchema(PlaceDetailsInputSchema) as any
      },
      {
        name: 'calculate_distance_matrix',
        description: 'Calculate travel distance and time between multiple origins and destinations using Google Distance Matrix API. Supports different travel modes (driving, walking, bicycling, transit) and returns distance and duration for each origin-destination pair.',
        inputSchema: zodToJsonSchema(DistanceMatrixInputSchema) as any
      }
    ]
  }));

  // Register tool execution
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'geocode_address': {
          const validated = GeocodeInputSchema.parse(args);
          const result = await placesApi.geocodeAddress(validated.address);

          if ('error' in result) {
            return {
              content: [
                {
                  type: 'text',
                  text: `❌ Geocoding Error\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${result.error}`
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
                  text: `📍 No Results Found\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nNo geocoding results found for: ${validated.address}`
                }
              ]
            };
          }

          let resultsText = `📍 GEOCODING RESULTS\n`;
          resultsText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
          resultsText += `Query: ${validated.address}\n`;
          resultsText += `Found ${results.length} result(s)\n\n`;

          results.forEach((item, index) => {
            resultsText += `${index + 1}. ${item.address}\n`;
            resultsText += `   📍 Coordinates: ${item.latitude}, ${item.longitude}\n`;
            resultsText += `   🆔 Place ID: ${item.place_id}\n\n`;
          });

          return {
            content: [
              {
                type: 'text',
                text: resultsText
              }
            ],
            metadata: {
              total_results: results.length,
              query: validated.address
            }
          };
        }

        case 'get_place_details': {
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
                  text: `❌ Place Details Error\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${result.error}`
                }
              ],
              isError: true
            };
          }

          const place = result.place_details;

          let detailsText = `🏢 PLACE DETAILS\n`;
          detailsText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
          detailsText += `Name: ${place.displayName || 'N/A'}\n`;
          detailsText += `Address: ${place.formattedAddress}\n`;
          detailsText += `📍 Location: ${place.location.latitude}, ${place.location.longitude}\n`;
          detailsText += `🆔 Place ID: ${place.id}\n`;

          if (place.types && place.types.length > 0) {
            detailsText += `🏷️  Types: ${place.types.join(', ')}\n`;
          }

          if (place.googleMapsLinks?.mapsUri) {
            detailsText += `🔗 Google Maps: ${place.googleMapsLinks.mapsUri}\n`;
          }

          return {
            content: [
              {
                type: 'text',
                text: detailsText
              }
            ],
            metadata: {
              place_id: place.id,
              location: place.location,
              query: validated.query || validated.place_id
            }
          };
        }

        case 'calculate_distance_matrix': {
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
                  text: `❌ Distance Matrix Error\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${result.error}`
                }
              ],
              isError: true
            };
          }

          const distanceMatrix = result as DistanceMatrixResponse;

          let matrixText = `📏 DISTANCE MATRIX\n`;
          matrixText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
          matrixText += `Mode: ${validated.mode}\n\n`;

          // Calculate total elements for billing info
          const totalElements = distanceMatrix.origin_addresses.length * distanceMatrix.destination_addresses.length;

          // Display matrix results
          distanceMatrix.rows.forEach((row, originIndex) => {
            const origin = distanceMatrix.origin_addresses[originIndex];
            matrixText += `📍 Origin: ${origin}\n\n`;

            row.elements.forEach((element, destIndex) => {
              const destination = distanceMatrix.destination_addresses[destIndex];
              matrixText += `  → Destination: ${destination}\n`;

              if (element.status === 'OK') {
                if (element.distance) {
                  matrixText += `     📏 Distance: ${element.distance.text} (${element.distance.value}m)\n`;
                }
                if (element.duration) {
                  matrixText += `     ⏱️  Duration: ${element.duration.text} (${element.duration.value}s)\n`;
                }
              } else {
                matrixText += `     ❌ Status: ${element.status}\n`;
              }
              matrixText += `\n`;
            });
          });

          matrixText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
          matrixText += `Total elements: ${totalElements}\n`;
          matrixText += `💡 Billing: 10,000 elements/month free tier (Essentials)`;

          return {
            content: [
              {
                type: 'text',
                text: matrixText
              }
            ],
            metadata: {
              total_elements: totalElements,
              origins_count: distanceMatrix.origin_addresses.length,
              destinations_count: distanceMatrix.destination_addresses.length,
              mode: validated.mode,
              billing_info: '10,000 elements/month free tier (Essentials)'
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
            text: `❌ Error: ${errorMessage}`
          }
        ],
        isError: true
      };
    }
  });

  return server;
}
