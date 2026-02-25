import React, { useState, useRef } from 'react';
import { User, Post } from '../types';
import { Settings, MapPin, Shield, Activity, Camera, Save, Edit2, X, Music, Users, MessageCircle, Zap, ChevronRight, Clock, Crown } from 'lucide-react';

import { PostCard } from './PostCard';
import { Roots } from './OriginRoots';
import { calculateTrustScore } from '../utils/algorithms';
import { FollowButton } from './FollowButton';
import { useAdmin } from '../hooks/useAdmin';
import { AdminDashboard } from './AdminDashboard';

const IS_DEV = import.meta.env.DEV;

// Helper Component for Friend Item
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const FriendItem: React.FC<{ userId: string }> = ({ userId }) => {
  const [friend, setFriend] = useState<User | null>(null);
  const [error, setError] = useState(false);

  React.useEffect(() => {
    const fetchFriend = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', userId));
        if (snap.exists()) {
          setFriend({ id: snap.id, ...snap.data() } as User);
        } else {
          setError(true);
        }
      } catch (e) {
        console.error(e);
        setError(true);
      }
    };
    fetchFriend();
  }, [userId]);

  if (error) return null; // Hide if user not found/error
  if (!friend) return <div className="h-12 bg-slate-800/50 rounded-lg animate-pulse" />;

  return (
    <div className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded-lg transition">
      <img src={friend.avatarUrl} className="w-10 h-10 rounded-full object-cover" alt="" />
      <div>
        <div className="font-bold text-white">@{friend.handle}</div>
        <div className="text-xs text-slate-400">@{friend.handle || 'user'}</div>
      </div>
    </div>
  );
};

interface ProfileProps {
  user: User; // The user being VIEWED
  currentUser: User; // The logged-in user
  onUpdateUser: (updates: Partial<User>) => void; // Only works if user.id === currentUser.id
  posts: Post[];
  onMessage?: () => void;
  onNavigate?: (page: string) => void;
  onToggleFollow?: () => void;
  onUpdatePost?: (post: Partial<Post>) => void; // Updated for compatibility
}

// Mock Data removed




