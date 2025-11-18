# 📊 Polymarket Gamma Structure - Complete Guide

## Overview

Polymarket's Gamma API uses a hierarchical structure where **Events contain Markets**. This organizational model allows for both simple yes/no questions and complex multi-outcome scenarios.

```
Event (Container)
├── Market 1
├── Market 2
├── Market 3
└── Market N
```

---

## 🎯 Core Concepts

### Market
**The fundamental trading unit**
- Contains data for a single tradeable question
- Has 2 outcomes (Yes/No, Up/Down, Team A/Team B)
- Maps to CLOB token IDs, market address, question ID, condition ID
- Can exist independently or as part of an Event

### Event
**The organizational container**
- Groups related markets together
- Can contain 1 or more markets
- Provides context and categorization
- Has metadata: title, description, image, tags, series

---

## 📝 SMP vs GMP - The Two Types

### SMP (Single Market Prediction)
**Event with 1 Market**

An Event that contains exactly ONE market. Simple yes/no questions.

**Example 1: Price Prediction (SMP)**
```
EVENT: "Solana Up or Down - November 19, 2:00AM-2:15AM ET"
├── MARKET: "Solana Up or Down - November 19, 2:00AM-2:15AM ET"
    └── Outcomes: ["Up", "Down"]
```

**Real API Response Structure:**
```json
{
  "id": "84183",
  "title": "Solana Up or Down - November 19, 2:00AM-2:15AM ET",
  "markets": [
    {
      "id": "688720",
      "question": "Solana Up or Down - November 19, 2:00AM-2:15AM ET",
      "outcomes": "[\"Up\", \"Down\"]",
      "outcomePrices": "[\"0.5\", \"0.5\"]"
    }
  ]
}
```

**Example 2: Sports Match Draw (SMP)**
```
EVENT: "ARch Euro 2024: Romania vs. Ukraine"
├── MARKET: "Will the match be a draw?"
    └── Outcomes: ["Yes", "No"]
```

**Characteristics:**
- ✅ Single question
- ✅ Binary outcome (Yes/No, Up/Down, Win/Lose)
- ✅ Direct answer
- ✅ `markets.length === 1`

---

### GMP (Group Market Prediction)
**Event with 2+ Markets**

An Event that contains MULTIPLE related markets. Complex scenarios with many possible outcomes.

**Example 1: Multiple Choice (GMP)**
```
EVENT: "Where will Barron Trump attend College?"
├── MARKET: "Will Barron attend Georgetown?"
│   └── Outcomes: ["Yes", "No"]
├── MARKET: "Will Barron attend NYU?"
│   └── Outcomes: ["Yes", "No"]
├── MARKET: "Will Barron attend UPenn?"
│   └── Outcomes: ["Yes", "No"]
├── MARKET: "Will Barron attend Harvard?"
│   └── Outcomes: ["Yes", "No"]
└── MARKET: "Will Barron attend another college?"
    └── Outcomes: ["Yes", "No"]
```

**Example 2: Word Predictions (GMP)**
```
EVENT: "What will Trump or Melania say during the Executive Order signing?"
├── MARKET: "Will they say 'Health'?"
│   └── Outcomes: ["Yes", "No"]
├── MARKET: "Will they say 'College'?"
│   └── Outcomes: ["Yes", "No"]
├── MARKET: "Will they say 'Innovation'?"
│   └── Outcomes: ["Yes", "No"]
├── MARKET: "Will they say 'Economy'?"
│   └── Outcomes: ["Yes", "No"]
└── ... (more word markets)
```

**Real API Response Structure:**
```json
{
  "id": "80031",
  "title": "What will Trump or Melania say during the Executive Order signing?",
  "volume": 251424.08,
  "markets": [
    {
      "id": "679567",
      "question": "Will they say 'Health'?",
      "groupItemTitle": "Health",
      "groupItemThreshold": "8",
      "outcomes": "[\"Yes\", \"No\"]",
      "volume": 14149.25
    },
    {
      "id": "679569",
      "question": "Will they say 'College'?",
      "groupItemTitle": "College",
      "groupItemThreshold": "10",
      "outcomes": "[\"Yes\", \"No\"]",
      "volume": 8339.12
    },
    {
      "id": "679571",
      "question": "Will they say 'Innovation'?",
      "groupItemTitle": "Innovation",
      "groupItemThreshold": "12",
      "outcomes": "[\"Yes\", \"No\"]",
      "volume": 5234.88
    }
    // ... more markets
  ]
}
```

**Example 3: Sports Tournament (GMP)**
```
EVENT: "NBA Championship Winner 2024"
├── MARKET: "Will Lakers win?"
├── MARKET: "Will Celtics win?"
├── MARKET: "Will Warriors win?"
├── MARKET: "Will Heat win?"
└── MARKET: "Will another team win?"
```

