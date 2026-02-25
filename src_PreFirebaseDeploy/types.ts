export interface User {
  id: string;
  displayName: string;
  avatarUrl: string;
  isConnected: boolean; // P1 vs P2
  bio?: string;
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
  isInfluencer?: boolean;
  isFounder?: boolean;
  isPlaceAccount?: boolean;
  followedPlaces?: string[]; // Names of places followed by this user
  frequentPlaces?: string[]; // Names of places frequently visited
  trustScore?: number; // 0-100 score based on behavior
  interests?: string[];
}

export interface LocationInfo {
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  tags?: string[];
}

export interface Visit {
  id: string;
  user: User;
  location: LocationInfo;
  date: string; // ISO string
  durationMinutes: number;
}

export enum RSVPStatus {
  WILL_JOIN = 'Going',
  INTERESTED = 'Interested',
  MAYBE = 'Maybe',
  NOT_THIS_TIME = 'Not Going'
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}

export type ReactionType = 'heart' | 'fire' | 'party';
export type VibeType = 'Dancing' | 'Partying' | 'Chilling' | 'Dining' | 'Live Music' | 'Deep House';
export type VisibilityType = 'Public' | 'Followers Only' | 'Friends Only';

export interface Post {
  id: string;
  user: User;
  location: LocationInfo;
  visitDate: string;
  description: string;
  rsvps: { [userId: string]: RSVPStatus };
  comments: Comment[];
  likes: number; // Total count
  userReaction?: ReactionType; // Current user's reaction
  imageUrl?: string;
  distanceKm?: number;
  vibe?: VibeType;
  visibility?: VisibilityType;
  isPinned?: boolean;
}

export type PlaceCategory = 'bar' | 'pub' | 'club' | 'dining' | 'cafe' | 'other';

export interface HotSpotPlace {
  name: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
  category: PlaceCategory;
}

export interface HotSpotArea {
  area: string;
  coordinates?: { lat: number; lng: number };
  places: HotSpotPlace[];
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
}
