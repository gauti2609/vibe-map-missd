import React from 'react';

export const Founders: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center p-6 text-center animate-fade-in min-h-[calc(100vh-100px)]">
            <h1 className="text-4xl font-black mb-8 bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-600 bg-clip-text text-transparent italic tracking-tighter">
                The Vibe Origin
            </h1>
            <div className="relative group max-w-4xl mx-auto mb-8">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-pink-600 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <img
                    src="/Vibe_Origin.jpeg"
                    alt="Vibe Origin"
                    className="relative rounded-lg shadow-2xl border-2 border-slate-800 w-full object-cover"
                />
            </div>
            <p className="text-xl text-slate-300 font-medium italic max-w-2xl leading-relaxed">
                "The original moment that gave birth to the idea. Just vibing, no words needed."
            </p>
        </div>
    );
};
