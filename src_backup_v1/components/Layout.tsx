import { Home, Search, User, MapPin, LogOut, Flame, Crown, Zap } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate, onLogout }) => {
  const navItems = [
    { id: 'feed', icon: Home, label: 'Feed' },
    { id: 'hotspots', icon: Flame, label: 'Hotspots' },
    { id: 'search', icon: Search, label: 'Discovery' },
    { id: 'influencers', icon: Crown, label: 'Inner Circle' },
    { id: 'founders', icon: Zap, label: 'Founders' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-brand-900 border-r border-brand-800 p-6 fixed h-full z-10">
        <div className="flex items-center gap-2 mb-10">
          <MapPin className="text-brand-400 w-8 h-8" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-400 to-accent bg-clip-text text-transparent">
            VibeMap
          </h1>
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
        </nav>

        <button
          onClick={onLogout}
          className="flex items-center gap-3 p-3 text-slate-400 hover:text-red-400 transition-colors mt-auto"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-brand-900 sticky top-0 z-20 border-b border-brand-800">
        <div className="flex items-center gap-2">
          <MapPin className="text-brand-400 w-6 h-6" />
          <span className="font-bold text-xl">VibeMap</span>
        </div>
        <button onClick={onLogout}>
          <LogOut className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8 max-w-4xl mx-auto w-full">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-900 border-t border-brand-800 p-4 flex justify-around z-20 pb-safe">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center gap-1 ${currentPage === item.id ? 'text-brand-400' : 'text-slate-500'
              }`}
          >
            <item.icon className={`w-6 h-6 ${currentPage === item.id ? 'fill-current' : ''}`} />
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
