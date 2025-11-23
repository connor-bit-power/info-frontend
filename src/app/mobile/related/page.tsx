'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import type { HeadlineItem, MarketSummary } from '@/types/news-api';

import RelatedMarket from '../components/RelatedMarket';

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

                    {headline.markets?.map((market: MarketSummary) => (
                        <RelatedMarket key={market.id} market={market} />
                    ))}

                    {(!headline.markets || headline.markets.length === 0) && (
                        <div className="text-center text-gray-500 py-8">
                            No related markets found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
