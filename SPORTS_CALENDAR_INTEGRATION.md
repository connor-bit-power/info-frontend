# Sports Calendar Integration

## Overview
Updated the Calendar component to properly display sports games with team names and logos, showing them on the day they're played rather than the settle date.

## Changes Made

### 1. New Sports Hook (`src/lib/hooks/useSports.ts`)
Created a new custom hook for fetching sports data:
- `useSportsMetadata()` - Fetches sports configuration and metadata
- `useTeams()` - Fetches teams data with helper function `getTeamById()`

### 2. Updated Calendar Component (`src/components/Calendar.tsx`)

Main calendar component with month view display.

### 3. Updated CalendarTile Component (`src/app/desktop/components/CalendarTile.tsx`)

Desktop tile version with list and date range picker.

#### Key Features Added:
- **Sports Detection**: Identifies sports events by checking for `gameStartTime` and team IDs (`teamAID`, `teamBID`)
- **Smart Date Display**: 
  - Sports events: Shows on `gameStartTime` (when the game is played)
  - Regular events: Shows on `endDate` (when the market settles)
- **Team Information Display**:
  - Shows team abbreviations/names (e.g., "LAL vs BOS")
  - Displays team logos as small icons above the event text
- **Visual Differentiation**:
  - Sports events: Green background (`rgba(34, 197, 94, 0.3)`)
  - Regular events: Blue background (`rgba(46, 92, 255, 0.3)`)

#### Helper Functions:
- `isSportsEvent(event)` - Checks if an event is a sports game
- `getEventDisplayDate(event)` - Returns the appropriate display date (gameStartTime or endDate)
- `getTeamsForEvent(event)` - Retrieves team data for sports events
- `getEventDisplayText(event)` - Formats event text (team names for sports, title for others)

### 3. Updated Hooks Index (`src/lib/hooks/index.ts`)
- Exported new sports hooks
- Added TypeScript types for sports hooks

## API Integration

### Endpoints Used:
- `/api/events` - Fetches all active events (limit: 500)
- `/api/teams` - Fetches team data (limit: 1000)

### Data Flow:
```
Calendar Component
├── useActiveEvents() → Fetches events with markets
├── useTeams() → Fetches team metadata
└── Matches team IDs from markets to team data
```

## Event Types Handled

### Sports Events:
- Must have `market.gameStartTime`
- Must have `market.teamAID` or `market.teamBID`
- Displayed on game day
- Green colored
- Shows team logos and "Team A vs Team B" format

### Regular Events:
- All other events
- Displayed on settle date (`endDate`)
- Blue colored
- Shows event title

## Visual Design

### Sports Event Card:
```
┌─────────────────┐
│ 🏀 🏀          │ ← Team logos (if available)
│ LAL vs BOS     │ ← Team abbreviations
└─────────────────┘
```

### Regular Event Card:
```
┌─────────────────┐
│ Will Bitcoin   │
│ hit $100k?     │
└─────────────────┘
```

## Benefits

1. **User-Friendly**: Shows sports games when they're actually happening
2. **Visual Clarity**: Team logos and colors help identify sports quickly
3. **Accurate Information**: Uses team abbreviations for cleaner display
4. **Mixed Content**: Seamlessly displays both sports and prediction markets

## Technical Notes

- Teams are fetched once on component mount
- Team lookup is memoized via `getTeamById()` helper
- Handles missing team data gracefully (falls back to "Team A"/"Team B")
- Maintains existing event filtering (excludes crypto up/down markets)
- Compatible with existing calendar animation and interaction logic

