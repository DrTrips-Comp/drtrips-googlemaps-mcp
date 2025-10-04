#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from './server.js';
import { GOOGLE_MAPS_API_KEY } from './config/settings.js';

/**
 * Main entry point for stdio-based MCP server
 * Can be run via npx or directly with node
 */
async function runServer() {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('ERROR: GOOGLE_MAPS_API_KEY environment variable is not set');
      console.error('Please set it in your .env file or environment variables');
      process.exit(1);
    }

    // Create the MCP server
    const server = createMcpServer(GOOGLE_MAPS_API_KEY);

    // Create stdio transport
    const transport = new StdioServerTransport();

    // Connect server to transport
    await server.connect(transport);

    console.error('Google Places MCP Server running on stdio');
    console.error('API Key configured: Yes');
  } catch (error) {
    console.error('Fatal error running server:', error);
    process.exit(1);
  }
}

// Start the server
runServer().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
