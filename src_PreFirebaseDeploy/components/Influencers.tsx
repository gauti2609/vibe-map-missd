import React from 'react';
import { Crown, MapPin, Users, Heart, Share2, Navigation, UserPlus, Zap, Star } from 'lucide-react';
import { Post, User } from '../types';

interface InfluencersProps {
    posts: Post[];
    onToggleFollow: (id: string) => void;
    followingIds: Set<string>;
}

export const Influencers: React.FC<InfluencersProps> = ({ posts, onToggleFollow, followingIds }) => {
    const sortedInfluencers = [...posts]
        .filter(p => p.user.isInfluencer)
        .sort((a, b) => {
            if (a.user.isFounder) return -1;
            if (b.user.isFounder) return 1;
            return (a.distanceKm || 0) - (b.distanceKm || 0);
        });

    const uniqueInfluencers: User[] = [];
    const seenIds = new Set();
    sortedInfluencers.forEach(p => {
        if (!seenIds.has(p.user.id)) {
            seenIds.add(p.user.id);
            uniqueInfluencers.push(p.user);
        }
    });

    return (
        <div className="max-w-3xl mx-auto space-y-8 md:space-y-12 pb-24 animate-fade-in overflow-x-hidden">
            <div className="flex flex-col gap-2 md:gap-3 px-2">
                <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-600 bg-clip-text text-transparent flex items-center gap-3 md:gap-4 italic tracking-tighter">
                    <Crown className="w-8 h-8 md:w-10 md:h-10 text-amber-500" /> Inner Circle
                </h2>
                <div className="flex items-center gap-2 md:gap-3 text-slate-500 text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] italic">
                    <Zap className="w-3 h-3 md:w-4 md:h-4 text-brand-400" />
                    <span>The heartbeat of the local scene</span>
                </div>
            </div>

            {/* Featured Founders & Elite Horizontal Scroll */}
            <div className="flex gap-4 md:gap-6 overflow-x-auto pb-6 md:pb-8 scrollbar-hide px-2">
                {uniqueInfluencers.map((inf) => (
                    <div key={inf.id} className="flex-shrink-0 flex flex-col items-center gap-2 md:gap-3 group cursor-pointer relative">
                        <div className="relative">
                            <div className={`absolute -inset-1.5 md:-inset-2 rounded-full blur-xl opacity-20 group-hover:opacity-60 transition duration-700 ${inf.isFounder ? 'bg-amber-400' : 'bg-brand-500'}`} />
                            <img src={inf.avatarUrl} className={`relative w-16 h-16 md:w-20 md:h-20 rounded-full border-2 md:border-4 ${inf.isFounder ? 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.4)]' : 'border-slate-900'} object-cover shadow-2xl transition duration-500 group-hover:scale-105`} alt="" />
                            <div className={`absolute -bottom-1 -right-1 rounded-full p-1 md:p-1.5 border-2 md:border-4 border-slate-950 shadow-lg ${inf.isFounder ? 'bg-amber-500' : 'bg-brand-600'}`}>
                                {inf.isFounder ? <Zap className="w-2.5 h-2.5 md:w-3 md:h-3 text-white fill-white" /> : <Star className="w-2.5 h-2.5 md:w-3 md:h-3 text-white fill-white" />}
                            </div>
                        </div>
                        <span className={`text-[9px] md:text-[11px] font-black uppercase tracking-widest transition ${inf.isFounder ? 'text-amber-400' : 'text-slate-400 group-hover:text-white'}`}>
                            {inf.displayName}
                        </span>
                        {inf.isFounder && <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[6px] md:text-[7px] font-black px-1.5 md:px-2 py-0.5 rounded-full uppercase tracking-widest shadow-xl">Founder</span>}
                    </div>
                ))}
            </div>

            <div className="grid gap-8 md:gap-12 px-2">
                {sortedInfluencers.map((post) => {
                    const isFollowing = followingIds.has(post.user.id);
                    const isFounder = post.user.isFounder;
                    return (
                        <div key={post.id} className={`bg-gradient-to-br ${isFounder ? 'from-brand-900/60 to-slate-900' : 'from-brand-900/40 to-slate-950'} border-2 ${isFounder ? 'border-amber-500/30 shadow-[0_0_60px_rgba(251,191,36,0.08)]' : 'border-white/5'} rounded-3xl md:rounded-[3.5rem] p-6 md:p-10 shadow-2xl relative overflow-hidden group hover:border-amber-500/20 transition-all duration-700`}>
                            <div className="absolute top-0 right-0 p-8 md:p-12 opacity-[0.02] pointer-events-none group-hover:opacity-[0.06] transition-opacity rotate-12">
                                {isFounder ? <Crown className="w-48 h-48 md:w-64 md:h-64 text-amber-500" /> : <Star className="w-48 h-48 md:w-64 md:h-64 text-brand-500" />}
                            </div>

                            <div className="flex items-center gap-4 md:gap-6 mb-6 md:mb-8 relative z-10">
                                <div className="relative">
                                    <img src={post.user.avatarUrl} className={`w-12 h-12 md:w-16 md:h-16 rounded-full border-2 ${isFounder ? 'border-amber-400' : 'border-brand-600'} object-cover shadow-2xl group-hover:scale-110 transition duration-500`} alt="" />
                                    <div className={`absolute -bottom-1 -right-1 rounded-full p-1.5 md:p-2 border-2 md:border-4 border-brand-900 shadow-xl ${isFounder ? 'bg-amber-500' : 'bg-brand-600'}`}>
                                        {isFounder ? <Crown className="w-3 md:w-3.5 h-3 md:h-3.5 text-white fill-white" /> : <Star className="w-3 md:w-3.5 h-3 md:h-3.5 text-white fill-white" />}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className={`font-black text-xl md:text-2xl italic tracking-tighter ${isFounder ? 'text-amber-400' : 'text-white'}`}>
                                        {post.user.displayName}
                                    </h3>
                                    <div className="flex items-center gap-3 text-[9px] md:text-[11px] font-black text-slate-500 uppercase tracking-[0.15em] md:tracking-[0.2em] mt-0.5 md:mt-1">
                                        <span className="flex items-center gap-1.5"><Users className="w-3 h-3 md:w-4 md:h-4 text-brand-400" /> {(post.user.followersCount || 0).toLocaleString()}</span>
                                        <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
                                        <span className="flex items-center gap-1.5 text-brand-400"><Navigation className="w-3 h-3 md:w-4 md:h-4" /> {post.distanceKm}km</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => onToggleFollow(post.user.id)}
                                    className={`p-3 md:p-4 rounded-xl md:rounded-2xl transition-all duration-500 shadow-xl active:scale-90 flex items-center justify-center border-2 ${isFollowing
                                            ? 'bg-slate-900/80 text-brand-400 border-brand-400/20'
                                            : isFounder
                                                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/30 hover:bg-amber-400'
                                                : 'bg-brand-600 text-white border-brand-500 shadow-brand-600/30 hover:bg-brand-500'
                                        }`}
                                >
                                    {isFollowing ? (
                                        <div className="flex items-center gap-1.5 md:gap-2 px-0.5 md:px-1">
                                            <Star className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest hidden sm:block">Inner Circle</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 md:gap-2 px-0.5 md:px-1">
                                            <UserPlus className="w-5 h-5 md:w-6 md:h-6" />
                                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest hidden sm:block">Join Tribe</span>
                                        </div>
                                    )}
                                </button>
                            </div>

                            {post.imageUrl && (
                                <div className={`relative aspect-video rounded-2xl md:rounded-[3rem] overflow-hidden mb-6 md:mb-8 border-2 ${isFounder ? 'border-amber-500/10' : 'border-white/5'} shadow-2xl group`}>
                                    <img src={post.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition duration-[3s] ease-out" alt="Inner Circle View" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                                    {isFounder && (
                                        <div className="absolute top-4 left-4 md:top-6 md:left-6 bg-amber-500/80 backdrop-blur-md px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2 border border-white/20">
                                            <Zap className="w-3 md:w-4 h-3 md:h-4 fill-current" /> Official Vibe
                                        </div>
                                    )}
                                </div>
                            )}

                            <p className="text-slate-200 text-lg md:text-xl font-medium leading-relaxed mb-6 md:mb-8 pl-3 md:pl-4 pr-4 md:pr-6 italic border-l-4 border-brand-600/30">
                                "{post.description}"
                            </p>

                            <div className="flex items-center justify-between pt-6 md:pt-8 border-t border-white/5 relative z-10">
                                <div className="flex items-center gap-4 md:gap-8">
                                    <div className="flex items-center gap-2 md:gap-3 text-slate-400 group-hover:text-pink-500 transition-colors">
                                        <Heart className="w-5 h-5 md:w-6 md:h-6" />
                                        <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.15em] md:tracking-[0.2em]">{post.likes.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2 md:gap-3 text-slate-400 hover:text-brand-400 transition cursor-pointer">
                                        <MapPin className="w-4 h-4 md:w-5 md:h-5 text-brand-400" />
                                        <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.15em] md:tracking-[0.2em] italic truncate max-w-[100px] md:max-w-[150px]">{post.location.name}</span>
                                    </div>
                                </div>
                                <button className="p-3 md:p-4 text-slate-500 hover:text-white transition bg-white/5 rounded-xl md:rounded-2xl border border-transparent hover:border-white/10 shadow-xl">
                                    <Share2 className="w-4 h-4 md:w-5 md:h-5" />
                                </button>
                            </div>
                        </div>
                    );
                })}

                {sortedInfluencers.length === 0 && (
                    <div className="text-center py-20 md:py-32 bg-brand-900/20 rounded-3xl md:rounded-[4rem] border-2 border-dashed border-slate-800 opacity-50 mx-2">
                        <Crown className="w-16 h-16 md:w-20 md:h-20 text-slate-800 mx-auto mb-4 md:mb-6" />
                        <p className="text-slate-600 font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-[10px] md:text-xs italic">The Circle awaits its legends</p>
                    </div>
                )}
            </div>
        </div>
    );
};
