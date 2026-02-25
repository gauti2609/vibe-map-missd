import React, { useState, useRef, useMemo } from 'react';
import { Calendar, MapPin, Image as ImageIcon, X, Camera, Send, TrendingUp, Clock, ChevronRight, Crown, Zap, Map, Plus, Check, Search } from 'lucide-react';
import { Post, PlaceCategory, User } from '../types';
import { MOCK_POSTS, HOT_SPOTS, USERS } from '../data';
import usePlacesAutocomplete from "use-places-autocomplete";
import { PostCard } from './PostCard';

// Initial Mock Data (Fallback) if not passed from prop-ish
const INITIAL_FOLLOWED_PLACES = ['Open Tap', 'Social Cyber Hub'];
const CURRENT_USER_FREQUENT_PLACES = ['Downtown Diner', 'Whisky Samba'];

// Horizontal Scrolling Hotspots Widget (Unchanged functionality, just prop pass-through)
const HotSpotsWidget: React.FC<{
  onPlaceClick: (place: string) => void;
  followedPlaces: string[];
  onToggleFollow: (place: string) => void;
}> = ({ onPlaceClick, followedPlaces, onToggleFollow }) => {
  const [activeAreaIndex, setActiveAreaIndex] = useState(0);
  const area = HOT_SPOTS[activeAreaIndex];

  const nextArea = () => {
    setActiveAreaIndex((prev) => (prev + 1) % HOT_SPOTS.length);
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
              onClick={() => onPlaceClick(place.name)}
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
                  <span className={`text-[9px] font-medium ${place.trend === 'up' ? 'text-green-400' : place.trend === 'down' ? 'text-red-400' : 'text-slate-400'}`}>
                    {place.trend === 'up' ? 'Rising' : place.trend === 'down' ? 'Quiet' : 'Stable'}
                  </span>
                </div>

                {/* Follow Button on Place Card */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFollow(place.name);
                  }}
                  className={`w-full py-1 rounded text-[9px] font-bold uppercase tracking-wide flex items-center justify-center gap-1 transition-colors ${isFollowed
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-brand-600 text-white hover:bg-brand-500'
                    }`}
                >
                  {isFollowed ? (
                    <> <Check className="w-3 h-3" /> Following </>
                  ) : (
                    <> <Plus className="w-3 h-3" /> Follow </>
                  )}
                </button>
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
}

