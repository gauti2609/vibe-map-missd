import React, { useState } from 'react';
import { Clock, MapPin, Shield, Activity as ActivityIcon, Users, ChevronRight, AlertTriangle, Navigation, Info, X } from 'lucide-react';
import { ACTIVITY_HISTORY, RADAR_ITEMS } from '../data';

interface ActivityProps {
    onNavigate?: (page: string) => void;
}

export const Activity: React.FC<ActivityProps> = ({ onNavigate }) => {
    const [activeTab, setActiveTab] = useState<'history' | 'radar'>('history');
    const [radarSubTab, setRadarSubTab] = useState<'places' | 'users'>('places');
    const [isSafetyOpen, setIsSafetyOpen] = useState(false);
    const [isGhostMode, setIsGhostMode] = useState(false);

    return (
        <div className="pb-24 pt-4 px-4 min-h-screen relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <ActivityIcon className="text-brand-400" /> Activity
                    </h1>
                    <p className="text-slate-400 text-xs">Your vibe footprint & radar.</p>
                </div>
                <div className="flex gap-2">
                    {/* Ghost Mode Toggle */}
                    <button
                        onClick={() => setIsGhostMode(!isGhostMode)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition ${isGhostMode ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 10h.01" /><path d="M15 10h.01" /><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z" /></svg>
                        Ghost Mode: {isGhostMode ? 'ON' : 'OFF'}
                    </button>

                    {/* Safety Button */}
                    <button
                        onClick={() => setIsSafetyOpen(true)}
                        className="bg-red-500/10 text-red-400 border border-red-500/50 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 hover:bg-red-500/20 transition"
                    >
                        <Shield className="w-3 h-3" /> Safety
                    </button>
                </div>
            </div>

            {/* Tabs - RENAMED as requested */}
            <div className="flex p-1 bg-slate-900/50 rounded-xl mb-6 border border-white/5">
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    Your Activity
                </button>
                <button
                    onClick={() => setActiveTab('radar')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'radar' ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    Your Visits <span className="ml-1 bg-red-500 text-white text-[9px] px-1.5 rounded-full">2</span>
                </button>
            </div>

            {/* Tab Content */}
            <div className="space-y-4 animate-fade-in">

                {activeTab === 'history' && (
                    <>
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
                    </>
                )}

                {activeTab === 'radar' && (
                    <>
                        {/* Sub Tabs Toggle for Places vs Users */}
                        <div className="flex items-center gap-3 mb-4 bg-slate-800/50 p-1.5 rounded-lg w-fit">
                            <button
                                onClick={() => setRadarSubTab('places')}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${radarSubTab === 'places' ? 'bg-brand-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                            >
                                <MapPin className="w-3 h-3" /> Places
                            </button>
                            <button
                                onClick={() => setRadarSubTab('users')}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${radarSubTab === 'users' ? 'bg-brand-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                            >
                                <Users className="w-3 h-3" /> Users
                            </button>
                        </div>

                        {radarSubTab === 'places' && (
                            <div className="bg-brand-900/20 border border-brand-500/20 p-4 rounded-2xl mb-4">
                                <h3 className="text-sm font-bold text-brand-200 mb-1 flex items-center gap-2">
                                    <Navigation className="w-4 h-4" /> Visited Places
                                </h3>
                                <p className="text-[10px] text-brand-400/70 mb-0">Places you've verified a presence at.</p>
                                {/* Reusing ACTIVITY_HISTORY as visited places for now, filtering unique places if needed, or just list them */}
                                <div className="mt-3 space-y-2">
                                    {ACTIVITY_HISTORY.filter(i => i.type === 'checkin' || i.type === 'event').map(item => (
                                        <div key={item.id} className="bg-black/20 p-2 rounded-lg flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-brand-500" />
                                            <span className="text-sm text-slate-200 font-medium">{item.place}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {radarSubTab === 'users' && (
                            <>
                                <div className="bg-brand-900/20 border border-brand-500/20 p-4 rounded-2xl mb-4">
                                    <h3 className="text-sm font-bold text-brand-200 mb-1 flex items-center gap-2">
                                        <Navigation className="w-4 h-4" /> Cross-Paths
                                    </h3>
                                    <p className="text-[10px] text-brand-400/70 mb-0">People you've vibes with nearby.</p>
                                </div>

                                {RADAR_ITEMS.map(item => (
                                    <div key={item.id} className="bg-slate-900/40 border border-white/5 p-4 rounded-2xl flex items-center gap-4 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-200%] group-hover:animate-shimmer" />
                                        <img src={item.avatar} alt="" className="w-12 h-12 rounded-full border-2 border-slate-700" />
                                        <div className="flex-1">
                                            <h4 className="text-white font-bold text-sm flex items-center gap-2">
                                                {item.user}
                                                {/* Trust Score Mini Badge */}
                                                <span className="bg-blue-500/20 text-blue-400 text-[9px] px-1.5 rounded-full border border-blue-500/30">85</span>
                                            </h4>
                                            <p className="text-xs text-slate-400 flex items-center gap-1">
                                                <MapPin className="w-3 h-3" /> {item.location}
                                            </p>
                                            <p className="text-[10px] text-slate-500 mt-1">{item.time} • {item.mutuals} mutuals</p>
                                        </div>
                                        <button className="bg-white/10 hover:bg-brand-600 hover:text-white p-2 rounded-full transition text-slate-400">
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </>
                        )}
                    </>
                )}
            </div>

            {/* Floating Safety Button (Bottom Right Fixed) */}
            <button
                onClick={() => setIsSafetyOpen(true)}
                className="fixed bottom-24 right-4 bg-red-600 hover:bg-red-500 text-white p-3 rounded-full shadow-lg shadow-red-600/30 z-40 transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 pr-4"
            >
                <div className="bg-white/20 p-1.5 rounded-full">
                    <AlertTriangle className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold">Safety</span>
            </button>

            {/* Safety Popup Modal */}
            {isSafetyOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-brand-900 border border-brand-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
                        <button
                            onClick={() => setIsSafetyOpen(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-2 bg-black/10 rounded-full"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="flex flex-col items-center mb-6">
                            <div className="bg-red-500/20 p-3 rounded-full mb-3">
                                <Shield className="w-8 h-8 text-red-500" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Safety Center</h2>
                            <p className="text-slate-400 text-center text-sm mt-1">
                                How can we help you right now?
                            </p>
                        </div>

                        <div className="space-y-3">
                            <button className="w-full bg-red-600 hover:bg-red-500 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 transition">
                                <AlertTriangle className="w-5 h-5" /> Emergency (SOS)
                            </button>
                            <button className="w-full bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-xl font-medium flex items-center justify-center gap-2 transition">
                                <Shield className="w-5 h-5" /> Report a User
                            </button>
                            <button className="w-full bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-xl font-medium flex items-center justify-center gap-2 transition">
                                <ActivityIcon className="w-5 h-5" /> Share Location
                            </button>
                            <button
                                onClick={() => onNavigate?.('safety')}
                                className="w-full bg-brand-900/50 hover:bg-brand-900 text-brand-300 p-3 rounded-xl font-medium flex items-center justify-center gap-2 transition border border-brand-800"
                            >
                                <Info className="w-5 h-5" /> How VibeMap Keeps You Safe
                            </button>
                        </div>

                        <p className="text-[10px] text-slate-500 text-center mt-6">
                            VibeMap prioritizes your safety. All reports are anonymous and reviewed instantly.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
