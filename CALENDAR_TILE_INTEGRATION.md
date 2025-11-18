# Calendar Tile Integration

## Overview

The `CalendarTile` component has been successfully integrated with the Polymarket API to display real events organized by their closing/expiration dates for the next 7 days.

## What Changed

### Previous Implementation
- Hardcoded placeholder event titles
- Randomly generated market data
- Static data with no real API connection
- Non-functional date picker

### New Implementation
- **Real-time Data**: Fetches actual Polymarket events from the API
- **Event-based Display**: Shows events (not individual markets) as these are the higher-level organizational units
- **Date Grouping**: Events are grouped by their `endDate` (close/expire/resolve date)
- **Dynamic Date Range**: Displays events for the selected date range (defaults to next 7 days)
- **Functional Date Picker**: Select any date range to filter events
- **Smart Truncation**: Event titles can span up to 2 lines with automatic ellipsis truncation using CSS

## Key Implementation Details

### Data Fetching
```typescript
const { events, isLoading, error } = useActiveEvents({
  limit: 500,
});
```

The component uses the `useActiveEvents` hook to fetch 500 active events. A higher limit is needed because many recurring short-term markets are filtered out (see below).

### Date Range State Management
```typescript
// State for selected date range (defaults to next 7 days)
const [dateRange, setDateRange] = useState<DateRange>(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(today.getDate() + 7);
  return { from: today, to: sevenDaysFromNow };
});

// Handler for date picker updates
const handleDateRangeUpdate = (values) => {
  if (values.range.from && values.range.to) {
    setDateRange({ from: values.range.from, to: values.range.to });
  }
};
```

### Filtering & Date Grouping Logic
```typescript
const eventsByDate = useMemo((): EventsByDate[] => {
  // 1. Creates a map of dates for the SELECTED date range
  // 2. Excludes repetitive recurring markets (crypto up/down)
  // 3. Filters events by their endDate within the range
  // 4. Groups remaining events under the appropriate date
  // 5. Returns array of dates with their events
}, [events, dateRange]); // Re-runs when date range changes
```

**Excluded Patterns:**
To keep the calendar focused on meaningful events, we filter out:
- Crypto "Up or Down" markets (e.g., "Bitcoin Up or Down - November 19, 2:15AM-2:30AM ET")
- Short-term recurring markets with timestamp slugs (patterns like `15m-1763536500`)

This ensures the calendar shows diverse, interesting content like:
- Political predictions
- Sports matches
- Economic forecasts
- Social events
- Major crypto milestones (not minute-by-minute fluctuations)

### Display Features

1. **Interactive Date Picker**: 
   - Click the calendar icon in top-right to select date range
   - Defaults to next 7 days from today
   - Updates event list immediately when range changes
   - Shows selected range in picker display
2. **Date Headers**: Each day shows the full date (e.g., "November 19, 2025") with a count of events closing that day
3. **Event Display**:
   - **Image thumbnail** (40x40px, rounded corners) on the left
   - **Event title** on the right with single-line truncation and ellipsis
   - Flex layout with proper alignment
4. **Loading States**: Shows "Loading events..." while fetching data
5. **Error Handling**: Displays error message if API call fails
6. **Empty States**: Shows "No events closing" for dates with no events

### Understanding Events vs Markets

According to the Polymarket Gamma structure:
- **Events** are the higher-level organizational unit containing one or more markets
- **Markets** are the individual tradeable items within an event

**Example:**
- **Event**: "Where will Barron Trump attend College?" (closes on a specific date)
  - Market: "Will Barron attend Georgetown?"
  - Market: "Will Barron attend NYU?"
  - Market: "Will Barron attend UPenn?"
  - Market: "Will Barron attend Harvard?"
  - Market: "Will Barron attend another college?"

For the calendar view, we display **events** because:
1. They represent the overall question/topic
2. They have a single close date for all contained markets
3. They provide better high-level organization
4. Users can drill down to specific markets if needed

### Event Types

The component will display both:
- **SMP (Single Market Event)**: Events containing only 1 market
- **GMP (Group Market Event)**: Events containing 2+ markets

Both types are treated the same in the calendar view since we're showing the event title, which represents the overall question.

## Example Output

```
November 20, 2025 (3)
├─ Will Mohammed bin Salman wear a suit and tie by Thursday?
├─ Trump to announce Treasury Secretary by Nov 20?
└─ ...

November 28, 2025 (5)
├─ Elon Musk # tweets November 21 - November 28, 2025?
├─ Will the Fed cut rates in December?
└─ ...

November 30, 2025 (8)
├─ Chelsea vs. Arsenal - More Markets
├─ Aston Villa vs. Wolves - More Markets
├─ AS Roma vs. SSC Napoli - More Markets
└─ ...

December 1, 2025 (4)
├─ Rayo Vallecano vs. Valencia
└─ ...
```

**Note:** Repetitive crypto "Up or Down" markets are automatically filtered out to show only diverse, meaningful events.

## Technical Stack

- **React Hook**: `useActiveEvents` from `@/lib/hooks/useEvents`
- **API Client**: Polymarket API via `info-api` backend proxy
- **State Management**: React `useMemo` for efficient event grouping
- **Styling**: CSS-in-JS with Tailwind classes and inline styles
- **Type Safety**: Full TypeScript types from `@/types/polymarket`

## Performance Considerations

1. **Memoization**: Event grouping and filtering logic is memoized to prevent unnecessary recalculations
2. **Efficient Filtering**: Events are filtered once during the grouping phase using regex patterns
3. **Smart Limits**: Fetches 500 events (enough to ensure 7 days of diverse content after filtering)
4. **Loading States**: Provides immediate feedback during data fetching
5. **Pattern Matching**: Uses optimized regex patterns for exclusion filtering

## Future Enhancements

Potential improvements that could be added:
1. Click-through to event details
2. Visual indicators for event categories (crypto, politics, sports)
3. Time remaining countdown
4. Market probability indicators
5. Refresh/reload functionality
6. Filter by category/tag
7. Sort by volume or popularity
8. Quick date range presets (Today, This Week, Next 30 Days, etc.)
9. Event count summary at the top

## Files Modified

- `/info-frontend/src/app/desktop/components/CalendarTile.tsx`
  - Added real API integration
  - Implemented date-based event grouping
  - Added loading and error states
  - Implemented 2-line truncation with ellipsis

## Dependencies

No new dependencies were added. The component uses existing:
- `@/lib/hooks/useEvents` - React hooks for event data
- `@/types/polymarket` - TypeScript types
- Existing UI components (DateRangePicker, CalendarIcon, Tile)

