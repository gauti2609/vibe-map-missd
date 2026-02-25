import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Calendar, MapPin, Image as ImageIcon, X, Camera, Send, TrendingUp, Clock, ChevronRight, Crown, Zap, Map, Plus, Check, Search, Loader2, ArrowLeft, Phone, Video, MoreVertical, MessageSquare } from 'lucide-react';
import { Post, PlaceCategory, User } from '../types';
import { db, auth } from '../firebase';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { createPost, updatePost, deletePost } from '../services/postService';
import { useFeed } from '../hooks/useFeed';
import usePlacesAutocomplete from "use-places-autocomplete";
import { getFeedPosts, SortDateType, FeedTab } from '../services/FeedEngine'; // Imported FeedTab
import { PostCard } from './PostCard';

import { extractAreaFromAddress, moderateContent, suggestVibe } from '../services/gemini';
import { handleError, ERROR_CODES } from '../utils/errorHandler';
import { getTrendingPlaces } from '../services/placeService';
import { HotSpotArea } from '../types';
import { FollowButton } from './FollowButton';

// Initial Mock Data (Fallback) if not passed from prop-ish
const INITIAL_FOLLOWED_PLACES = ['Open Tap', 'Social Cyber Hub'];
const CURRENT_USER_FREQUENT_PLACES = ['Downtown Diner', 'Whisky Samba'];

