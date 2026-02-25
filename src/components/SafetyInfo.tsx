import React, { useState, useEffect } from 'react';
import { Shield, Lock, Eye, CheckCircle, X, AlertOctagon, Share2, FileText } from 'lucide-react';
import { COMMUNITY_GUIDELINES } from '../data/communityGuidelines';

interface SafetyInfoProps {
    onBack: () => void;
}

export const SafetyInfo: React.FC<SafetyInfoProps> = ({ onBack }) => {
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 px-4 pt-4 pb-24 text-white animate-fade-in relative">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Shield className="w-8 h-8 text-brand-500" />
                    Safety Center
                </h1>
                <button
                    onClick={onBack}
                    className="bg-slate-900 p-2 rounded-full text-slate-400 hover:text-white transition"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">

                {/* Intro Card */}
                <div className="bg-gradient-to-br from-brand-900 to-slate-900 border border-brand-800 p-6 rounded-2xl relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-xl font-bold mb-2">How VibeMap Keeps You Safe</h2>
                        <p className="text-slate-300 text-sm leading-relaxed">
                            Your safety is our top priority. We use advanced AI and community-driven features to ensure VibeMap remains a secure space for authentic connections.
                        </p>
                    </div>
                    <Shield className="absolute -bottom-4 -right-4 w-32 h-32 text-brand-500/10 rotate-12" />
                </div>

                {/* Feature Grid */}
                <div className="grid gap-4">

                    {/* Trust Score */}
                    <div className="bg-slate-900/50 border border-white/5 p-5 rounded-xl">
                        <div className="flex items-start gap-4">
                            <div className="bg-blue-500/20 p-3 rounded-full">
                                <CheckCircle className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">Vibe Trust Score</h3>
                                <p className="text-slate-400 text-xs leading-relaxed">
                                    Every user has a dynamic Trust Score based on verified interactions, endorsements, and community feedback. A high score means a trusted viber.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Privacy */}
                    <div className="bg-slate-900/50 border border-white/5 p-5 rounded-xl">
                        <div className="flex items-start gap-4">
                            <div className="bg-purple-500/20 p-3 rounded-full">
                                <Lock className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">Privacy First</h3>
                                <p className="text-slate-400 text-xs leading-relaxed">
                                    You control who sees your location. Use "Ghost Mode" to go invisible or limit visibility to your "Inner Circle" only. Your data is encrypted and never sold.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Monitoring */}
                    <div className="bg-slate-900/50 border border-white/5 p-5 rounded-xl">
                        <div className="flex items-start gap-4">
                            <div className="bg-emerald-500/20 p-3 rounded-full">
                                <Eye className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">Proactive Monitoring</h3>
                                <p className="text-slate-400 text-xs leading-relaxed">
                                    Our AI monitors for suspicious activity and harassment. Toxic behavior is flagged instantly, and repeated offenders are banned to keep the vibe positive.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Guidelines Section (Moved) */}
                <section className="pt-4 border-t border-white/10">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-brand-400" /> Community Guidelines
                    </h3>
                    <div className="space-y-3">
                        {COMMUNITY_GUIDELINES.map((guide, idx) => (
                            <div key={idx} className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                                <h4 className="font-bold text-slate-200 mb-1">{guide.title}</h4>
                                <p className="text-sm text-slate-400 leading-relaxed">{guide.description}</p>
                            </div>
                        ))}
                    </div>
                </section>



            </div>

            {/* Floating Safety Button */}
            <button
                onClick={() => setIsPopupOpen(true)}
                className="fixed bottom-24 right-5 z-[60] bg-red-500 hover:bg-red-600 text-white p-4 rounded-full shadow-2xl shadow-red-500/30 transition-transform active:scale-95 animate-bounce-slow"
            >
                <Shield className="w-6 h-6" />
            </button>

            {/* Safety Options Popup */}
            {isPopupOpen && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in" onClick={() => setIsPopupOpen(false)}>
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-[2rem] p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 mb-20 sm:mb-0" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Shield className="w-6 h-6 text-red-500" />
                                Emergency Options
                            </h3>
                            <button onClick={() => setIsPopupOpen(false)} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <button className="w-full bg-red-500 hover:bg-red-600 p-4 rounded-2xl flex items-center gap-4 group transition">
                            <div className="bg-red-600 rounded-xl p-3 group-hover:scale-110 transition">
                                <AlertOctagon className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-white">Report Incident / Emergency</div>
                                <div className="text-[10px] text-red-200 mt-0.5">Call 112 if in immediate danger</div>
                            </div>
                        </button>

                        <button className="w-full bg-slate-800 hover:bg-slate-700 p-4 rounded-2xl flex items-center gap-4 group transition">
                            <div className="bg-slate-700 rounded-xl p-3 group-hover:scale-110 transition">
                                <Share2 className="w-6 h-6 text-brand-400" />
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-white">Share Live Location</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">Send location to trusted contacts</div>
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
