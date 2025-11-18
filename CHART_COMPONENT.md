# Chart Component Documentation

## Overview

The `Chart` component displays historical market odds data using [MUI X Charts LineChart](https://mui.com/x/react-charts/lines/). It's specifically designed to work with Polymarket's CLOB API price history data format.

## Component Location

- **Chart Component**: `/src/components/Chart.tsx`
- **Demo Page**: `/src/app/chart/page.tsx`
- **Demo URL**: `http://localhost:3000/chart`

## Features

✅ **Direct API Integration**: Consumes CLOB API data format directly (no transformation needed)  
✅ **Time-based X-Axis**: Automatically converts Unix timestamps to readable dates  
✅ **Percentage Display**: Converts 0.0-1.0 prices to 0-100% for better readability  
✅ **Area Chart**: Shows filled area under the line for better visualization  
✅ **Responsive**: Adapts to container width  
✅ **Loading States**: Shows loading indicator while fetching data  
✅ **Error Handling**: Displays error messages when data fetch fails  
✅ **Empty States**: Handles missing or empty data gracefully  

## Usage

### Basic Usage

```tsx
import Chart from '@/components/Chart';

const MyComponent = () => {
  const [chartData, setChartData] = useState(null);
  
  // Fetch data from API
  useEffect(() => {
    fetch('/api/prices-history?market=TOKEN_ID&interval=1d')
      .then(res => res.json())
      .then(data => setChartData(data));
  }, []);
  
  return (
    <Chart
      data={chartData}
      title="Trump 2024 Win Probability"
      outcome="Yes"
      height={400}
    />
  );
};
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `PriceHistoryData \| null` | - | **Required**. The price history data from CLOB API |
| `title` | `string` | `'Market Odds Over Time'` | Chart title displayed above the chart |
| `outcome` | `string` | `'Yes'` | Name of the outcome being charted (for legend) |
| `height` | `number` | `400` | Height of the chart in pixels |
| `loading` | `boolean` | `false` | Show loading state |
| `error` | `string \| null` | `null` | Error message to display |

### Data Format

The component expects data in the exact format returned by the CLOB API:

```typescript
interface PriceHistoryData {
  history: Array<{
    t: number;  // Unix timestamp
    p: number;  // Price (0.0 to 1.0)
  }>;
}
```

**Example:**
```json
{
  "history": [
    { "t": 1763454547, "p": 0.5 },
    { "t": 1763454607, "p": 0.505 },
    { "t": 1763454667, "p": 0.51 }
  ]
}
```

## Demo Page

Visit `/chart` to see an interactive demo with the following features:

### Features

1. **Event Selector**: Choose from 10 diverse market events
2. **Market Selector**: If an event has multiple markets, select which one to display
3. **Outcome Selector**: Choose which outcome to chart (Yes/No, Win/Lose, etc.)
4. **Interval Selector**: Select time range (1h, 6h, 1d, 1w, all time)
5. **Market Info Card**: Shows market details, volume, and end date
6. **API Details Panel**: Displays the technical details of the current API call

### How to Use the Demo

1. **Start the backend**: Make sure `info-api` is running on port 3001
   ```bash
   cd info-api && yarn dev
   ```

2. **Start the frontend**: Run Next.js dev server
   ```bash
   cd info-frontend && yarn dev
   ```

3. **Open the demo**: Navigate to `http://localhost:3000/chart`

4. **Explore**: Select different events, markets, and time intervals to see the charts

## Implementation Details

### Data Transformation

The component automatically transforms the API data:

```typescript
// Unix timestamp → JavaScript Date
const xAxisData = data.history.map(point => new Date(point.t * 1000));

// Price (0.0-1.0) → Percentage (0-100)
const yAxisData = data.history.map(point => point.p * 100);
```

### MUI X Charts Configuration

```typescript
<LineChart
  xAxis={[{
    data: xAxisData,
    scaleType: 'time',
    valueFormatter: (date) => date.toLocaleString(/* ... */)
  }]}
  yAxis={[{
    min: 0,
    max: 100,
    label: 'Probability (%)'
  }]}
  series={[{
    data: yAxisData,
    label: outcome,
    color: '#2196f3',
    area: true,
    showMark: false,
    curve: 'linear'
  }]}
  height={height}
  grid={{ vertical: true, horizontal: true }}
/>
```

### Styling

The chart uses MUI's `sx` prop for styling:

```typescript
sx={{
  '& .MuiLineElement-root': {
    strokeWidth: 2,  // Line thickness
  },
  '& .MuiAreaElement-root': {
    fillOpacity: 0.2,  // Area transparency
  },
}}
```

## Getting CLOB Token IDs

To fetch chart data, you need the CLOB token ID from a market:

```typescript
// 1. Get market data from event
const market = event.markets[0];

// 2. Parse CLOB token IDs (they're stored as JSON string)
const clobTokenIds = JSON.parse(market.clobTokenIds);

// 3. Get token ID for specific outcome
const yesTokenId = clobTokenIds[0];  // "Yes" outcome
const noTokenId = clobTokenIds[1];   // "No" outcome

// 4. Fetch price history
const response = await fetch(
  `http://localhost:3001/api/prices-history?market=${yesTokenId}&interval=1d`
);
const chartData = await response.json();
```

## Customization

### Change Colors

```tsx
<Chart
  data={chartData}
  // ... other props
/>
```

Then modify the series color in the component:

```typescript
series={[{
  // ...
  color: '#4caf50',  // Green for positive sentiment
}]}
```

### Multiple Outcomes

To show both "Yes" and "No" on the same chart, you'd need to fetch data for both token IDs and modify the component to accept multiple series.

### Custom Time Formatting

Modify the `valueFormatter` in the xAxis configuration:

```typescript
valueFormatter: (date: Date) => {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
```

## Performance Considerations

1. **Data Points**: The component handles hundreds of data points efficiently
2. **Re-renders**: Uses React best practices to minimize unnecessary re-renders
3. **Loading States**: Shows immediate feedback while fetching data
4. **Error Boundaries**: Handles API errors gracefully

## Future Enhancements

Potential improvements:

1. **Comparison Mode**: Show multiple outcomes on the same chart
2. **Zoom Controls**: Add brush/zoom functionality
3. **Annotations**: Mark significant events on the timeline
4. **Export**: Download chart as PNG/SVG
5. **Real-time Updates**: WebSocket integration for live data
6. **Mobile Optimization**: Touch-friendly interactions
7. **Candlestick View**: Alternative chart type for OHLC data
8. **Volume Overlay**: Show trading volume alongside price

## Dependencies

- `@mui/x-charts`: ^8.18.0 (Line chart component)
- `react`: For component structure
- Next.js: For routing and SSR

## Troubleshooting

### Chart not displaying

1. Check that backend is running on port 3001
2. Verify the market has `clobTokenIds` field
3. Check browser console for errors
4. Ensure CORS is enabled on backend

### No data points

1. The market might be very new (< 1 hour old)
2. Try different time intervals (e.g., "max" for all available data)
3. Check the CLOB token ID is valid

### Styling issues

1. Make sure MUI X Charts CSS is loaded
2. Check that no conflicting global styles are applied
3. Verify the container has sufficient width/height

## References

- [MUI X Charts - Lines Documentation](https://mui.com/x/react-charts/lines/)
- [Polymarket CLOB API - Timeseries](https://docs.polymarket.com/developers/CLOB/timeseries)
- [Backend API Documentation](/info-api/README.md)





