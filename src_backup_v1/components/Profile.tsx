import React, { useState, useRef } from 'react';
import { User } from '../types';
import { Settings, MapPin, Shield, Activity, Camera, Save, Edit2, X, Music, Users } from 'lucide-react';

interface ProfileProps {
  user: User;
  onUpdateUser: (updates: Partial<User>) => void;
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

export const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser }) => {
  const [bio, setBio] = useState(user.bio || '');
  const [isEditing, setIsEditing] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [showVibes, setShowVibes] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveBio = () => {
    onUpdateUser({ bio });
    setIsEditing(false);
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in relative">
       <div className="bg-brand-800/50 p-8 rounded-3xl border border-brand-700/50 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-brand-600/20 to-transparent pointer-events-none" />
          
          <div className="relative group mb-4 z-10">
            <img 
              src={user.avatarUrl} 
              className="w-32 h-32 rounded-full border-4 border-brand-500 shadow-xl object-cover" 
              alt={user.displayName} 
            />
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
          </div>

          <h2 className="text-3xl font-bold text-white relative z-10">{user.displayName}</h2>
          <p className="text-brand-300 mt-1 font-medium relative z-10">@{user.displayName.toLowerCase().replace(/\s/g, '')}</p>
          
          {/* Bio Section */}
          <div className="mt-4 relative z-10 w-full max-w-md">
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about your vibe..."
                  className="w-full bg-slate-900/80 border border-brand-600 rounded-xl p-3 text-slate-200 focus:outline-none resize-none text-center"
                  rows={3}
                />
                <div className="flex justify-center gap-2">
                  <button 
                    onClick={handleSaveBio}
                    className="flex items-center gap-1 bg-brand-600 hover:bg-brand-500 text-white px-3 py-1 rounded-lg text-sm transition"
                  >
                    <Save className="w-3 h-3" /> Save
                  </button>
                  <button 
                    onClick={() => {
                      setBio(user.bio || '');
                      setIsEditing(false);
                    }}
                    className="text-slate-400 hover:text-white px-3 py-1 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => setIsEditing(true)}
                className="group relative cursor-pointer min-h-[2rem] px-4 py-2 rounded-xl hover:bg-brand-900/30 transition border border-transparent hover:border-brand-800/50"
              >
                <p className="text-slate-300 italic">
                  {user.bio || "No bio yet. Tap to add your vibe."}
                </p>
                <Edit2 className="w-3 h-3 text-brand-400 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>

          <div className="flex gap-4 mt-6 relative z-10">
             <button 
                onClick={() => setShowVibes(true)}
                className="bg-brand-900/50 px-6 py-3 rounded-xl border border-brand-700/50 min-w-[100px] hover:bg-brand-800 transition"
             >
                <span className="block text-2xl font-bold text-white">{MOCK_VIBES.length}</span>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Vibes</span>
             </button>
             <button 
                onClick={() => setShowFriends(true)}
                className="bg-brand-900/50 px-6 py-3 rounded-xl border border-brand-700/50 min-w-[100px] hover:bg-brand-800 transition"
             >
                <span className="block text-2xl font-bold text-white">{MOCK_FRIENDS.length}</span>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Friends</span>
             </button>
          </div>
       </div>

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
             <span className="flex items-center gap-3"><Activity className="w-5 h-5 text-brand-400" /> Activity Log</span>
          </div>
       </div>

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

       {/* Vibes Modal */}
       {showVibes && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
           <div className="bg-brand-900 border border-brand-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
             <button onClick={() => setShowVibes(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
             <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Music className="w-5 h-5 text-brand-400" /> Your Vibes</h3>
             <div className="flex flex-wrap gap-2">
               {MOCK_VIBES.map((vibe, i) => (
                 <span key={i} className="bg-brand-800 text-brand-100 px-3 py-1.5 rounded-lg text-sm font-medium border border-brand-700">
                   {vibe}
                 </span>
               ))}
             </div>
           </div>
         </div>
       )}
    </div>
  );
};
