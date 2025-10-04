# Google Places MCP Server (TypeScript)

A Model Context Protocol (MCP) server that provides Google Places API and Google Maps Geocoding API functionality via stdio transport.

## Features

- **Geocode Address**: Convert addresses to coordinates using Google Maps Geocoding API
- **Get Place Details**: Retrieve detailed place information using Google Places API (New)
- **TypeScript**: Full type safety with Zod validation
- **NPX Ready**: Can be run directly via npx or node

## Tools Available

### 1. `geocode_address`

Geocode an address to get coordinates and place information.

**Input:**
- `address` (string, required): Address to geocode

**Output:**
- Up to 3 geocoding results with:
  - `place_id`: Google Place ID
  - `address`: Formatted address
  - `latitude`: Latitude coordinate
  - `longitude`: Longitude coordinate

**Example:**
```json
{
  "address": "1600 Amphitheatre Parkway, Mountain View, CA"
}
```

### 2. `get_place_details`

Get detailed information about a place using either a place_id or a search query.

**Input:**
- `place_id` (string, optional): Google Place ID
- `query` (string, optional): Search query for the place

**Note:** Either `place_id` OR `query` must be provided.

**Output:**
- Place details including:
  - `id`: Place ID
  - `displayName`: Place name
  - `formattedAddress`: Full address
  - `location`: Coordinates (latitude, longitude)
  - `types`: Place types (e.g., restaurant, cafe)
  - `googleMapsLinks`: Google Maps and Directions URLs

**Example:**
```json
{
  "query": "Statue of Liberty"
}
```

## Installation

### Prerequisites

- Node.js v18+ and npm
- Google Maps API Key with the following APIs enabled:
  - Geocoding API
  - Places API (New)

### Setup

1. **Clone or navigate to the project:**
```bash
cd google_place_api_mcp
```

2. **Install dependencies:**
```bash
npm install
```

3. **Build the project:**
```bash
npm run build
```

4. **Set up environment variables:**

Create a `.env` file in the project root:
```bash
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

## Usage

### Run Locally

```bash
# Using npm script
npm start

# Using node directly
node dist/index.js

# Development mode (with auto-reload)
npm run dev
```

### Configure with Claude Desktop

Add to your Claude Desktop config file:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "google-places": {
      "command": "node",
      "args": ["D:/path/to/google_place_api_mcp/dist/index.js"],
      "env": {
        "GOOGLE_MAPS_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

Or if published to npm:

```json
{
  "mcpServers": {
    "google-places": {
      "command": "npx",
      "args": ["-y", "drtrips-google-mcp"],
      "env": {
        "GOOGLE_MAPS_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Development

### Scripts

```bash
# Build the project
npm run build

# Watch mode (rebuild on changes)
npm run watch

# Development mode with tsx
npm run dev

# Run the built server
npm start
```

### Project Structure

```
google_place_api_mcp/
├── src/
│   ├── config/
│   │   └── settings.ts          # Environment configuration
│   ├── models/
│   │   └── maps-models.ts       # Zod schemas and TypeScript types
│   ├── services/
│   │   └── google-places-api.ts # Google API client
│   ├── server.ts                # MCP server setup
│   └── index.ts                 # Stdio entry point
├── dist/                        # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── .env                         # Environment variables (create this)
```

## Migration from Python

This server was migrated from a Python-based MCP server to TypeScript. Key changes:

- **Pydantic → Zod**: Input validation using Zod schemas
- **aiohttp → axios**: HTTP client for API requests
- **Python MCP SDK → TypeScript MCP SDK**: Server implementation
- **stdio transport**: Compatible with Claude Desktop and other MCP clients

For detailed migration steps, see `docs/MIGRATION_GUIDE_PYTHON_TO_TYPESCRIPT.md`

## API Usage and Pricing

This server uses:
- **Google Maps Geocoding API**: Free tier available
- **Google Places API (New)**: Pay-as-you-go pricing

Ensure you have these APIs enabled in your Google Cloud Console and monitor your usage.

## Troubleshooting

### API Key Not Set

```
ERROR: GOOGLE_MAPS_API_KEY environment variable is not set
```

**Solution**: Create a `.env` file with your API key or set it in your environment.

### Module Resolution Errors

Ensure all imports include `.js` extensions:
```typescript
import { something } from './file.js';  // ✅ Correct
import { something } from './file';      // ❌ Wrong
```

### Build Errors

```bash
# Clean build
rm -rf dist/
npm run build
```

## License

MIT
# drtrips-googlemaps-mcp
