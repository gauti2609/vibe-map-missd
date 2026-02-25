import React, { useState } from 'react';
import { Sparkles, RefreshCw, ArrowRight } from 'lucide-react';
import { generateUsernames } from '../services/gemini';

interface OnboardingProps {
    onComplete: (displayName: string) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
    const [step, setStep] = useState<1|2>(1);
    const [interests, setInterests] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedName, setSelectedName] = useState('');

    const handleGenerate = async () => {
        if (!interests) return;
        setLoading(true);
        const names = await generateUsernames(interests);
        setSuggestions(names);
        setLoading(false);
    };

    if (step === 1) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-900 via-slate-950 to-slate-950 p-4">
                <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl text-center space-y-6">
                    <div className="w-16 h-16 bg-brand-600 rounded-2xl mx-auto flex items-center justify-center rotate-3">
                         <Sparkles className="text-white w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Welcome to VibeMap</h1>
                        <p className="text-slate-400">Reconnect with the moments you missed.</p>
                    </div>
                    
                    <button 
                        onClick={() => setStep(2)}
                        className="w-full bg-white text-brand-900 font-bold py-3 rounded-xl hover:bg-slate-200 transition flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1V11.1Z" />
                        </svg>
                        Continue with Google
                    </button>
                    <p className="text-xs text-slate-500">By continuing, you agree to our Terms & Privacy Policy.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
            <div className="w-full max-w-lg space-y-8">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white">Create your Persona</h2>
                    <p className="text-slate-400">We prioritize privacy. Choose a quirky Display Name instead of your real name.</p>
                </div>

                <div className="bg-brand-900/30 p-6 rounded-2xl border border-brand-800 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            What are your vibes? (e.g. Techno, Jazz, Traveling)
                        </label>
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                value={interests}
                                onChange={(e) => setInterests(e.target.value)}
                                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-brand-500 focus:outline-none"
                                placeholder="Enter interests..."
                            />
                            <button 
                                onClick={handleGenerate}
                                disabled={loading || !interests}
                                className="bg-brand-600 px-4 rounded-xl hover:bg-brand-500 transition disabled:opacity-50"
                            >
                                {loading ? <RefreshCw className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {suggestions.length > 0 && (
                        <div className="grid grid-cols-2 gap-3">
                            {suggestions.map((name) => (
                                <button
                                    key={name}
                                    onClick={() => setSelectedName(name)}
                                    className={`p-3 rounded-lg text-sm font-medium transition text-left ${
                                        selectedName === name 
                                        ? 'bg-gradient-to-r from-brand-600 to-accent text-white shadow-lg' 
                                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                    }`}
                                >
                                    @{name}
                                </button>
                            ))}
                        </div>
                    )}
                    
                    <div className="pt-4 border-t border-slate-800">
                         <label className="block text-sm font-medium text-slate-300 mb-2">
                            Or type your own
                        </label>
                        <input 
                            type="text"
                            value={selectedName}
                            onChange={(e) => setSelectedName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-brand-500 focus:outline-none"
                        />
                    </div>

                    <button 
                        onClick={() => onComplete(selectedName)}
                        disabled={!selectedName}
                        className="w-full bg-white text-brand-900 font-bold py-3 rounded-xl hover:bg-slate-200 transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        Start Vibing <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
