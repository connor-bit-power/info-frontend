# Polymarket API Integration Documentation

Complete modular integration of the info-api backend with the info-frontend Next.js application.

## 📁 File Structure

```
src/
├── types/
│   └── polymarket.ts          # Complete TypeScript types for all API responses
├── lib/
│   ├── api/
│   │   ├── client.ts          # Base HTTP client with error handling
│   │   ├── config.ts          # API configuration and endpoints
│   │   ├── index.ts           # Unified API export
│   │   └── services/
│   │       ├── markets.ts     # Markets service
│   │       ├── events.ts      # Events service (RECOMMENDED)
│   │       ├── tags.ts        # Tags service
│   │       ├── sports.ts      # Sports service
│   │       └── search.ts      # Search service
│   └── hooks/
│       ├── index.ts           # Hooks export
│       ├── useMarkets.ts      # Market hooks
│       └── useEvents.ts       # Event hooks
└── app/
    └── api-test/
        └── page.tsx           # Test page demonstrating integration
```

## 🚀 Quick Start

### 1. Configure Environment

Create `.env.local` file:

```bash
cp .env.local.example .env.local
```

Update the API URL if needed (default is `http://localhost:3001`):

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 2. Start the Backend API

```bash
cd ../info-api
yarn dev
```

The API should be running at `http://localhost:3001`

### 3. Start the Frontend

```bash
yarn dev
```

### 4. Test the Integration

Visit `http://localhost:3000/api-test` to see the API integration in action.

## 💻 Usage Examples

### Direct API Calls

```typescript
import { polymarketApi } from '@/lib/api';

// Get markets
const markets = await polymarketApi.markets.getMarkets({ 
  limit: 20, 
  closed: false 
});

// Get specific market by slug (RECOMMENDED)
const market = await polymarketApi.markets.getMarketBySlug('presidential-election-2024');

// Get active events (RECOMMENDED for fetching markets)
const events = await polymarketApi.events.getActiveEvents({ limit: 50 });

// Get trending events
const trending = await polymarketApi.events.getTrendingEvents(20);

// Search
const results = await polymarketApi.search.quickSearch('bitcoin');

// Get sports metadata
const sports = await polymarketApi.sports.getSportsMetadata();

// Get teams
const teams = await polymarketApi.sports.getTeamsByLeague('NBA');
```

### Using React Hooks (Client Components)

```typescript
'use client';

import { useActiveEvents, useMarketBySlug, useTrendingEvents } from '@/lib/hooks';

function MyComponent() {
  // Fetch active events (auto-fetches on mount)
  const { events, isLoading, error, refetch } = useActiveEvents({ limit: 20 });

  // Fetch specific market by slug
  const { market } = useMarketBySlug('presidential-election-2024');

  // Fetch trending events with auto-refresh
  const { events: trending } = useTrendingEvents(10, { 
    refetchInterval: 60000 // Refresh every minute
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {events.map(event => (
        <div key={event.id}>
          <h2>{event.title}</h2>
          <p>{event.description}</p>
          {event.markets?.map(market => (
            <div key={market.id}>{market.question}</div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

## 📚 API Services

### Markets Service

```typescript
import { polymarketApi } from '@/lib/api';

// List markets with filtering
const markets = await polymarketApi.markets.getMarkets({
  limit: 10,
  offset: 0,
  closed: false,
  tag_id: 100381, // Filter by tag
  order: 'volume24hr',
  ascending: false
});

// Get market by ID
const market = await polymarketApi.markets.getMarketById('12345');

// Get market by slug (RECOMMENDED)
const market = await polymarketApi.markets.getMarketBySlug('presidential-election-2024');

// Get markets by tag
const sportsMarkets = await polymarketApi.markets.getMarketsByTag(100381);

// Get active markets only
const active = await polymarketApi.markets.getActiveMarkets({ limit: 50 });

// Get top volume markets
const topMarkets = await polymarketApi.markets.getTopVolumeMarkets(20);
```

### Events Service (RECOMMENDED)

Events contain markets - this is the most efficient way to fetch market data.

```typescript
import { polymarketApi } from '@/lib/api';

// Get active events (RECOMMENDED)
const events = await polymarketApi.events.getActiveEvents({ limit: 50 });

// Get event by slug (RECOMMENDED)
const event = await polymarketApi.events.getEventBySlug('2024-presidential-election');

// Get events by category
const politicsEvents = await polymarketApi.events.getEventsByCategory(100381);

// Get trending events
const trending = await polymarketApi.events.getTrendingEvents(20);

// Get featured events
const featured = await polymarketApi.events.getFeaturedEvents();
```

### Sports Service

```typescript
import { polymarketApi } from '@/lib/api';

