'use client';

import { motion } from 'framer-motion';
import type { Event } from '../../../types/polymarket';
import { ChevronRightIcon } from '../../components/icons/ChevronRightIcon';

interface CalendarItemProps {
  event: Event;
  isDarkMode?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  onClick?: () => void;
}

export default function CalendarItem({ event, isDarkMode = true, isFirst = false, isLast = false, onClick }: CalendarItemProps) {
  // Format volume or liquidity
  const formatAmount = (amount?: number | null) => {
    if (!amount) return '$0';
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}m`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}k`;
    }
    return `$${amount.toFixed(0)}`;
  };

  // Helper to check if this is a sports event
  const isSportsEvent = (): boolean => {
    if (!event.markets || event.markets.length === 0) return false;
    return event.markets.some(m => m.gameStartTime);
  };

  // Helper to parse team names from event title
  const getTeamNamesFromTitle = (): { teamA: string; teamB: string } | null => {
    const title = event.title || '';
    // Match patterns like "Team A vs. Team B" or "Team A vs Team B"
    const vsPattern = /(.+?)\s+vs\.?\s+(.+)/i;
    const match = title.match(vsPattern);

    if (match) {
      return {
        teamA: match[1].trim(),
        teamB: match[2].trim(),
      };
    }

    return null;
  };

  // Helper to find the moneyline market for sports events
  const findMoneylineMarket = () => {
    if (!event.markets || event.markets.length === 0) return null;

    // For sports events with multiple markets, find the moneyline market
    // Moneyline market pattern: "Team vs. Team" with no colons, no O/U, no Spread, no 1H, no Total
    const moneylineMarket = event.markets.find(m => {
      const q = m.question || '';
      // Match "Team vs. Team" pattern - simple format with no extra indicators
      return /^[^:]+\s+vs\.?\s+[^:]+$/.test(q) &&
        !q.includes('O/U') &&
        !q.includes('Spread') &&
        !q.includes('1H') &&
        !q.includes('Total');
    });

    return moneylineMarket || event.markets[0]; // Fall back to first market if no moneyline found
  };

  // Get market info - check if it's a yes/no or multi-outcome market
  const getMarketInfo = () => {
    if (!event.markets || event.markets.length === 0) {
      return { type: 'none', odds: null, winner: null };
    }

    // Check if this is a GMP (Group Market Prediction) event with multiple markets
    const isGMP = event.markets.length > 1;

    // For GMP events with multiple yes/no markets, find the most likely option
    if (isGMP && !isSportsEvent()) {
      let bestMarket = null;
      let bestYesPrice = 0;

      // Iterate through all markets to find the one with the highest "Yes" probability
      for (const market of event.markets) {
        try {
          const outcomes = market.outcomes ? JSON.parse(market.outcomes) : [];
          const prices = market.outcomePrices ? JSON.parse(market.outcomePrices) : [];

          // Check if it's a yes/no market
          const yesIndex = outcomes.findIndex((o: string) => o && o.toLowerCase() === 'yes');

          if (yesIndex !== -1 && prices[yesIndex]) {
            const yesPrice = parseFloat(prices[yesIndex]);
            if (yesPrice > bestYesPrice) {
              bestYesPrice = yesPrice;
              bestMarket = market;
            }
          }
        } catch (e) {
          // Skip markets with parsing errors
          continue;
        }
      }

      // If we found a likely market, display it
      if (bestMarket && bestYesPrice > 0.1) { // Only show if at least 10% probability
        const optionName = bestMarket.groupItemTitle || bestMarket.question || 'Unknown';
        const odds = Math.round(bestYesPrice * 100);
        return { type: 'multi', odds, winner: optionName };
      }
    }

    // For sports events, try to find the moneyline market
    const market = isSportsEvent() ? findMoneylineMarket() : event.markets[0];

    if (!market) {
      return { type: 'none', odds: null, winner: null };
    }

    // Parse outcomes to determine if yes/no or multi-outcome
    let outcomes: string[] = [];
    try {
      outcomes = market.outcomes ? JSON.parse(market.outcomes) : [];
    } catch (e) {
      outcomes = [];
    }

    // Parse prices
    let prices: string[] = [];
    try {
      prices = market.outcomePrices ? JSON.parse(market.outcomePrices) : [];
    } catch (e) {
      prices = [];
    }

    // Check if it's a yes/no market (exactly 2 outcomes with "Yes" and "No")
    const isYesNoMarket = outcomes.length === 2 &&
      outcomes.some(o => o && o.toLowerCase() === 'yes') &&
      outcomes.some(o => o && o.toLowerCase() === 'no');

    if (isYesNoMarket) {
      // Yes/No market - find which outcome has higher odds
      const yesIndex = outcomes.findIndex(o => o.toLowerCase() === 'yes');
      const noIndex = outcomes.findIndex(o => o.toLowerCase() === 'no');

      if (yesIndex !== -1 && noIndex !== -1 && prices[yesIndex] && prices[noIndex]) {
        const yesPrice = parseFloat(prices[yesIndex]);
        const noPrice = parseFloat(prices[noIndex]);

        // Determine which is more likely
        const likelyOutcome = yesPrice > noPrice ? 'Yes' : 'No';
        const likelyOdds = Math.round(Math.max(yesPrice, noPrice) * 100);

        // For sports events, try to extract team names from title
        if (isSportsEvent()) {
          const teams = getTeamNamesFromTitle();
          const marketQuestion = market.question || '';

          // Check if the question mentions one of the teams (e.g., "Will Rangers FC win?")
          if (teams) {
            // Try to determine which team the question is about
            const isAboutTeamA = marketQuestion.toLowerCase().includes(teams.teamA.toLowerCase());
            const isAboutTeamB = marketQuestion.toLowerCase().includes(teams.teamB.toLowerCase());

            if (isAboutTeamA) {
              // Question is about Team A winning
              const winningTeam = likelyOutcome === 'Yes' ? teams.teamA : teams.teamB;
              return { type: 'yesno-contextual', odds: likelyOdds, winner: winningTeam };
            } else if (isAboutTeamB) {
              // Question is about Team B winning
              const winningTeam = likelyOutcome === 'Yes' ? teams.teamB : teams.teamA;
              return { type: 'yesno-contextual', odds: likelyOdds, winner: winningTeam };
            }
          }
        }

        // Extract meaningful information from the title for context
        // Look for patterns like "Bitcoin above X", "Ethereum price", etc.
        const title = event.title || '';
        let contextText = null;

        // The actual price value is in groupItemTitle (e.g., "84,000", "2.20")
        const priceValue = market.groupItemTitle;

        // Patterns to extract meaningful context
        const aboveMatch = title.match(/(.*?)\s+above/i);
        const belowMatch = title.match(/(.*?)\s+below/i);
        const overMatch = title.match(/(.*?)\s+over/i);
        const underMatch = title.match(/(.*?)\s+under/i);
        const priceMatch = title.match(/(.*?)\s+price/i);

        if ((aboveMatch || belowMatch || overMatch || underMatch) && priceValue) {
          // For "above/below/over/under" patterns with price value, show the outcome with direction
          const direction = aboveMatch ? 'Above' : belowMatch ? 'Below' : overMatch ? 'Over' : 'Under';

          // Format the price value (add $ if it looks like a price and doesn't have it)
          const formattedValue = priceValue.includes('$') ? priceValue : `$${priceValue}`;

          // Show the likely outcome with context
          if (likelyOutcome === 'Yes') {
            contextText = `${direction} ${formattedValue}`;
          } else {
            // If No is more likely, flip the direction
            const oppositeDir = direction === 'Above' || direction === 'Over' ? 'Below' : 'Above';
            contextText = `${oppositeDir} ${formattedValue}`;
          }
        } else if (priceMatch) {
          // For generic price questions, just show Yes/No
          contextText = likelyOutcome;
        } else {
          // For other yes/no markets, show the outcome
          contextText = likelyOutcome;
        }

        return { type: 'yesno-contextual', odds: likelyOdds, winner: contextText };
      }

      return { type: 'none', odds: null, winner: null };
    } else if (outcomes.length >= 2 && prices.length >= 2) {
      // Multi-outcome market - find likely winner
      let maxPrice = 0;
      let maxIndex = -1;

      prices.forEach((price: string, index: number) => {
        const priceNum = parseFloat(price);
        if (priceNum > maxPrice) {
          maxPrice = priceNum;
          maxIndex = index;
        }
      });

      if (maxIndex !== -1 && maxIndex < outcomes.length) {
        const winnerOdds = Math.round(maxPrice * 100);
        const winnerName = outcomes[maxIndex];
        return { type: 'multi', odds: winnerOdds, winner: winnerName };
      }
    }

    return { type: 'none', odds: null, winner: null };
  };

  const marketInfo = getMarketInfo();
  const volume = event.volume || event.volume24hr || 0;
  const liquidity = event.liquidity || 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          opacity: { duration: 0.2 }
        }}
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          paddingTop: isFirst ? '20px' : '16px',
          paddingBottom: '16px',
          position: 'relative',
          cursor: onClick ? 'pointer' : 'default',
        }}
        whileHover={{
          opacity: onClick ? 0.8 : 1,
          transition: { duration: 0.2 }
        }}
      >
        {/* Underline - 95% width, centered (hidden on last item) */}
        {!isLast && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: '2.5%',
              width: '95%',
              height: '1px',
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(24, 24, 24, 0.1)',
            }}
          />
        )}
        {/* Event Image */}
        {event.image && (
          <img
            src={event.image}
            alt=""
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              objectFit: 'cover',
              flexShrink: 0,
            }}
          />
        )}

        {/* Event Info */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            maxWidth: '60%',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {/* Event Title */}
          <div
            className={isDarkMode ? 'text-white' : ''}
            style={{
              fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
              fontSize: '15px',
              fontWeight: 500,
              lineHeight: '1.3',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              cursor: 'pointer',
              transition: 'opacity 0.2s ease',
              color: isDarkMode ? 'white' : '#181818',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            {event.title || 'Untitled Event'}
          </div>

          {/* Volume & Liquidity Subline */}
          <div
            className={isDarkMode ? 'text-white' : ''}
            style={{
              fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
              fontSize: '12px',
              fontWeight: 400,
              opacity: 0.6,
              color: isDarkMode ? 'white' : '#181818',
            }}
          >
            {formatAmount(volume)} Vol. • {formatAmount(liquidity)} Liq.
          </div>
        </div>

        {/* Odds Section on Right */}
        {marketInfo.odds !== null && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginLeft: 'auto',
              flexShrink: 0,
              alignSelf: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
              }}
            >
              {/* Odds Percentage */}
              <div
                className={isDarkMode ? 'text-white' : ''}
                style={{
                  fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                  fontSize: '18px',
                  fontWeight: 600,
                  color: isDarkMode ? 'white' : '#181818',
                }}
              >
                {marketInfo.odds}%
              </div>

              {/* Winner Name (for multi-outcome and contextual yes/no markets) */}
              {(marketInfo.type === 'multi' || marketInfo.type === 'yesno-contextual') && marketInfo.winner && (
                <div
                  className={isDarkMode ? 'text-white' : ''}
                  style={{
                    fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                    fontSize: '11px',
                    fontWeight: 400,
                    opacity: 0.7,
                    maxWidth: '80px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    textAlign: 'center',
                    color: isDarkMode ? 'white' : '#181818',
                  }}
                >
                  {marketInfo.winner}
                </div>
              )}
            </div>

            {/* Chevron Icon */}
            <ChevronRightIcon size="sm" className={`${isDarkMode ? 'text-white' : 'text-[#181818]'} opacity-85`} />
          </div>
        )}
      </motion.div>
    </>
  );
}

