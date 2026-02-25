import React, { useState, useRef, useEffect } from 'react';
import { Calendar, MapPin, MessageCircle, MoreHorizontal, CheckCircle, HelpCircle, XCircle, Image as ImageIcon, X, Camera, Send, Heart, Loader2, TrendingUp, Clock, Flag, AlertTriangle, Flame, PartyPopper, ChevronRight, Utensils, Music, Wine, Coffee, Ticket, Users, Share2, Star, Link as LinkIcon } from 'lucide-react';
import { Post, RSVPStatus, ReactionType, PlaceCategory, LocationInfo } from '../types';
import { moderateContent, findPlaces } from '../services/gemini';
import { MOCK_POSTS, HOT_SPOTS } from '../data';

// Helper for Date Formatting (dd/mm/yyyy)
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Helper for Time Formatting (24h)
const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

// Helper to render text with @mentions and #hashtags
const renderTextWithTags = (text: string) => {
  return text.split(/(\s+)/).map((part, i) => {
    if (part.startsWith('@')) {
      return <span key={i} className="text-blue-400 font-medium cursor-pointer hover:underline">{part}</span>;
    }
    if (part.startsWith('#')) {
      return <span key={i} className="text-brand-400 font-medium cursor-pointer hover:underline">{part}</span>;
    }
    return part;
  });
};

// Mock Helper to get user details for RSVP list
const getMockUser = (id: string, index: number) => ({
  id,
  displayName: id === 'currentUser' ? 'You' : `Viber${index}`,
  avatarUrl: `https://picsum.photos/50/50?${index + 100}`,
  isConnected: index % 2 === 0
});

