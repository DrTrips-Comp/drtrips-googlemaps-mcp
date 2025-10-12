# Google Platform MCP Server (TypeScript)

A Model Context Protocol (MCP) server that provides Google Places API and Google Maps Geocoding API functionality via stdio transport.

## Features

- **Geocode Address**: Convert addresses to coordinates using Google Maps Geocoding API
- **Get Place Details**: Retrieve detailed place information using Google Places API (New)
- **TypeScript**: Full type safety with Zod validation
- **npx-first**: Run the server directly with `npx drtrips-google-mcp`

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

**Example Input:**
```json
{
  "address": "1600 Amphitheatre Parkway, Mountain View, CA"
}
```

**Example Output:**
```json
[
  {
    "place_id": "ChIJ2eUgeAK6j4ARbn5u_wAGqWA",
    "address": "1600 Amphitheatre Parkway, Mountain View, CA 94043, USA",
    "latitude": 37.4224764,
    "longitude": -122.0842499
  }
]
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

**Example Input:**
```json
{
  "query": "Statue of Liberty"
}
```

**Example Output:**
```json
{
  "id": "ChIJPTacEpBQwokRKwIlDXelxkA",
  "displayName": "Statue of Liberty",
  "formattedAddress": "New York, NY 10004, United States",
  "location": {
    "latitude": 40.6892494,
    "longitude": -74.04450039999999
  },
  "types": [
    "tourist_attraction",
    "point_of_interest",
    "establishment"
  ],
  "googleMapsLinks": {
    "mapsUri": "https://maps.google.com/?cid=1275417193933034028",
    "directionsUri": "https://www.google.com/maps/dir/?api=1&destination=40.6892494,-74.04450039999999"
  }
}
```


## Usage

### Run with npx (recommended)

```bash
GOOGLE_MAPS_API_KEY=your_api_key_here 
```

### Configure with Claude Desktop

Add to your Claude Desktop config file:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

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

## API Usage and Pricing

This server uses:
- **Google Maps Geocoding API**: Free tier available
- **Google Places API (New)**: Pay-as-you-go pricing

Ensure you have these APIs enabled in your Google Cloud Console and monitor your usage.


## License

MIT
