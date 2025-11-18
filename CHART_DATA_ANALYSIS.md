# Chart Data Analysis for Event Odds

## ✅ UPDATE: YES, WE HAVE HISTORICAL CHART DATA!

**Great news!** Polymarket has a CLOB API endpoint that provides historical price data perfect for charts.

**Endpoint Added:** `GET /api/prices-history`

**Documentation:** https://docs.polymarket.com/developers/CLOB/timeseries

**Status:** ✅ Implemented and tested in backend!

---

## Current Data Available ✅

From our existing **Gamma Markets API** integration, we have access to:

### 1. Current Snapshot Data (Per Market)
```json
{
  "outcomePrices": ["0.5", "0.5"],  // Current odds for each outcome
  "bestBid": 0.46,                   // Current best bid price
  "bestAsk": 0.54,                   // Current best ask price
  "spread": 0.08,                    // Current bid-ask spread
  "lastTradePrice": 0.48             // Most recent trade price
}
```

### 2. Price Change Indicators
```json
{
  "oneDayPriceChange": 0.05,    // Price change in last 24 hours
  "oneHourPriceChange": 0.02,   // Price change in last hour
  "oneWeekPriceChange": 0.15,   // Price change in last week
  "oneMonthPriceChange": 0.20,  // Price change in last month
  "oneYearPriceChange": 0.30    // Price change in last year
}
```

### 3. Volume Data
```json
{
  "volume24hr": 15234.56,       // Trading volume in last 24 hours
  "volume1wk": 125432.34,       // Trading volume in last week
  "volume1mo": 543234.12,       // Trading volume in last month
  "volumeNum": 1234567.89       // Total volume
}
```

## What We CAN Display Now 📊

With the current data, we can create:

### 1. **Simple Current Odds Display**
- Show current probability for each outcome
- Display as percentage (e.g., "Yes: 50%, No: 50%")
- Color-coded confidence indicators

### 2. **Price Change Indicators**
- Arrow indicators (↑ up, ↓ down)
- Percentage change badges
- Time-based comparisons (1h, 24h, 1w, 1m)
- Example: "↑ 5% in last 24h"

### 3. **Volume Indicators**
- Show trading activity level
- Compare recent volume to historical
- Activity heat indicators

### 4. **Spread/Liquidity Indicators**
- Show bid-ask spread as confidence metric
- Tighter spread = more liquid market = more confident prices

## What We CANNOT Display Yet ❌

### Historical Time-Series Charts
We **DO NOT** currently have access to:
- Price data points over time (e.g., hourly/daily snapshots)
- Historical probability curves
- Traditional line/candlestick charts showing price movement

## How to Get Historical Chart Data 🔧

To display full historical charts, we need additional data sources:

### Option 1: Polymarket Subgraph (GraphQL) ⭐ RECOMMENDED
**Source:** https://docs.polymarket.com/developers/subgraph/overview

**What it provides:**
- Historical trades and positions
- Volume over time
- User positions and movements
- Real-time updates via GraphQL queries

**Pros:**
- Official Polymarket data source
- Real-time updates
- GraphQL flexibility
- Free to use

**Cons:**
- Requires GraphQL client
- Different API pattern than REST
- Need to process raw trade data into price points

**Implementation:**
```graphql
query GetMarketHistory($conditionId: String!) {
  fpmmTrades(
    where: { fpmm_: { condition_: { id: $conditionId } } }
    orderBy: creationTimestamp
    orderDirection: asc
  ) {
    id
    outcomeIndex
    outcomeTokensTraded
    creationTimestamp
    collateralAmount
  }
}
```

### Option 2: Real-Time Data Socket (RTDS)
**Source:** https://docs.polymarket.com/developers/RTDS/RTDS-overview

**What it provides:**
- Live WebSocket updates for market prices
- Real-time odds changes
- Event updates as they happen

**Pros:**
- Live updates (no polling)
- Minimal latency
- Official source

**Cons:**
- Only provides real-time data (not historical)
- Requires WebSocket connection
- We'd need to store historical data ourselves

**Use Case:**
- Best for keeping charts updated in real-time
- Combine with another source for historical baseline

### Option 3: Third-Party Aggregators
**Examples:**
- PredictionData.io
- Custom Python packages (polymarket-py)

**Pros:**
- Pre-processed data
- REST API (easier integration)
- Historical data readily available

**Cons:**
- Third-party dependency
- May have costs/limits
- Not official source

## Recommended Implementation Strategy 🎯

### Phase 1: Simple Odds Display (IMMEDIATE - No New Endpoints)
Use existing data from Gamma API:
```typescript
interface SimpleOddsDisplay {
  currentPrice: number;        // From outcomePrices
  priceChange24h: number;      // From oneDayPriceChange
  volume24h: number;           // From volume24hr
  spread: number;              // From spread
}
```

