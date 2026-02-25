import { Post, User, RSVPStatus } from '../types';

export type SortDateType = 'posted' | 'visited';
export type FeedTab = 'inner-circle' | 'trend' | 'places' | 'polls';

// --- SCORING CONFIGURATION ---
const POINTS = {
    COMMENT: 1,
    REACTION: 0.5, // Likes
    RSVP_GOING: 2, // Locked In
    RSVP_MAYBE: 1, // Vibes TBD
    RSVP_INTERESTED: 0.5, // Lowkey curious
    RSVP_NOT_GOING: 0 // Out
};

// --- HELPER FUNCTIONS ---

export const getInteractionScore = (post: Post): number => {
    let score = 0;

    // Comments
    score += (post.comments?.length || 0) * POINTS.COMMENT;

    // Likes (Reactions)
    score += (post.likes || 0) * POINTS.REACTION;

    // RSVPs
    if (post.rsvps) {
        Object.values(post.rsvps).forEach(status => {
            Object.values(post.rsvps).forEach(status => {
                const s = status as string;
                // Check against Enum Values or common string variants
                if (s === RSVPStatus.WILL_JOIN || s === 'Going') score += POINTS.RSVP_GOING;
                else if (s === RSVPStatus.MAYBE || s === 'Maybe') score += POINTS.RSVP_MAYBE;
                else if (s === RSVPStatus.INTERESTED || s === 'Interested') score += POINTS.RSVP_INTERESTED;
                else if (s === RSVPStatus.NOT_THIS_TIME || s === 'Not Going') score += POINTS.RSVP_NOT_GOING;
            });
        });
    }

    return score;
};

// Definition of "Live Drop-In":
// A post is a "drop-in" if it has a visitDate.
// Prioritization Rule: "Prioritize Drop-ins... after expiry... show after live".
// Expiry assumption: 2 hours after visitDate? Or just End of Day?
// Let's assume "Active" if visitDate is in the future OR less than 3 hours ago.
export const isLiveDropIn = (post: Post): boolean => {
    if (!post.visitDate) return false;

    const visitTime = new Date(post.visitDate).getTime();
    const now = Date.now();
    const threeHoursAgo = now - (3 * 60 * 60 * 1000);

    // Consider it "Live" if it's in the future OR within the last 3 hours
    return visitTime > threeHoursAgo;
};

export const getPostDate = (post: Post, type: SortDateType): number => {
    if (type === 'visited') {
        return new Date(post.visitDate).getTime();
    }
    // Default to posted date (createdAt) - fallback to visitDate if createdAt missing
    // Cast to any to access createdAt if it's strictly not in Type but exists in DB
    return new Date((post as any).createdAt || post.visitDate).getTime();
};

// --- MAIN ENGINE ---

export const getFeedPosts = (
    allPosts: Post[],
    currentUser: User | null,
    realInfluencers: User[], // The authoritative list of influencers
    tab: FeedTab,
    sortDateType: SortDateType,
    followedPlaces: string[],
    frequentPlaces: string[]
): Post[] => {
    let filtered = [...allPosts];
    const followingIds = currentUser?.following || [];

    // IDs of influencers that the user follows
    const myInfluencerIds = realInfluencers
        .filter(u => followingIds.includes(u.id))
        .map(u => u.id);

    // IDs of currentUser + followed influencers + followed friends? 
    // (User said "followed/friends". Assuming 'following' covers both for now).
    const innerCircleIds = [...myInfluencerIds, currentUser?.id || ''];
    // Note: If normal friends are also in 'following', they should be filtered by logic below if we only want INFLUENCERS in inner circle?
    // User said: "Posts/Drop-ins of users/infuencers followed/friends to be shown in Inner Circle"
    // So ANYONE I follow should be here.
    // BUT, the previous logic specifically filtered for 'influencer'. 
    // I will interpret "users/influencers followed" as ANY followed user.

    // However, if the user only follows 2 influencers and 0 "users", we need to know who is a "user".
    // Since I don't have a list of ALL "users" I follow (only list of influencers), I rely on `currentUser.following`
    // checks against `post.user.id`.

    // Filter Logic
    if (tab === 'inner-circle') {
        // FILTER: Followed Users + Current User
        filtered = filtered.filter(post =>
            followingIds.includes(post.user.id) || post.user.id === currentUser?.id
        );

        // SORT: Chronological (Latest -> Oldest)
        // PRIORITIZE: Drop-ins over Posts
        filtered.sort((a, b) => {
            const aLive = isLiveDropIn(a);
            const bLive = isLiveDropIn(b);

            if (aLive && !bLive) return -1; // a comes first
            if (!aLive && bLive) return 1;  // b comes first

            // Same priority? Time sort.
            return getPostDate(b, sortDateType) - getPostDate(a, sortDateType);
        });
    }
    else if (tab === 'trend') {
        // FILTER: NOT Followed Users (and NOT me)
        filtered = filtered.filter(post =>
            !followingIds.includes(post.user.id) && post.user.id !== currentUser?.id
        );

        // SORT: Popularity Score -> Date
        // PRIORITIZE: Live Drop-ins > Posts (within this logic?)
        // User: "Prioritize Drop-ins over posts... In case of clash in popularity score show the latest drop-in/post first."
        // Wait, User said: "Multiply points... then add all to arrive at popularity score. In case of clash... latest first."
        // AND THEN: "Prioritize Drop-ins over posts as they are more time sensitive"
        // This implies:
        // Bucket 1: Live Drop-ins (Sorted by Score)
        // Bucket 2: Expired/Regular Posts (Sorted by Score)

        filtered.sort((a, b) => {
            const aLive = isLiveDropIn(a);
            const bLive = isLiveDropIn(b);

            if (aLive && !bLive) return -1;
            if (!aLive && bLive) return 1;

            // Both Live or Both Not Live -> Sort by Score
            const scoreA = getInteractionScore(a);
            const scoreB = getInteractionScore(b);

            if (scoreA !== scoreB) return scoreB - scoreA; // High score first

            // Score Clash -> Date
            return getPostDate(b, sortDateType) - getPostDate(a, sortDateType);
        });
    }
    else if (tab === 'places') {
        // FILTER: Tagged Places (Any post with a location name)
        filtered = filtered.filter(post => post.location && post.location.name);

        // SORT: Popularity Score -> Date
        // PRIORITIZE: "Drop-in prioritization shall not be applicable"

        filtered.sort((a, b) => {
            const scoreA = getInteractionScore(a);
            const scoreB = getInteractionScore(b);

            if (scoreA !== scoreB) return scoreB - scoreA;

            return getPostDate(b, sortDateType) - getPostDate(a, sortDateType);
        });
    }
    else if (tab === 'polls') {
        filtered = filtered.filter(post => post.type === 'poll');
        filtered.sort((a, b) => getPostDate(b, sortDateType) - getPostDate(a, sortDateType));
    }

    return filtered;
};
