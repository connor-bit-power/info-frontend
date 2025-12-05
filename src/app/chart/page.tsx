'use client';

import { useState, useEffect } from 'react';
import Chart from '../../components/Chart';
import type { Event, Market } from '../../types/polymarket';
import { API_CONFIG } from '@/lib/api/config';

interface PriceHistoryData {
  history: Array<{ t: number; p: number }>;
}

interface SeriesData {
  label: string;
  data: PriceHistoryData | null;
  color?: string;
}

export default function ChartDemoPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [chartSeries, setChartSeries] = useState<SeriesData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interval, setInterval] = useState<string>('max'); // Default to max for all historical data

  // Fetch events on mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Fetch featured events by slug
        const featuredSlugs = [
          'trump-agrees-to-sell-f-35-to-saudi-arabia-by-november-30',
          'what-will-trump-say-first-during-saudi-pm-events-on-november-18',
          'elon-musk-of-tweets-november-11-november-18'
        ];
        
        const featuredEvents: Event[] = [];
        for (const slug of featuredSlugs) {
          try {
            const response = await fetch(`${API_CONFIG.baseURL}/api/events/slug/${slug}`);
            if (response.ok) {
              const event = await response.json();
              if (event.markets && event.markets.length > 0) {
                featuredEvents.push(event);
              }
            }
          } catch (err) {
            console.log(`Event ${slug} not found`);
          }
        }

        // Fetch general events
        const response = await fetch(`${API_CONFIG.baseURL}/api/events?limit=100&closed=false`);
        const data = await response.json();
        
        // Filter out crypto up/down events and events without markets
        const filtered = data.filter((event: Event) => {
          const title = event.title || '';
          const slug = event.slug || '';
          const hasMarkets = event.markets && event.markets.length > 0;
          const isUpDown = /up or down/i.test(title) || /\d+m-\d+/i.test(slug);
          return hasMarkets && !isUpDown;
        });
        
        // Combine events: featured first, then others
        const allEvents: Event[] = [...featuredEvents, ...filtered.slice(0, 10)];
        
        // Remove duplicates by ID
        const uniqueEvents = Array.from(
          new Map(allEvents.map(event => [event.id, event])).values()
        );
        
        setEvents(uniqueEvents.slice(0, 12));
        
        // Auto-select first featured event if available
        if (featuredEvents.length > 0) {
          setSelectedEvent(featuredEvents[0]);
        } else if (uniqueEvents.length > 0) {
          setSelectedEvent(uniqueEvents[0]);
        }
      } catch (err) {
        console.error('Error fetching events:', err);
      }
    };

    fetchEvents();
  }, []);

  // Fetch chart data when event or interval changes
  useEffect(() => {
    if (!selectedEvent || !selectedEvent.markets || selectedEvent.markets.length === 0) return;

    const fetchChartData = async () => {
      setLoading(true);
      setError(null);

      try {
        const markets = selectedEvent.markets!;
        const seriesData: SeriesData[] = [];
        
        // Fidelity based on interval
        const fidelityMap: { [key: string]: number } = {
          '1h': 1,
          '6h': 5,
          '1d': 15,
          '1w': 60,
          'max': 60,
        };
        const fidelity = fidelityMap[interval] || 60;

        // Determine market structure and fetch appropriate data
        // HARD LIMIT: Never show more than 4 lines
        const MAX_SERIES = 4;
        
        console.log(`Processing ${markets.length} markets for event:`, selectedEvent.title);
        
        // Check if ALL markets are binary (common for multi-outcome events structured as multiple binary markets)
        const allBinary = markets.every(market => {
          const outcomes = JSON.parse(market.outcomes || '[]');
          return outcomes.length === 2 && 
                 outcomes.some((o: string) => /^yes$/i.test(o.trim())) && 
                 outcomes.some((o: string) => /^no$/i.test(o.trim()));
        });
        
        if (allBinary && markets.length > 4) {
          // Multiple binary markets (e.g., Elon tweets ranges): Fetch all "Yes" odds and sort
          console.log('Event has multiple binary markets - sorting by highest Yes odds');
          
          const marketsWithOdds: Array<{ market: typeof markets[0]; currentPrice: number }> = [];
          
          // Fetch current "Yes" odds for all markets
          for (const market of markets) {
            const clobTokenIds = JSON.parse(market.clobTokenIds || '[]');
            const outcomes = JSON.parse(market.outcomes || '[]');
            const yesIndex = outcomes.findIndex((o: string) => /^yes$/i.test(o.trim()));
            
            if (yesIndex >= 0 && clobTokenIds[yesIndex]) {
              try {
                const response = await fetch(
                  `http://localhost:3001/api/prices-history?market=${clobTokenIds[yesIndex]}&interval=max&fidelity=60`
                );
                if (response.ok) {
                  const priceData = await response.json();
                  const currentPrice = priceData.history && priceData.history.length > 0
                    ? priceData.history[priceData.history.length - 1].p
                    : 0;
                  marketsWithOdds.push({ market, currentPrice });
                  console.log(`${market.groupItemTitle || market.question}: ${(currentPrice * 100).toFixed(1)}%`);
                }
              } catch (err) {
                console.log(`Failed to fetch odds for ${market.groupItemTitle || market.question}`);
              }
            }
          }
          
          // Sort by highest odds
          marketsWithOdds.sort((a, b) => b.currentPrice - a.currentPrice);
          console.log('Top 4 markets by Yes odds:', marketsWithOdds.slice(0, 4).map(m => `${m.market.groupItemTitle || m.market.question}: ${(m.currentPrice * 100).toFixed(1)}%`));
          
          // Fetch full historical data for top 4
          for (const { market } of marketsWithOdds.slice(0, MAX_SERIES)) {
            const clobTokenIds = JSON.parse(market.clobTokenIds || '[]');
            const outcomes = JSON.parse(market.outcomes || '[]');
            const yesIndex = outcomes.findIndex((o: string) => /^yes$/i.test(o.trim()));
            
            if (yesIndex >= 0 && clobTokenIds[yesIndex]) {
              const response = await fetch(
                `http://localhost:3001/api/prices-history?market=${clobTokenIds[yesIndex]}&interval=${interval}&fidelity=${fidelity}`
              );
              if (response.ok) {
                const data = await response.json();
                const label = market.groupItemTitle || market.question || `Market ${seriesData.length + 1}`;
                seriesData.push({ label, data });
              }
            }
          }
        } else {
          // Original logic for single market or mixed types
          for (const market of markets) {
            if (seriesData.length >= MAX_SERIES) {
              console.log('Reached MAX_SERIES limit, stopping');
              break;
            }
            
            const clobTokenIds = JSON.parse(market.clobTokenIds || '[]');
            const outcomes = JSON.parse(market.outcomes || '[]');
            
            if (clobTokenIds.length === 0) continue;

            const isBinary = outcomes.length === 2 && 
                            outcomes.some((o: string) => /^yes$/i.test(o.trim())) && 
                            outcomes.some((o: string) => /^no$/i.test(o.trim()));

            if (isBinary) {
              // Binary market: only show "Yes" odds
              const yesIndex = outcomes.findIndex((o: string) => /^yes$/i.test(o.trim()));
              if (yesIndex >= 0 && clobTokenIds[yesIndex] && seriesData.length < MAX_SERIES) {
                const response = await fetch(
                  `http://localhost:3001/api/prices-history?market=${clobTokenIds[yesIndex]}&interval=${interval}&fidelity=${fidelity}`
                );
                if (response.ok) {
                  const data = await response.json();
                  const label = markets.length === 1 
                    ? 'Yes' 
                    : (market.groupItemTitle || market.question || `Market ${seriesData.length + 1}`);
                  seriesData.push({ label, data });
                }
              }
            } else {
              // Multi-outcome market: show top outcomes by highest odds
              const remainingSlots = MAX_SERIES - seriesData.length;
              const outcomesWithOdds: Array<{ outcome: string; index: number; currentPrice: number }> = [];
              
              for (let i = 0; i < outcomes.length && i < clobTokenIds.length; i++) {
                try {
                  const response = await fetch(
                    `http://localhost:3001/api/prices-history?market=${clobTokenIds[i]}&interval=max&fidelity=60`
                  );
                  if (response.ok) {
                    const priceData = await response.json();
                    const currentPrice = priceData.history && priceData.history.length > 0
                      ? priceData.history[priceData.history.length - 1].p
                      : 0;
                    outcomesWithOdds.push({ outcome: outcomes[i], index: i, currentPrice });
                  }
                } catch (err) {
                  console.log(`Failed to fetch odds for outcome ${outcomes[i]}`);
                }
              }
              
              outcomesWithOdds.sort((a, b) => b.currentPrice - a.currentPrice);
              const topOutcomes = outcomesWithOdds.slice(0, remainingSlots);
              
              for (const { outcome, index } of topOutcomes) {
                const response = await fetch(
                  `http://localhost:3001/api/prices-history?market=${clobTokenIds[index]}&interval=${interval}&fidelity=${fidelity}`
                );
                if (response.ok) {
                  const data = await response.json();
                  seriesData.push({ label: outcome, data });
                }
                
                if (seriesData.length >= MAX_SERIES) break;
              }
            }
          }
        }

        // Final safety check: ensure we never exceed 4 series
        setChartSeries(seriesData.slice(0, MAX_SERIES));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch chart data');
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [selectedEvent, interval]);

  const handleEventChange = (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
        Market Odds Chart Demo
      </h1>
      <p style={{ color: '#666', marginBottom: '16px' }}>
        Select an event and market to view historical price data
      </p>
      
      {/* Featured Market Note */}
      <div
        style={{
          padding: '16px',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          marginBottom: '32px',
          borderLeft: '4px solid #2196f3',
        }}
      >
        <p style={{ margin: 0, fontSize: '14px', marginBottom: '8px' }}>
          <strong>📊 Featured Markets:</strong>
        </p>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
          <li style={{ marginBottom: '4px' }}>
            <a
              href="https://polymarket.com/event/trump-agrees-to-sell-f-35-to-saudi-arabia-by-november-30"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#1976d2', textDecoration: 'underline' }}
            >
              Trump F-35 to Saudi Arabia
            </a>{' '}
            (Binary SMP)
          </li>
          <li style={{ marginBottom: '4px' }}>
            <a
              href="https://polymarket.com/event/what-will-trump-say-first-during-saudi-pm-events-on-november-18"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#1976d2', textDecoration: 'underline' }}
            >
              What will Trump say first during Saudi PM events?
            </a>{' '}
            (Multi-outcome - top 4 lines)
          </li>
          <li>
            <a
              href="https://polymarket.com/event/elon-musk-of-tweets-november-11-november-18"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#1976d2', textDecoration: 'underline' }}
            >
              Elon Musk # tweets November 11-18
            </a>{' '}
            (Multi-outcome - top 4 lines)
          </li>
        </ul>
      </div>

      {/* Controls */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {/* Event Selector */}
        <div>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Select Event
          </label>
          <select
            value={selectedEvent?.id || ''}
            onChange={(e) => handleEventChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontSize: '14px',
            }}
          >
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title || 'Untitled Event'}
              </option>
            ))}
          </select>
        </div>

        {/* Interval Selector */}
        <div>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Time Interval
          </label>
          <select
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontSize: '14px',
            }}
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="1d">Last Day</option>
            <option value="1w">Last Week</option>
            <option value="max">All Time</option>
          </select>
        </div>
      </div>

      {/* Event Info */}
      {selectedEvent && (
        <div
          style={{
            marginBottom: '24px',
            padding: '16px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
          }}
        >
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
            {selectedEvent.title || 'Event'}
          </h2>
          {selectedEvent.description && (
            <p
              style={{
                fontSize: '14px',
                color: '#666',
                marginBottom: '8px',
                maxHeight: '60px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {selectedEvent.description}
            </p>
          )}
          <div style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
            <span>
              <strong>Markets:</strong> {selectedEvent.markets?.length || 0}
            </span>
            <span>
              <strong>End Date:</strong>{' '}
              {selectedEvent.endDate
                ? new Date(selectedEvent.endDate).toLocaleDateString()
                : 'N/A'}
            </span>
          </div>
        </div>
      )}

      {/* Chart */}
      <Chart
        series={chartSeries}
        title={selectedEvent?.title || 'Event'}
        height={500}
        loading={loading}
        error={error}
      />

      {/* API Info */}
      <div
        style={{
          marginTop: '32px',
          padding: '16px',
          backgroundColor: '#f0f7ff',
          borderRadius: '8px',
          fontSize: '14px',
        }}
      >
        <h3 style={{ fontWeight: 600, marginBottom: '8px' }}>API Details</h3>
        <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          <p>
            <strong>Endpoint:</strong> /api/prices-history
          </p>
          <p>
            <strong>Interval:</strong> {interval}
          </p>
          <p>
            <strong>Series Count:</strong> {chartSeries.length}
          </p>
          <p>
            <strong>Total Data Points:</strong>{' '}
            {chartSeries.reduce((sum, s) => sum + (s.data?.history?.length || 0), 0)}
          </p>
        </div>
      </div>
    </div>
  );
}

