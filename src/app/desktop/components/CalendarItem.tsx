'use client';

import { motion } from 'framer-motion';
import { ChevronRightIcon } from '../../components/icons/ChevronRightIcon';

interface CalendarItemProps {
  event: any; // Accept any event type to handle both old and new API formats
  isDarkMode?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  onClick?: () => void;
}

export default function CalendarItem({ event, isDarkMode = true, isFirst = false, isLast = false, onClick }: CalendarItemProps) {
  // Get title from either 'question' (new API) or 'title' (old API)
  const eventTitle = event.question || event.title || 'Untitled Event';
  
  // Format volume or liquidity
  const formatAmount = (amount?: number | string | null) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (!numAmount) return '$0';
    if (numAmount >= 1000000) {
      return `$${(numAmount / 1000000).toFixed(1)}m`;
    } else if (numAmount >= 1000) {
      return `$${(numAmount / 1000).toFixed(0)}k`;
    }
    return `$${numAmount.toFixed(0)}`;
  };

  // Helper to check if this is a sports event
  const isSportsEvent = (): boolean => {
    // Check title for "vs" pattern
    return /(.+?)\s+(?:vs\.?|@)\s+(.+)/i.test(eventTitle);
  };

  // Helper to parse team names from event title
  const getTeamNamesFromTitle = (): { teamA: string; teamB: string } | null => {
    // Match patterns like "Team A vs. Team B" or "Team A vs Team B"
    const vsPattern = /(.+?)\s+vs\.?\s+(.+)/i;
    const match = eventTitle.match(vsPattern);

    if (match) {
      return {
        teamA: match[1].trim(),
        teamB: match[2].trim(),
      };
    }

    return null;
  };

  // Get market info from the event data (new API format has outcomes/outcomePrices at top level)
  const getMarketInfo = () => {
    // Try to parse outcomes and prices from the event itself (new API format)
    let outcomes: string[] = [];
    let prices: string[] = [];
    
    try {
      outcomes = event.outcomes ? JSON.parse(event.outcomes) : [];
    } catch (e) {
      outcomes = [];
    }

    try {
      prices = event.outcomePrices ? JSON.parse(event.outcomePrices) : [];
    } catch (e) {
      prices = [];
    }

    if (outcomes.length === 0 || prices.length === 0) {
      return { type: 'none', odds: null, winner: null };
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
          if (teams) {
            // Try to determine which team is favored based on question context
            const questionLower = eventTitle.toLowerCase();
            const isAboutTeamA = questionLower.includes(teams.teamA.toLowerCase());
            const isAboutTeamB = questionLower.includes(teams.teamB.toLowerCase());

            if (isAboutTeamA) {
              const winningTeam = likelyOutcome === 'Yes' ? teams.teamA : teams.teamB;
              return { type: 'yesno-contextual', odds: likelyOdds, winner: winningTeam };
            } else if (isAboutTeamB) {
              const winningTeam = likelyOutcome === 'Yes' ? teams.teamB : teams.teamA;
              return { type: 'yesno-contextual', odds: likelyOdds, winner: winningTeam };
            }
          }
        }

        return { type: 'yesno-contextual', odds: likelyOdds, winner: likelyOutcome };
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
  
  // Handle both string and number formats for volume/liquidity
  const volume = event.volumeNum || event.volume || event.volume24hr || 0;
  const liquidity = event.liquidityNum || event.liquidity || 0;

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
              color: isDarkMode ? 'white' : '#242424',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            {eventTitle}
          </div>

          {/* Volume & Liquidity Subline */}
          <div
            className={isDarkMode ? 'text-white' : ''}
            style={{
              fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
              fontSize: '12px',
              fontWeight: 400,
              opacity: 0.6,
              color: isDarkMode ? 'white' : '#242424',
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
                  color: isDarkMode ? 'white' : '#242424',
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
                    color: isDarkMode ? 'white' : '#242424',
                  }}
                >
                  {marketInfo.winner}
                </div>
              )}
            </div>

            {/* Chevron Icon */}
            <ChevronRightIcon size="sm" className={`${isDarkMode ? 'text-white' : 'text-[#242424]'} opacity-85`} />
          </div>
        )}
      </motion.div>
    </>
  );
}

