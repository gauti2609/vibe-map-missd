import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, MapPin, Clock, Calendar, UserPlus, MessageSquare, Loader2, Users, UserCheck, Sparkles, Star, Crown, ArrowRight, CheckCircle, Filter } from 'lucide-react';
import { findPlaces, generateUsernames } from '../services/gemini';
import { LocationInfo, User, Post } from '../types';
import { MOCK_POSTS, RADAR_ITEMS, ACTIVITY_HISTORY } from '../data';

import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";

interface SearchProps {
    initialQuery?: string;
    followingIds: Set<string>;
    onToggleFollow: (userId: string) => void;
}

export const Search: React.FC<SearchProps> = ({ initialQuery, followingIds, onToggleFollow }) => {
    const [activeTab, setActiveTab] = useState<'reconnect' | 'discovery'>('reconnect');

    // Reconnect Tab State - Places Autocomplete
    const {
        ready,
        value,
        suggestions: { status, data },
        setValue,
        clearSuggestions,
    } = usePlacesAutocomplete({
        requestOptions: {
            /* Define search scope here if needed */
        },
        debounce: 300,
    });

    const [selectedLocation, setSelectedLocation] = useState<LocationInfo | null>(null);
    const [date, setDate] = useState('');
    const [timeFrom, setTimeFrom] = useState('');
    const [timeTo, setTimeTo] = useState('');
    const [showReconnectResults, setShowReconnectResults] = useState(false);
    const [visitsTab, setVisitsTab] = useState<'places' | 'users'>('places');

    // Sync initial query
    useEffect(() => {
        if (initialQuery) {
            setActiveTab('reconnect');
            setValue(initialQuery);
        }
    }, [initialQuery, setValue]);

    const handleSelect = async (placeId: string, description: string, main_text: string) => {
        setValue(description, false);
        clearSuggestions();

        // Construct LocationInfo from prediction
        const loc: LocationInfo = {
            name: main_text,
            address: description,
            placeId: placeId
        };
        setSelectedLocation(loc);

        // Optional: Get Lat/Lng details
        try {
            const results = await getGeocode({ address: description });
            const { lat, lng } = await getLatLng(results[0]);
            console.log("📍 Coordinates: ", { lat, lng });
        } catch (error) {
            console.error("Error: ", error);
        }
    };

    // Discovery Tab State
    const [viberNameQuery, setViberNameQuery] = useState('');
    const [viberLocationQuery, setViberLocationQuery] = useState('');
    const [viberDate, setViberDate] = useState('');
    const [viberTime, setViberTime] = useState('');
    const [userResults, setUserResults] = useState<{ user: User, upcomingPlan?: Post }[]>([]);
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);

    const handleDeepSearch = () => {
        // Determine who was there (Mock logic)
        setShowReconnectResults(true);
    };

    const handleVibersSearch = async () => {
        setIsSearchingUsers(true);
        await new Promise(resolve => setTimeout(resolve, 800)); // Fake delay

        const lowerQuery = viberNameQuery.toLowerCase();
        const lowerLoc = viberLocationQuery.toLowerCase();

        // 1. Filter existing mock posts
        const filteredMock = MOCK_POSTS.filter(post => {
            // Name/Interest Match
            const nameMatch = !lowerQuery || post.user.displayName.toLowerCase().includes(lowerQuery) || post.user.interests?.some(i => i.toLowerCase().includes(lowerQuery)) || post.vibe?.toLowerCase().includes(lowerQuery);

            // Location Match
            const locMatch = !lowerLoc || post.location.name.toLowerCase().includes(lowerLoc);

            // Date Match
            const dateMatch = !viberDate || post.visitDate.includes(viberDate);

            return nameMatch && locMatch && dateMatch;
        });

        // 2. Generate AI users if query exists but no mock results, ONLY if looking for name/interest
        let aiUsers: User[] = [];
        if (filteredMock.length === 0 && viberNameQuery && !viberLocationQuery && !viberDate) {
            const names = await generateUsernames(viberNameQuery);
            aiUsers = names.map((name, i) => ({
                id: `search-u-${i}`,
                displayName: name,
                avatarUrl: `https://ui-avatars.com/api/?name=${name}&background=7c3aed&color=fff`,
                isConnected: false,
                interests: [viberNameQuery]
            }));
        }

        const rawResults = [
            ...filteredMock.map(post => ({ user: post.user, upcomingPlan: post })),
            ...aiUsers.map(u => ({ user: u }))
        ];

        // Deduplicate by User ID
        const seen = new Set();
        const uniqueResults = rawResults.filter(item => {
            if (seen.has(item.user.id)) return false;
            seen.add(item.user.id);
            return true;
        });

        // 3. Grouping & Sorting
        const friends = uniqueResults.filter(r => r.user.isConnected);
        const influencers = uniqueResults.filter(r => !r.user.isConnected && r.user.isInfluencer);
        const others = uniqueResults.filter(r => !r.user.isConnected && !r.user.isInfluencer);

        setUserResults([...friends, ...influencers, ...others]);
        setIsSearchingUsers(false);
    };

    return (
        <div className="max-w-2xl mx-auto pb-24 animate-fade-in text-slate-100">
            <div className="mb-10 px-4 md:px-0">
                <h2 className="text-4xl font-black bg-gradient-to-r from-brand-400 via-accent to-pink-500 bg-clip-text text-transparent uppercase tracking-tighter italic">
                    Vibe Finder
                </h2>
                <p className="text-slate-500 text-sm font-medium mt-2">
                    Find the tribe you crossed paths with or search by interests, venue, or time.
                </p>

                <div className="flex bg-slate-900/80 border border-slate-800 rounded-3xl p-1.5 mt-8 backdrop-blur-xl">
                    <button onClick={() => setActiveTab('reconnect')} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition ${activeTab === 'reconnect' ? 'bg-brand-600 text-white shadow-2xl shadow-brand-600/30' : 'text-slate-500 hover:text-white'}`}>
                        <MapPin className="w-4 h-4" /> Reconnect
                    </button>
                    <button onClick={() => setActiveTab('discovery')} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition ${activeTab === 'discovery' ? 'bg-brand-600 text-white shadow-2xl shadow-brand-600/30' : 'text-slate-500 hover:text-white'}`}>
                        <Sparkles className="w-4 h-4" /> Social Scene
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
                                    <MapPin className="absolute left-5 top-5 text-brand-400 w-5 h-5 z-10" />
                                    <input
                                        type="text"
                                        value={value}
                                        onChange={(e) => setValue(e.target.value)}
                                        disabled={!ready}
                                        placeholder="Venue name..."
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 py-4.5 text-white focus:border-brand-500 focus:outline-none transition disabled:opacity-50 relative z-0"
                                    />

                                    {/* Google Maps Autocomplete Dropdown - Absolute Positioned */}
                                    {status === "OK" && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto">
                                            {data.map(({ place_id, description, structured_formatting: { main_text, secondary_text } }) => (
                                                <button
                                                    key={place_id}
                                                    onClick={() => handleSelect(place_id, description, main_text)}
                                                    className="w-full text-left p-4 hover:bg-slate-800 transition border-b border-slate-800/50 last:border-none flex items-center justify-between group"
                                                >
                                                    <div>
                                                        <div className="font-bold text-white text-sm">{main_text}</div>
                                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">{secondary_text}</div>
                                                    </div>
                                                    {selectedLocation?.placeId === place_id && <CheckCircle className="w-5 h-5 text-brand-400" />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 items-end">
                                    <div className="space-y-2 flex-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Date</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-3.5 text-brand-400 w-4 h-4" />
                                            <input
                                                type="date"
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                                onClick={(e) => e.currentTarget.showPicker()}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-2 py-3 text-white text-sm focus:border-brand-500 focus:outline-none [color-scheme:dark] cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">From</label>
                                        <div className="relative">
                                            <Clock className="absolute left-4 top-3.5 text-brand-400 w-4 h-4" />
                                            <input
                                                type="time"
                                                value={timeFrom}
                                                onChange={(e) => setTimeFrom(e.target.value)}
                                                onClick={(e) => e.currentTarget.showPicker()}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-2 py-3 text-white text-sm focus:border-brand-500 focus:outline-none [color-scheme:dark] cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Till</label>
                                        <div className="relative">
                                            <Clock className="absolute left-4 top-3.5 text-brand-400 w-4 h-4" />
                                            <input
                                                type="time"
                                                value={timeTo}
                                                onChange={(e) => setTimeTo(e.target.value)}
                                                onClick={(e) => e.currentTarget.showPicker()}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-2 py-3 text-white text-sm focus:border-brand-500 focus:outline-none [color-scheme:dark] cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleDeepSearch}
                            disabled={!value || !date}
                            className="w-full bg-gradient-to-r from-brand-600 to-accent py-5 rounded-3xl font-black text-white shadow-2xl hover:scale-[1.02] active:scale-95 transition disabled:opacity-30 uppercase tracking-[0.2em] text-[12px] flex items-center justify-center gap-3"
                        >
                            Verify Crossed Paths <ArrowRight className="w-5 h-5" />
                        </button>

                        <div className="bg-brand-900/20 border border-brand-500/20 p-4 rounded-2xl mt-4">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-sm font-bold text-brand-200 flex items-center gap-2">
                                    <MapPin className="w-4 h-4" /> Your Visits
                                </h3>
                                <div className="flex bg-slate-900/50 rounded-lg p-0.5 border border-white/10">
                                    <button
                                        onClick={() => setVisitsTab('places')}
                                        className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition ${visitsTab === 'places' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Places
                                    </button>
                                    <button
                                        onClick={() => setVisitsTab('users')}
                                        className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition ${visitsTab === 'users' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Users
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                {ACTIVITY_HISTORY.filter(item => {
                                    if (visitsTab === 'places') return item.type === 'checkin' || item.type === 'event';
                                    if (visitsTab === 'users') return item.type === 'connection';
                                    return false;
                                }).map(item => (
                                    <div key={item.id} className="bg-black/20 p-2.5 rounded-xl flex items-center justify-between group hover:bg-black/40 transition border border-transparent hover:border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-brand-400 group-hover:bg-brand-900/50 transition">
                                                {visitsTab === 'places' ? <MapPin className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <div className="text-sm text-slate-200 font-bold">{item.place}</div>
                                                <div className="text-[10px] text-slate-500">{item.time} • {item.vibe}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-full">{item.points}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {showReconnectResults && (
                            <div className="pt-8 border-t border-brand-800/50 animate-fade-in space-y-3">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    <h3 className="text-sm font-bold text-green-400 uppercase tracking-widest">Run-ins Detected</h3>
                                </div>
                                {/* Synced Data from data.ts (Same as Activity Page) */}
                                {RADAR_ITEMS.map(item => (
                                    <div key={item.id} className="bg-slate-800/50 p-4 rounded-xl flex items-center justify-between group hover:bg-slate-800 transition border border-slate-700">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <img src={item.avatar} className="w-10 h-10 rounded-full bg-slate-700 object-cover" alt="" />
                                                <div className="absolute -bottom-1 -right-1 bg-green-500 border-2 border-slate-800 rounded-full p-0.5">
                                                    <UserCheck className="w-2 h-2 text-white" />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="font-bold text-white text-sm">{item.user}</div>
                                                <div className="text-[10px] text-slate-400 mt-0.5">Scanned at 22:30 • {item.location}</div>
                                            </div>
                                        </div>
                                        <button className="p-2 bg-slate-700 hover:bg-brand-600 rounded-full text-white transition">
                                            <MessageSquare className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-8 animate-fade-in">
                        {/* Discovery Input */}
                        <div className="bg-brand-900/40 p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] border border-brand-800/50 space-y-6 shadow-2xl backdrop-blur-md">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 mb-2 block">Tribe Discovery</label>
                                    <div className="relative w-full">
                                        <Sparkles className="absolute left-5 top-4 text-brand-400 w-5 h-5" />
                                        <input type="text" value={viberNameQuery} onChange={(e) => setViberNameQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleVibersSearch()} placeholder="Handle or interest (Techno, Cocktails)..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-white focus:border-brand-500 focus:outline-none transition" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-3.5 text-slate-500 w-4 h-4" />
                                        <input type="text" value={viberLocationQuery} onChange={(e) => setViberLocationQuery(e.target.value)} placeholder="Where? (Optional)" className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-sm text-white focus:border-brand-500 focus:outline-none" />
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Calendar className="absolute left-3 top-3.5 text-slate-500 w-3.5 h-3.5" />
                                            <input type="date" value={viberDate} onChange={(e) => setViberDate(e.target.value)} onClick={(e) => e.currentTarget.showPicker()} className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-9 pr-2 py-3 text-xs text-white focus:border-brand-500 focus:outline-none [color-scheme:dark] cursor-pointer" />
                                        </div>
                                        <div className="relative w-24">
                                            <Clock className="absolute left-3 top-3.5 text-slate-500 w-3.5 h-3.5" />
                                            <input type="time" value={viberTime} onChange={(e) => setViberTime(e.target.value)} onClick={(e) => e.currentTarget.showPicker()} className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-9 pr-2 py-3 text-xs text-white focus:border-brand-500 focus:outline-none [color-scheme:dark] cursor-pointer" />
                                        </div>
                                    </div>
                                </div>

                                <button onClick={handleVibersSearch} disabled={isSearchingUsers} className="w-full bg-brand-600 hover:bg-brand-500 py-4 rounded-2xl transition font-black text-[11px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2">
                                    {isSearchingUsers ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Find Vibers <ArrowRight className="w-4 h-4" /></>}
                                </button>
                            </div>
                        </div>

                        {/* Results Grid */}
                        <div className="grid gap-4">
                            {['Friends', 'Influencers', 'Others'].map(group => {
                                const groupItems = userResults.filter(item => {
                                    if (group === 'Friends') return item.user.isConnected;
                                    if (group === 'Influencers') return !item.user.isConnected && item.user.isInfluencer;
                                    return !item.user.isConnected && !item.user.isInfluencer;
                                });

                                if (groupItems.length === 0) return null;

                                return (
                                    <div key={group} className="space-y-3">
                                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">{group}</h3>
                                        {groupItems.map(item => (
                                            <div key={item.user.id} className="bg-brand-900/30 border border-brand-800/50 p-5 rounded-3xl flex items-center justify-between group hover:border-brand-600 transition backdrop-blur-md">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <img src={item.user.avatarUrl} className="w-12 h-12 rounded-full border border-brand-700 object-cover shadow-lg" alt="" />
                                                        {item.user.isInfluencer && (
                                                            <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5 border-2 border-slate-900">
                                                                <Crown className="w-2.5 h-2.5 text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-white text-base">{item.user.displayName}</div>

                                                        {item.upcomingPlan && (
                                                            <div className="flex items-center text-[10px] text-brand-300 mt-1">
                                                                <MapPin className="w-3 h-3 mr-1" />
                                                                {item.upcomingPlan.location.name}
                                                            </div>
                                                        )}

                                                        {!item.upcomingPlan && item.user.interests && (
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {item.user.interests.slice(0, 2).map(i => <span key={i} className="text-[9px] text-slate-400">#{i}</span>)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => onToggleFollow(item.user.id)}
                                                    className={`p-3 rounded-xl transition-all active:scale-95 ${followingIds.has(item.user.id)
                                                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                                                        }`}
                                                >
                                                    {followingIds.has(item.user.id) ? (
                                                        <CheckCircle className="w-5 h-5" />
                                                    ) : (
                                                        <UserPlus className="w-5 h-5" />
                                                    )}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}

                            {userResults.length === 0 && !isSearchingUsers && (
                                <div className="text-center py-12 opacity-50 space-y-2">
                                    <Filter className="w-12 h-12 mx-auto text-slate-600" />
                                    <p className="text-slate-500 text-sm font-medium">Use filters to find your tribe.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};