**Characteristics:**
- ✅ Multiple related questions
- ✅ Each market is Yes/No
- ✅ Markets share context (same event)
- ✅ `markets.length > 1`
- ✅ `groupItemTitle` identifies each option
- ✅ `groupItemThreshold` for ordering

---

## 🔍 How to Identify SMP vs GMP

### In Code:

```typescript
import { Event } from '@/types/polymarket';

function identifyEventType(event: Event): 'SMP' | 'GMP' {
  const marketCount = event.markets?.length || 0;
  
  if (marketCount === 1) {
    return 'SMP'; // Single Market Prediction
  } else if (marketCount > 1) {
    return 'GMP'; // Group Market Prediction
  }
  
  throw new Error('Invalid event structure');
}

// Usage
const event = await polymarketApi.events.getEventBySlug('some-event');
const type = identifyEventType(event);

if (type === 'SMP') {
  // Display as single yes/no question
  console.log(`Question: ${event.markets[0].question}`);
} else {
  // Display as multiple choice
  console.log(`Main Question: ${event.title}`);
  event.markets.forEach(market => {
    console.log(`- ${market.groupItemTitle}: ${market.outcomePrices}`);
  });
}
```

---

## 📊 Data Structure Breakdown

### Event Object (Container)
```typescript
{
  id: string;                    // Event ID
  title: string;                 // Main question/title
  description: string;           // Full description
  slug: string;                  // URL-friendly identifier
  
  // Metadata
  image: string;                 // Event image
  icon: string;                  // Event icon
  active: boolean;               // Is active
  closed: boolean;               // Is closed
  
  // Trading Data
  volume: number;                // Total volume across all markets
  liquidity: number;             // Total liquidity
  volume24hr: number;            // 24hr trading volume
  
  // The Markets!
  markets: Market[];             // Array of markets (1 for SMP, 2+ for GMP)
  
  // Organization
  tags: Tag[];                   // Category tags
  series: Series[];              // Series info (recurring events)
}
```

### Market Object (Tradeable Unit)
```typescript
{
  id: string;                    // Market ID
  question: string;              // The specific question
  slug: string;                  // URL-friendly identifier
  
  // Trading Data
  outcomes: string;              // JSON: ["Yes", "No"] or ["Up", "Down"]
  outcomePrices: string;         // JSON: ["0.65", "0.35"] (probabilities)
  volume: string;                // Trading volume for this market
  liquidity: string;             // Liquidity for this market
  
  // GMP-Specific Fields
  groupItemTitle: string;        // Label for this option (GMP only)
  groupItemThreshold: string;    // Display order (GMP only)
  
  // Technical
  conditionId: string;           // Blockchain condition ID
  clobTokenIds: string;          // CLOB token pair
  questionID: string;            // Question identifier
  
  // Status
  active: boolean;               // Is trading active
  closed: boolean;               // Is market closed
  acceptingOrders: boolean;      // Accepting new orders
}
```

---

## 🎨 UI Display Patterns

### Displaying SMP (Single Market)
```typescript
function SMPDisplay({ event }: { event: Event }) {
  const market = event.markets[0];
  const outcomes = JSON.parse(market.outcomes);
  const prices = JSON.parse(market.outcomePrices);
  
  return (
    <div>
      <h2>{event.title}</h2>
      <p>{event.description}</p>
      
      <div className="outcomes">
        <button>
          {outcomes[0]} - {(parseFloat(prices[0]) * 100).toFixed(1)}%
        </button>
        <button>
          {outcomes[1]} - {(parseFloat(prices[1]) * 100).toFixed(1)}%
        </button>
      </div>
      
      <p>Volume: ${market.volumeNum?.toLocaleString()}</p>
    </div>
  );
}
```

### Displaying GMP (Multiple Markets)
```typescript
function GMPDisplay({ event }: { event: Event }) {
  return (
    <div>
      <h2>{event.title}</h2>
      <p>{event.description}</p>
      
      <div className="market-grid">
        {event.markets
          ?.sort((a, b) => 
            parseInt(a.groupItemThreshold || '0') - 
            parseInt(b.groupItemThreshold || '0')
          )
          .map(market => {
            const prices = JSON.parse(market.outcomePrices || '[0,0]');
            const yesProbability = (parseFloat(prices[0]) * 100).toFixed(1);
            
            return (
              <div key={market.id} className="market-card">
                <h3>{market.groupItemTitle}</h3>
                <p className="probability">{yesProbability}%</p>
                <p className="volume">${market.volumeNum?.toLocaleString()}</p>
              </div>
            );
          })}
      </div>
      
      <p>Total Volume: ${event.volume?.toLocaleString()}</p>
    </div>
  );
}
```

---

## 🔄 Data Enrichment Opportunities