export const Feed: React.FC<FeedProps> = ({ onPlaceClick, onUserClick }) => {
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [sortBy, setSortBy] = useState<'inner-circle' | 'trending' | 'places'>('inner-circle');
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // User State for Following Places
  const [followedPlaces, setFollowedPlaces] = useState<string[]>(INITIAL_FOLLOWED_PLACES);

  const toggleFollowPlace = (placeName: string) => {
    setFollowedPlaces(prev =>
      prev.includes(placeName)
        ? prev.filter(p => p !== placeName)
        : [...prev, placeName]
    );
  };

  // --- SEARCH LOGIC ---
  // Combine Users and Places for Search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { users: [], places: [] };

    const query = searchQuery.toLowerCase();

    // Mock Users Filter
    const matchedUsers = USERS.filter(u =>
      u.displayName.toLowerCase().includes(query) ||
      (u.bio && u.bio.toLowerCase().includes(query))
    ).slice(0, 5);

    // Mock Places Filter (from HOT_SPOTS)
    const allPlaces = HOT_SPOTS.flatMap(h => h.places);
    const matchedPlaces = allPlaces.filter(p =>
      p.name.toLowerCase().includes(query)
    ).slice(0, 5);

    return { users: matchedUsers, places: matchedPlaces };
  }, [searchQuery]);


  // Use Places Autocomplete for Location
  const {
    ready,
    value: newPostLocation,
    suggestions: { status, data: locationSuggestions },
    setValue: setNewPostLocation,
    clearSuggestions,
  } = usePlacesAutocomplete({
    debounce: 300,
  });

  const [newPostDate, setNewPostDate] = useState('');
  const [newPostDesc, setNewPostDesc] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const VIBE_OPTIONS = ['Dancing', 'Chilling', 'Partying', 'Networking', 'Dating'];

  // Helper for Interaction Score
  const getInteractionScore = (post: Post) => {
    const rsvpCount = Object.keys(post.rsvps).length;
    return post.likes + post.comments.length + (rsvpCount * 2);
  };

  // --- FILTERING & SORTING LOGIC ---
  const getFilteredAndSortedPosts = () => {
    let filtered = [...posts];

    if (sortBy === 'inner-circle') {
      filtered = filtered.filter(post => post.user.isConnected);
      filtered.sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());
    }
    else if (sortBy === 'trending') {
      filtered = filtered.filter(post => post.user.isInfluencer || getInteractionScore(post) > 10);
      filtered.sort((a, b) => getInteractionScore(b) - getInteractionScore(a));
    }
    else if (sortBy === 'places') {
      // PLACES TAB LOGIC

      // 1. Followed Places Matches
      const followedMatches = filtered.filter(post =>
        followedPlaces.includes(post.location.name)
      );

      // 2. Frequent Places Matches
      const frequentMatches = filtered.filter(post =>
        CURRENT_USER_FREQUENT_PLACES.includes(post.location.name)
      );

      // 3. Nearby Matches (15km)
      const nearbyMatches = filtered.filter(post =>
        (post.distanceKm || 0) <= 15
      );

      let finalSet: Post[] = [];

      if (followedMatches.length > 0) {
        finalSet = followedMatches;
      } else if (frequentMatches.length > 0) {
        finalSet = frequentMatches;
      } else {
        finalSet = nearbyMatches;
      }

      // Priority Scoring
      const getPriorityScore = (post: Post) => {
        if (post.user.isPlaceAccount) return 100;
        if (post.user.isInfluencer) return 50;
        if (post.user.isConnected) return 25;
        return 0;
      };

      finalSet.sort((a, b) => {
        const scoreA = getPriorityScore(a);
        const scoreB = getPriorityScore(b);
        if (scoreA !== scoreB) return scoreB - scoreA;
        return new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime();
      });

      return finalSet;
    }

    return filtered;
  };

  const sortedPosts = getFilteredAndSortedPosts();

  // Get Founders
  const founders = sortBy === 'inner-circle' ? MOCK_POSTS
    .map(p => p.user)
    .filter(u => u.isFounder || u.isInfluencer)
    .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i) // unique
    .sort((a, b) => (a.isFounder ? -1 : 1))
    : [];

  const handleLocationInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPostLocation(e.target.value);
  };

  const selectLocation = (description: string, main_text: string) => {
    setNewPostLocation(main_text, false);
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

  const handleCreatePost = () => {
    if (!newPostLocation || !newPostDate || !newPostDesc) {
      return;
    }
    const newPost: Post = {
      id: Date.now().toString(),
      user: {
        id: 'current-user',
        displayName: 'Me',
        avatarUrl: `https://ui-avatars.com/api/?name=Me&background=7c3aed&color=fff`,
        isConnected: true
      },
      location: { name: newPostLocation, address: 'Unknown Address' },
      visitDate: newPostDate,
      description: selectedVibe ? `[${selectedVibe}] ${newPostDesc}` : newPostDesc,
      rsvps: {},
      comments: [],
      likes: 0,
      imageUrl: newPostImage || undefined,
      userReaction: undefined
    };

    setPosts(prev => [newPost, ...prev]);
    setIsCreatingPost(false);
    setNewPostLocation('');
    setNewPostDate('');
    setNewPostDesc('');
    setNewPostImage(null);
    setSelectedVibe(null);
  };

  const handleUpdatePost = (updatedPost: Post) => {
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
  };

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
            placeholder="Search people or places..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)} // Delay to allow clicks
            className="w-full bg-slate-900 border border-slate-700 rounded-full py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all shadow-lg"
          />

          {/* Search Results Dropdown */}
          {isSearchFocused && searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-brand-800 rounded-xl shadow-2xl p-2 z-40 animate-fade-in max-h-60 overflow-y-auto">
              {(searchResults.users.length === 0 && searchResults.places.length === 0) ? (
                <div className="p-3 text-center text-slate-500 text-sm italic">No matches found.</div>
              ) : (
                <>
                  {searchResults.users.length > 0 && (
                    <div className="mb-2">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-1">People</h4>
                      {searchResults.users.map(u => (
                        <div
                          key={u.id}
                          onClick={() => onUserClick(u)}
                          className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded-lg cursor-pointer transition"
                        >
                          <img src={u.avatarUrl} className="w-8 h-8 rounded-full object-cover" alt="" />
                          <div>
                            <div className="text-sm font-bold text-slate-200">{u.displayName}</div>
                            {u.isInfluencer && <div className="text-[10px] text-amber-500">Influencer</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.places.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-1">Places</h4>
                      {searchResults.places.map((p, i) => (
                        <div
                          key={i}
                          onClick={() => onPlaceClick(p.name)}
                          className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded-lg cursor-pointer transition"
                        >
                          <div className="w-8 h-8 rounded-full bg-brand-900 border border-brand-700 flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-brand-400" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-200">{p.name}</div>
                            <div className="text-[10px] text-slate-400 capitalize">{p.category}</div>
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

        {/* Interest Filter Toggle (New Feature) */}
        {isSearchFocused && (
          <div className="absolute top-14 left-0 right-0 z-30 px-4 animate-fade-in">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
              {['All', 'music', 'dance', 'tech', 'food', 'fashion'].map((interest) => (
                <button
                  key={interest}
                  onClick={() => {/* Mock Filter Logic could go here, or just visual for now */ }}
                  className="bg-slate-900/90 border border-slate-700 text-xs text-slate-300 px-3 py-1.5 rounded-full whitespace-nowrap hover:border-brand-500 hover:text-white transition"
                >
                  #{interest}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          {sortBy === 'inner-circle' && <Crown className="w-6 h-6 text-amber-500" />}
          {sortBy === 'trending' && <TrendingUp className="w-6 h-6 text-brand-500" />}
          {sortBy === 'places' && <MapPin className="w-6 h-6 text-brand-400" />}
          {sortBy === 'inner-circle' ? 'Inner Circle' : sortBy === 'trending' ? 'Trending Vibes' : 'Places'}
        </h2>

        <div className="flex w-full md:w-auto gap-2 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
          <div className="flex bg-brand-900 border border-brand-800 rounded-lg p-1 mr-auto md:mr-0 flex-nowrap">
            <button
              onClick={() => setSortBy('inner-circle')}
              className={`px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 transition whitespace-nowrap ${sortBy === 'inner-circle' ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-white'
                }`}
            >
              <Crown className="w-4 h-4" /> Inner Circle
            </button>
            <button
              onClick={() => setSortBy('trending')}
              className={`px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 transition whitespace-nowrap ${sortBy === 'trending' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
            >
              <TrendingUp className="w-4 h-4" /> Trending
            </button>
            <button
              onClick={() => setSortBy('places')}
              className={`px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 transition whitespace-nowrap ${sortBy === 'places' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
            >
              <MapPin className="w-4 h-4" /> Places
            </button>
          </div>

          <button
            onClick={() => setIsCreatingPost(true)}
            className="bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-lg font-medium transition text-sm flex items-center gap-2 whitespace-nowrap ml-2"
          >
            <Camera className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>

      {sortBy === 'inner-circle' && (
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
              <span className={`text-[10px] font-bold uppercase tracking-wider ${inf.isFounder ? 'text-amber-400' : 'text-slate-400'}`}>
                {inf.displayName}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Create Post Modal */}
      {isCreatingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-brand-900 border border-brand-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setIsCreatingPost(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-xl font-bold mb-4">Share your plan or check-in</h3>

            {/* Current Vibe Selector */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Current Vibe:</label>
              <div className="flex flex-wrap gap-2">
                {VIBE_OPTIONS.map((vibe) => (
                  <button
                    key={vibe}
                    onClick={() => setSelectedVibe(selectedVibe === vibe ? null : vibe)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition
                        ${selectedVibe === vibe
                        ? 'bg-brand-500 border-brand-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                        : 'bg-transparent border-slate-700 text-slate-400 hover:border-brand-500 hover:text-white'
                      }`}
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
                        onClick={() => selectLocation(description, main_text)}
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

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Add Photo</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-brand-500 hover:bg-slate-900/50 transition relative overflow-hidden h-32"
                >
                  {newPostImage ? (
                    <img src={newPostImage} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <>
                      <ImageIcon className="text-slate-500 w-8 h-8 mb-2" />
                      <span className="text-sm text-slate-500">Click to upload photo</span>
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
              </div>

              <button
                onClick={handleCreatePost}
                disabled={!newPostLocation || !newPostDate || !newPostDesc}
                className="w-full bg-brand-600 hover:bg-brand-500 py-3 rounded-xl font-bold text-white shadow-lg shadow-brand-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Post Update
              </button>
            </div>
          </div>
        </div>
      )}

      {sortedPosts.length === 0 && (
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
      )}

      {sortedPosts.map((post, index) => (
        <React.Fragment key={post.id}>
          {index === 1 && (
            <HotSpotsWidget
              onPlaceClick={onPlaceClick}
              followedPlaces={followedPlaces}
              onToggleFollow={toggleFollowPlace}
            />
          )}
          <PostCard
            post={post}
            onUpdatePost={handleUpdatePost}
            onPlaceClick={onPlaceClick}
            onUserClick={onUserClick}
            isPlaceFollowed={post.user.isPlaceAccount ? followedPlaces.includes(post.user.displayName) : undefined}
            onToggleFollow={post.user.isPlaceAccount ? () => toggleFollowPlace(post.user.displayName) : undefined}
          />
        </React.Fragment>
      ))}
    </div>
  );
};