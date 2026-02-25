import React from 'react';
import { Flame, MapPin, TrendingUp, ChevronRight } from 'lucide-react';
import { HOT_SPOTS } from '../data';

export const Hotspots: React.FC = () => {
    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-20 animate-fade-in">
            <div className="flex flex-col mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent flex items-center gap-2">
                    <Flame className="w-8 h-8 text-orange-500" /> Trending Hotspots
                </h2>
                <p className="text-slate-400">Where the vibe is right now.</p>
            </div>

            <div className="bg-gradient-to-br from-brand-900 to-slate-900 border border-brand-700/50 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-3 opacity-5">
                    <Flame className="w-64 h-64 text-brand-500" />
                </div>
                
                <div className="space-y-8 relative z-10">
                    {HOT_SPOTS.map((area, idx) => (
                        <div key={idx} className="animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                            <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                                <h4 className="text-sm font-bold text-brand-300 uppercase tracking-widest flex items-center gap-2">
                                    <MapPin className="w-4 h-4" /> {area.area}
                                </h4>
                                <span className="text-xs text-slate-500">{area.places.length} places active</span>
                            </div>
                            
                            <div className="grid gap-3">
                                {area.places.map((place, pIdx) => (
                                    <div key={pIdx} className="flex items-center justify-between bg-slate-950/40 p-3 rounded-xl border border-slate-800 hover:border-brand-500/50 transition group cursor-pointer hover:bg-brand-900/20">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-xl font-bold text-slate-600 group-hover:text-white transition">
                                                {pIdx + 1}
                                            </div>
                                            <div>
                                                <div className="font-bold text-base text-slate-200 group-hover:text-brand-400 transition">{place.name}</div>
                                                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-wider">{place.category}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-lg font-bold text-white">{place.count}</span>
                                                <span className="text-[10px] text-slate-500 uppercase">Going</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {place.trend === 'up' && <span className="text-xs text-green-400 flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> Rising</span>}
                                                {place.trend === 'down' && <span className="text-xs text-red-400 flex items-center gap-0.5"><TrendingUp className="w-3 h-3 rotate-180" /> Quiet</span>}
                                                {place.trend === 'stable' && <span className="text-xs text-slate-500 flex items-center gap-0.5">Stable</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
