
import { db } from '../firebase';
import { collection, query, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { Post, HotSpotArea, PlaceCategory } from '../types';

/**
 * Helper to extract Area from Address
 * Heuristic: First part of the address string, or 2nd part if Google formatted?
 * Google Format: "Name, Area, City, State" (in secondary_text) limits usually to "Area, City, State"
 * We want "Area".
 */
const getAreaFromAddress = (address?: string): string => {
    if (!address || address === 'Unknown' || address === 'Unknown Address') return 'Trending Now';
    // Heuristic: "Cyber Hub, DLF Cyber City, Gurgaon" -> "DLF Cyber City"
    // If address is "Sector 29, Gurgaon", we want "Sector 29"
    const parts = address.split(',').map(p => p.trim());
    if (parts.length > 0) return parts[0];
    return 'Trending Now';
};

/**
 * Client-side aggregation of Trending Places.
 */
export const getTrendingPlaces = async (): Promise<HotSpotArea[]> => {
    try {
        const postsRef = collection(db, 'posts');
        const q = query(postsRef, orderBy('visitDate', 'desc'), limit(100));
        const snapshot = await getDocs(q);

        // Group by Area -> Place
        const areaGroups: Record<string, {
            areaName: string,
            places: Record<string, { count: number, category: PlaceCategory, sampleAddress?: string }>
        }> = {};

        snapshot.docs.forEach(doc => {
            const post = doc.data() as Post;
            const placeName = post.location.name;
            // Use shortLocation if available (AI Area), else fallback to address heuristic
            const areaName = post.location.shortLocation || getAreaFromAddress(post.location.address);

            if (!areaGroups[areaName]) {
                areaGroups[areaName] = { areaName, places: {} };
            }

            // Simple Category Heuristic (can be improved)
            let category: PlaceCategory = 'dining';
            const lowerName = placeName.toLowerCase();
            if (lowerName.includes('bar') || lowerName.includes('pub') || lowerName.includes('brew') || lowerName.includes('social')) category = 'bar';
            else if (lowerName.includes('cafe') || lowerName.includes('coffee') || lowerName.includes('starbucks')) category = 'cafe';
            else if (lowerName.includes('club') || lowerName.includes('lounge') || lowerName.includes('night')) category = 'club';

            if (!areaGroups[areaName].places[placeName]) {
                areaGroups[areaName].places[placeName] = {
                    count: 0,
                    category,
                    sampleAddress: post.location.address
                };
            }
            areaGroups[areaName].places[placeName].count++;
        });

        // Convert to HotSpotArea[]
        const hotSpotAreas: HotSpotArea[] = Object.values(areaGroups).map(group => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const places = Object.entries(group.places).map(([name, data]) => ({
                name,
                count: data.count,
                category: data.category,
                // Determine trend based on count relative to others?
                trend: data.count > 2 ? 'up' : 'stable',
                // Pass specific address context if possible? 
                // The UI hotSpotPlace type might need extension if we want to pass address
                // For now, we trust name + area context implies location.
            } as any));

            // Sort places by count
            places.sort((a, b) => b.count - a.count);

            return {
                area: group.areaName,
                places: places.slice(0, 5) // Top 5 per area
            };
        });

        // Sort areas by total activity
        hotSpotAreas.sort((a, b) => {
            const totalA = a.places.reduce((sum, p) => sum + p.count, 0);
            const totalB = b.places.reduce((sum, p) => sum + p.count, 0);
            return totalB - totalA;
        });

        // Fallback if empty
        return hotSpotAreas.length > 0 ? hotSpotAreas : [{ area: "Trending Now", places: [] }];

    } catch (error) {
        console.error("Error fetching trending places:", error);
        return [];
    }
};

/**
 * Fetch Place Details from Google Maps API
 * Note: Requires 'places' library to be loaded (window.google.maps.places)
 */
export const getPlaceDetails = async (placeName: string): Promise<any> => {
    return new Promise((resolve) => {
        if (!window.google || !window.google.maps || !window.google.maps.places) {
            console.warn("Google Maps Places library not loaded.");
            resolve(null);
            return;
        }

        const dummyDiv = document.createElement('div');
        const service = new window.google.maps.places.PlacesService(dummyDiv);

        const request = {
            query: placeName,
            fields: ['name', 'formatted_address', 'photos', 'rating', 'user_ratings_total', 'geometry']
        };

        service.findPlaceFromQuery(request, (results: any, status: any) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
                const place = results[0];
                const photoUrl = place.photos?.[0]?.getUrl({ maxWidth: 800 });

                resolve({
                    ...place,
                    photos: photoUrl ? [photoUrl] : []
                });
            } else {
                console.warn("Place not found:", status);
                resolve(null);
            }
        });
    });
};

/**
 * Calculate Vibe Stats from Posts
 */
export const getPlaceStats = async (placeName: string, posts: Post[]): Promise<any> => {
    // 1. Busy Times (Hourly Histogram)
    const busyTimes = new Array(24).fill(0);
    posts.forEach(p => {
        const d = new Date(p.visitDate);
        // Only count past/present posts for historical busyness? 
        // Or include future plans as "predicted" busy times?
        // User asked to fix "Live Now" count for future posts.
        // Let's keep busyTimes showing ALL intent (future + past) as "Activity"
        const hour = d.getHours();
        busyTimes[hour]++;
    });

    // 2. Vibe Score (Mock Algorithm)
    const totalLikes = posts.reduce((acc, p) => acc + (p.likes || 0), 0);
    const rawScore = 75 + (totalLikes / 10) + (posts.length * 2);
    const vibeScore = Math.min(Math.floor(rawScore), 99);

    // 3. Live Count (Posts in last 2 hours AND NOT FUTURE)
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours window

    // Filter: Post date must be > 2 hours ago AND <= now (no future posts)
    const liveCount = posts.filter(p => {
        const d = new Date(p.visitDate);
        return d > twoHoursAgo && d <= now;
    }).length;

    return {
        busyTimes,
        vibeScore,
        liveCount
    };
};
