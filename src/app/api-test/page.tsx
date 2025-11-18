/**
 * API Test Page
 * Demonstrates the Polymarket API integration
 * This page tests the API client without modifying existing components
 */

'use client';

import { useState } from 'react';
import { polymarketApi } from '@/lib/api';
import { useMarkets, useActiveEvents, useMarketBySlug } from '@/lib/hooks';
import type { Market, Event } from '@/types/polymarket';

export default function ApiTestPage() {
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Test 1: Fetch markets using hooks
  const { markets, isLoading: marketsLoading, error: marketsError } = useMarkets({
    limit: 5,
    closed: false,
    enabled: false, // Don't auto-fetch
  });

  // Test 2: Fetch active events using hooks
  const { events, isLoading: eventsLoading, error: eventsError } = useActiveEvents({
    limit: 5,
    enabled: false, // Don't auto-fetch
  });

  // API Client Tests
  const runTests = async () => {
    setIsLoading(true);
    const results: Record<string, any> = {};

    try {
      // Test 1: Health Check
      console.log('Testing health check...');
      const health = await polymarketApi.healthCheck();
      results.health = { success: true, data: health };

      // Test 2: Get Markets
      console.log('Testing get markets...');
      const marketsData = await polymarketApi.markets.getMarkets({ limit: 3, closed: false });
      results.markets = { 
        success: true, 
        count: marketsData.length,
        sample: marketsData[0] 
      };

      // Test 3: Get Active Events (RECOMMENDED)
      console.log('Testing get active events...');
      const eventsData = await polymarketApi.events.getActiveEvents({ limit: 3 });
      results.events = { 
        success: true, 
        count: eventsData.length,
        sample: eventsData[0],
        markets: eventsData[0]?.markets?.length || 0
      };

      // Test 4: Get Specific Market by Slug
      if (marketsData[0]?.slug) {
        console.log('Testing get market by slug...');
        const market = await polymarketApi.markets.getMarketBySlug(marketsData[0].slug);
        results.marketBySlug = { success: true, data: market };
      }

      // Test 5: Get Sports Metadata
      console.log('Testing get sports metadata...');
      const sports = await polymarketApi.sports.getSportsMetadata();
      results.sports = { 
        success: true, 
        count: sports.length,
        sample: sports[0]
      };

      // Test 6: Get Teams
      console.log('Testing get teams...');
      const teams = await polymarketApi.sports.getTeams({ limit: 5 });
      results.teams = { 
        success: true, 
        count: teams.length,
        sample: teams[0]
      };

      // Test 7: Search
      console.log('Testing search...');
      const searchResults = await polymarketApi.search.quickSearch('bitcoin', 2);
      results.search = { 
        success: true, 
        eventsCount: searchResults.events?.length || 0,
        tagsCount: searchResults.tags?.length || 0,
        sample: searchResults.events?.[0]
      };

      // Test 8: Get Tags
      console.log('Testing get tags...');
      const tags = await polymarketApi.tags.getTags({ limit: 5 });
      results.tags = { 
        success: true, 
        count: tags.length,
        sample: tags[0]
      };

      console.log('All tests completed!', results);
      setTestResults(results);
    } catch (error) {
      console.error('Test error:', error);
      results.error = { success: false, error: String(error) };
      setTestResults(results);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '1200px', 
      margin: '0 auto',
      minHeight: '100vh',
      color: '#1f2937',
      backgroundColor: '#ffffff'
    }}>
      <h1 style={{ 
        fontSize: '2rem', 
        fontWeight: 'bold', 
        marginBottom: '2rem',
        color: '#111827'
      }}>
        Polymarket API Integration Test
      </h1>

      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={runTests}
          disabled={isLoading}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            backgroundColor: isLoading ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading ? 'Running Tests...' : 'Run API Tests'}
        </button>
      </div>

      {Object.keys(testResults).length > 0 && (
        <div>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            marginBottom: '1rem',
            color: '#111827'
          }}>
            Test Results
          </h2>
          
          {Object.entries(testResults).map(([key, result]) => (
            <div
              key={key}
              style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                backgroundColor: result.success ? '#f0fdf4' : '#fef2f2',
              }}
            >
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: 'bold', 
                marginBottom: '0.5rem',
                color: '#111827'
              }}>
                {key}
              </h3>
              <pre style={{ 
                overflow: 'auto', 
                fontSize: '0.875rem',
                backgroundColor: '#f9fafb',
                padding: '1rem',
                borderRadius: '0.25rem',
                color: '#1f2937',
                maxHeight: '400px',
                overflowY: 'auto'
              }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '3rem', paddingBottom: '2rem' }}>
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          marginBottom: '1rem',
          color: '#111827'
        }}>
          API Documentation
        </h2>
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#f9fafb', 
          borderRadius: '0.5rem',
          color: '#1f2937'
        }}>
          <h3 style={{ 
            fontSize: '1.25rem', 
            marginBottom: '1rem',
            color: '#111827'
          }}>
            Available Services:
          </h3>
          <ul style={{ 
            listStyle: 'disc', 
            paddingLeft: '2rem', 
            lineHeight: '1.8',
            color: '#374151'
          }}>
            <li><strong style={{ color: '#111827' }}>polymarketApi.markets</strong> - Market operations</li>
            <li><strong style={{ color: '#111827' }}>polymarketApi.events</strong> - Event operations (RECOMMENDED for markets)</li>
            <li><strong style={{ color: '#111827' }}>polymarketApi.sports</strong> - Sports metadata and teams</li>
            <li><strong style={{ color: '#111827' }}>polymarketApi.tags</strong> - Tags and categories</li>
            <li><strong style={{ color: '#111827' }}>polymarketApi.search</strong> - Universal search</li>
          </ul>

          <h3 style={{ 
            fontSize: '1.25rem', 
            marginTop: '1.5rem', 
            marginBottom: '1rem',
            color: '#111827'
          }}>
            React Hooks Available:
          </h3>
          <ul style={{ 
            listStyle: 'disc', 
            paddingLeft: '2rem', 
            lineHeight: '1.8',
            color: '#374151'
          }}>
            <li><strong style={{ color: '#111827' }}>useMarkets()</strong> - Fetch markets list</li>
            <li><strong style={{ color: '#111827' }}>useMarket(id)</strong> - Fetch specific market</li>
            <li><strong style={{ color: '#111827' }}>useMarketBySlug(slug)</strong> - Fetch market by slug</li>
            <li><strong style={{ color: '#111827' }}>useEvents()</strong> - Fetch events list</li>
            <li><strong style={{ color: '#111827' }}>useActiveEvents()</strong> - Fetch active events</li>
            <li><strong style={{ color: '#111827' }}>useTrendingEvents()</strong> - Fetch trending events</li>
            <li><strong style={{ color: '#111827' }}>useEventBySlug(slug)</strong> - Fetch event by slug</li>
          </ul>

          <h3 style={{ 
            fontSize: '1.25rem', 
            marginTop: '1.5rem', 
            marginBottom: '1rem',
            color: '#111827'
          }}>
            Usage Example:
          </h3>
          <pre style={{ 
            overflow: 'auto', 
            fontSize: '0.875rem',
            backgroundColor: '#1f2937',
            color: '#f9fafb',
            padding: '1rem',
            borderRadius: '0.25rem',
          }}>
{`// Import
import { polymarketApi } from '@/lib/api';
import { useActiveEvents, useMarketBySlug } from '@/lib/hooks';

// Direct API call
const markets = await polymarketApi.markets.getMarkets({ limit: 10 });

// Using React hooks
const { events, isLoading, error } = useActiveEvents({ limit: 20 });
const { market } = useMarketBySlug('presidential-election-2024');`}
          </pre>
        </div>
      </div>
    </div>
  );
}

