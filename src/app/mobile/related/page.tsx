'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import type { HeadlineItem, MarketSummary } from '@/types/news-api';

import RelatedMarket from '../components/RelatedMarket';
import Tile from '../components/Tile';

export default function RelatedPage() {
    const router = useRouter();
    const [headline, setHeadline] = useState<HeadlineItem | null>(null);

    useEffect(() => {
        const storedHeadline = localStorage.getItem('selectedHeadline');
        if (storedHeadline) {
            setHeadline(JSON.parse(storedHeadline));
        } else {
            // Redirect back if no headline found
            router.push('/mobile/home');
        }
    }, [router]);

    if (!headline) {
        return <div className="min-h-screen bg-[#181818] text-white p-4">Loading...</div>;
    }

    return (
        <div className="h-screen bg-[#181818] text-white flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 flex items-center gap-4 border-b border-white/10">
                <button
                    onClick={() => router.back()}
                    className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
                >
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-lg font-semibold truncate">Related Markets</h1>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2 font-sf-rounded">{headline.title}</h2>
                    <div className="text-sm text-gray-400 mb-3">
                        {new Date(headline.published_at).toLocaleDateString()} • {headline.source}
                    </div>
                    {(headline.summary || headline.lead) && (
                        <p className="text-base text-gray-300 leading-relaxed">
                            {headline.summary || headline.lead}
                        </p>
                    )}
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                        Markets ({headline.markets?.length || 0})
                    </h3>

                    {(() => {
                        const markets = headline.markets || [];
                        if (markets.length === 0) {
                            return (
                                <div className="text-center text-gray-500 py-8">
                                    No related markets found.
                                </div>
                            );
                        }

                        // Helper to find common prefix
                        const findCommonPrefix = (strs: string[]) => {
                            if (!strs.length) return '';
                            let prefix = strs[0];
                            for (let i = 1; i < strs.length; i++) {
                                while (strs[i].indexOf(prefix) !== 0) {
                                    prefix = prefix.substring(0, prefix.length - 1);
                                    if (prefix === '') return '';
                                }
                            }
                            return prefix;
                        };

                        // 1. Try to group by exact question first (for truly distinct markets)
                        const byQuestion: Record<string, MarketSummary[]> = {};
                        markets.forEach(m => {
                            if (!byQuestion[m.question]) byQuestion[m.question] = [];
                            byQuestion[m.question].push(m);
                        });

                        // If we have many small groups (mostly size 1), it implies they might be related outcomes
                        // Check if they share a significant prefix
                        const questions = markets.map(m => m.question);
                        const commonPrefix = findCommonPrefix(questions);

                        // Heuristic: If prefix is long enough (> 15 chars) and covers > 30% of the string length
                        // we treat them as one group. Only apply if we have multiple markets to avoid redundancy.
                        const isGrouped = markets.length > 1 &&
                            commonPrefix.length > 15 &&
                            commonPrefix.length > (questions[0].length * 0.3);

                        if (isGrouped) {
                            // Clean up prefix (remove trailing " be " or similar if needed, but keep it simple for now)
                            // Maybe trim trailing spaces
                            const groupTitle = commonPrefix.trim();

                            return (
                                <Tile padding="0px">
                                    <div className="flex flex-col">
                                        {/* Header */}
                                        <div className="px-6 pt-6 pb-4">
                                            <h2 style={{
                                                fontSize: '20px',
                                                fontWeight: 700,
                                                color: 'white',
                                                letterSpacing: '-0.02em',
                                                fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                                                lineHeight: '1.3'
                                            }}>
                                                {groupTitle}
                                            </h2>
                                        </div>

                                        {/* Markets List */}
                                        <div className="flex flex-col gap-1 px-6 pb-6">
                                            {markets.map((market) => {
                                                // Remove prefix from question to get custom title
                                                // Capitalize the first letter of the remainder
                                                let remainder = market.question.substring(commonPrefix.length).trim();
                                                if (remainder.length > 0) {
                                                    remainder = remainder.charAt(0).toUpperCase() + remainder.slice(1);
                                                }
                                                // If remainder is empty (exact match), show full question or "Yes/No"? 
                                                // Usually won't happen if they are distinct.

                                                return (
                                                    <RelatedMarket
                                                        key={market.id}
                                                        market={market}
                                                        showTitle={true}
                                                        customTitle={remainder || market.question}
                                                        publishedAt={headline.published_at}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                </Tile>
                            );
                        }

                        // Fallback: Render groups by question (original logic)
                        return Object.entries(byQuestion).map(([question, groupMarkets]) => (
                            <Tile key={question} padding="0px">
                                <div className="flex flex-col">
                                    {/* Header */}
                                    <div className="px-6 pt-6 pb-4">
                                        <h2 style={{
                                            fontSize: '20px',
                                            fontWeight: 700,
                                            color: 'white',
                                            letterSpacing: '-0.02em',
                                            fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                                            lineHeight: '1.3'
                                        }}>
                                            {question}
                                        </h2>
                                    </div>

                                    {/* Markets List */}
                                    <div className="flex flex-col gap-1 px-6 pb-6">
                                        {groupMarkets.map((market) => (
                                            <RelatedMarket
                                                key={market.id}
                                                market={market}
                                                showTitle={false}
                                                publishedAt={headline.published_at}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </Tile>
                        ));
                    })()}
                </div>
            </div>
        </div>
    );
}