### 1. Calculate Market Share (GMP)
```typescript
function calculateMarketShares(event: Event) {
  if (event.markets.length === 1) return null; // SMP, no shares
  
  const totalVolume = event.markets.reduce(
    (sum, m) => sum + (m.volumeNum || 0), 
    0
  );
  
  return event.markets.map(market => ({
    ...market,
    volumeShare: ((market.volumeNum || 0) / totalVolume) * 100,
    isLeader: market.volumeNum === Math.max(...event.markets.map(m => m.volumeNum || 0))
  }));
}
```

### 2. Aggregate Statistics
```typescript
function enrichEvent(event: Event) {
  const marketCount = event.markets?.length || 0;
  const type = marketCount === 1 ? 'SMP' : 'GMP';
  
  const totalVolume = event.markets?.reduce(
    (sum, m) => sum + (m.volumeNum || 0), 
    0
  ) || 0;
  
  const avgVolume = totalVolume / marketCount;
  
  const mostActiveMarket = event.markets?.reduce((max, m) => 
    (m.volumeNum || 0) > (max.volumeNum || 0) ? m : max
  );
  
  return {
    ...event,
    enriched: {
      type,
      marketCount,
      totalVolume,
      avgVolumePerMarket: avgVolume,
      mostActiveMarket,
      hasHighActivity: totalVolume > 100000
    }
  };
}
```

### 3. Price Movement Tracking
```typescript
function trackPriceChanges(market: Market) {
  return {
    ...market,
    priceMetrics: {
      oneDayChange: market.oneDayPriceChange,
      oneHourChange: market.oneHourPriceChange,
      oneWeekChange: market.oneWeekPriceChange,
      trend: market.oneDayPriceChange > 0 ? 'up' : 
             market.oneDayPriceChange < 0 ? 'down' : 'flat',
      volatility: Math.abs(market.oneHourPriceChange || 0)
    }
  };
}
```

---

## ✅ Our API Integration Status

### Current Structure: ✅ CORRECT

Our TypeScript types in `src/types/polymarket.ts` correctly model:

```typescript
export interface Event {
  id: string;
  title: string;
  markets?: Market[];  // ✅ Array of markets (SMP = 1, GMP = 2+)
  // ... all other fields
}

export interface Market {
  id: string;
  question: string;
  outcomes: string;         // ✅ JSON array
  outcomePrices?: string;   // ✅ JSON array
  groupItemTitle?: string;  // ✅ For GMP identification
  groupItemThreshold?: string; // ✅ For GMP ordering
  // ... all other fields
}
```

### API Client: ✅ CORRECTLY STRUCTURED

```typescript
// Fetch Events (RECOMMENDED - most efficient)
const events = await polymarketApi.events.getActiveEvents({ limit: 50 });

// Each event contains its markets
events.forEach(event => {
  const type = event.markets.length === 1 ? 'SMP' : 'GMP';
  console.log(`${event.title} is a ${type}`);
  console.log(`Has ${event.markets.length} market(s)`);
});

// Fetch individual market (less efficient, but possible)
const market = await polymarketApi.markets.getMarketBySlug('some-market');
// Note: This returns Market object, not Event
// You'll need to fetch the parent event separately if needed
```

---

## 🎯 Best Practices

### 1. Always Fetch Events (Not Markets)
```typescript
// ✅ GOOD - Efficient, gets context
const events = await polymarketApi.events.getActiveEvents();

// ❌ LESS IDEAL - Missing context
const markets = await polymarketApi.markets.getMarkets();
```

### 2. Check Market Count Before Rendering
```typescript
function renderEvent(event: Event) {
  if (event.markets.length === 1) {
    return <SMPCard event={event} />;
  } else {
    return <GMPCard event={event} />;
  }
}
```

### 3. Use groupItemTitle for GMP Display
```typescript
// In GMP, groupItemTitle tells you what each market represents
event.markets.forEach(market => {
  console.log(`${market.groupItemTitle}: ${market.outcomePrices}`);
});
// Output:
// Georgetown: ["0.15", "0.85"]
// NYU: ["0.25", "0.75"]
// UPenn: ["0.20", "0.80"]
```

### 4. Sort GMP Markets by Threshold
```typescript
const sortedMarkets = event.markets.sort((a, b) => 
  parseInt(a.groupItemThreshold || '0') - parseInt(b.groupItemThreshold || '0')
);
```

---

## 📈 Summary

| Aspect | SMP (Single) | GMP (Group) |
|--------|-------------|-------------|
| **Markets** | 1 | 2+ |
| **Use Case** | Simple yes/no | Multiple choice |
| **Example** | "Will Bitcoin hit $100k?" | "Which team will win?" |
| **groupItemTitle** | Not used | Identifies each option |
| **Display** | Two buttons | Multiple cards/options |
| **Volume** | Single market volume | Sum of all markets |
| **Complexity** | Simple | Complex |

---

## 🚀 Ready to Use

Your integration is **perfectly structured** to handle both SMP and GMP patterns. The API correctly returns Events with their Markets array, and you can easily differentiate between the two types by checking `event.markets.length`.

All the data needed for rich UI displays is present in the API responses! 🎉





