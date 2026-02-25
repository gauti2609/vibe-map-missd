import React, { useState } from 'react';
import { Sparkles, RefreshCw, ArrowRight, Music, Mic2, Utensils, Zap, ChevronRight, Check, Info } from 'lucide-react';
import { generateUsernames } from '../services/gemini';

interface OnboardingProps {
    onComplete: (displayName: string) => void;
}

// Interest Data Structure
type InterestCategory = 'Music' | 'Dance' | 'Food' | 'Ambiance';
const INTEREST_CATEGORIES: Record<InterestCategory, { icon: React.ReactNode, options: string[] }> = {
    Music: {
        icon: <Music className="w-4 h-4" />,
        options: ['Rock', 'Pop', 'Jazz', 'Techno', 'EDM', 'Hip-Hop', 'Classical', 'Indie', 'Metal', 'R&B']
    },
    Dance: {
        icon: <Mic2 className="w-4 h-4" />, // Mic/Performance icon proxy
        options: ['Salsa', 'Bachata', 'Hip-Hop', 'Contemporary', 'Freestyle', 'Ballroom', 'Bollywood', 'Bhangra']
    },
    Food: {
        icon: <Utensils className="w-4 h-4" />,
        options: ['Mediterranean', 'Mughlai', 'Indian', 'Continental', 'Pan-Asian', 'Italian', 'Mexican', 'Street Food']
    },
    Ambiance: {
        icon: <Zap className="w-4 h-4" />,
        options: ['Rooftop', 'Speakeasy', 'Outdoor', 'Cozy', 'Energetic', 'Romantic', 'Dive Bar', 'Live Music']
    }
};

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
    const [step, setStep] = useState<1 | 2>(1);

    // Generator State
    const [vibeInput, setVibeInput] = useState('');
    const [vibeIntensity, setVibeIntensity] = useState(50); // 0 = Lowkey, 100 = Raging
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    // Selection State
    const [selectedName, setSelectedName] = useState('');
    const [manualName, setManualName] = useState('');

    // Interests State
    const [activeCategory, setActiveCategory] = useState<InterestCategory>('Music');
    const [selectedInterests, setSelectedInterests] = useState<Record<string, string[]>>({
        Music: [], Dance: [], Food: [], Ambiance: []
    });

    const handleGenerate = async () => {
        if (!vibeInput) return;
        setLoading(true);
        // Intensity context
        let intensityDesc = "Balanced vibe";
        if (vibeIntensity < 30) intensityDesc = "Very lowkey, chill, mysterious";
        if (vibeIntensity > 70) intensityDesc = "High energy, raging, loud, party";

        const prompt = `${vibeInput}. Intensity: ${intensityDesc}`;
        const names = await generateUsernames(prompt);
        setSuggestions(names);
        setLoading(false);
    };

    const toggleInterest = (category: string, option: string) => {
        setSelectedInterests(prev => {
            const current = prev[category];
            if (current.includes(option)) {
                return { ...prev, [category]: current.filter(i => i !== option) };
            } else {
                if (current.length >= 3) return prev; // Limit 3
                return { ...prev, [category]: [...current, option] };
            }
        });
    };

    const finalName = manualName || selectedName;

    // --- STEP 1: WELCOME SCREEN ---
    if (step === 1) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-900 via-slate-950 to-slate-950 p-4">
                <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl text-center space-y-6 animate-fade-in-up">
                    <div className="w-16 h-16 bg-brand-600 rounded-2xl mx-auto flex items-center justify-center rotate-3 shadow-2xl shadow-brand-500/20">
                        <Sparkles className="text-white w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Welcome to VibeMap</h1>
                        <p className="text-slate-400">Reconnect with the moments you missed.</p>
                    </div>

                    <button
                        onClick={() => setStep(2)}
                        className="w-full bg-white text-brand-900 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition flex items-center justify-center gap-2 shadow-lg"
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

    // --- STEP 2: CREATE PERSONA ---
    return (
        <div className="min-h-screen bg-slate-950 p-4 pt-8 pb-20 md:flex md:items-center md:justify-center overflow-y-auto">
            <div className="w-full max-w-lg space-y-6">

                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-1">Create your Flex</h2>
                    <p className="text-slate-400 text-sm">Design your vibe identity.</p>
                </div>

                {/* BOX 1: AI GENERATOR (Moved Top for Focus) */}
                <div className="bg-brand-900/20 backdrop-blur-md border border-brand-500/20 p-5 rounded-2xl space-y-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-brand-200 uppercase tracking-wider flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-brand-400" /> Flex Generator
                            </label>
                            <span className="text-[10px] bg-brand-500/10 text-brand-400 px-2 py-0.5 rounded-full border border-brand-500/20">Recommended</span>
                        </div>
                        <p className="text-[10px] text-brand-400/80">Let AI craft your unique Vibe Flex.</p>
                    </div>

                    <div className="space-y-3">
                        <input
                            type="text"
                            value={vibeInput}
                            onChange={(e) => setVibeInput(e.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:border-brand-500 focus:outline-none placeholder:text-slate-600 text-sm"
                            placeholder="Describe your vibe (e.g., 'Techno raver seeking chill spots')"
                        />

                        {/* Vibe Intensity Slider */}
                        <div className="bg-slate-950/30 p-3 rounded-xl border border-white/5 space-y-2">
                            <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
                                <span>Lowkey</span>
                                <span>Intensity: {vibeIntensity}%</span>
                                <span>Raging</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={vibeIntensity}
                                onChange={(e) => setVibeIntensity(Number(e.target.value))}
                                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
                            />
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={loading || !vibeInput}
                            className="w-full bg-brand-600 py-3 rounded-xl hover:bg-brand-500 transition disabled:opacity-50 text-white font-bold shadow-lg shadow-brand-600/20 flex items-center justify-center gap-2"
                        >
                            {loading ? <RefreshCw className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                            Generate Flex
                        </button>
                    </div>

                    {suggestions.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 animate-fade-in pt-2">
                            {suggestions.map((name) => (
                                <button
                                    key={name}
                                    onClick={() => { setSelectedName(name); setManualName(''); }}
                                    className={`p-2.5 rounded-lg text-xs font-medium transition text-left truncate border ${selectedName === name && !manualName
                                        ? 'bg-brand-600 border-brand-500 text-white shadow-md'
                                        : 'bg-slate-800/50 border-white/5 text-slate-300 hover:bg-slate-700 hover:border-white/10'
                                        }`}
                                >
                                    @{name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* BOX 2: MANUAL INPUT */}
                <div className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl relative space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Or flex manually
                        </label>
                    </div>
                    <input
                        type="text"
                        value={manualName}
                        onChange={(e) => {
                            setManualName(e.target.value);
                            setSelectedName('');
                        }}
                        className={`w-full bg-transparent border-b ${manualName.toLowerCase() === 'admin' ? 'border-red-500' : 'border-slate-700'} py-2 text-white focus:border-white focus:outline-none placeholder:text-slate-600 text-sm transition-colors`}
                        placeholder="Type your handle..."
                    />
                    {manualName.toLowerCase() === 'admin' && (
                        <p className="text-red-500 text-[10px] font-medium mt-1">Reserved handle.</p>
                    )}
                </div>

                {/* BOX 3: INTERESTS CHIPS (New Layout) */}
                <div className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl space-y-4">
                    <label className="text-sm font-bold text-slate-300 uppercase tracking-wider block mb-2">
                        Your Vibe Profile
                    </label>

                    {/* Category Tabs */}
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                        {Object.keys(INTEREST_CATEGORIES).map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat as InterestCategory)}
                                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeCategory === cat
                                    ? 'bg-white text-brand-950 shadow-lg'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    }`}
                            >
                                {cat}
                                {selectedInterests[cat].length > 0 && (
                                    <span className="ml-2 bg-brand-600 text-white rounded-full w-4 h-4 inline-flex items-center justify-center text-[8px]">
                                        {selectedInterests[cat].length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Chips Grid for Active Category */}
                    <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5 min-h-[120px] animate-fade-in">
                        <div className="flex flex-wrap gap-2">
                            {INTEREST_CATEGORIES[activeCategory].options.map(option => {
                                const isSelected = selectedInterests[activeCategory].includes(option);
                                return (
                                    <button
                                        key={option}
                                        onClick={() => toggleInterest(activeCategory, option)}
                                        disabled={!isSelected && selectedInterests[activeCategory].length >= 3}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${isSelected
                                            ? 'bg-brand-600 border-brand-500 text-white shadow-brand-500/20 shadow-md'
                                            : 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300 disabled:opacity-30'
                                            }`}
                                    >
                                        {option}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-[10px] text-slate-600 mt-4 text-center">
                            Select up to 3 {activeCategory} vibes.
                        </p>
                    </div>
                </div>

                {/* CONFIRMATION CARD (New Feature) */}
                {finalName && (
                    <div className="bg-gradient-to-r from-brand-900/50 to-slate-900/50 border border-brand-500/30 p-4 rounded-xl flex items-center gap-4 animate-fade-in">
                        <div className="w-12 h-12 bg-brand-600/20 rounded-full flex items-center justify-center border border-brand-500/50">
                            <Sparkles className="w-6 h-6 text-brand-400" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-white font-bold text-sm">@{finalName}</h4>
                            <p className="text-xs text-brand-200">
                                {vibeIntensity > 70 ? 'High Energy • Party Starter' : vibeIntensity < 30 ? 'Lowkey • Mystery Guest' : 'Balanced • Social Explorer'}
                            </p>
                        </div>
                        <Check className="w-5 h-5 text-green-400" />
                    </div>
                )}

                {/* Footer Action */}
                <button
                    onClick={() => onComplete(finalName)}
                    disabled={!finalName}
                    className="w-full bg-white text-brand-900 font-bold py-4 rounded-xl hover:bg-slate-200 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-white/5"
                >
                    Start Vibing <ArrowRight className="w-4 h-4" />
                </button>

            </div>
        </div>
    );
};