export const Profile: React.FC<ProfileProps> = ({ user, currentUser, onUpdateUser, posts, onMessage, onNavigate, onToggleFollow, onUpdatePost }) => {
  const [bio, setBio] = useState(user.bio || '');
  const [isEditing, setIsEditing] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [showVibes, setShowVibes] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showRoots, setShowRoots] = useState(false);
  const [showPlaces, setShowPlaces] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [isGhostMode, setIsGhostMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showQr, setShowQr] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const { adminPrivileges } = useAdmin();

  const isOwnProfile = user.id === currentUser.id;

  const handleSaveBio = () => {
    if (!isOwnProfile) return;
    onUpdateUser({ bio });
    setIsEditing(false);
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isOwnProfile) return;
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateUser({ avatarUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in relative pb-20">
      <div className="bg-brand-800/50 p-6 rounded-3xl border border-brand-700/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-600/10 to-transparent pointer-events-none" />

        <div className="flex gap-6 relative z-10 w-full">
          {/* Left Column: Avatar + Info + Bio */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative group shrink-0">
                <img
                  src={user.avatarUrl}
                  className="w-20 h-20 rounded-full border-2 border-brand-500 shadow-xl object-cover"
                  alt={user.displayName}
                />
                {isOwnProfile && (
                  <>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Camera className="w-8 h-8 text-white" />
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                    />
                  </>
                )}
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  {isOwnProfile ? user.displayName : `@${user.handle}`}
                  {user.isInfluencer && <Crown className="w-5 h-5 text-amber-500 fill-amber-500" />}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-brand-300 font-medium text-sm">
                    {isOwnProfile ? (user.handle ? `@${user.handle}` : '') : ''}
                  </span>
                  {(() => {
                    const score = calculateTrustScore(user);
                    return (
                      <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${score >= 90 ? "text-green-400 bg-green-500/10 border-green-500/20" :
                        score < 70 ? "text-red-400 bg-red-500/10 border-red-500/20" :
                          "text-blue-400 bg-blue-500/10 border-blue-500/20"
                        }`} title="Trust Score">
                        <Shield className="w-3 h-3" />
                        <span>{score}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Bio Section - Now compact under name/avatar */}
            <div className="w-full">
              {isEditing && isOwnProfile ? (
                <div className="space-y-2">
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about your vibe..."
                    className="w-full bg-slate-900/80 border border-brand-600 rounded-xl p-2 text-slate-200 focus:outline-none resize-none text-sm"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveBio}
                      className="flex items-center gap-1 bg-brand-600 hover:bg-brand-500 text-white px-3 py-1 rounded-lg text-xs transition"
                    >
                      <Save className="w-3 h-3" /> Save
                    </button>
                    <button
                      onClick={() => {
                        setBio(user.bio || '');
                        setIsEditing(false);
                      }}
                      className="text-slate-400 hover:text-white px-3 py-1 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => isOwnProfile && setIsEditing(true)}
                  className={`group relative min-h-[1.5rem] rounded-lg border border-transparent ${isOwnProfile ? 'cursor-pointer hover:bg-brand-900/30 hover:border-brand-800/50 px-2 -ml-2' : ''} transition`}
                >
                  <p className="text-slate-300 text-sm italic leading-relaxed">
                    {user.bio || (isOwnProfile ? "No bio yet. Tap to add your vibe." : "No bio yet.")}
                  </p>
                  {isOwnProfile && <Edit2 className="w-3 h-3 text-brand-400 absolute top-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity" />}
                </div>
              )}
            </div>

            {/* Action Buttons for non-owners */}
            {!isOwnProfile && (
              <div className="flex gap-2 mt-3">
                <button onClick={onMessage} className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-1.5 rounded-full font-bold shadow-lg shadow-brand-600/20 transition flex items-center gap-2 text-xs">
                  <MessageCircle className="w-3 h-3" /> Message
                </button>
                <FollowButton
                  isFollowing={currentUser.following?.includes(user.id) || false}
                  onToggle={(e) => {
                    e.stopPropagation();
                    if (onToggleFollow) onToggleFollow();
                  }}
                  className="px-4 py-1.5 w-auto h-auto rounded-full text-xs font-bold gap-2"
                />

              </div>
            )}
          </div>

        </div>
      </div>

      {/* Stats Grid - Mobile Optimized */}
      <div className="grid grid-cols-5 gap-1 px-1 sm:px-6 md:gap-2 pb-6">
        <button
          onClick={() => setShowVibes(true)}
          className="bg-brand-900/40 py-2 sm:py-3 px-0.5 rounded-xl border border-brand-700/30 hover:bg-brand-800 transition flex flex-col items-center justify-center min-h-[60px]"
        >
          <span className="block text-base sm:text-xl font-bold text-white leading-tight">{user.vibes?.length || 0}</span>
          <span className="text-[8px] sm:text-[10px] text-slate-400 uppercase tracking-tight sm:tracking-wider font-semibold mt-1 truncate w-full text-center">Vibes</span>
        </button>

        <button
          onClick={() => setShowFriends(true)}
          className="bg-brand-900/40 py-2 sm:py-3 px-0.5 rounded-xl border border-brand-700/30 hover:bg-brand-800 transition flex flex-col items-center justify-center min-h-[60px]"
        >
          <span className="block text-base sm:text-xl font-bold text-white leading-tight">
            {(user.followers?.filter(id => user.following?.includes(id)).length) || 0}
          </span>
          <span className="text-[8px] sm:text-[10px] text-slate-400 uppercase tracking-tight sm:tracking-wider font-semibold mt-1 truncate w-full text-center">Friends</span>
        </button>

        <button
          onClick={() => setShowFollowers(true)}
          className="bg-brand-900/40 py-2 sm:py-3 px-0.5 rounded-xl border border-brand-700/30 hover:bg-brand-800 transition flex flex-col items-center justify-center min-h-[60px]"
        >
          <span className="block text-base sm:text-xl font-bold text-white leading-tight">{user.followers?.length || 0}</span>
          <span className="text-[8px] sm:text-[10px] text-slate-400 uppercase tracking-tight sm:tracking-wider font-semibold mt-1 truncate w-full text-center">Followers</span>
        </button>

        <button
          onClick={() => setShowFollowing(true)}
          className="bg-brand-900/40 py-2 sm:py-3 px-0.5 rounded-xl border border-brand-700/30 hover:bg-brand-800 transition flex flex-col items-center justify-center min-h-[60px]"
        >
          <span className="block text-base sm:text-xl font-bold text-white leading-tight">{user.following?.length || 0}</span>
          <span className="text-[8px] sm:text-[10px] text-slate-400 uppercase tracking-tight sm:tracking-wider font-semibold mt-1 truncate w-full text-center">Following</span>
        </button>

        <button
          onClick={() => setShowPlaces(true)}
          className="bg-brand-900/40 py-2 sm:py-3 px-0.5 rounded-xl border border-brand-700/30 hover:bg-brand-800 transition flex flex-col items-center justify-center min-h-[60px]"
        >
          <span className="block text-base sm:text-xl font-bold text-white leading-tight">{user.followedPlaces?.length || 0}</span>
          <span className="text-[8px] sm:text-[10px] text-slate-400 uppercase tracking-tight sm:tracking-wider font-semibold mt-1 truncate w-full text-center">Places</span>
        </button>

        <button
          onClick={() => setShowWishlist(true)}
          className="bg-brand-900/40 py-2 sm:py-3 px-0.5 rounded-xl border border-brand-700/30 hover:bg-brand-800 transition flex flex-col items-center justify-center min-h-[60px]"
        >
          <span className="block text-base sm:text-xl font-bold text-white leading-tight">{user.wishlist?.length || 0}</span>
          <span className="text-[8px] sm:text-[10px] text-slate-400 uppercase tracking-tight sm:tracking-wider font-semibold mt-1 truncate w-full text-center">Wishlist</span>
        </button>
      </div>


      {/* User Posts Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold px-2">Vibe History</h3>
        {posts.length > 0 ? (
          posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onUpdatePost={onUpdatePost || (() => { })}
              currentUser={currentUser}
            />
          ))
        ) : (
          <div className="text-center py-10 text-slate-500 bg-slate-900/30 rounded-2xl border border-slate-800">
            <Camera className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No vibes shared yet.</p>
          </div>
        )}
      </div>

      {/* Settings (Only for Owner) */}
      {
        isOwnProfile && (
          <div className="grid gap-4">
            <div className="bg-brand-900/30 p-4 rounded-xl border border-brand-800 flex items-center justify-between text-slate-300 cursor-not-allowed opacity-75">
              <span className="flex items-center gap-3"><Settings className="w-5 h-5 text-brand-400" /> Account Settings</span>
              <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded">Coming Soon</span>
            </div>
            <div className="bg-brand-900/30 p-4 rounded-xl border border-brand-800 flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-3"><MapPin className="w-5 h-5 text-brand-400" /> Location History</span>
              <span className="text-xs bg-brand-900/80 text-brand-300 border border-brand-700 px-2 py-1 rounded flex items-center gap-1">
                <Shield className="w-3 h-3" /> Auto-Deletes 30d
              </span>
            </div>

            <div className="bg-brand-900/30 p-4 rounded-xl border border-brand-800 flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-500/20 p-1.5 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M9 10h.01" /><path d="M15 10h.01" /><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z" /></svg>
                </div>
                Ghost Mode
              </div>
              <button
                onClick={() => setIsGhostMode(!isGhostMode)}
                className={`w-10 h-5 rounded-full relative transition-colors ${isGhostMode ? 'bg-indigo-500' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform ${isGhostMode ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <div
              onClick={() => setShowActivity(true)}
              className="bg-brand-900/30 p-4 rounded-xl border border-brand-800 flex items-center justify-between text-slate-300 cursor-pointer hover:bg-brand-800 transition"
            >
              <span className="flex items-center gap-3"><Activity className="w-5 h-5 text-brand-400" /> Your Activity</span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </div>

            <div
              onClick={() => onNavigate?.('safety')}
              className="bg-brand-900/30 p-4 rounded-xl border border-brand-800 flex items-center justify-between text-slate-300 cursor-pointer hover:bg-brand-800 transition"
            >
              <span className="flex items-center gap-3"><Shield className="w-5 h-5 text-brand-400" /> Safety Center</span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </div>
          </div>
        )
      }

      {/* Friends Modal (Mutuals) */}
      {
        showFriends && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-brand-900 border border-brand-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
              <button onClick={() => setShowFriends(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-brand-400" /> Friends (Mutual)</h3>
              <div className="space-y-3 max-h-80 overflow-y-auto w-full">
                {(!user.followers || user.followers.filter(id => user.following?.includes(id)).length === 0) && (
                  <p className="text-slate-400 text-sm">No mutual friends yet.</p>
                )}
                {user.followers?.filter(id => user.following?.includes(id)).map(friendId => (
                  <div key={friendId} className="relative">
                    <FriendItem userId={friendId} />
                    <div className="absolute top-1/2 -translate-y-1/2 right-2 text-yellow-400 text-xs font-bold flex items-center gap-1">
                      <Users className="w-3 h-3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      }

      {/* Followers Modal */}
      {
        showFollowers && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-brand-900 border border-brand-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
              <button onClick={() => setShowFollowers(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-brand-400" /> Followers</h3>
              <div className="space-y-3 max-h-80 overflow-y-auto w-full">
                {(!user.followers || user.followers.length === 0) && (
                  <p className="text-slate-400 text-sm">No followers yet.</p>
                )}
                {user.followers?.map(friendId => {
                  const isMutual = user.following?.includes(friendId);
                  return (
                    <div key={friendId} className="relative">
                      <FriendItem userId={friendId} />
                      {isMutual && (
                        <div className="absolute top-1/2 -translate-y-1/2 right-2 text-yellow-400" title="Mutual Friend">
                          <Users className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )
      }

      {/* Following Modal */}
      {
        showFollowing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-brand-900 border border-brand-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
              <button onClick={() => setShowFollowing(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-brand-400" /> Following</h3>
              <div className="space-y-3 max-h-80 overflow-y-auto w-full">
                {(!user.following || user.following.length === 0) && (
                  <p className="text-slate-400 text-sm">Not following anyone yet.</p>
                )}
                {user.following?.map(friendId => {
                  const isMutual = user.followers?.includes(friendId);
                  return (
                    <div key={friendId} className="relative">
                      <FriendItem userId={friendId} />
                      {isMutual && (
                        <div className="absolute top-1/2 -translate-y-1/2 right-2 text-yellow-400" title="Mutual Friend">
                          <Users className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )
      }

      {/* Places Modal */}
      {
        showPlaces && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-brand-900 border border-brand-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
              <button onClick={() => setShowPlaces(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-brand-400" /> Followed Places</h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {(!user.followedPlaces || user.followedPlaces.length === 0) && (
                  <p className="text-slate-400 text-sm">No places followed yet.</p>
                )}
                {user.followedPlaces?.map((placeName, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{placeName}</h4>
                      <p className="text-xs text-slate-500">Followed Spot</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      }

      {/* Wishlist Modal */}
      {
        showWishlist && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-brand-900 border border-brand-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
              <button onClick={() => setShowWishlist(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Save className="w-5 h-5 text-brand-400" /> Wishlist</h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {(!user.wishlist || user.wishlist.length === 0) && (
                  <p className="text-slate-400 text-sm">No places saved yet.</p>
                )}
                {user.wishlist?.map((placeName, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
                      <Save className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{placeName}</h4>
                      <p className="text-xs text-slate-500">Saved Vibe</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      }

      {
        showRoots && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-4xl h-[90vh] relative bg-brand-950 rounded-3xl overflow-hidden border border-brand-500/30">
              <button
                onClick={() => setShowRoots(false)}
                className="absolute top-4 right-4 z-50 text-slate-400 hover:text-white transition-colors p-2 bg-black/20 rounded-full"
              >
                <X className="w-8 h-8" />
              </button>
              <div className="w-full h-full">
                <Roots onBack={() => setShowRoots(false)} />
              </div>
            </div>
          </div>
        )
      }

      {/* Vibes Modal */}
      {
        showVibes && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-brand-900 border border-brand-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
              <button onClick={() => setShowVibes(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-brand-400" /> {isOwnProfile ? 'Edit Your Vibes' : 'Vibes'}</h3>

              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  'Dancing', 'Partying', 'Chilling', 'Dining',
                  'Live Music', 'Deep House', 'Networking', 'Dating',
                  'Techno', 'Art', 'Fashion', 'Foodie'
                ].map(vibe => {
                  const isSelected = user.vibes?.includes(vibe);
                  return (
                    <button
                      key={vibe}
                      onClick={() => {
                        if (!isOwnProfile) return;
                        const currentVibes = user.vibes || [];
                        const newVibes = isSelected
                          ? currentVibes.filter(v => v !== vibe)
                          : [...currentVibes, vibe];
                        onUpdateUser({ vibes: newVibes });
                      }}
                      disabled={!isOwnProfile && !isSelected}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition
                        ${isSelected
                          ? 'bg-brand-500 border-brand-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                          : isOwnProfile
                            ? 'bg-transparent border-slate-700 text-slate-400 hover:border-brand-500 hover:text-white'
                            : 'bg-transparent border-slate-800 text-slate-600 opacity-50 cursor-default hidden'
                        } `}
                    >
                      {vibe}
                    </button>
                  );
                })}

                {/* Show selected vibes that might not be in the list (legacy/custom) */}
                {user.vibes?.filter(v => ![
                  'Dancing', 'Partying', 'Chilling', 'Dining',
                  'Live Music', 'Deep House', 'Networking', 'Dating',
                  'Techno', 'Art', 'Fashion', 'Foodie'
                ].includes(v)).map(vibe => (
                  <button
                    key={vibe}
                    onClick={() => {
                      if (!isOwnProfile) return;
                      const newVibes = user.vibes?.filter(v => v !== vibe) || [];
                      onUpdateUser({ vibes: newVibes });
                    }}
                    className="px-3 py-1.5 rounded-full text-xs font-bold border bg-brand-500 border-brand-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                  >
                    {vibe}
                  </button>
                ))}
              </div>

              {isOwnProfile && (
                <p className="text-xs text-slate-500 text-center">
                  Select the vibes that match your energy.
                </p>
              )}
            </div>
          </div>
        )
      }

      {
        showActivity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-brand-900 border border-brand-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
              <button onClick={() => setShowActivity(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-brand-400" /> Your Activity</h3>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5">
                  <p className="text-slate-500 text-sm text-center italic">No activity to show.</p>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Admin Dashboard Trigger */}
      {isOwnProfile && adminPrivileges && (
        <div className="mt-8 px-4 pb-8">
          <button
            onClick={() => setShowAdminDashboard(true)}
            className="w-full bg-slate-900 border border-amber-500/30 hover:border-amber-500 hover:bg-amber-500/10 text-amber-500 font-bold py-4 rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-900/10"
          >
            <Shield className="w-5 h-5" />
            Access Admin Dashboard
          </button>
        </div>
      )}

      {/* Admin Dashboard Modal */}
      {showAdminDashboard && <AdminDashboard onClose={() => setShowAdminDashboard(false)} />}

      {/* Version Display */}
      <div className="mt-8 mb-8 text-center pb-8">
        <p className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
          VibeMap v0.2.0 (Alpha)
        </p>
        <p className="text-[10px] text-slate-700 mt-1">
          Build: {new Date().toLocaleDateString()}
        </p>
      </div>
    </div >
  );
};