**UI Components:**
- Large percentage display: "Yes: 52%"
- Change indicator: "↑ 5% (24h)"
- Volume badge: "High Activity"
- Confidence indicator based on spread

### Phase 2: Add Historical Charts (REQUIRES NEW INTEGRATION)
Integrate Polymarket Subgraph:

1. **Add GraphQL Client**
   ```bash
   yarn add graphql-request graphql
   ```

2. **Create Subgraph Service**
   ```typescript
   // src/lib/api/services/subgraph.ts
   import { GraphQLClient } from 'graphql-request';
   
   const client = new GraphQLClient('https://api.thegraph.com/subgraphs/name/polymarket/matic-markets-5');
   ```

3. **Fetch Historical Trades**
   - Query trades for a market's conditionId
   - Calculate price points from trades
   - Generate time-series data

4. **Display Charts**
   - Use charting library (recharts, chart.js, etc.)
   - Show price over time
   - Add volume indicators

### Phase 3: Real-Time Updates (OPTIONAL ENHANCEMENT)
Add WebSocket connection for live updates:
- Connect to RTDS
- Subscribe to market updates
- Update charts in real-time

## Data Flow Examples

### Current Snapshot (What We Have Now)
```
Frontend → info-api → Gamma API → Current Snapshot
                                   ├─ outcomePrices: ["0.52", "0.48"]
                                   ├─ oneDayPriceChange: 0.05
                                   └─ volume24hr: 15234.56
```

### Historical Charts (What We Need)
```
Frontend → info-api → Subgraph API → Historical Trades
                                      ├─ Trade 1 @ timestamp 1
                                      ├─ Trade 2 @ timestamp 2
                                      └─ Trade N @ timestamp N
         → Process trades into price series
         → Display on chart
```

## NEW: CLOB Price History API ✅

### Endpoint Details
```
GET http://localhost:3001/api/prices-history
```

### Parameters
- **market** (required): CLOB token ID from market's `clobTokenIds` field
- **interval** (optional): `1m`, `1h`, `6h`, `1d`, `1w`, `max`
- **fidelity** (optional): Resolution in minutes (e.g., 60 for hourly)
- **startTs** (optional): Unix timestamp for start time
- **endTs** (optional): Unix timestamp for end time

### Response Format
```json
{
  "history": [
    { "t": 1763454547, "p": 0.5 },
    { "t": 1763454607, "p": 0.505 },
    { "t": 1763454667, "p": 0.51 }
  ]
}
```

- `t` = Unix timestamp
- `p` = Price (0.0 to 1.0)

### How to Use

1. **Get CLOB Token ID** from market data:
```typescript
const market = event.markets[0];
const clobTokenIds = JSON.parse(market.clobTokenIds);
const tokenId = clobTokenIds[0]; // First outcome (e.g., "Yes")
```

2. **Fetch Historical Prices**:
```typescript
const response = await fetch(
  `http://localhost:3001/api/prices-history?market=${tokenId}&interval=1d&fidelity=60`
);
const data = await response.json();
```

3. **Use in Chart Library**:
```typescript
// For Chart.js, Recharts, etc.
const chartData = data.history.map(point => ({
  x: new Date(point.t * 1000), // Convert Unix timestamp to Date
  y: point.p * 100              // Convert to percentage
}));
```

### Tested Examples

**Example 1: Last 24 hours**
```
/api/prices-history?market=62260219281952998269644965754036760807170205908312295058404031203458962637554&interval=1d
```
Returns: 14 data points with minute-level detail

**Example 2: Maximum available history**
```
/api/prices-history?market=62260219281952998269644965754036760807170205908312295058404031203458962637554&interval=max&fidelity=60
```
Returns: All available historical data with hourly resolution

---

## Summary

| Feature | Current Data | Status |
|---------|--------------|--------|
| Current odds/prices | ✅ Yes | Available now |
| Price change indicators | ✅ Yes | Available now |
| Volume indicators | ✅ Yes | Available now |
| Spread/liquidity | ✅ Yes | Available now |
| **Historical line charts** | **✅ YES!** | **CLOB API implemented** |
| Real-time updates | ⏳ Future | RTDS WebSocket (optional) |
| Candlestick charts | ✅ Yes | Via CLOB history data |

## Recommendation

**Start with Phase 1** - We have enough data RIGHT NOW to create useful odds displays:
- Current probability percentages
- 24h/1w price changes with arrows
- Volume and activity indicators
- Simple visual representations

**Then add Phase 2** - Integrate Subgraph for full historical charts when needed.

This approach lets you ship value immediately while planning for richer visualizations later.

