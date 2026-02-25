
import { useState, useEffect } from 'react';
import { HotSpotArea } from '../types';
import { getTrendingPlaces } from '../services/placeService';

export const useHotspots = () => {
    const [hotspots, setHotspots] = useState<HotSpotArea[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchHotspots = async () => {
            setIsLoading(true);
            try {
                // For now, we aggregate dynamically on the client
                const trending = await getTrendingPlaces();
                setHotspots(trending);
            } catch (e) {
                console.error("Failed to load hotspots", e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHotspots();
    }, []);

    return { hotspots, isLoading };
};
