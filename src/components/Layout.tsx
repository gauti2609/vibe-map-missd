import React, { useState, useEffect } from 'react';
import usePlacesAutocomplete from "use-places-autocomplete";
import { Home, Search, User, MapPin, LogOut, LogIn, Flame, Crown, MessageCircle, X, Navigation, Clock, Plus, Loader2, Bell, Camera } from 'lucide-react';
import { User as UserType } from '../types';
import { db } from '../firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'; // Keep for other uses if any
import { createPost } from '../services/postService';
import { handleError, ERROR_CODES } from '../utils/errorHandler';
import { extractAreaFromAddress } from '../services/gemini';


interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  onDropVibe: () => void;
  isDropVibeOpen: boolean;
  setIsDropVibeOpen: (isOpen: boolean) => void;
  user: UserType | null;
  initialLocation?: string;
  // Notification Props
  notifications?: any[]; // Using any to avoid importing type here if lazy
  onOpenNotifications?: () => void;
  unreadMessageCount?: number;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentPage,
  onNavigate,
  onLogout,
  onDropVibe,
  isDropVibeOpen,
  setIsDropVibeOpen,
  user,
  initialLocation,
  notifications = [],
  onOpenNotifications,
  unreadMessageCount = 0
}) => {
  const [flashMessage, setFlashMessage] = useState('');
  const [flashLocation, setFlashLocation] = useState('');
  const [flashAddress, setFlashAddress] = useState('');
  const [flashDuration, setFlashDuration] = useState('2');
  const [dropImage, setDropImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const unreadNotifCount = notifications.filter(n => !n.read).length;

  // ... (Keep existing Geolocation & Autocomplete Logic) ... 

  // Geolocation & Autocomplete for Drop Vibe
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
      }, (error) => console.log("Layout Geo error:", error));
    }
  }, []);

  const {
    ready: dropReady,
    value: dropValue,
    suggestions: { status: dropStatus, data: dropSuggestions },
    setValue: setDropValue,
    clearSuggestions: clearDropSuggestions,
  } = usePlacesAutocomplete({
    requestOptions,
    debounce: 300,
  });

  // Handle Pre-fill from Profile
  useEffect(() => {
    // Pre-fill if provided
    if (initialLocation && isDropVibeOpen) {
      setDropValue(initialLocation, false); // false to not fetch suggestions immediately?
      setFlashLocation(initialLocation);
      // Address will be unknown until they edit/select, or we could leave it empty.
    }
  }, [initialLocation, isDropVibeOpen, setDropValue]);

  // Handle Drop Vibe Action
  const handleDropVibeSubmit = async () => {
    if (!flashMessage || !dropValue) {
      handleError('Drop Vibe', new Error("Missing Message or Location"), ERROR_CODES.DATA_MISSING_FIELDS);
      return;
    }

    if (!user) {
      handleError('Drop Vibe', new Error("You must be logged in."), ERROR_CODES.AUTH_NOT_LOGGED_IN);
      return;
    }

    try {
      // AI Area Extraction (Write-Time)
      let smartArea = '';
      if (dropValue && flashAddress) {
        smartArea = await extractAreaFromAddress(dropValue, flashAddress);
      }

      const postData = {
        location: {
          name: dropValue,
          address: flashAddress || 'Unknown',
          shortLocation: smartArea
        },
        visitDate: new Date().toISOString(),
        imageUrl: dropImage || null, // Persist image
        rsvps: {},
        comments: [],
        likes: [],
        shares: 0,
        type: 'regular',
        visibility: 'Public'
      };

      await createPost({
        ...postData,
        description: `[DROP: ${flashDuration}h] ${flashMessage}`,
        user: {
          id: user.id,
          displayName: user.displayName,
          handle: user.handle || 'vibemap_user',
          avatarUrl: user.avatarUrl,
          isConnected: true,
          isInfluencer: user.isInfluencer || false,
          trustScore: user.trustScore || 0
        }
      });
      alert(`Vibe dropped for ${flashDuration} hours! Saved to Feed.`);
      setIsDropVibeOpen(false);
      setFlashMessage('');
      setDropValue('');
      setFlashLocation('');
      setFlashAddress('');
      setDropImage(null); // Reset image
      onNavigate('feed'); // Go to feed to see it
    } catch (e) {
      handleError('Drop Vibe', e, ERROR_CODES.NET_FIRESTORE_WRITE);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert("File too large. Max 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setDropImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const navItems = [
    { id: 'feed', icon: Home, label: 'Feed' },
    { id: 'hotspots', icon: Flame, label: 'Hotspots' },
    // Search is now handled by the custom central button
    { id: 'chat', icon: MessageCircle, label: 'Chat' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row">

      {/* Desktop Top Header (New) */}
      <div className="hidden md:flex fixed top-0 left-64 right-0 h-16 bg-slate-950/50 backdrop-blur-md z-20 px-8 items-center justify-end gap-6 border-b border-brand-800/20">
        <button
          onClick={onOpenNotifications}
          className="relative p-2 text-slate-400 hover:text-white transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadNotifCount > 0 && (
            <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900" />
          )}
        </button>
        <button
          onClick={() => onNavigate('origin-roots')}
          className="group flex items-center gap-2 px-4 py-2 rounded-full border border-brand-500/30 bg-brand-500/5 hover:bg-brand-500/10 transition-all duration-300 animate-neon-pulse"
        >
          <Crown className="w-4 h-4 text-brand-400 group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-black uppercase tracking-[0.2em] text-shimmer">
            Our Roots
          </span>
        </button>
        <button
          onClick={onLogout}
          className={`flex items-center gap-2 p-2 transition-colors ${user?.handle?.startsWith('guest_') ? 'text-brand-400 hover:text-brand-300' : 'text-slate-500 hover:text-red-400'}`}
          title={user?.handle?.startsWith('guest_') ? "Log In" : "Sign Out"}
        >
          {user?.handle?.startsWith('guest_') ? <LogIn className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
          <span className="text-xs font-bold uppercase tracking-widest">{user?.handle?.startsWith('guest_') ? 'Login' : 'Logout'}</span>
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-brand-900 border-r border-brand-800 p-6 fixed h-full z-10">
        <div className="flex items-center gap-2 mb-10 cursor-pointer" onClick={() => onNavigate('feed')}>
          <MapPin className="text-brand-400 w-8 h-8" />
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-400 to-accent bg-clip-text text-transparent leading-none">
              VibeMap
            </h1>
            <span className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase mt-1">
              Find Your Tribe
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`relative flex items-center gap-3 w-full p-3 rounded-xl transition-all ${currentPage === item.id
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                : 'text-slate-400 hover:bg-brand-800 hover:text-white'
                }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>

              {/* Sidebar Chat Dot */}
              {item.id === 'chat' && unreadMessageCount > 0 && (
                <span className="absolute right-3 w-3 h-3 bg-green-500 rounded-full shadow-lg shadow-green-500/50" />
              )}
            </button>
          ))}
          {/* Desktop equivalent of the Vibe Finder button? Adding standard item for now */}
          <button
            onClick={() => onNavigate('search')}
            className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${currentPage === 'search'
              ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
              : 'text-slate-400 hover:bg-brand-800 hover:text-white'
              }`}
          >
            <Search className="w-5 h-5" />
            <span className="font-medium">Vibe Finder</span>
          </button>
        </nav>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-brand-900 sticky top-0 z-20 border-b border-brand-800">
        <div className="flex items-center gap-2" onClick={() => onNavigate('feed')}>
          <MapPin className="text-brand-400 w-6 h-6" />
          <div className="flex flex-col">
            <span className="font-bold text-xl leading-none">VibeMap</span>
            <span className="text-[8px] font-bold text-slate-500 tracking-[0.2em] uppercase">Find Your Tribe</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Mobile Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-1.5 text-slate-400 hover:text-white transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-brand-900" />
            )}
          </button>

          <button
            onClick={() => onNavigate('origin-roots')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/5 animate-neon-pulse"
          >
            <Crown className="w-3.5 h-3.5 text-brand-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-shimmer">
              Roots
            </span>
          </button>
          <button onClick={onLogout} className={`p-1 transition-colors ${user?.handle?.startsWith('guest_') ? 'text-brand-400 hover:text-brand-300' : 'text-slate-500 hover:text-red-400'}`}>
            {user?.handle?.startsWith('guest_') ? <LogIn className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 md:pt-24 pb-24 md:pb-8 max-w-4xl mx-auto w-full relative">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-900 border-t border-brand-800 px-4 flex justify-between items-center z-50 h-14">

        {/* Feed */}
        <button onClick={() => onNavigate('feed')} className={`flex flex-col items-center gap-1 ${currentPage === 'feed' ? 'text-white' : 'text-slate-500'}`}>
          <Home className="w-[1.6rem] h-[1.6rem]" strokeWidth={currentPage === 'feed' ? 2.5 : 2} />
        </button>

        {/* Hotspots */}
        <button onClick={() => onNavigate('hotspots')} className={`flex flex-col items-center gap-1 ${currentPage === 'hotspots' ? 'text-white' : 'text-slate-500'}`}>
          <Flame className="w-[1.6rem] h-[1.6rem]" strokeWidth={currentPage === 'hotspots' ? 2.5 : 2} />
        </button>

        {/* CENTER CUSTOM BUTTON: Drop - Vibe - Finder */}
        <div className="relative group pointer-events-none transform scale-90 origin-center">
          <div className="pointer-events-auto relative">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-brand-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full" />

            <div className="bg-gradient-to-b from-brand-600 to-brand-900 border border-brand-400/50 rounded-3xl w-40 h-12 flex items-center justify-between px-1 shadow-2xl shadow-brand-500/30 relative overflow-hidden">
              {/* Background Grid */}
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />

              {/* Left: Drop */}
              <button
                onClick={onDropVibe}
                className="z-10 flex flex-col items-center justify-center w-12 active:scale-95 transition-transform"
              >
                <Plus className="w-5 h-5 text-white mb-0.5" strokeWidth={2.5} />
                <span className="text-[8px] font-bold text-brand-100 uppercase tracking-wide">Drop</span>
              </button>

              {/* Middle: Vertical VIBE Text */}
              <div className="z-10 flex flex-col items-center justify-center">
                <span className="text-xl font-black italic text-white tracking-tighter leading-none" style={{ textShadow: '0 0 10px rgba(255,255,255,0.5)' }}>Vibe</span>
              </div>

              {/* Right: Finder */}
              <button
                onClick={() => onNavigate('search')}
                className="z-10 flex flex-col items-center justify-center w-12 active:scale-95 transition-transform"
              >
                <Search className="w-5 h-5 text-white mb-0.5" strokeWidth={2.5} />
                <span className="text-[8px] font-bold text-brand-100 uppercase tracking-wide">Finder</span>
              </button>

              {/* Vertical Divider Lines */}
              <div className="absolute top-2 bottom-2 left-[3.25rem] w-px bg-white/10" />
              <div className="absolute top-2 bottom-2 right-[3.25rem] w-px bg-white/10" />
            </div>
          </div>
        </div>

        {/* Chat */}
        <button onClick={() => onNavigate('chat')} className={`relative flex flex-col items-center gap-1 ${currentPage === 'chat' ? 'text-white' : 'text-slate-500'}`}>
          <MessageCircle className="w-[1.6rem] h-[1.6rem]" strokeWidth={currentPage === 'chat' ? 2.5 : 2} />
          {unreadMessageCount > 0 && (
            <span className="absolute top-0 right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-brand-900" />
          )}
        </button>

        {/* Profile */}
        <button onClick={() => onNavigate('profile')} className={`flex flex-col items-center gap-1 ${currentPage === 'profile' ? 'text-white' : 'text-slate-500'}`}>
          <User className="w-[1.6rem] h-[1.6rem]" strokeWidth={currentPage === 'profile' ? 2.5 : 2} />
        </button>
      </div>

      {/* Global Drop Vibe Modal */}
      {isDropVibeOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-brand-900 border border-brand-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
            <button onClick={() => setIsDropVibeOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white">
                <Navigation className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Drop a Vibe</h3>
                <p className="text-xs text-slate-400">Signal a flash event nearby.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Message</label>
                <input
                  type="text"
                  placeholder="e.g. Grab a beer @ Open Tap..."
                  value={flashMessage}
                  onChange={(e) => setFlashMessage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Location</label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-4 top-3.5 text-brand-400 w-4 h-4 z-10" />
                  <input
                    type="text"
                    placeholder="Search places..."
                    value={dropValue}
                    onChange={(e) => {
                      setDropValue(e.target.value);
                      setFlashLocation(e.target.value);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-brand-500"
                  />
                  {/* Drop Vibe Suggestions */}
                  {dropStatus === 'OK' && dropSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-brand-800 rounded-xl shadow-xl z-50 max-h-40 overflow-y-auto">
                      {dropSuggestions.map((suggestion) => (
                        <div
                          key={suggestion.place_id}
                          onClick={() => {
                            setDropValue(suggestion.structured_formatting.main_text, false);
                            setFlashLocation(suggestion.structured_formatting.main_text);
                            setFlashAddress(suggestion.structured_formatting.secondary_text);
                            clearDropSuggestions();
                          }}
                          className="px-4 py-2 hover:bg-white/10 cursor-pointer text-sm text-slate-300 truncate"
                        >
                          <span className="font-bold text-white">{suggestion.structured_formatting.main_text}</span>
                          <span className="text-slate-500 ml-1">- {suggestion.structured_formatting.secondary_text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Expires In</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {['1', '2', '4'].map((dur) => (
                    <button
                      key={dur}
                      onClick={() => setFlashDuration(dur)}
                      className={`py-2 rounded-xl text-xs font-bold transition border ${flashDuration === dur
                        ? 'bg-brand-600 border-brand-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                        }`}
                    >
                      {dur} Hour{dur !== '1' && 's'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Add Photo (Optional)</label>

                {!dropImage ? (
                  <div className="flex gap-2 mt-1">
                    {/* Gallery Upload */}
                    <div className="flex-1 relative group">
                      <div className="border border-slate-700 bg-slate-900/50 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800 hover:border-brand-500 transition h-24">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                        <div className="bg-slate-800 p-2 rounded-full mb-1 group-hover:scale-110 transition">
                          {/* Image Icon */}
                          <svg className="w-4 h-4 text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                          </svg>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Gallery</span>
                      </div>
                    </div>

                    {/* Camera Upload */}
                    <div className="flex-1 relative group">
                      <div className="border border-slate-700 bg-slate-900/50 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800 hover:border-brand-500 transition h-24">
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleImageUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                        <div className="bg-slate-800 p-2 rounded-full mb-1 group-hover:scale-110 transition">
                          <Camera className="w-4 h-4 text-brand-400" />
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Camera</span>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Hidden Input for Reset if needed, though we use the state logic above */}
                <input
                  type="file"
                  accept="image/*"
                  id="drop-image-upload"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {dropImage ? (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden border border-brand-700 group">
                    <img src={dropImage} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setDropImage(null)}
                      className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full text-white hover:bg-red-500 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <button
              onClick={async () => {
                setIsSubmitting(true);
                await handleDropVibeSubmit();
                setIsSubmitting(false);
              }}
              disabled={!flashMessage || isSubmitting}
              className="w-full bg-white text-brand-900 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition mt-4 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Clock className="w-4 h-4" />}
              {isSubmitting ? 'Dropping...' : 'Drop Vibe Pin'}
            </button>
          </div>
        </div>
      )
      }
    </div >
  );
};
