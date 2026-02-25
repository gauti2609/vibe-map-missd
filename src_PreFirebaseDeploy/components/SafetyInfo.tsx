import React from 'react';
import { Shield, Lock, Eye, AlertTriangle, CheckCircle, ChevronLeft } from 'lucide-react';

interface SafetyInfoProps {
    onBack: () => void;
}

export const SafetyInfo: React.FC<SafetyInfoProps> = ({ onBack }) => {

    return (
        <div className="min-h-screen bg-slate-950 px-4 pt-4 pb-24 text-white animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={onBack}
                    className="bg-slate-900 p-2 rounded-full text-slate-400 hover:text-white transition"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Shield className="w-8 h-8 text-brand-500" />
                    Safety Center
                </h1>
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

                {/* Call to Action */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center">
                    <h3 className="font-bold text-white mb-2">Help Us Keep It Safe</h3>
                    <p className="text-slate-400 text-xs mb-4">
                        See something off? Don't hesitate to report it using the Safety button. Your reports are anonymous and help protect the entire community.
                    </p>
                    <button className="bg-brand-600 hover:bg-brand-500 text-white py-2 px-6 rounded-full font-bold text-sm transition">
                        Read Community Guidelines
                    </button>
                </div>

            </div>
        </div>
    );
};
