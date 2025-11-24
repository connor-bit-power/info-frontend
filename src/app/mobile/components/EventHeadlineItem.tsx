import React from 'react';
import ArrowUpIcon from '../../../components/icons/ArrowUpIcon';
import ArrowDownIcon from '../../../components/icons/ArrowDownIcon';
import type { MarketHeadlineDetail, HeadlineSentiment } from '@/types/news-api';

interface EventHeadlineItemProps {
    headline: MarketHeadlineDetail;
    isFocused: boolean;
    isDarkMode?: boolean;
    getSentimentColor: (sentiment: HeadlineSentiment | null) => string;
    isFirst: boolean;
    priceChange?: number | null;
}

export default function EventHeadlineItem({
    headline,
    isFocused,
    isDarkMode,
    getSentimentColor,
    isFirst,
    priceChange,
}: EventHeadlineItemProps) {

    // Calculate time string (abbreviated)
    const getTimeString = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffWeeks = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));

        if (diffHrs < 24) {
            return `${diffHrs} hrs`;
        } else if (diffDays < 7) {
            return `${diffDays}D`;
        } else {
            return `${diffWeeks}W`;
        }
    };

    const sentiment = headline.sentiment || 'neutral';
    const isBullish = sentiment === 'bullish';
    const isBearish = sentiment === 'bearish';
    const sentimentColor = isBullish ? '#00FF00' : isBearish ? '#FF0000' : '#808080';

    return (
        <div
            data-headline-id={headline.id}
            data-headline-date={headline.published_at}
            className="transition-all duration-300 ease-out"
            style={{
                backgroundColor: isFocused ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
                padding: isFocused ? '12px' : '0',
                marginLeft: isFocused ? '-12px' : '0',
                marginRight: isFocused ? '-12px' : '0',
                borderRadius: isFocused ? '12px' : '0',
                marginTop: isFirst ? '0px' : '24px',
                display: 'flex',
                flexDirection: 'row',
                gap: '12px',
                alignItems: 'flex-start',
            }}
        >
            {/* Left Column: Sentiment & Time */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '40px',
                gap: '4px',
                paddingTop: '2px',
            }}>
                {/* Row 1: Arrow + Percentage */}
                {priceChange !== null && priceChange !== undefined && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        color: sentimentColor,
                        fontSize: '14px',
                        fontWeight: 600,
                        fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                    }}>
                        {isBullish && <ArrowUpIcon width={10} height={10} color={sentimentColor} />}
                        {isBearish && <ArrowDownIcon width={10} height={10} color={sentimentColor} />}
                        <span>{Math.abs(priceChange).toFixed(0)}%</span>
                    </div>
                )}

                {/* Row 2: Time */}
                <div style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '14px',
                    fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                }}>
                    {getTimeString(headline.published_at)}
                </div>
            </div>

            {/* Right Column: Headline Title */}
            <p
                className="text-white transition-all duration-300 ease-out"
                style={{
                    color: isFocused ? '#FFD700' : '#FFFFFF',
                    fontWeight: isFocused ? 500 : 400,
                    fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                    fontSize: '16px',
                    lineHeight: '1.4',
                    margin: 0,
                    flex: 1,
                }}
            >
                {headline.title}
            </p>
        </div>
    );
}
