# DrTrips Google Maps MCP Server

A production-ready Model Context Protocol (MCP) server providing comprehensive Google Maps API integration with geocoding, place search, place details, and distance matrix capabilities.

[![npm version](https://img.shields.io/npm/v/drtrips-google-mcp.svg)](https://www.npmjs.com/package/drtrips-google-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

## Features

- 🌍 **Geocoding**: Convert addresses to coordinates with Google Maps Geocoding API
- 🏢 **Place Details**: Retrieve comprehensive place information using Google Places API (New)
- 📏 **Distance Matrix**: Calculate travel distance and time between multiple locations
- 🔄 **Multiple Response Formats**: JSON for programmatic use, Markdown for human readability
- ✅ **Type-Safe**: Full TypeScript implementation with Zod validation
- 🎯 **MCP Compliant**: Follows all Model Context Protocol best practices
- 🚀 **npx-Ready**: Run directly with `npx drtrips-google-mcp`

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Available Tools](#available-tools)
  - [google_maps_geocode_address](#1-google_maps_geocode_address)
  - [google_maps_get_place_details](#2-google_maps_get_place_details)
  - [google_maps_calculate_distance_matrix](#3-google_maps_calculate_distance_matrix)
- [Response Formats](#response-formats)
- [Tool Annotations](#tool-annotations)
- [Error Handling](#error-handling)
- [API Usage and Pricing](#api-usage-and-pricing)
- [Development](#development)
- [License](#license)

## Installation

### Using npx (Recommended)

```bash
npx drtrips-google-mcp
```

### Using npm

```bash
npm install -g drtrips-google-mcp
```

### From Source

```bash
git clone https://github.com/DrTrips-Comp/drtrips-googlemaps-mcp.git
cd drtrips-googlemaps-mcp
npm install
npm run build
```

## Quick Start

### 1. Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Geocoding API
   - Places API (New)
   - Distance Matrix API
4. Create an API key in "Credentials"
5. (Optional) Restrict the API key to specific APIs for security

### 2. Configure with Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "google-maps": {
      "command": "npx",
      "args": ["-y", "drtrips-google-mcp"],
      "env": {
        "GOOGLE_MAPS_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### 3. Restart Claude Desktop

The tools will be available in your next conversation.

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_MAPS_API_KEY` | Yes | Your Google Maps API key with required APIs enabled |

### Response Format Options

All tools support two response formats:

- `markdown` (default): Human-readable formatted text
- `json`: Structured data for programmatic processing

## Available Tools

### 1. `google_maps_geocode_address`

Convert human-readable addresses to geographic coordinates (latitude/longitude) and Google Place IDs.

**Tool Annotations:**
```typescript
{
  readOnlyHint: true,      // Does not modify environment
  destructiveHint: false,  // Non-destructive operation
  idempotentHint: true,    // Same input produces same output
  openWorldHint: true      // Interacts with external Google API
}
```

#### Input Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | string | Yes | - | Full or partial address to geocode (max 500 chars) |
| `response_format` | enum | No | `markdown` | Output format: `"json"` or `"markdown"` |

#### Examples

**Use Cases:**
- ✅ "Find coordinates for Eiffel Tower"
- ✅ "Get lat/lng for 123 Main St, NYC"
- ✅ "Geocode Tokyo Station"
- ❌ Converting coordinates to address (use reverse geocoding instead)
- ❌ Getting detailed place information (use `google_maps_get_place_details`)

#### JSON Response Format

```json
[
  {
    "place_id": "ChIJLU7jZClu5kcR4PcOOO6p3I0",
    "address": "Av. Gustave Eiffel, 75007 Paris, France",
    "latitude": 48.8584,
    "longitude": 2.2945
  }
]
```

**Response Metadata:**
```json
{
  "total_results": 1,
  "query": "Eiffel Tower",
  "truncated": false
}
```

#### Markdown Response Format

```markdown
# Geocoding Results

Query: Eiffel Tower
Results: 1

## Result 1
- **Address**: Av. Gustave Eiffel, 75007 Paris, France
- **Coordinates**: 48.8584, 2.2945
- **Place ID**: ChIJLU7jZClu5kcR4PcOOO6p3I0
```

---

### 2. `google_maps_get_place_details`

Retrieve comprehensive information about a place including name, address, coordinates, types, and Google Maps links.

**Tool Annotations:**
```typescript
{
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true
}
```

#### Input Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `place_id` | string | No* | - | Google Place ID for precise lookup |
| `query` | string | No* | - | Search query for text-based search |
| `response_format` | enum | No | `markdown` | Output format: `"json"` or `"markdown"` |

*Note: Either `place_id` OR `query` must be provided (not both).*

#### Examples

**Use Cases:**
- ✅ "Get details for Statue of Liberty"
- ✅ "Find info about place ChIJN1t..."
- ✅ "What's at this place ID?"
- ❌ Just need coordinates (use `google_maps_geocode_address`)
- ❌ Need distance/directions (use `google_maps_calculate_distance_matrix`)

#### JSON Response Format

```json
{
  "id": "ChIJPTacEpBQwokRKwIlDXelxkA",
  "displayName": "Statue of Liberty",
  "formattedAddress": "New York, NY 10004, USA",
  "location": {
    "latitude": 40.6892494,
    "longitude": -74.04450039999999
  },
  "types": [
    "historical_landmark",
    "tourist_attraction",
    "monument",
    "point_of_interest",
    "establishment"
  ],
  "googleMapsLinks": {
    "mapsUri": "https://maps.google.com/?cid=1275417193933034028",
    "directionsUri": "https://www.google.com/maps/dir/?api=1&destination=40.6892494,-74.04450039999999"
  }
}
```

**Response Metadata:**
```json
{
  "place_id": "ChIJPTacEpBQwokRKwIlDXelxkA",
  "location": {
    "latitude": 40.6892494,
    "longitude": -74.04450039999999
  },
  "query": "Statue of Liberty",
  "truncated": false
}
```

#### Markdown Response Format

```markdown
# Place Details

**Name**: Statue of Liberty
**Address**: New York, NY 10004, USA
**Location**: 40.6892494, -74.04450039999999
**Place ID**: ChIJPTacEpBQwokRKwIlDXelxkA
**Types**: historical_landmark, tourist_attraction, monument, point_of_interest, establishment
**Google Maps**: https://maps.google.com/?cid=1275417193933034028
**Directions**: https://www.google.com/maps/dir/?api=1&destination=40.6892494,-74.04450039999999
```

---

### 3. `google_maps_calculate_distance_matrix`

Calculate travel distance and duration between multiple origins and destinations with support for various travel modes.

**Tool Annotations:**
```typescript
{
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true
}
```

#### Input Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `origins` | string[] | Yes | - | Array of origin addresses or coordinates (max 10) |
| `destinations` | string[] | Yes | - | Array of destination addresses or coordinates (max 10) |
| `mode` | enum | No | `driving` | Travel mode: `"driving"`, `"walking"`, `"bicycling"`, `"transit"` |
| `response_format` | enum | No | `markdown` | Output format: `"json"` or `"markdown"` |

#### Examples

**Use Cases:**
- ✅ "How far from Times Square to Central Park?"
- ✅ "Walking distance from A to B and C"
- ✅ "Transit time between these 3 locations"
- ❌ Just need coordinates (use `google_maps_geocode_address`)
- ❌ Need place details (use `google_maps_get_place_details`)

#### JSON Response Format

```json
{
  "origin_addresses": [
    "Manhattan, NY 10036, USA"
  ],
  "destination_addresses": [
    "Central Park, New York, NY, USA"
  ],
  "rows": [
    {
      "elements": [
        {
          "status": "OK",
          "distance": {
            "text": "1.0 km",
            "value": 1000
          },
          "duration": {
            "text": "14 mins",
            "value": 840
          }
        }
      ]
    }
  ],
  "metadata": {
    "total_elements": 1,
    "origins_count": 1,
    "destinations_count": 1,
    "mode": "walking",
    "billing_note": "10,000 elements/month free tier"
  }
}
```

**Response Metadata:**
```json
{
  "total_elements": 1,
  "origins_count": 1,
  "destinations_count": 1,
  "mode": "walking",
  "billing_info": "10,000 elements/month free tier",
  "truncated": false
}
```

#### Markdown Response Format

```markdown
# Distance Matrix Results

**Travel Mode**: walking
**Total Elements**: 1 (origins × destinations)

## Origin: Manhattan, NY 10036, USA

### → Central Park, New York, NY, USA
- **Distance**: 1.0 km (1000 meters)
- **Duration**: 14 mins (840 seconds)

---
**Billing Note**: 10,000 elements/month free tier (Essentials plan)
```

## Response Formats

### JSON Format

Optimized for programmatic processing:
- Complete structured data
- All available fields included
- Consistent field names and types
- Machine-readable format

**Use when:**
- Processing results programmatically
- Storing data in databases
- Passing to other APIs
- Need precise field access

### Markdown Format

Optimized for human readability:
- Clean formatting with headers
- Readable timestamps and units
- Organized information hierarchy
- No verbose metadata

**Use when:**
- Presenting to end users
- Displaying in chat interfaces
- Creating reports
- Human review needed

## Tool Annotations

All tools include MCP annotations to help clients understand their behavior:

| Annotation | Value | Meaning |
|------------|-------|---------|
| `readOnlyHint` | `true` | Tool does not modify its environment |
| `destructiveHint` | `false` | Tool does not perform destructive updates |
| `idempotentHint` | `true` | Repeated calls with same arguments produce same result |
| `openWorldHint` | `true` | Tool interacts with external Google Maps API |

**Note:** Annotations are hints and should not be relied upon for security decisions.

## Error Handling

The server provides actionable, context-specific error messages:

### Common Errors

**403 - Access Denied**
```
Access denied. Please check your Google Maps API key has [API Name] enabled in Google Cloud Console.
```
**Action:** Enable the required API in Google Cloud Console

**429 - Rate Limit Exceeded**
```
Rate limit exceeded. Please wait a moment before making more requests.
```
**Action:** Wait before retrying; consider implementing rate limiting

**400 - Invalid Request**
```
Invalid request. Please check that [parameter] format is correct.
```
**Action:** Verify input parameters match expected format

**Timeout**
```
Request timed out. Please try again [with specific suggestion].
```
**Action:** Retry with simpler query or fewer locations

### Empty Results

When no results are found, the server returns an empty array with appropriate messaging:
```json
{
  "content": [{
    "type": "text",
    "text": "No results found for: [query]"
  }]
}
```

## Character Limits

To prevent overwhelming responses:

- **Maximum response size**: 25,000 characters
- **Automatic truncation**: Responses exceeding limit are truncated with guidance
- **Truncation message**: Includes original length and suggestions

Example truncation message:
```
[Response truncated: exceeded 25000 character limit.
Original length: 35000 characters.
Try using response_format="json" for more compact output.]
```

**Metadata includes:**
```json
{
  "truncated": true
}
```

## API Usage and Pricing

This server uses the following Google Maps APIs:

### Geocoding API
- **Free Tier**: Up to $200/month in credits
- **Pricing**: $5 per 1,000 requests (after free tier)
- [Pricing Details](https://developers.google.com/maps/documentation/geocoding/usage-and-billing)

### Places API (New)
- **Free Tier**: Up to $200/month in credits
- **Pricing**: Varies by field requested
- [Pricing Details](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing)

### Distance Matrix API
- **Free Tier**: 10,000 elements/month (Essentials plan)
- **Pricing**: $5-10 per 1,000 elements (varies by plan)
- **Note**: Elements = origins × destinations
- [Pricing Details](https://developers.google.com/maps/documentation/distance-matrix/usage-and-billing)

### Best Practices

1. **Monitor Usage**: Check Google Cloud Console regularly
2. **Set Quotas**: Configure quota limits to prevent unexpected charges
3. **Restrict API Keys**: Limit API keys to specific APIs and domains
4. **Cache Results**: Cache geocoding results to reduce API calls
5. **Use Limits**: Respect the max 10 origins/destinations limit

## Development

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Google Maps API key

### Setup

```bash
# Clone repository
git clone https://github.com/DrTrips-Comp/drtrips-googlemaps-mcp.git
cd drtrips-googlemaps-mcp

# Install dependencies
npm install

# Create .env file
echo "GOOGLE_MAPS_API_KEY=your_api_key_here" > .env

# Build
npm run build

# Run server
npm start
```

### Project Structure

```
drtrips-googlemaps-mcp/
├── src/
│   ├── index.ts              # Main entry point
│   ├── server.ts             # MCP server setup and tool registration
│   ├── config/
│   │   └── settings.ts       # Configuration and constants
│   ├── models/
│   │   └── maps-models.ts    # TypeScript types and Zod schemas
│   └── services/
│       └── google-places-api.ts  # Google Maps API client
├── dist/                     # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
├── server.json              # MCP server metadata
└── README.md
```

### Scripts

```bash
npm run build        # Compile TypeScript to JavaScript
npm run watch        # Watch mode for development
npm start            # Run the compiled server
npm run dev          # Development mode with auto-reload
```

### Testing

```bash
# Build first
npm run build

# Server will wait for stdio input (normal behavior)
npm start
```

The server is designed to run as a long-running process, waiting for MCP protocol messages via stdin.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/DrTrips-Comp/drtrips-googlemaps-mcp/issues)
- **Documentation**: [MCP Documentation](https://modelcontextprotocol.io)
- **Google Maps API**: [Google Maps Platform Documentation](https://developers.google.com/maps)

## Acknowledgments

- Built with [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk)
- Powered by [Google Maps Platform](https://developers.google.com/maps)
- TypeScript validation by [Zod](https://zod.dev/)

---

**Made with ❤️ by DrTrips**
