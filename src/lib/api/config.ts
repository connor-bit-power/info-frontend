/**
 * API Configuration
 * Central configuration for the Polymarket API client
 */

export const API_CONFIG = {
  // Base URL for the info-api backend
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://info-api-kyfw.onrender.com',
  
  // Default timeout for requests (in milliseconds)
  timeout: 30000,
  
  // Default headers
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Retry configuration
  retry: {
    attempts: 3,
    delay: 1000, // milliseconds
    backoff: 2, // exponential backoff multiplier
  },
  
  // Cache configuration (for client-side caching)
  cache: {
    ttl: 60000, // 1 minute default TTL
    enabled: true,
  },
} as const;

export const API_ENDPOINTS = {
  // Health
  health: '/health',
  
  // Search
  search: '/api/search',
  
  // Events
  events: '/api/events',
  eventBySlug: (slug: string) => `/api/events/slug/${slug}`,
  eventById: (id: string) => `/api/events/${id}`,
  
  // Markets
  markets: '/api/markets',
  marketBySlug: (slug: string) => `/api/markets/slug/${slug}`,
  marketById: (id: string) => `/api/markets/${id}`,
  
  // Sports
  sports: '/api/sports',
  teams: '/api/teams',
  
  // Tags
  tags: '/api/tags',
  tagById: (id: string) => `/api/tags/${id}`,
  tagBySlug: (slug: string) => `/api/tags/slug/${slug}`,
  relatedTagsById: (id: string) => `/api/tags/${id}/related-tags`,
  relatedTagsBySlug: (slug: string) => `/api/tags/slug/${slug}/related-tags`,
  relatedTagObjectsById: (id: string) => `/api/tags/${id}/related-tags/tags`,
  relatedTagObjectsBySlug: (slug: string) => `/api/tags/slug/${slug}/related-tags/tags`,

  // News & Headlines (New API)
  headlines: '/headlines',
  market: '/market',
} as const;





