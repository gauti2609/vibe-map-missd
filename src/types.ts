export interface User {
  id: string;
  displayName: string;
  email?: string;
  avatarUrl: string;
  isConnected: boolean; // P1 vs P2
  bio?: string;
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
  isInfluencer?: boolean;
  isFounder?: boolean;
  isPlaceAccount?: boolean;
  followers?: string[]; // IDs of users following this user
  following?: string[]; // IDs of users followed by this user
  followedPlaces?: string[]; // Names of places followed by this user
  frequentPlaces?: string[]; // Names of places frequently visited
  trustScore?: number; // 0-100 score based on behavior
  interests?: string[];
  vibes?: string[]; // Array of vibe tags
  handle?: string;
  wishlist?: string[]; // Array of place names for bookmarks
  isNewUser?: boolean; // Flag for onboarding flow
}

export interface LocationInfo {
  name: string;
  address: string;
  latitude?: number;
  placeId?: string;
  shortLocation?: string; // AI-extracted short name (e.g., "Cyber Hub")
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
  deleted?: boolean;
  isInfluencer?: boolean;
}

export type ReactionType = 'heart' | 'fire' | 'party';
export type VibeType = 'Dancing' | 'Partying' | 'Chilling' | 'Dining' | 'Live Music' | 'Deep House';
export type VisibilityType = 'Public' | 'Followers Only' | 'Friends Only';

export type AdminRole = 'SUPER_ADMIN' | 'INFLUENCER_MANAGER' | 'OUTLET_ONBOARDING' | 'SAFETY_MANAGER' | 'POST_MODERATOR' | 'COMMENT_MODERATOR';

export interface AdminPrivileges {
  uid: string;
  email: string;
  assignedBy: string;
  assignedAt: string; // ISO string
  roles: AdminRole[];
}

export interface Post {
  id: string;
  user: User;
  location: LocationInfo;
  visitDate: string;
  description: string;
  rsvps: { [userId: string]: RSVPStatus };
  comments: Comment[];
  likes: number; // Total count
  reactions?: { [userId: string]: ReactionType }; // Map of user IDs to reaction types
  userReaction?: ReactionType; // Derived or Legacy Current user's reaction
  imageUrl?: string;
  distanceKm?: number;
  vibe?: VibeType;
  visibility?: VisibilityType;
  isPinned?: boolean;
  type?: 'regular' | 'poll';
  pollData?: PollData;
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

export interface Conversation {
  id: string;
  participants: string[]; // IDs of users
  lastMessage: string;
  lastMessageAt: string;
  unreadCount?: { [userId: string]: number };
  // Group Chat Fields
  type?: 'direct' | 'group';
  groupName?: string;
  groupPhotoUrl?: string;
  createdBy?: string;
  adminIds?: string[];
}

export interface PollOption {
  id: string;
  text: string;
  voteCount: number;
}

export interface PollData {
  question: string;
  options: PollOption[];
  voters?: { [userId: string]: string }; // userId -> optionId
  expiresAt: string;
  totalVotes: number;
}

export type TabType = 'feed' | 'hotspots' | 'chat' | 'profile' | 'search' | 'place' | 'activity' | 'safety' | 'origin-roots';

export type NotificationType = 'like' | 'comment' | 'rsvp' | 'follow' | 'system' | 'group_add';

export interface Notification {
  id: string;
  recipientId: string;
  senderId: string;
  type: NotificationType;
  targetId?: string; // Post ID or Group ID
  message: string;
  read: boolean;
  createdAt: string;
  senderName?: string;
  senderAvatar?: string;
}
