'use client';

import { useState, useEffect } from 'react';
import { polymarketApi } from '@/lib/api';
import { useTeams } from '@/lib/hooks/useSports';
import type { Event, Market, Team } from '@/types/polymarket';

export default function SportsTestPage() {
  const [nflGames, setNflGames] = useState<Event[]>([]);
  const [nbaGames, setNbaGames] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch teams data
  const { getTeamById } = useTeams({ limit: 1000 });

  useEffect(() => {
    async function fetchSportsGames() {
      setIsLoading(true);
      setError(null);

      try {
        // NFL tag ID from sports metadata: 450
        // NBA tag ID from sports metadata: 745
        
        // Fetch NFL games using tag_id
        const nflEvents = await polymarketApi.events.getEvents({
          tag_id: 450,
          closed: false,
          limit: 100,
          order: 'id',
          ascending: false,
        });

        // Fetch NBA games using tag_id
        const nbaEvents = await polymarketApi.events.getEvents({
          tag_id: 745,
          closed: false,
          limit: 100,
          order: 'id',
          ascending: false,
        });

        console.log('📊 NFL Events fetched:', nflEvents.length);
        console.log('📊 NBA Events fetched:', nbaEvents.length);
        console.log('📊 Sample NFL event:', nflEvents[0]);
        console.log('📊 Sample NBA event:', nbaEvents[0]);
        
        // Debug: Check what's in the markets - look for actual game with teams
        const nflGameEvents = nflEvents.filter(e => e.title?.includes('vs'));
        const nbaGameEvents = nbaEvents.filter(e => e.title?.includes('vs'));
        
        if (nflGameEvents[0]?.markets && nflGameEvents[0].markets.length > 0) {
          console.log('📊 NFL Game Event:', nflGameEvents[0].title);
          console.log('📊 NFL Total Markets:', nflGameEvents[0].markets.length);
          console.log('📊 NFL Market Questions:', nflGameEvents[0].markets.map(m => m.question));
          
          // Find moneyline market - should be just "Team vs. Team" with nothing after
          const moneylineMarket = nflGameEvents[0].markets.find(m => {
            const q = m.question || '';
            // Match "Team vs. Team" pattern with optional colon but nothing after
            return /^[^:]+\s+vs\.?\s+[^:]+$/.test(q) && !q.includes('O/U') && !q.includes('Spread');
          });
          
          if (moneylineMarket) {
            console.log('📊 NFL Moneyline Market:', moneylineMarket.question);
            console.log('📊 NFL Moneyline Price Fields:', {
              outcomePrices: moneylineMarket.outcomePrices,
              lastTradePrice: moneylineMarket.lastTradePrice,
              bestBid: moneylineMarket.bestBid,
              bestAsk: moneylineMarket.bestAsk,
            });
          } else {
            console.log('📊 NFL Moneyline Market: NOT FOUND');
          }
        }
        
        if (nbaGameEvents[0]?.markets && nbaGameEvents[0].markets.length > 0) {
          console.log('📊 NBA Game Event:', nbaGameEvents[0].title);
          console.log('📊 NBA Full Market:', nbaGameEvents[0].markets[0]);
          console.log('📊 NBA Market Price Fields:', {
            outcomePrices: nbaGameEvents[0].markets[0].outcomePrices,
            lastTradePrice: nbaGameEvents[0].markets[0].lastTradePrice,
            bestBid: nbaGameEvents[0].markets[0].bestBid,
            bestAsk: nbaGameEvents[0].markets[0].bestAsk,
          });
        }

        // Filter for actual sports games (have gameStartTime OR team IDs)
        // Also filter out finished games (where one team has 100% odds)
        const nflSportsGames = nflEvents.filter(event => {
          if (!event.markets || event.markets.length === 0) return false;
          
          const hasGameTime = event.markets.some(m => m.gameStartTime || m.teamAID || m.teamBID);
          if (!hasGameTime) return false;
          
          // Filter out finished games
          const market = event.markets[0];
          if (market.outcomePrices) {
            const prices = JSON.parse(market.outcomePrices);
            const price1 = parseFloat(prices[0]);
            const price2 = parseFloat(prices[1]);
            // Skip if either outcome is 100% (game finished)
            if (price1 >= 0.99 || price2 >= 0.99 || price1 <= 0.01 || price2 <= 0.01) {
              return false;
            }
          }
          
          return true;
        });

        const nbaSportsGames = nbaEvents.filter(event => {
          if (!event.markets || event.markets.length === 0) return false;
          
          const hasGameTime = event.markets.some(m => m.gameStartTime || m.teamAID || m.teamBID);
          if (!hasGameTime) return false;
          
          // Filter out finished games
          const market = event.markets[0];
          if (market.outcomePrices) {
            const prices = JSON.parse(market.outcomePrices);
            const price1 = parseFloat(prices[0]);
            const price2 = parseFloat(prices[1]);
            // Skip if either outcome is 100% (game finished)
            if (price1 >= 0.99 || price2 >= 0.99 || price1 <= 0.01 || price2 <= 0.01) {
              return false;
            }
          }
          
          return true;
        });

        console.log('📊 NFL Sports Games:', nflSportsGames.length);
        console.log('📊 NBA Sports Games:', nbaSportsGames.length);

        // Sort by game start time
        nflSportsGames.sort((a, b) => {
          const aTime = a.markets?.[0]?.gameStartTime || '';
          const bTime = b.markets?.[0]?.gameStartTime || '';
          return new Date(aTime).getTime() - new Date(bTime).getTime();
        });

        nbaSportsGames.sort((a, b) => {
          const aTime = a.markets?.[0]?.gameStartTime || '';
          const bTime = b.markets?.[0]?.gameStartTime || '';
          return new Date(aTime).getTime() - new Date(bTime).getTime();
        });

        setNflGames(nflSportsGames);
        setNbaGames(nbaSportsGames);
      } catch (err) {
        console.error('Error fetching sports games:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch games');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSportsGames();
  }, []);

  const getTeamsForGame = (event: Event): { teamA: Team | undefined; teamB: Team | undefined; teamAName: string; teamBName: string } => {
    // First try to get teams from team IDs (if they exist)
    if (event.markets && event.markets.length > 0) {
      const market = event.markets[0];
      const teamAID = market.teamAID ? parseInt(market.teamAID) : undefined;
      const teamBID = market.teamBID ? parseInt(market.teamBID) : undefined;

      if (teamAID && teamBID) {
        const teamA = getTeamById(teamAID);
        const teamB = getTeamById(teamBID);
        return {
          teamA,
          teamB,
          teamAName: teamA?.name || teamA?.abbreviation || 'Team A',
          teamBName: teamB?.name || teamB?.abbreviation || 'Team B',
        };
      }
    }

    // Otherwise, parse team names from the title
    const title = event.title || '';
    
    // Common patterns: "Team A vs. Team B", "Team A vs Team B", "Team A @ Team B"
    const vsPattern = /(.+?)\s+(?:vs\.?|@)\s+(.+)/i;
    const match = title.match(vsPattern);
    
    if (match) {
      const teamAName = match[1].trim();
      const teamBName = match[2].trim();
      
      return {
        teamA: undefined,
        teamB: undefined,
        teamAName,
        teamBName,
      };
    }

    return {
      teamA: undefined,
      teamB: undefined,
      teamAName: 'Team A',
      teamBName: 'Team B',
    };
  };

  const formatGameTime = (gameStartTime: string) => {
    const date = new Date(gameStartTime);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderGameCard = (event: Event, sport: string) => {
    const { teamA, teamB, teamAName, teamBName } = getTeamsForGame(event);
    
    // Find the moneyline market (not spread or totals)
    // The moneyline market is just "Team vs. Team" with no additional text
    let market = event.markets?.[0];
    if (event.markets && event.markets.length > 0) {
      // Try to find moneyline market - should be just "Team vs. Team" pattern
      const moneylineMarket = event.markets.find(m => {
        const q = m.question || '';
        // Match "Team vs. Team" pattern - no colons, no O/U, no Spread, no 1H
        return /^[^:]+\s+vs\.?\s+[^:]+$/.test(q) && 
               !q.includes('O/U') && 
               !q.includes('Spread') && 
               !q.includes('1H') &&
               !q.includes('Total');
      });
      if (moneylineMarket) {
        market = moneylineMarket;
      }
    }
    
    const gameTime = market?.gameStartTime ? formatGameTime(market.gameStartTime) : 'TBD';
    
    // Get real-time odds from bestBid/bestAsk or fall back to outcomePrices
    // For sports betting markets, we typically show the "Yes" price (probability of Team A winning)
    let teamAProb = 50;
    let teamBProb = 50;
    
    if (market) {
      // Use bestBid for more accurate real-time odds if available
      if (market.bestBid !== undefined && market.bestBid !== null) {
        teamAProb = Math.round(market.bestBid * 100);
        teamBProb = 100 - teamAProb;
      } 
      // Fall back to lastTradePrice if available
      else if (market.lastTradePrice !== undefined && market.lastTradePrice !== null) {
        teamAProb = Math.round(market.lastTradePrice * 100);
        teamBProb = 100 - teamAProb;
      }
      // Fall back to outcomePrices as last resort
      else if (market.outcomePrices) {
        const outcomePrices = JSON.parse(market.outcomePrices);
        teamAProb = Math.round(parseFloat(outcomePrices[0]) * 100);
        teamBProb = Math.round(parseFloat(outcomePrices[1]) * 100);
      }
    }

    return (
      <div
        key={event.id}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow"
      >
        {/* Game Time */}
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {gameTime}
        </div>

        {/* Teams */}
        <div className="space-y-4">
          {/* Team A */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              {teamA?.logo && (
                <img
                  src={teamA.logo}
                  alt={teamAName}
                  className="w-12 h-12 object-contain"
                />
              )}
              <div className="flex-1">
                <div className="font-semibold text-lg text-gray-900 dark:text-white">
                  {teamAName}
                </div>
                {teamA?.record && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">{teamA.record}</div>
                )}
              </div>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {teamAProb}¢
            </div>
          </div>

          {/* VS Divider */}
          <div className="text-center text-gray-400 text-sm font-medium">
            VS
          </div>

          {/* Team B */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              {teamB?.logo && (
                <img
                  src={teamB.logo}
                  alt={teamBName}
                  className="w-12 h-12 object-contain"
                />
              )}
              <div className="flex-1">
                <div className="font-semibold text-lg text-gray-900 dark:text-white">
                  {teamBName}
                </div>
                {teamB?.record && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">{teamB.record}</div>
                )}
              </div>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {teamBProb}¢
            </div>
          </div>
        </div>

        {/* Event Slug */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <a
            href={`https://polymarket.com/event/${event.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            View on Polymarket →
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 overflow-y-auto">
      <div className="max-w-7xl mx-auto pb-20">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Sports Games Test Page
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Testing NFL and NBA game data from Polymarket API
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading games...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-8">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* NFL Section */}
        {!isLoading && !error && (
          <>
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  NFL Games
                </h2>
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                  {nflGames.length} games
                </span>
              </div>

              {nflGames.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400">No NFL games found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {nflGames.map(game => renderGameCard(game, 'NFL'))}
                </div>
              )}
            </div>

            {/* NBA Section */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  NBA Games
                </h2>
                <span className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-3 py-1 rounded-full text-sm font-medium">
                  {nbaGames.length} games
                </span>
              </div>

              {nbaGames.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400">No NBA games found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {nbaGames.map(game => renderGameCard(game, 'NBA'))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

