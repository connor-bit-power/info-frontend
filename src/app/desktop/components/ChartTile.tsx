'use client';

import { useState, useEffect } from 'react';
import Chart from '../../../components/Chart';
import Tile from './Tile';

interface ChartTileProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isDarkMode?: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
  onResizeStart?: (e: React.MouseEvent, handle: string) => void;
  isDragging?: boolean;
  isResizing?: boolean;
  marketId?: string; // Optional market ID to display specific market
}

interface PriceHistoryData {
  history: Array<{ t: number; p: number }>;
}

export default function ChartTile({
  id,
  x,
  y,
  width,
  height,
  isDarkMode,
  onMouseDown,
  onResizeStart,
  isDragging,
  isResizing,
  marketId = 'trump-agrees-to-sell-f-35-to-saudi-arabia-by-november-30', // Default market
}: ChartTileProps) {
  const [chartData, setChartData] = useState<PriceHistoryData | null>(null);
  const [marketTitle, setMarketTitle] = useState<string>('Loading...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch market data
  useEffect(() => {
    const fetchMarketData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch event data
        const eventResponse = await fetch(`http://localhost:3001/api/events/slug/${marketId}`);
        if (!eventResponse.ok) {
          throw new Error('Failed to fetch market data');
        }

        const event = await eventResponse.json();
        setMarketTitle(event.title || 'Market');

        // Get the first market's Yes outcome
        if (event.markets && event.markets.length > 0) {
          const market = event.markets[0];
          const clobTokenIds = JSON.parse(market.clobTokenIds || '[]');
          const outcomes = JSON.parse(market.outcomes || '[]');
          
          // Find Yes index
          const yesIndex = outcomes.findIndex((o: string) => /^yes$/i.test(o.trim()));
          
          if (yesIndex >= 0 && clobTokenIds[yesIndex]) {
            // Fetch price history
            const priceResponse = await fetch(
              `http://localhost:3001/api/prices-history?market=${clobTokenIds[yesIndex]}&interval=max&fidelity=60`
            );
            
            if (priceResponse.ok) {
              const data = await priceResponse.json();
              setChartData(data);
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load market data');
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
  }, [marketId]);

  return (
    <Tile
      id={id}
      x={x}
      y={y}
      width={width}
      height={height}
      isDarkMode={isDarkMode}
      onMouseDown={onMouseDown}
      onResizeStart={onResizeStart}
      isDragging={isDragging}
      isResizing={isResizing}
    >
      <div className="h-full" style={{ padding: '0px' }}>
        <Chart
          data={chartData}
          title={marketTitle}
          outcome="Yes"
          height={height - 40}
          loading={loading}
          error={error}
        />
      </div>
    </Tile>
  );
}
