'use client';

import { useRouter, useParams } from 'next/navigation';
import EventView from '../../components/EventView';

export default function MarketPage() {
    const router = useRouter();
    const params = useParams();
    const marketId = params.id as string;

    return (
        <EventView
            marketId={marketId}
            onBack={() => router.back()}
        />
    );
}