// Get sports metadata (includes tag IDs)
const sports = await polymarketApi.sports.getSportsMetadata();

// Get specific sport
const nba = await polymarketApi.sports.getSportByCode('nba');

// Get tag IDs for filtering
const nbaTags = await polymarketApi.sports.getTagsForSport('nba');

// Get teams
const teams = await polymarketApi.sports.getTeams({ limit: 50 });

// Get teams by league
const nbaTeams = await polymarketApi.sports.getTeamsByLeague('NBA');

// Get team by name
const lakers = await polymarketApi.sports.getTeamByName('Lakers');
```

### Tags Service

```typescript
import { polymarketApi } from '@/lib/api';

// Get all tags
const tags = await polymarketApi.tags.getTags({ limit: 100 });

// Get tag by slug
const tag = await polymarketApi.tags.getTagBySlug('politics');

// Get related tags
const related = await polymarketApi.tags.getRelatedTagObjectsBySlug('politics');

// Get carousel tags
const carousel = await polymarketApi.tags.getCarouselTags();
```

### Search Service

```typescript
import { polymarketApi } from '@/lib/api';

// Quick search
const results = await polymarketApi.search.quickSearch('bitcoin', 10);

// Search with options
const results = await polymarketApi.search.search({
  q: 'election',
  limit_per_type: 20,
  search_tags: true,
  search_profiles: false
});

// Search within category
const results = await polymarketApi.search.searchInCategory('trump', 'politics');
```

## 🎣 React Hooks

### Market Hooks

```typescript
import { 
  useMarkets, 
  useMarket, 
  useMarketBySlug, 
  useActiveMarkets,
  useTopVolumeMarkets 
} from '@/lib/hooks';

// Fetch markets list
const { markets, isLoading, error, refetch } = useMarkets({ 
  limit: 20,
  closed: false 
});

// Fetch specific market
const { market } = useMarket('12345');

// Fetch market by slug (RECOMMENDED)
const { market } = useMarketBySlug('presidential-election-2024');

// Fetch active markets only
const { markets } = useActiveMarkets({ limit: 50 });

// Fetch top volume markets
const { markets } = useTopVolumeMarkets(20);
```

### Event Hooks (RECOMMENDED)

```typescript
import { 
  useEvents, 
  useEvent, 
  useEventBySlug,
  useActiveEvents,
  useTrendingEvents,
  useEventsByCategory
} from '@/lib/hooks';

// Fetch events list
const { events, isLoading, error, refetch } = useEvents({ 
  limit: 20,
  closed: false 
});

// Fetch specific event
const { event } = useEvent('12345');

// Fetch event by slug (RECOMMENDED)
const { event } = useEventBySlug('2024-presidential-election');

// Fetch active events (most efficient)
const { events } = useActiveEvents({ limit: 50 });

// Fetch trending events
const { events } = useTrendingEvents(20);

// Fetch events by category
const { events } = useEventsByCategory(100381);
```

### Hook Options

All hooks support these options:

```typescript
{
  enabled?: boolean;        // Enable/disable auto-fetching (default: true)
  refetchInterval?: number; // Auto-refetch interval in ms (optional)
}
```

Example with options:

```typescript
const { markets, refetch } = useMarkets({
  limit: 20,
  closed: false,
  enabled: true,           // Auto-fetch on mount
  refetchInterval: 60000   // Refresh every minute
});
```

## 🔧 Advanced Configuration

### Custom API Base URL

Update `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

### Custom Timeout

Modify `src/lib/api/config.ts`:

```typescript
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 30000, // Change timeout here
  // ...
};
```

## 🎯 Best Practices

1. **Use Events over Markets**: The `/events` endpoint is more efficient as events contain markets
2. **Use Slugs**: When fetching specific resources, use slugs instead of IDs
3. **Enable Caching**: Use `refetchInterval` for auto-refreshing data
4. **Error Handling**: Always handle errors in your components
5. **Loading States**: Use `isLoading` to show loading indicators

## 🐛 Troubleshooting

### API Connection Issues

1. Ensure the backend API is running at `http://localhost:3001`
2. Check `.env.local` file exists and has correct URL
3. Verify CORS is enabled in the backend

### TypeScript Errors

1. Ensure all types are imported from `@/types/polymarket`
2. Run `yarn build` to check for type errors

### Hook Not Updating

1. Check that `enabled` is not set to `false`
2. Verify dependencies in the hook are correct
3. Use `refetch()` to manually trigger updates

## 📝 Notes

- All API calls are type-safe with full TypeScript support
- Error handling is built into the client
- Hooks automatically handle loading and error states
- No existing frontend components were modified
- Integration is modular and can be imported where needed

## 🔗 API Documentation

Backend API: `http://localhost:3001/`
Test Page: `http://localhost:3000/api-test`





