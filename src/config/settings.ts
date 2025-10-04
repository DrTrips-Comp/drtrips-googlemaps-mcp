import dotenv from 'dotenv';

dotenv.config();

export const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

if (!GOOGLE_MAPS_API_KEY) {
  console.error('Warning: GOOGLE_MAPS_API_KEY not set');
}