// Horizontal Scrolling Hotspots Widget (Unchanged functionality, just prop pass-through)
const HotSpotsWidget: React.FC<{
  onPlaceClick: (place: string) => void;
  followedPlaces: string[];
  onToggleFollow: (place: string) => void;

  hotSpots: HotSpotArea[];
}> = ({ onPlaceClick, followedPlaces, onToggleFollow, hotSpots }) => {
  const [activeAreaIndex, setActiveAreaIndex] = useState(0);

  if (!hotSpots || hotSpots.length === 0) return null;

  const area = hotSpots[activeAreaIndex];

  const nextArea = () => {
    setActiveAreaIndex((prev) => (prev + 1) % hotSpots.length);
  };

  const getPlaceImage = (category: PlaceCategory) => {
    switch (category) {
      case 'pub': return 'https://images.unsplash.com/photo-1572116469696-95872127f635?auto=format&fit=crop&q=80&w=200';
      case 'bar': return 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=200';
      case 'club': return 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&q=80&w=200';
      case 'dining': return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=200';
      case 'cafe': return 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=200';
      default: return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=200';
    }
  };

  return (
    <div className="w-full overflow-hidden mb-5">
      <div className="flex justify-between items-center mb-2 px-1">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <TrendingUp className="w-3 h-3 text-brand-400" /> {area.area}
        </h3>
        <button
          onClick={nextArea}
          className="text-[10px] text-slate-500 hover:text-white flex items-center gap-1 transition"
        >
          Next <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
        {area.places.map((place, i) => {
          const isFollowed = followedPlaces.includes(place.name);
          return (
            <div
              key={i}
              onClick={() => onPlaceClick(`${place.name}, ${area.area} `)}
              className="min-w-[120px] w-[120px] h-[140px] bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-end shadow-md flex-shrink-0 relative overflow-hidden group cursor-pointer hover:border-brand-500/50 transition active:scale-95"
            >
              <img
                src={getPlaceImage(place.category)}
                alt={place.name}
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-50 transition-opacity"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

              {/* Count Badge */}
              <div className="absolute top-1.5 right-1.5 bg-brand-900/80 backdrop-blur text-brand-200 text-[9px] font-bold px-1.5 py-0.5 rounded border border-brand-500/30">
                {place.count}
              </div>

              <div className="relative z-10 p-2 w-full flex flex-col h-full justify-end">
                <div className="text-[11px] font-bold text-white truncate leading-tight mb-0.5">{place.name}</div>
                <div className="flex items-center gap-1 mb-2">
                  {place.trend === 'up' && <TrendingUp className="w-2.5 h-2.5 text-green-400" />}
                  {place.trend === 'down' && <TrendingUp className="w-2.5 h-2.5 text-red-400 rotate-180" />}
                  {place.trend === 'stable' && <div className="w-1 h-1 bg-slate-400 rounded-full" />}
                  <span className={`text - [9px] font - medium ${place.trend === 'up' ? 'text-green-400' : place.trend === 'down' ? 'text-red-400' : 'text-slate-400'} `}>
                    {place.trend === 'up' ? 'Rising' : place.trend === 'down' ? 'Quiet' : 'Stable'}
                  </span>
                </div>

                {/* Follow Button on Place Card */}
                <div className="absolute top-2 right-2 z-20" onClick={(e) => e.stopPropagation()}>
                  <FollowButton
                    isFollowing={isFollowed}
                    onToggle={(e) => {
                      e.stopPropagation();
                      onToggleFollow(place.name);
                    }}
                    size="sm"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


interface FeedProps {
  onPlaceClick: (place: string) => void;
  onUserClick: (user: User) => void;
  currentUser: User | null;
  followedPlaces?: string[];
  followingUsers?: string[];
  onTogglePlaceFollow: (placeName: string) => void;
  onToggleUserFollow: (userId: string) => void;
  posts: Post[];
  onUpdatePost: (post: Partial<Post>) => Promise<void>;
  onDeletePost: (postId: string) => Promise<void>;
  initialTab?: FeedTab; // Added initialTab prop
}

const IS_DEV = import.meta.env.DEV;

export const Feed: React.FC<FeedProps> = ({
  onPlaceClick,
  onUserClick,
  currentUser,
  followedPlaces = [],
  followingUsers = [],
  onTogglePlaceFollow,
  onToggleUserFollow,
  posts,
  onUpdatePost, // Received from App
  onDeletePost, // Received from App
  initialTab = 'inner-circle' // Default to inner-circle
}) => {
  // const { posts, setPosts } = useFeed(); // Removed: State lifted to App
  const [sortBy, setSortBy] = useState<FeedTab>(initialTab); // Use FeedTab type and initialTab
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [trendingHotSpots, setTrendingHotSpots] = useState<HotSpotArea[]>([]);
  const [newPostPlaceId, setNewPostPlaceId] = useState(''); // Store Place ID
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Trending Places on Mount
  useEffect(() => {
    const fetchTrends = async () => {
      const places = await getTrendingPlaces();
      setTrendingHotSpots(places);
    };
    fetchTrends();
  }, [posts]); // Refresh when posts change (e.g. new post created)



  // Geolocation for Autosuggest
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [requestOptions, setRequestOptions] = useState<any>({});

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const google = (window as any).google;
        if (google && google.maps) {
          setRequestOptions({
            location: new google.maps.LatLng(latitude, longitude),
            radius: 50000,
          });
        }
      }, (error) => console.log("Feed Geo error:", error));
    }
  }, []);

  const {
    ready,
    value: newPostLocation,
    suggestions: { status, data: locationSuggestions },
    setValue: setNewPostLocation,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions,
    debounce: 300,
  });

  // Dedicated Autocomplete for Main Search Bar
  const {
    ready: searchReady,
    value: searchAutocompleteValue,
    suggestions: { status: searchStatus, data: searchAutocompleteSuggestions },
    setValue: setSearchAutocompleteValue,
    clearSuggestions: clearSearchAutocompleteSuggestions,
  } = usePlacesAutocomplete({
    requestOptions,
    debounce: 300,
  });

  // --- SEARCH LOGIC (MATCHING SOCIAL SCENE) ---
  const [searchResults, setSearchResults] = useState<{ users: User[], places: any[] }>({ users: [], places: [] });

  useEffect(() => {
    const performSearch = async () => {
      const queryStr = searchQuery.trim();
      if (!queryStr) {
        setSearchResults({ users: [], places: [] });
        return;
      }

      const isPeopleSearch = queryStr.startsWith('@');
      const searchTerm = isPeopleSearch ? queryStr.substring(1).toLowerCase() : queryStr.toLowerCase();

      // 1. USER SEARCH (Firestore)
      let matchedUsers: User[] = [];
      if (isPeopleSearch) {
        try {
          const usersRef = collection(db, 'users');
          const snapshot = await getDocs(usersRef);
          matchedUsers = snapshot.docs
            .map(doc => doc.data() as User)
            .filter(u => {
              const handle = u.handle?.toLowerCase() || '';
              const name = u.displayName.toLowerCase();
              return handle.includes(searchTerm) || name.includes(searchTerm);
            })
            .slice(0, 5);
        } catch (e) {
          console.error("Feed User Search Error:", e);
        }
      }

      // 2. PLACE SEARCH
      let matchedPlaces: any[] = [];
      if (!isPeopleSearch) {
        // Use Autocomplete Suggestions if available, else Mock Spots
        if (searchAutocompleteSuggestions.length > 0) {
          matchedPlaces = searchAutocompleteSuggestions.slice(0, 5);
        } else {
          const allPlaces = trendingHotSpots.flatMap(h => h.places);
          matchedPlaces = allPlaces.filter(p => p.name.toLowerCase().includes(searchTerm)).slice(0, 5);
        }
      }

      setSearchResults({ users: matchedUsers, places: matchedPlaces });
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, searchAutocompleteSuggestions]);


  /* New Post Form State */
  const [postType, setPostType] = useState<'regular' | 'poll'>('regular');
  const [newPostDate, setNewPostDate] = useState('');
  const [newPostDesc, setNewPostDesc] = useState('');
  const [newPostLocationAddress, setNewPostLocationAddress] = useState(''); // Added address state
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);

  // Poll State
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollDuration, setPollDuration] = useState('24h');

  // EDIT MODE STATE
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const VIBE_OPTIONS = ['Dancing', 'Chilling', 'Partying', 'Networking', 'Dating'];

  // Helper for Interaction Score
  // Helper for Interaction Score
  // const getInteractionScore = ... (Removed, using Engine)

  const [sortDateType, setSortDateType] = useState<SortDateType>('posted');

  const [realInfluencers, setRealInfluencers] = useState<User[]>([]);

  // Fetch Real Influencers on Mount
  useEffect(() => {
    const fetchInfluencers = async () => {
      try {
        const q = query(collection(db, 'users'), where('isInfluencer', '==', true));
        const snap = await getDocs(q);
        const users = snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
        setRealInfluencers(users);
      } catch (e) {
        console.error("Failed to fetch influencers", e);
      }
    };
    fetchInfluencers();
  }, []);

  const getFilteredAndSortedPosts = () => {
    // Current User might be null/loading, handle gracefully
    if (!currentUser) return [];

    return getFeedPosts(
      posts,
      currentUser,
      realInfluencers,
      sortBy as any, // 'inner-circle' | 'trend' | 'places' | 'polls'
      sortDateType,
      followedPlaces,
      CURRENT_USER_FREQUENT_PLACES
    );
  };

  const sortedPosts = getFilteredAndSortedPosts();

  // Get Founders/Stories (Influencers I follow)
  const founders = sortBy === 'inner-circle' ? realInfluencers
    .filter(u => currentUser?.following?.includes(u.id) || u.isFounder) // Show my influencers + founders
    .sort((a, b) => (a.isFounder ? -1 : 1))
    : [];

  const handleLocationInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPostLocation(e.target.value);
  };

  const selectLocation = (description: string, main_text: string, secondary_text: string, placeId: string) => {
    setNewPostLocation(main_text, false);
    setNewPostLocationAddress(secondary_text || description);
    setNewPostPlaceId(placeId); // Store ID
    clearSuggestions();
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPostImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateOrUpdatePost = async () => {
    // Validation
    if (postType === 'regular') {
      if (!newPostLocation || !newPostDate || !newPostDesc) {
        handleError('Post Validation', new Error("Missing required fields"), ERROR_CODES.DATA_MISSING_FIELDS);
        return;
      }
    } else {
      if (!pollQuestion.trim() || pollOptions.length < 2 || pollOptions.some(o => !o.trim())) {
        handleError('Poll Validation', new Error("Poll needs a question and at least 2 options."), ERROR_CODES.DATA_MISSING_FIELDS);
        return;
      }
    }

    // AI Area Extraction (Write-Time)
    let smartArea = '';
    if (postType === 'regular' && newPostLocation && newPostLocationAddress) {
      smartArea = await extractAreaFromAddress(newPostLocation, newPostLocationAddress);
    }

    // Base Data
    const baseData = {
      visitDate: newPostDate || new Date().toISOString(), // Polls default to now if not set
      rsvps: {},
      comments: [],
      likes: 0,
      imageUrl: newPostImage || null,
      type: postType
    };

    let finalPostData: any = { ...baseData };

    if (postType === 'regular') {
      finalPostData = {
        ...finalPostData,
        location: {
          name: newPostLocation,
          address: newPostLocationAddress || 'Unknown Address',
          shortLocation: smartArea,
          placeId: newPostPlaceId
        },
        description: selectedVibe ? `[${selectedVibe}] ${newPostDesc} ` : newPostDesc,
      };
    } else {
      // Poll Data
      const expiresAt = new Date();
      const durationHours = parseInt(pollDuration); // naive parsing 24h -> 24
      expiresAt.setHours(expiresAt.getHours() + (pollDuration === '1h' ? 1 : pollDuration === '6h' ? 6 : 24));

      finalPostData = {
        ...finalPostData,
        location: { name: 'Vibe Poll', address: 'Digital', shortLocation: 'Poll' }, // Dummy location for schema compliance
        description: pollQuestion, // Use description for question preview
        pollData: {
          question: pollQuestion,
          options: pollOptions.map((text, i) => ({ id: `opt_${i} `, text, voteCount: 0 })),
          voters: {},
          expiresAt: expiresAt.toISOString(),
          totalVotes: 0
        }
      };
    }

    // Real Firestore
    if (currentUser) {
      try {
        if (editingPostId) {
          await updatePost(editingPostId, finalPostData);
        } else {
          await createPost({
            ...finalPostData,
            user: {
              id: currentUser.id,
              displayName: currentUser.displayName,
              handle: currentUser.handle || 'vibemap_user',
              avatarUrl: currentUser.avatarUrl,
              isConnected: true,
              isInfluencer: currentUser.isInfluencer || false,
              trustScore: currentUser.trustScore || 0
            }
          });
        }
      } catch (e) {
        handleError(editingPostId ? 'Update Post' : 'Create Post', e, ERROR_CODES.NET_FIRESTORE_WRITE);
      }
    } else {
      handleError('Auth', new Error("You must be logged in to post."), ERROR_CODES.AUTH_NOT_LOGGED_IN);
      return;
    }

    // Reset State
    setIsCreatingPost(false);
    setNewPostLocation('');
    setNewPostLocationAddress('');
    setNewPostDate('');
    setNewPostDesc('');
    setNewPostImage(null);
    setSelectedVibe(null);
    setEditingPostId(null);
    setPollQuestion('');
    setPollOptions(['', '']);
    setPostType('regular');
  };

  const handleRequestEdit = (post: Post) => {
    setEditingPostId(post.id);

    // Parse Description/Vibe
    const vibeMatch = post.description.match(/^\[(.*?)\]\s*(.*)/s);
    const vibeTag = vibeMatch ? vibeMatch[1] : null;
    const cleanDesc = vibeMatch ? vibeMatch[2] : post.description;

    setNewPostLocation(post.location.name);
    setNewPostLocationAddress(post.location.address);
    setNewPostDate(post.visitDate); // Ensure ISO string works with datetime-local if formatted correctly
    setNewPostDesc(cleanDesc);
    setSelectedVibe(vibeTag);
    setNewPostImage(post.imageUrl || null);

    setIsCreatingPost(true);
  };

  // handleUpdatePost and handleDeletePost are now passed via props
  // We can keep wrapper functions if needed, or just pass props directly.
  // However, local handleCreateOrUpdate needs to call proper functions.

  // Note: handleCreateOrUpdatePost calls updatePost directly for editing. 
  // We should probably route it through onUpdatePost to keep state sync?
  // Yes, if we edit a post, we want App state to update.
  // But handleCreateOrUpdatePost is complex. Let's look at it.
  // It calls 'updatePost' service. That updates DB. Snapshot updates App state.
  // So it's fine.

  // But usage in PostCard needs to use the props.


  return (
    <div className="space-y-6 relative pb-20">

      {/* FLOATING SEARCH BAR */}
      <div className="sticky top-0 z-30 pt-2 pb-2 bg-slate-950/80 backdrop-blur-md -mx-4 px-4 border-b border-white/5">
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Use @ to search people (e.g. @nightriot), or type name for places"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchAutocompleteValue(e.target.value);
            }}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)} // Delay to allow clicks
            className="w-full bg-slate-900 border border-slate-700 rounded-full py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all shadow-lg"
          />

          {/* Search Results Dropdown */}
          {isSearchFocused && searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-brand-800 rounded-xl shadow-2xl p-2 z-40 animate-fade-in max-h-60 overflow-y-auto">
              {(!searchAutocompleteSuggestions.length && searchResults.users.length === 0) ? (
                <div className="p-3 text-center text-slate-500 text-sm italic">No matches found.</div>
              ) : (
                <>
                  {/* API Places Results */}
                  {searchStatus === "OK" && !searchQuery.startsWith('@') && searchAutocompleteSuggestions.map((suggestion) => (
                    <div
                      key={suggestion.place_id}
                      onClick={() => {
                        console.log("Selected Place:", suggestion);
                        onPlaceClick(suggestion.structured_formatting.main_text);
                        setSearchQuery(suggestion.structured_formatting.main_text);
                        clearSearchAutocompleteSuggestions();
                      }}
                      className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg cursor-pointer transition"
                    >
                      <div className="w-8 h-8 rounded-full bg-brand-900/50 flex items-center justify-center border border-brand-800">
                        <MapPin className="w-4 h-4 text-brand-400" />
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-sm font-bold text-slate-200 truncate">{suggestion.structured_formatting.main_text}</div>
                        <div className="text-[10px] text-slate-500 truncate">{suggestion.structured_formatting.secondary_text}</div>
                      </div>
                    </div>
                  ))}

                  {/* Mock Users Results */}
                  {searchResults.users.length > 0 && (
                    <div className="mt-2">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-1">People</h4>
                      {searchResults.users.map(u => (
                        <div
                          key={u.id}
                          onClick={() => onUserClick(u)}
                          className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded-lg cursor-pointer transition"
                        >
                          <div className="relative">
                            <img src={u.avatarUrl} className="w-12 h-12 rounded-full object-cover border border-slate-700" alt="" />
                            {u.isInfluencer && (
                              <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-[1px] border border-slate-900">
                                <Crown className="w-2 h-2 text-black fill-current" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-200 flex items-center gap-1">
                              {u.handle ? `@${u.handle}` : u.displayName}
                              {u.isInfluencer && <Crown className="w-3 h-3 text-amber-500 fill-amber-500" />}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Full Width Tabs */}
      <div className="w-full">
        <div className="grid grid-cols-4 bg-brand-900 border border-brand-800 rounded-lg p-1 gap-1">
          <button
            onClick={() => setSortBy('inner-circle')}
            className={`py-2 rounded px-1 text-xs sm:text-sm font-medium flex items-center justify-center gap-1 sm:gap-2 transition whitespace-nowrap overflow-hidden ${sortBy === 'inner-circle' ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-white'}`}
          >
            <Crown className="w-4 h-4 shrink-0" /> <span>Inner Circle</span>
          </button>
          <button
            onClick={() => setSortBy('trend')}
            className={`py-2 rounded px-1 text-xs sm:text-sm font-medium flex items-center justify-center gap-1 sm:gap-2 transition whitespace-nowrap overflow-hidden ${sortBy === 'trend' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            <TrendingUp className="w-4 h-4 shrink-0" /> <span>Trending</span>
          </button>
          <button
            onClick={() => setSortBy('places')}
            className={`py-2 rounded px-1 text-xs sm:text-sm font-medium flex items-center justify-center gap-1 sm:gap-2 transition whitespace-nowrap overflow-hidden ${sortBy === 'places' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            <MapPin className="w-4 h-4 shrink-0" /> <span>Places</span>
          </button>
          <button
            onClick={() => setSortBy('polls')}
            className={`py-2 rounded px-1 text-xs sm:text-sm font-medium flex items-center justify-center gap-1 sm:gap-2 transition whitespace-nowrap overflow-hidden ${sortBy === 'polls' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" /> <span>Polls</span>
          </button>
        </div>
      </div >
      <div className="flex flex-col gap-2 mt-4 px-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {sortBy === 'inner-circle' && <Crown className="w-5 h-5 text-amber-500 shrink-0" />}
              {sortBy === 'trend' && <TrendingUp className="w-5 h-5 text-brand-400 shrink-0" />}
              {sortBy === 'places' && <MapPin className="w-5 h-5 text-brand-400 shrink-0" />}
              {sortBy === 'polls' && <MessageSquare className="w-5 h-5 text-brand-400 shrink-0" />}
              {sortBy === 'inner-circle' ? 'Inner Circle' : sortBy === 'trend' ? 'Trending' : sortBy === 'polls' ? 'Polls' : 'Places'}
            </h2>

            {/* Sort Dropdown */}
            {(sortBy === 'inner-circle' || sortBy === 'trend' || sortBy === 'polls') && (
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-0.5 flex">
                <button onClick={() => setSortDateType('posted')} className={`px-2 py-1 text-[10px] font-bold rounded ${sortDateType === 'posted' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}>Shared on</button>
                <button onClick={() => setSortDateType('visited')} className={`px-2 py-1 text-[10px] font-bold rounded ${sortDateType === 'visited' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}>Going on</button>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCreatingPost(true)}
            className="bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-lg font-medium transition text-sm flex items-center gap-2 whitespace-nowrap shadow-lg shadow-brand-600/20"
          >
            <Camera className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>

      {
        sortBy === 'inner-circle' && (
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide mb-2">
            {founders.map((inf) => (
              <div key={inf.id} className="flex-shrink-0 flex flex-col items-center gap-2 group cursor-pointer" onClick={() => onUserClick?.(inf)}>
                <div className="relative">
                  <img src={inf.avatarUrl} className={`w-14 h-14 rounded-full border-2 ${inf.isFounder ? 'border-amber-400' : 'border-slate-700'} object-cover`} alt="" />
                  {inf.isFounder && (
                    <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full p-1 border-2 border-slate-900">
                      <Zap className="w-2.5 h-2.5 text-white fill-white" />
                    </div>
                  )}
                </div>
                <span className={`text-[10px] font-bold tracking-wider ${inf.isFounder ? 'text-amber-400' : 'text-slate-400'}`}>
                  {inf.handle ? `@${inf.handle}` : inf.displayName.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        )
      }

      {/* Create Post Modal */}
      {
        isCreatingPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-brand-900 border border-brand-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
              <button
                onClick={() => setIsCreatingPost(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>

              <h3 className="text-xl font-bold mb-4">Share your plan or check-in</h3>

              {/* Type Switcher */}
              <div className="flex bg-slate-950 rounded-lg p-1 mb-4">
                <button
                  onClick={() => setPostType('regular')}
                  className={`flex - 1 py - 2 rounded text - sm font - bold transition ${postType === 'regular' ? 'bg-brand-600 text-white shadow' : 'text-slate-500 hover:text-white'} `}
                >Post</button>
                <button
                  onClick={() => setPostType('poll')}
                  className={`flex - 1 py - 2 rounded text - sm font - bold transition flex items - center justify - center gap - 2 ${postType === 'poll' ? 'bg-brand-600 text-white shadow' : 'text-slate-500 hover:text-white'} `}
                ><span className="w-4 h-4 border border-current rounded-sm flex items-center justify-center text-[8px]">In</span> Poll</button>
              </div>

              {postType === 'regular' ? (
                // REGULAR POST FORM
                <div className="space-y-4">
                  {/* Current Vibe Selector */}
                  <h3 className="text-xl font-bold mb-4">{editingPostId ? 'Edit Vibe' : 'Share your plan or check-in'}</h3>

                  <div className="mb-4">
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Current Vibe:</label>
                    <div className="flex flex-wrap gap-2">
                      {VIBE_OPTIONS.map((vibe) => (
                        <button
                          key={vibe}
                          onClick={() => setSelectedVibe(selectedVibe === vibe ? null : vibe)}
                          className={`px - 3 py - 1.5 rounded - full text - xs font - bold border transition
                            ${selectedVibe === vibe
                              ? 'bg-brand-500 border-brand-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                              : 'bg-transparent border-slate-700 text-slate-400 hover:border-brand-500 hover:text-white'
                            } `}
                        >
                          {vibe}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="relative">
                      <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Where?</label>
                      <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3">
                        <MapPin className="text-slate-500 w-5 h-5 mr-2" />
                        <input
                          type="text"
                          placeholder="e.g. Open Tap, Gurgaon"
                          className="w-full bg-transparent py-3 text-white focus:outline-none"
                          value={newPostLocation}
                          onChange={handleLocationInput}
                          disabled={!ready}
                        />
                      </div>
                      {status === "OK" && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-brand-700 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto">
                          {locationSuggestions.map(({ place_id, description, structured_formatting: { main_text, secondary_text } }) => (
                            <button
                              key={place_id}
                              onClick={() => selectLocation(description, main_text, secondary_text, place_id)}
                              className="w-full text-left px-4 py-2 hover:bg-brand-900/50 text-sm text-slate-200 border-b border-slate-800 last:border-0"
                            >
                              <div className="font-bold">{main_text}</div>
                              <div className="text-xs text-slate-500 truncate">{secondary_text}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">When?</label>
                      <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3">
                        <Calendar className="text-slate-500 w-5 h-5 mr-2" />
                        <input
                          type="datetime-local"
                          className="w-full bg-transparent py-3 text-white focus:outline-none [color-scheme:dark]"
                          value={newPostDate}
                          onChange={(e) => setNewPostDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">What's the vibe?</label>
                      <textarea
                        placeholder="Describe your plan... use @ to tag friends and #hashtags"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none h-24 resize-none"
                        value={newPostDesc}
                        onChange={(e) => setNewPostDesc(e.target.value)}
                      />
                    </div>

                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Add Photo</label>
                    <div className="flex gap-2">
                      {/* Normal Upload */}
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 border-2 border-dashed border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-brand-500 hover:bg-slate-900/50 transition relative overflow-hidden h-32"
                      >
                        {newPostImage ? (
                          <img src={newPostImage} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <>
                            <ImageIcon className="text-slate-500 w-8 h-8 mb-2" />
                            <span className="text-sm text-slate-500">Upload</span>
                          </>
                        )}
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                      </div>

                      {/* Camera Button (Mobile) */}
                      <div className="flex-1 md:hidden border-2 border-dashed border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-brand-500 hover:bg-slate-900/50 transition h-32 relative">
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          onChange={handleImageUpload}
                        />
                        <Camera className="text-slate-500 w-8 h-8 mb-2" />
                        <span className="text-sm text-slate-500">Camera</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // POLL FORM
                <div className="space-y-4">
                  <h3 className="text-xl font-bold mb-4">Create a Poll</h3>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Question</label>
                    <input
                      type="text"
                      placeholder="e.g. Where should we go tonight?"
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Options</label>
                    <div className="space-y-2">
                      {pollOptions.map((opt, i) => (
                        <input
                          key={i}
                          type="text"
                          placeholder={`Option ${i + 1} `}
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...pollOptions];
                            newOpts[i] = e.target.value;
                            setPollOptions(newOpts);
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-brand-500"
                        />
                      ))}
                      {pollOptions.length < 4 && (
                        <button
                          onClick={() => setPollOptions([...pollOptions, ''])}
                          className="text-brand-400 text-sm hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" /> Add Option
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Duration</label>
                    <div className="flex gap-2">
                      {['1h', '6h', '24h'].map(d => (
                        <button
                          key={d}
                          onClick={() => setPollDuration(d)}
                          className={`px - 3 py - 1 rounded - lg text - sm border ${pollDuration === d ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-700 text-slate-400'} `}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={async () => {
                  setIsSubmitting(true);
                  await handleCreateOrUpdatePost();
                  setIsSubmitting(false);
                }}
                disabled={isSubmitting || (postType === 'regular' ? (!newPostLocation || !newPostDate || !newPostDesc) : (!pollQuestion || pollOptions.length < 2))}
                className="w-full bg-brand-600 hover:bg-brand-500 py-3 rounded-xl font-bold text-white shadow-lg shadow-brand-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {isSubmitting ? 'Posting...' : 'Post Update'}
              </button>
            </div>
          </div>
        )
      }


      {
        sortedPosts.length === 0 && (
          <div className="text-center py-20 px-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 mb-4 animate-bounce">
              <TrendingUp className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No vibes here yet!</h3>
            <p className="text-slate-400 max-w-xs mx-auto mb-6">
              It looks a bit quiet. Be the first to start the party or try searching for something else.
            </p>
            <button
              onClick={() => setIsCreatingPost(true)}
              className="bg-brand-600 hover:bg-brand-500 px-6 py-3 rounded-xl font-bold text-white transition shadow-lg shadow-brand-600/20"
            >
              Start the Vibe
            </button>
          </div>
        )
      }

      {
        sortedPosts.map((post, index) => (
          <React.Fragment key={post.id}>
            {index === 1 && (
              <HotSpotsWidget
                onPlaceClick={onPlaceClick}
                followedPlaces={followedPlaces}
                onToggleFollow={onTogglePlaceFollow}
                hotSpots={trendingHotSpots}
              />
            )}
            <PostCard
              key={post.id}
              post={post}
              onUpdatePost={onUpdatePost}
              onDeletePost={onDeletePost}
              onUserClick={onUserClick}
              onPlaceClick={onPlaceClick}
              isPlaceFollowed={currentUser?.followedPlaces?.includes(post.location.name)}
              onToggleFollow={() => onTogglePlaceFollow(post.location.name)}
              onRequestEdit={handleRequestEdit}
              isUserFollowed={currentUser?.following?.includes(post.user.id)}
              onToggleUserFollow={() => onToggleUserFollow(post.user.id)}
              currentUser={currentUser}
            />
          </React.Fragment>
        ))
      }
    </div >
  );
};