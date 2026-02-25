import React, { useState, useRef } from 'react';
import { User, Post } from '../types';
import { Settings, MapPin, Shield, Activity, Camera, Save, Edit2, X, Music, Users, MessageCircle, Zap, ChevronRight, Clock } from 'lucide-react';
import { ACTIVITY_HISTORY } from '../data';
import { PostCard } from './PostCard';
import { Roots } from './OriginRoots';

interface ProfileProps {
  user: User; // The user being VIEWED
  currentUser: User; // The logged-in user
  onUpdateUser: (updates: Partial<User>) => void; // Only works if user.id === currentUser.id
  posts: Post[];
  onMessage?: () => void;
  onNavigate?: (page: string) => void;
}

// Mock Data for Profile Lists
const MOCK_FRIENDS = [
  { id: '1', name: 'JazzSoul', avatar: 'https://picsum.photos/50/50?10', status: 'Online' },
  { id: '2', name: 'NeonRider', avatar: 'https://picsum.photos/50/50?11', status: 'Last seen 2h ago' },
  { id: '3', name: 'TechnoKing', avatar: 'https://picsum.photos/50/50?12', status: 'At Cyber Hub' },
  { id: '4', name: 'VibeQueen', avatar: 'https://picsum.photos/50/50?13', status: 'Online' },
];

const MOCK_VIBES = [
  'Techno Music', 'Rooftop Bars', 'Jazz Nights', 'Late Night Drives', 'Cocktail Making', 'Street Food'
];

export const Profile: React.FC<ProfileProps> = ({ user, currentUser, onUpdateUser, posts, onMessage, onNavigate }) => {
  const [bio, setBio] = useState(user.bio || '');
  const [isEditing, setIsEditing] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [showVibes, setShowVibes] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showRoots, setShowRoots] = useState(false);
  const [isGhostMode, setIsGhostMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
                  {user.displayName}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-brand-300 font-medium text-sm">@{user.displayName.toLowerCase().replace(/\s/g, '')}</span>
                  {user.trustScore !== undefined && (
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${user.trustScore >= 90 ? "text-green-400 bg-green-500/10 border-green-500/20" :
                      user.trustScore < 70 ? "text-red-400 bg-red-500/10 border-red-500/20" :
                        "text-blue-400 bg-blue-500/10 border-blue-500/20"
                      }`} title="Trust Score">
                      <Shield className="w-3 h-3" />
                      <span>{user.trustScore}</span>
                    </div>
                  )}
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
                <button className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-1.5 rounded-full font-bold transition text-xs">
                  Follow
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Stacked Stats */}
          <div className="flex flex-col gap-2 w-20 shrink-0">
            <button
              onClick={() => setShowVibes(true)}
              className="bg-brand-900/40 p-1 rounded-xl border border-brand-700/30 hover:bg-brand-800 transition flex flex-col items-center justify-center aspect-square w-full h-auto"
            >
              <span className="block text-xl font-bold text-white">{MOCK_VIBES.length}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Vibes</span>
            </button>
            <button
              onClick={() => setShowFriends(true)}
              className="bg-brand-900/40 p-1 rounded-xl border border-brand-700/30 hover:bg-brand-800 transition flex flex-col items-center justify-center aspect-square w-full h-auto"
            >
              <span className="block text-xl font-bold text-white">{MOCK_FRIENDS.length}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Friends</span>
            </button>
            <button
              className="bg-brand-900/40 p-1 rounded-xl border border-brand-700/30 hover:bg-brand-800 transition flex flex-col items-center justify-center aspect-square w-full h-auto"
            >
              <span className="block text-xl font-bold text-white">{user.followedPlaces?.length || 2}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Places</span>
            </button>
          </div>
        </div>
      </div>

      {/* User Posts Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold px-2">Vibe History</h3>
        {posts.length > 0 ? (
          posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onUpdatePost={() => { }} // Read-only or mock update for now in profile view
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
      {isOwnProfile && (
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
      )}

      {/* Friends Modal */}
      {showFriends && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-brand-900 border border-brand-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
            <button onClick={() => setShowFriends(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-brand-400" /> Friends</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {MOCK_FRIENDS.map(friend => (
                <div key={friend.id} className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded-lg transition">
                  <img src={friend.avatar} className="w-10 h-10 rounded-full" alt="" />
                  <div>
                    <div className="font-bold text-white">{friend.name}</div>
                    <div className="text-xs text-slate-400">{friend.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showRoots && (
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
      )}

      {showActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-brand-900 border border-brand-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button onClick={() => setShowActivity(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-brand-400" /> Your Activity</h3>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {ACTIVITY_HISTORY.map(item => (
                <div key={item.id} className="bg-slate-900/40 border border-white/5 p-4 rounded-2xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center border border-brand-500/20 text-brand-400">
                    {item.type === 'checkin' && <MapPin className="w-5 h-5" />}
                    {item.type === 'event' && <Clock className="w-5 h-5" />}
                    {item.type === 'connection' && <Users className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-bold text-sm">{item.place}</h4>
                    <p className="text-xs text-slate-500">{item.time} • {item.vibe}</p>
                  </div>
                  <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-full">{item.points}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
