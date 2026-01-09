/**
 * API Configuration
 * 
 * Centralizes API base URL configuration for the entire application.
 * Uses Vite's environment variable system.
 * 
 * Local Development: Uses VITE_API_URL from .env file (defaults to http://localhost:5000)
 * Production (Vercel): Uses VITE_API_URL from Vercel environment variables
 */

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default API;