// Horizontal Scrolling Hotspots Widget (Compact Square Version)
const HotSpotsWidget: React.FC<{ onPlaceClick: (place: string) => void }> = ({ onPlaceClick }) => {
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
        {area.places.map((place, i) => (
          <div
            key={i}
            onClick={() => onPlaceClick(place.name)}
            className="min-w-[100px] w-[100px] h-[100px] bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-end shadow-md flex-shrink-0 relative overflow-hidden group cursor-pointer hover:border-brand-500/50 transition active:scale-95"
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

            <div className="relative z-10 p-2 w-full">
              <div className="text-[10px] font-bold text-white truncate leading-tight mb-0.5">{place.name}</div>
              <div className="flex items-center gap-1">
                {place.trend === 'up' && <TrendingUp className="w-2.5 h-2.5 text-green-400" />}
                {place.trend === 'down' && <TrendingUp className="w-2.5 h-2.5 text-red-400 rotate-180" />}
                {place.trend === 'stable' && <div className="w-1 h-1 bg-slate-400 rounded-full" />}
                <span className={`text-[8px] font-medium ${place.trend === 'up' ? 'text-green-400' : place.trend === 'down' ? 'text-red-400' : 'text-slate-400'}`}>
                  {place.trend === 'up' ? 'Rising' : place.trend === 'down' ? 'Quiet' : 'Stable'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface FeedProps {
  onPlaceClick: (place: string) => void;
}

export const Feed: React.FC<FeedProps> = ({ onPlaceClick }) => {
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [commentInput, setCommentInput] = useState<{ [postId: string]: string }>({});
  const [loadingComment, setLoadingComment] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');

  // Modals & Active States
  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [rsvpModal, setRsvpModal] = useState<{ postId: string, status: RSVPStatus } | null>(null);
  const [viewRsvpListId, setViewRsvpListId] = useState<string | null>(null);
  const [sharePostId, setSharePostId] = useState<string | null>(null);

  // Create Post State
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [newPostLocation, setNewPostLocation] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationInfo[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [newPostDate, setNewPostDate] = useState('');
  const [newPostDesc, setNewPostDesc] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sortedPosts = [...posts].sort((a, b) => {
    if (sortBy === 'popular') {
      return b.likes - a.likes;
    }
    return new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime();
  });

  // Location Autocomplete Debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (newPostLocation.length > 2 && showLocationSuggestions) {
        // We rely on the onChange handler for the search trigger
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [newPostLocation]);

  const handleLocationInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewPostLocation(val);
    if (val.length > 0) {
      setShowLocationSuggestions(true);
      const results = await findPlaces(val);
      setLocationSuggestions(results);
    } else {
      setShowLocationSuggestions(false);
      setLocationSuggestions([]);
    }
  };

  const selectLocation = (place: LocationInfo) => {
    setNewPostLocation(place.name);
    setShowLocationSuggestions(false);
  };

  const handleRSVP = (postId: string, status: RSVPStatus) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const currentStatus = post.rsvps['currentUser'];
        const isRemoving = currentStatus === status;

        // 1. Update State Immediately
        const newRsvps = { ...post.rsvps };
        if (isRemoving) {
          delete newRsvps['currentUser'];
        } else {
          newRsvps['currentUser'] = status;
        }

        // 2. Trigger Booking Modal if needed (only when adding Going/Maybe)
        if (!isRemoving && (status === RSVPStatus.WILL_JOIN || status === RSVPStatus.MAYBE)) {
          setRsvpModal({ postId, status });
        } else {
          // Close modal if we are removing or setting a non-booking status
          if (rsvpModal?.postId === postId) setRsvpModal(null);
        }

        return { ...post, rsvps: newRsvps };
      }
      return post;
    }));
  };

  const handleBooking = () => {
    alert("Redirecting to Table Booking Partner...");
    setRsvpModal(null);
  };

  const handleReaction = (postId: string, type: ReactionType) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const isRemoving = post.userReaction === type;
        const newReaction = isRemoving ? undefined : type;
        let newLikes = post.likes;
        if (post.userReaction && !isRemoving && post.userReaction !== type) {
          // switching
        } else if (isRemoving) {
          newLikes--;
        } else if (!post.userReaction) {
          newLikes++;
        }
        return { ...post, likes: newLikes, userReaction: newReaction };
      }
      return post;
    }));
  };

  const toggleComments = (postId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
    }
    setExpandedComments(newExpanded);
  };

  const handleReportPost = (postId: string) => {
    setReportingPostId(postId);
    setOpenMenuPostId(null);
  };

  const confirmReport = () => {
    alert('Post reported successfully. We will review it shortly.');
    setReportingPostId(null);
  };

  const submitComment = async (postId: string) => {
    const text = commentInput[postId];
    if (!text) return;
    setLoadingComment(postId);
    const moderation = await moderateContent(text);
    if (!moderation.safe) {
      alert(`Comment blocked: ${moderation.reason}`);
      setLoadingComment(null);
      return;
    }
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [...post.comments, {
            id: Date.now().toString(),
            userId: 'currentUser',
            userName: 'Me',
            text: text,
            timestamp: new Date().toISOString()
          }]
        };
      }
      return post;
    }));
    setCommentInput(prev => ({ ...prev, [postId]: '' }));
    setLoadingComment(null);
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
    if (!newPostLocation || !newPostDate || !newPostDesc) return;
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
      description: newPostDesc,
      rsvps: {},
      comments: [],
      likes: 0,
      imageUrl: newPostImage || undefined
    };
    setPosts([newPost, ...posts]);
    setIsCreatingPost(false);
    setNewPostLocation('');
    setNewPostDate('');
    setNewPostDesc('');
    setNewPostImage(null);
  };

  return (
    <div className="space-y-6 relative pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold">Upcoming Vibes</h2>

        <div className="flex w-full md:w-auto gap-2">
          <div className="flex bg-brand-900 border border-brand-800 rounded-lg p-1 mr-auto md:mr-0">
            <button
              onClick={() => setSortBy('recent')}
              className={`px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 transition ${sortBy === 'recent' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
            >
              <Clock className="w-4 h-4" /> Recent
            </button>
            <button
              onClick={() => setSortBy('popular')}
              className={`px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 transition ${sortBy === 'popular' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
            >
              <TrendingUp className="w-4 h-4" /> Popular
            </button>
          </div>

          <button
            onClick={() => setIsCreatingPost(true)}
            className="bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-lg font-medium transition text-sm flex items-center gap-2 whitespace-nowrap"
          >
            <Camera className="w-4 h-4" />
            Share Vibe
          </button>
        </div>
      </div>

      {/* Modals */}

      {/* Report Confirmation Modal */}
      {reportingPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-brand-900 border border-brand-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Report Post?</h3>
            <p className="text-slate-400 mb-6 text-sm">
              Are you sure you want to report this post? Our AI moderation team will review it for guidelines violations.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setReportingPostId(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 py-2.5 rounded-xl font-medium text-slate-300 transition">Cancel</button>
              <button onClick={confirmReport} className="flex-1 bg-red-600 hover:bg-red-700 py-2.5 rounded-xl font-medium text-white transition">Report</button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {sharePostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-brand-900 border border-brand-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
            <button onClick={() => setSharePostId(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Share2 className="w-5 h-5 text-brand-400" /> Share Post</h3>

            <div className="space-y-3">
              <button className="w-full bg-slate-800 hover:bg-slate-700 p-3 rounded-xl flex items-center justify-between text-left transition group">
                <span className="text-slate-200">Copy Link</span>
                <LinkIcon className="w-5 h-5 text-slate-400 group-hover:text-white" />
              </button>
              <button className="w-full bg-slate-800 hover:bg-slate-700 p-3 rounded-xl flex items-center justify-between text-left transition group">
                <span className="text-slate-200">Share via WhatsApp</span>
                <MessageCircle className="w-5 h-5 text-green-500" />
              </button>
              <button className="w-full bg-slate-800 hover:bg-slate-700 p-3 rounded-xl flex items-center justify-between text-left transition group">
                <span className="text-slate-200">Share via Instagram</span>
                <Camera className="w-5 h-5 text-pink-500" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RSVP Confirmation Modal */}
      {rsvpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-brand-900 border border-brand-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
            <button onClick={() => setRsvpModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
            <h3 className="text-xl font-bold mb-2">Book a Spot?</h3>
            <p className="text-slate-300 mb-6">
              You're marked as <span className="font-bold text-white">"{rsvpModal.status}"</span>.
              {(rsvpModal.status === RSVPStatus.WILL_JOIN || rsvpModal.status === RSVPStatus.MAYBE) &&
                " Reserve a table now to secure your vibe?"}
            </p>

            <div className="space-y-3">
              {(rsvpModal.status === RSVPStatus.WILL_JOIN || rsvpModal.status === RSVPStatus.MAYBE) && (
                <button
                  onClick={handleBooking}
                  className="w-full bg-brand-600 hover:bg-brand-500 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2"
                >
                  <Ticket className="w-4 h-4" /> Book Table
                </button>
              )}
              <button
                onClick={() => setRsvpModal(null)}
                className="w-full bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-bold text-white"
              >
                No, thanks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RSVP List Modal */}
      {viewRsvpListId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-brand-900 border border-brand-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button onClick={() => setViewRsvpListId(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-brand-400" /> Who's Going</h3>

            {(() => {
              const post = posts.find(p => p.id === viewRsvpListId);
              if (!post) return null;

              const rsvpEntries = Object.entries(post.rsvps);
              if (rsvpEntries.length === 0) return <p className="text-slate-400 italic">No RSVPs yet.</p>;

              return (
                <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                  {[RSVPStatus.WILL_JOIN, RSVPStatus.INTERESTED, RSVPStatus.MAYBE, RSVPStatus.NOT_THIS_TIME].map(status => {
                    const usersInStatus = rsvpEntries.filter(([_, s]) => s === status);
                    if (usersInStatus.length === 0) return null;

                    return (
                      <div key={status}>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-800 pb-1">{status}</h4>
                        <div className="space-y-2">
                          {usersInStatus.map(([uid, _], idx) => {
                            const mockUser = getMockUser(uid, idx);
                            return (
                              <div key={uid} className="flex items-center gap-3">
                                <img src={mockUser.avatarUrl} className="w-8 h-8 rounded-full bg-slate-700" alt="" />
                                <span className="text-sm text-slate-200">{mockUser.displayName}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              );
            })()}
          </div>
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
                  />
                </div>
                {showLocationSuggestions && locationSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-brand-700 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto">
                    {locationSuggestions.map((place, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectLocation(place)}
                        className="w-full text-left px-4 py-2 hover:bg-brand-900/50 text-sm text-slate-200 border-b border-slate-800 last:border-0"
                      >
                        <div className="font-bold">{place.name}</div>
                        <div className="text-xs text-slate-500 truncate">{place.address}</div>
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

      {sortedPosts.map((post, index) => {
        const isCommentsExpanded = expandedComments.has(post.id);
        const isMenuOpen = openMenuPostId === post.id;
        const currentReaction = post.userReaction;
        const rsvpCount = Object.keys(post.rsvps).length;

        return (
          <React.Fragment key={post.id}>
            {/* Hot Spots Widget - Inserted after the first post */}
            {index === 1 && (
              <HotSpotsWidget onPlaceClick={onPlaceClick} />
            )}

            <div className="bg-brand-800/50 border border-brand-800/50 rounded-2xl p-5 shadow-xl backdrop-blur-sm mb-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                  <img src={post.user.avatarUrl} alt="" className="w-12 h-12 rounded-full border-2 border-brand-600 object-cover" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">{post.user.displayName}</h3>
                      {post.user.isConnected ? (
                        <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">Friend</span>
                      ) : (
                        <span className="bg-slate-700 text-slate-400 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">Suggested</span>
                      )}
                    </div>
                    <div className="flex items-center text-slate-400 text-sm mt-1">
                      <MapPin className="w-3 h-3 mr-1" />
                      {post.location.name}
                      <span className="mx-2">•</span>
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(post.visitDate)} {formatTime(post.visitDate)}
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setOpenMenuPostId(isMenuOpen ? null : post.id)}
                    className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>

                  {isMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenMenuPostId(null)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-brand-900 border border-brand-700 rounded-xl shadow-xl z-20 py-1 overflow-hidden animate-fade-in">
                        <button
                          onClick={() => handleReportPost(post.id)}
                          className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-brand-800 flex items-center gap-2"
                        >
                          <Flag className="w-4 h-4" /> Report Post
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <p className="text-slate-200 mb-4 pl-1 whitespace-pre-wrap">
                {renderTextWithTags(post.description)}
              </p>

              {post.imageUrl && (
                <div className="mb-4 rounded-xl overflow-hidden border border-slate-700/50">
                  <img src={post.imageUrl} alt="Post attachment" className="w-full h-auto max-h-96 object-cover" />
                </div>
              )}

              {/* RSVP Section */}
              <div className="bg-slate-900/50 rounded-xl p-3 mb-4 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-widest">Are you going?</span>
                  {rsvpCount > 0 && (
                    <button
                      onClick={() => setViewRsvpListId(post.id)}
                      className="text-xs text-brand-400 hover:text-brand-300 font-medium hover:underline flex items-center gap-1"
                    >
                      <Users className="w-3 h-3" /> {rsvpCount} going
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
                  {[RSVPStatus.WILL_JOIN, RSVPStatus.INTERESTED, RSVPStatus.MAYBE, RSVPStatus.NOT_THIS_TIME].map((status) => {
                    const isSelected = post.rsvps['currentUser'] === status;
                    let icon = <CheckCircle className="w-4 h-4" />;
                    if (status === RSVPStatus.MAYBE) icon = <HelpCircle className="w-4 h-4" />;
                    if (status === RSVPStatus.NOT_THIS_TIME) icon = <XCircle className="w-4 h-4" />;
                    if (status === RSVPStatus.INTERESTED) icon = <Star className="w-4 h-4" />;

                    return (
                      <button
                        key={status}
                        onClick={() => handleRSVP(post.id, status)}
                        className={`px-2 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium flex items-center justify-center gap-1.5 transition-all flex-1 whitespace-nowrap ${isSelected
                          ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                      >
                        {icon} {status}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Actions Bar */}
              <div className="flex items-center gap-4 border-t border-slate-800/50 pt-3">
                <div className="flex items-center bg-slate-800/50 rounded-full px-2 py-1">
                  <button
                    onClick={() => handleReaction(post.id, 'heart')}
                    className={`p-1.5 rounded-full transition-transform active:scale-90 hover:bg-slate-700 ${currentReaction === 'heart' ? 'text-pink-500' : 'text-slate-400'}`}
                    title="Love"
                  >
                    <Heart className={`w-5 h-5 ${currentReaction === 'heart' ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleReaction(post.id, 'fire')}
                    className={`p-1.5 rounded-full transition-transform active:scale-90 hover:bg-slate-700 ${currentReaction === 'fire' ? 'text-orange-500' : 'text-slate-400'}`}
                    title="Lit"
                  >
                    <Flame className={`w-5 h-5 ${currentReaction === 'fire' ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleReaction(post.id, 'party')}
                    className={`p-1.5 rounded-full transition-transform active:scale-90 hover:bg-slate-700 ${currentReaction === 'party' ? 'text-yellow-500' : 'text-slate-400'}`}
                    title="Party"
                  >
                    <PartyPopper className={`w-5 h-5 ${currentReaction === 'party' ? 'fill-current' : ''}`} />
                  </button>
                  <span className="text-sm font-bold text-slate-300 ml-2 mr-1">{post.likes}</span>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-brand-400 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="hidden sm:inline">{post.comments.length} Comments</span>
                    <span className="sm:hidden">{post.comments.length}</span>
                  </button>
                  <button
                    onClick={() => setSharePostId(post.id)}
                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-brand-400 transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Expandable Comments Section */}
              {isCommentsExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-800/50 animate-fade-in">
                  {post.comments.length > 0 ? (
                    <div className="space-y-3 mb-4">
                      {post.comments.map(comment => (
                        <div key={comment.id} className="bg-slate-900/30 p-3 rounded-lg text-sm">
                          <span className="font-bold text-brand-400 mr-2">{comment.userName}</span>
                          <span className="text-slate-300">{comment.text}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm mb-4 italic">No comments yet. Be the first!</p>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={commentInput[post.id] || ''}
                      onChange={(e) => setCommentInput(prev => ({ ...prev, [post.id]: e.target.value }))}
                      className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brand-600 text-white"
                    />
                    <button
                      onClick={() => submitComment(post.id)}
                      disabled={loadingComment === post.id}
                      className="bg-brand-600 hover:bg-brand-700 p-2 rounded-lg text-white disabled:opacity-50 min-w-[40px] flex items-center justify-center"
                    >
                      {loadingComment === post.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};