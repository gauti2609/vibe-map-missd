import React from 'react';
import { Crown, Star, MapPin, Zap, Share2, X } from 'lucide-react';

interface RootsProps {
    onBack?: () => void;
}

export const Roots: React.FC<RootsProps> = ({ onBack }) => {
    return (
        <div className="relative h-[calc(100vh-80px)] md:h-screen w-full overflow-hidden flex items-center justify-center p-4">
            {/* Back Button */}
            {onBack && (
                <button
                    onClick={onBack}
                    className="absolute top-6 right-6 z-20 bg-slate-950/50 backdrop-blur-md p-2 rounded-full text-white border border-white/10 hover:bg-white/10 transition shadow-2xl"
                >
                    <X className="w-6 h-6" />
                </button>
            )}
            {/* Background Image - Force Reload Check */}
            <div className="absolute inset-0 z-0">
                <img
                    src="/Vibe_Origin.jpeg?v=1"
                    alt="Roots Vibe"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            </div>

            {/* Content Card */}
            <div className="relative z-10 w-full max-w-lg animate-fade-in-up">
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden">

                    {/* Glow Effect */}
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-500/20 rounded-full blur-[80px]" />
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px]" />

                    {/* Header */}
                    <div className="flex justify-between items-start mb-6 relative">
                        <div className="flex gap-4">
                            <div className="relative">
                                <img src="https://ui-avatars.com/api/?name=Chief+Viber&background=000&color=fff" className="w-16 h-16 rounded-full border-2 border-amber-500 shadow-xl object-cover" alt="Chief Viber" />
                                <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full p-1 border-2 border-slate-900">
                                    <Crown className="w-3 h-3 text-black fill-black" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black italic tracking-tighter text-amber-500">ChiefViber</h2>
                                <div className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    <span className="flex items-center gap-1"><UsersIcon className="w-3 h-3" /> 250,000</span>
                                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> 0.1KM</span>
                                </div>
                            </div>
                        </div>
                        <button className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition shadow-lg hover:shadow-amber-500/20 flex items-center gap-2">
                            <UserPlusIcon className="w-4 h-4" /> Join Tribe
                        </button>
                    </div>

                    {/* Main Image Card */}
                    <div className="relative rounded-3xl overflow-hidden mb-6 aspect-video group cursor-pointer">
                        <img src="/Vibe_Origin.jpeg?v=1" alt="Chief Viber" className="w-full h-full object-cover transition duration-700 group-hover:scale-110" />
                        <div className="absolute top-4 left-4 bg-amber-500 text-black text-[10px] font-black uppercase px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                            <Zap className="w-3 h-3 fill-black" /> Official Vibe
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition duration-500" />
                    </div>

                    {/* Text Content */}
                    <div className="space-y-4 mb-6 relative">
                        <div className="pl-4 border-l-4 border-purple-500">
                            <p className="text-lg font-medium text-slate-200 italic leading-relaxed">
                                "The night it all clicked. Vibes locked, moments made, memories lived. This was just the beginning—next drop incoming. 🔥🚀"
                            </p>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between border-t border-white/5 pt-4">
                        <div className="flex items-center gap-6">
                            <button className="flex items-center gap-2 text-pink-500 font-bold text-sm tracking-wide hover:text-pink-400 transition">
                                <HeartIcon className="w-5 h-5 fill-current" /> 42,080
                            </button>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                <MapPin className="w-4 h-4 text-purple-500" /> Vibe HQ Lab
                            </div>
                        </div>
                        <button className="p-3 rounded-full bg-slate-800/50 hover:bg-slate-700 text-slate-300 transition backdrop-blur-md">
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Icons (reusing lucide imports for standard icons, creating custom small wrappers if needed for exact match)
const UsersIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
); // Using UserPlus icon visual for "Join Tribe" generically as Users for count
const UserPlusIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
);
const HeartIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
);
