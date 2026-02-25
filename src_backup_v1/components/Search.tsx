import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, MapPin, Clock, Calendar, UserPlus, MessageSquare, Loader2, Users, UserCheck, Sparkles, Star, Crown, ArrowRight, CheckCircle } from 'lucide-react';
import { findPlaces, generateUsernames } from '../services/gemini';
import { LocationInfo, User, Post } from '../types';
import { MOCK_POSTS } from '../data';

interface SearchProps {
    initialQuery?: string;
    followingIds: Set<string>;
    onToggleFollow: (userId: string) => void;
}

export const Search: React.FC<SearchProps> = ({ initialQuery, followingIds, onToggleFollow }) => {
    const [activeTab, setActiveTab] = useState<'reconnect' | 'discovery'>('reconnect');

    // Reconnect Tab State
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<LocationInfo[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<LocationInfo | null>(null);
    const [date, setDate] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [showReconnectResults, setShowReconnectResults] = useState(false);

    // Discovery Tab State
    const [viberNameQuery, setViberNameQuery] = useState('');
    const [userResults, setUserResults] = useState<{ user: User, upcomingPlan?: Post }[]>([]);
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);

    // Common : Auto-search logic
    const performSearch = async (searchTerm: string) => {
        setIsSearching(true);
        const places = await findPlaces(searchTerm);
        setResults(places);
        setIsSearching(false);
    };

    useEffect(() => {
        if (initialQuery) {
            setActiveTab('reconnect');
            setQuery(initialQuery);
            performSearch(initialQuery);
        }
    }, [initialQuery]);

    const handleDeepSearch = () => {
        // Determine who was there (Mock logic)
        setShowReconnectResults(true);
    };

    const handleVibersSearch = async () => {
        if (!viberNameQuery) return;
        setIsSearchingUsers(true);
        const lowerQuery = viberNameQuery.toLowerCase();

        // Filter by name OR interests (Vibes)
        const filteredMock = MOCK_POSTS.filter(post => {
            const nameMatch = post.user.displayName.toLowerCase().includes(lowerQuery);
            const interestMatch = post.user.interests?.some(i => i.toLowerCase().includes(lowerQuery));
            const vibeMatch = post.vibe?.toLowerCase().includes(lowerQuery);
            return nameMatch || interestMatch || vibeMatch;
        });

        let aiUsers: User[] = [];
        if (filteredMock.length === 0) {
            const names = await generateUsernames(viberNameQuery);
            aiUsers = names.map((name, i) => ({
                id: `search-u-${i}`,
                displayName: name,
                avatarUrl: `https://ui-avatars.com/api/?name=${name}&background=7c3aed&color=fff`,
                isConnected: false,
                interests: [viberNameQuery]
            }));
        }

        const finalResults = [
            ...filteredMock.map(post => ({ user: post.user, upcomingPlan: post })),
            ...aiUsers.map(u => ({ user: u }))
        ];

        const seen = new Set();
        setUserResults(finalResults.filter(item => {
            if (seen.has(item.user.id)) return false;
            seen.add(item.user.id);
            return true;
        }));
        setIsSearchingUsers(false);
    };

    return (
        <div className="max-w-2xl mx-auto pb-24 animate-fade-in">
            <div className="mb-10 px-4 md:px-0">
                <h2 className="text-4xl font-black bg-gradient-to-r from-brand-400 via-accent to-pink-500 bg-clip-text text-transparent uppercase tracking-tighter italic">
                    Discovery Engine
                </h2>
                <p className="text-slate-500 text-sm font-medium mt-2">
                    Find the tribe you crossed paths with or search by interests like "Techno" or "Deep House".
                </p>

                <div className="flex bg-slate-900 border border-slate-800 rounded-3xl p-1.5 mt-8 backdrop-blur-xl">
                    <button onClick={() => setActiveTab('reconnect')} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition ${activeTab === 'reconnect' ? 'bg-brand-600 text-white shadow-2xl shadow-brand-600/30' : 'text-slate-500 hover:text-white'}`}>
                        <MapPin className="w-4 h-4" /> Reconnect
                    </button>
                    <button onClick={() => setActiveTab('discovery')} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition ${activeTab === 'discovery' ? 'bg-brand-600 text-white shadow-2xl shadow-brand-600/30' : 'text-slate-500 hover:text-white'}`}>
                        <Sparkles className="w-4 h-4" /> Vibers
                    </button>
                </div>
            </div>

            <div className="px-2 md:px-0">
                {activeTab === 'reconnect' ? (
                    <div className="bg-brand-900/40 p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-brand-800/50 space-y-8 shadow-2xl backdrop-blur-md">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Location Scan</label>
                            <div className="space-y-4">
                                <div className="relative flex-1">
                                    <MapPin className="absolute left-5 top-5 text-brand-400 w-5 h-5" />
                                    <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Venue name..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 py-4.5 text-white focus:border-brand-500 focus:outline-none transition" />
                                    <button onClick={() => performSearch(query)} disabled={isSearching} className="absolute right-2 top-2 bottom-2 bg-brand-800 hover:bg-brand-700 px-4 rounded-xl transition text-[10px] uppercase font-bold tracking-widest">
                                        {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Find'}
                                    </button>
                                </div>

                                {/* Search Results */}
                                {results.length > 0 && (
                                    <div className="grid gap-3 animate-fade-in max-h-60 overflow-y-auto scrollbar-hide">
                                        {results.map((p, idx) => (
                                            <div key={idx} onClick={() => setSelectedLocation(p)} className={`p-4 rounded-2xl cursor-pointer border transition-all flex justify-between items-center ${selectedLocation === p ? 'bg-brand-600/20 border-brand-500 shadow-inner' : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'}`}>
                                                <div>
                                                    <div className="font-bold text-white text-sm italic tracking-tight">{p.name}</div>
                                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest">{p.address.split(',')[0]}</div>
                                                </div>
                                                {selectedLocation === p && <CheckCircle className="w-5 h-5 text-brand-400 animate-scale-in" />}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Date</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-4 text-brand-400 w-4 h-4" />
                                            <input
                                                type="date"
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-white text-sm focus:border-brand-500 focus:outline-none [color-scheme:dark]"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Duration</label>
                                        <div className="relative">
                                            <Clock className="absolute left-4 top-4 text-brand-400 w-4 h-4" />
                                            <select className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-white text-sm focus:border-brand-500 focus:outline-none appearance-none">
                                                <option>30 mins</option>
                                                <option>1 hour</option>
                                                <option>2 hours</option>
                                                <option>3+ hours</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleDeepSearch}
                            disabled={!selectedLocation || !date}
                            className="w-full bg-gradient-to-r from-brand-600 to-accent py-5 rounded-3xl font-black text-white shadow-2xl hover:scale-[1.02] active:scale-95 transition disabled:opacity-30 uppercase tracking-[0.2em] text-[12px] flex items-center justify-center gap-3"
                        >
                            Verify Crossed Paths <ArrowRight className="w-5 h-5" />
                        </button>

                        {showReconnectResults && (
                            <div className="pt-8 border-t border-brand-800/50 animate-fade-in">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    <h3 className="text-sm font-bold text-green-400 uppercase tracking-widest">Run-ins Detected</h3>
                                </div>
                                {/* Mock Result for Demo */}
                                <div className="bg-slate-800/50 p-4 rounded-xl flex items-center justify-between group hover:bg-slate-800 transition border border-slate-700">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <img src="https://picsum.photos/50/50?10" className="w-10 h-10 rounded-full bg-slate-700 object-cover" alt="" />
                                            <div className="absolute -bottom-1 -right-1 bg-green-500 border-2 border-slate-800 rounded-full p-0.5">
                                                <UserCheck className="w-2 h-2 text-white" />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-sm">JazzSoul</div>
                                            <div className="text-[10px] text-slate-400 mt-0.5">Scanned at 22:30 • Matches duration</div>
                                        </div>
                                    </div>
                                    <button className="p-2 bg-slate-700 hover:bg-brand-600 rounded-full text-white transition">
                                        <MessageSquare className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-8 animate-fade-in">
                        {/* Discovery Input */}
                        <div className="bg-brand-900/40 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-brand-800/50 space-y-6 shadow-2xl backdrop-blur-md">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Tribe Discovery</label>
                                <div className="flex gap-4">
                                    <div className="relative flex-1">
                                        <Sparkles className="absolute left-5 top-5 text-brand-400 w-5 h-5" />
                                        <input type="text" value={viberNameQuery} onChange={(e) => setViberNameQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleVibersSearch()} placeholder="Handle or interest (Techno, Cocktails)..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 py-4.5 text-white focus:border-brand-500 focus:outline-none transition" />
                                    </div>
                                    <button onClick={handleVibersSearch} disabled={isSearchingUsers} className="bg-brand-600 hover:bg-brand-500 px-6 md:px-8 rounded-2xl transition font-black text-[11px] uppercase tracking-widest shadow-2xl">
                                        {isSearchingUsers ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Find'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Results Grid */}
                        <div className="grid gap-6">
                            {userResults.map(item => (
                                <div key={item.user.id} className="bg-brand-900 border border-brand-800 p-8 rounded-[3rem] flex flex-col gap-6 group hover:border-brand-500 transition shadow-2xl backdrop-blur-xl">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-5">
                                            <div className="relative">
                                                <img src={item.user.avatarUrl} className="w-16 h-16 rounded-full border-2 border-brand-800 object-cover shadow-2xl transition group-hover:scale-105" alt="" />
                                                {followingIds.has(item.user.id) && (
                                                    <div className="absolute -top-1 -right-1 bg-brand-600 rounded-full p-2 border-2 border-slate-950 animate-pulse shadow-lg">
                                                        <Star className="w-3.5 h-3.5 text-white fill-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-white text-xl italic tracking-tight">{item.user.displayName}</span>
                                                    {item.user.isInfluencer && <Crown className="w-5 h-5 text-amber-500 fill-amber-500" />}
                                                </div>
                                                {item.user.interests && (
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {item.user.interests.map(i => <span key={i} className="text-[9px] font-black text-brand-400 uppercase tracking-widest px-2.5 py-1 bg-brand-400/10 rounded-lg border border-brand-400/20"># {i}</span>)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <button onClick={() => onToggleFollow(item.user.id)} className={`p-4 rounded-2xl transition-all shadow-xl active:scale-90 border-2 ${followingIds.has(item.user.id) ? 'bg-brand-600 text-white border-brand-400' : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-white'}`}>
                                            {followingIds.has(item.user.id) ? (
                                                <div className="flex flex-col items-center gap-1">
                                                    <Star className="w-6 h-6 fill-current" />
                                                    <span className="text-[6px] font-black uppercase">Viber</span>
                                                </div>
                                            ) : <UserPlus className="w-6 h-6" />}
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {userResults.length === 0 && !isSearchingUsers && viberNameQuery && (
                                <div className="text-center py-10 opacity-50">
                                    <p className="text-slate-500 text-sm">No vibers found directly in this zone.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};