import React, { useState, useEffect } from 'react';
import { Home, Search, User, MapPin, LogOut, Flame, Crown, MessageCircle, X, Navigation, Clock, Plus } from 'lucide-react';
import { User as UserType } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  onDropVibe: () => void;
  isDropVibeOpen: boolean;
  setIsDropVibeOpen: (isOpen: boolean) => void;
  user: UserType | null;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentPage,
  onNavigate,
  onLogout,
  onDropVibe,
  isDropVibeOpen,
  setIsDropVibeOpen,
  user
}) => {
  const [flashMessage, setFlashMessage] = useState('');
  const [flashLocation, setFlashLocation] = useState('');
  const [flashDuration, setFlashDuration] = useState('2');

  useEffect(() => {
    if (isDropVibeOpen) {
      setFlashLocation('CyberHub, Gurgaon');
    }
  }, [isDropVibeOpen]);

  // Handle Drop Vibe Action
  const handleDropVibeSubmit = () => {
    alert(`Vibe dropped for ${flashDuration} hours! Notifications sent.`);
    setIsDropVibeOpen(false);
    setFlashMessage('');
    onNavigate('hotspots'); // Navigate to map to show result
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
          className="flex items-center gap-2 p-2 text-slate-500 hover:text-red-400 transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest">Logout</span>
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
              className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${currentPage === item.id
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                : 'text-slate-400 hover:bg-brand-800 hover:text-white'
                }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
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
          <button
            onClick={() => onNavigate('origin-roots')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/5 animate-neon-pulse"
          >
            <Crown className="w-3.5 h-3.5 text-brand-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-shimmer">
              Roots
            </span>
          </button>
          <button onClick={onLogout} className="p-1 text-slate-500 hover:text-red-400 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 md:pt-24 pb-24 md:pb-8 max-w-4xl mx-auto w-full">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-900 border-t border-brand-800 p-2 pb-6 px-4 flex justify-between items-end z-50 min-h-[5rem]">

        {/* Feed */}
        <button onClick={() => onNavigate('feed')} className={`flex flex-col items-center gap-1 ${currentPage === 'feed' ? 'text-white' : 'text-slate-500'}`}>
          <Home className="w-8 h-8" strokeWidth={currentPage === 'feed' ? 2.5 : 2} />
        </button>

        {/* Hotspots */}
        <button onClick={() => onNavigate('hotspots')} className={`flex flex-col items-center gap-1 ${currentPage === 'hotspots' ? 'text-white' : 'text-slate-500'}`}>
          <Flame className="w-8 h-8" strokeWidth={currentPage === 'hotspots' ? 2.5 : 2} />
        </button>

        {/* CENTER CUSTOM BUTTON: Drop - Vibe - Finder */}
        <div className="relative group pointer-events-none mb-0.5">
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
              <div className="z-10 flex flex-col items-center justify-center -mt-0.5">
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
        <button onClick={() => onNavigate('chat')} className={`flex flex-col items-center gap-1 ${currentPage === 'chat' ? 'text-white' : 'text-slate-500'}`}>
          <MessageCircle className="w-8 h-8" strokeWidth={currentPage === 'chat' ? 2.5 : 2} />
        </button>

        {/* Profile */}
        <button onClick={() => onNavigate('profile')} className={`flex flex-col items-center gap-1 ${currentPage === 'profile' ? 'text-white' : 'text-slate-500'}`}>
          <User className="w-8 h-8" strokeWidth={currentPage === 'profile' ? 2.5 : 2} />
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
                  <MapPin className="absolute left-4 top-3.5 text-brand-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Detecting location..."
                    value={flashLocation}
                    onChange={(e) => setFlashLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500 px-1 mt-1 italic">Click to edit</p>
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

              <button
                onClick={handleDropVibeSubmit}
                disabled={!flashMessage}
                className="w-full bg-white text-brand-900 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition mt-4 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4" /> Drop Vibe Pin
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
