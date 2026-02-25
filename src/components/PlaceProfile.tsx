
import React, { useState, useEffect, useRef } from 'react';
import {
    ArrowLeft, MapPin, Star, Share2, Navigation, Clock,
    TrendingUp, Users, Instagram, Globe, Phone, Mail,
    MessageCircle, Heart, Plus, Bookmark
} from 'lucide-react';
import { updateDoc, arrayUnion, arrayRemove, doc } from 'firebase/firestore'; // Import Firestore helpers
import { db } from '../firebase'; // Import db
import { PostCard } from './PostCard';
import { Post, HotSpotPlace } from '../types';
import { useFeed } from '../hooks/useFeed';
import { getTrendingPlaces } from '../services/placeService';
import { getPlaceDetails, getPlaceStats } from '../services/placeService'; // We'll add this next
import { updatePost } from '../services/postService';

import { User } from '../types';

interface PlaceProfileProps {
    placeName: string;
    onBack: () => void;
    onDropVibe: () => void;
    currentUser: User | null;
    onUserClick: (user: User) => void;
    isFollowed: boolean;
    onToggleFollow: () => void;
    onUpdateUser: (updates: Partial<User>) => void;
}

export const PlaceProfile: React.FC<PlaceProfileProps> = ({
    placeName,
    onBack,
    onDropVibe,
    currentUser,
    onUserClick,
    isFollowed,
    onToggleFollow,
    onUpdateUser
}) => {
    const { posts } = useFeed();
    const [loading, setLoading] = useState(true);
    const [details, setDetails] = useState<any>(null); // Google Details
    const [stats, setStats] = useState<any>(null); // Our Vibe Stats
    const [placePosts, setPlacePosts] = useState<Post[]>([]);
    const [showCopied, setShowCopied] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);

    useEffect(() => {
        if (currentUser?.wishlist?.includes(placeName)) {
            setIsBookmarked(true);
        } else {
            setIsBookmarked(false);
        }
    }, [currentUser, placeName]);

    const handleToggleWishlist = async () => {
        if (!currentUser) return;

        const currentWishlist = currentUser.wishlist || [];
        const isCurrentlyBookmarked = currentWishlist.includes(placeName);

        const newWishlist = isCurrentlyBookmarked
            ? currentWishlist.filter(p => p !== placeName)
            : [...currentWishlist, placeName];

        // Optimistic UI update (via parent)
        onUpdateUser({ wishlist: newWishlist });
        // Local state update for immediate feedback (though useEffect will likely handle it via props)
        setIsBookmarked(!isCurrentlyBookmarked);
    };

    const handleShare = async () => {
        const shareUrl = `${window.location.origin}?place=${encodeURIComponent(placeName)}`;
        const shareData = {
            title: details?.name || placeName,
            text: `Check out ${details?.name || placeName} on VibeMap!`,
            url: shareUrl
        };

        try {
            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                throw new Error("Share API unavailable");
            }
        } catch (err) {
            // Fallback to Clipboard
            try {
                await navigator.clipboard.writeText(shareUrl);
                setShowCopied(true);
                setTimeout(() => setShowCopied(false), 2000);
            } catch (clipErr) {
                console.error("Clipboard failed", clipErr);
                alert("Could not share this page.");
            }
        }
    };

    const handleDirections = () => {
        const destination = details?.formatted_address || placeName;
        const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
        window.open(url, '_blank');
    };

    const handleUpdatePost = async (updatedPost: Partial<Post>) => {
        if (!updatedPost.id) return;
        // Optimistic Update
        setPlacePosts(prev => prev.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } as Post : p));
        try {
            await updatePost(updatedPost.id, updatedPost);
        } catch (e) {
            console.error("Failed to update post:", e);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Filter Posts for this place
                const relevantPosts = posts.filter(p =>
                    p.location.name.toLowerCase() === placeName.toLowerCase() ||
                    p.location.name.toLowerCase().includes(placeName.toLowerCase())
                );
                setPlacePosts(relevantPosts);

                // 2. Get Stats (Internal)
                const statsData = await getPlaceStats(placeName, relevantPosts);
                setStats(statsData);

                // 3. Get Details (Google API)
                // Note: In a real app, we'd use the Place ID if we had it, but searching by name is fine for V0
                const googleDetails = await getPlaceDetails(placeName);
                setDetails(googleDetails);

            } catch (e) {
                console.error("Error loading place:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [placeName, posts]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="animate-spin text-brand-500"><Navigation /></div>
            </div>
        );
    }

    // Fallback if no details
    const coverImage = details?.photos?.[0] || 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80';
    const rating = details?.rating || 4.5;
    const reviewCount = details?.user_ratings_total || 120;
    const vibeScore = stats?.vibeScore || 85;

    return (
        <div className="min-h-screen bg-slate-950 pb-24 animate-fade-in relative">

            {/* 1. Hero / Header */}
            <div className="relative h-72 w-full">
                <img src={coverImage} alt={placeName} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

                {/* Nav Bar */}
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20">
                    <button onClick={onBack} className="bg-black/40 backdrop-blur p-2 rounded-full text-white hover:bg-black/60 transition">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={handleToggleWishlist}
                            className={`bg-black/40 backdrop-blur p-2 rounded-full transition hover:bg-black/60 ${isBookmarked ? 'text-brand-400' : 'text-white'}`}
                        >
                            <Bookmark className={`w-6 h-6 ${isBookmarked ? 'fill-current' : ''}`} />
                        </button>
                        <button
                            onClick={onToggleFollow}
                            className={`px-4 py-2 rounded-full transition font-bold text-sm flex items-center gap-2
                                ${isFollowed ? 'bg-slate-800/80 text-white border border-slate-600' : 'bg-brand-600 text-white hover:bg-brand-500 shadow-brand-500/20'}
                            `}
                        >
                            <Heart className={`w-4 h-4 ${isFollowed ? 'fill-white' : ''}`} />
                            {isFollowed ? 'Following' : 'Follow'}
                        </button>
                        <button onClick={handleShare} className="bg-black/40 backdrop-blur p-2 rounded-full text-white hover:bg-black/60 transition relative group">
                            <Share2 className="w-6 h-6" />
                            {showCopied && (
                                <span className="absolute top-full mt-2 right-0 bg-brand-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap animate-fade-in-up">
                                    Link Copied!
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Title Block */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-3xl font-black text-white mb-2 leading-none tracking-tight">{details?.name || placeName}</h1>
                            <div className="flex items-center gap-2 text-slate-300 text-sm">
                                <MapPin className="w-4 h-4 text-brand-400" />
                                <span>{details?.formatted_address || "Location details unavailable"}</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1 bg-white/10 backdrop-blur px-2 py-1 rounded-lg border border-white/20">
                                <span className="text-amber-400 fill-amber-400"><Star className="w-4 h-4 fill-amber-400" /></span>
                                <span className="font-bold text-white">{rating}</span>
                                <span className="text-xs text-slate-400">({reviewCount})</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Main Content */}
            <div className="px-4 py-6 space-y-6 max-w-4xl mx-auto">

                {/* Vibe Stats Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/50 border border-brand-800/30 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute inset-0 bg-brand-500/5 group-hover:bg-brand-500/10 transition" />
                        <div className="flex justify-between items-start mb-2 relative z-10">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Vibe Score</span>
                            <TrendingUp className="w-5 h-5 text-green-400" />
                        </div>
                        <div className="relative z-10">
                            <div className="text-3xl font-black text-white">{vibeScore}</div>
                            <div className="text-xs text-green-400 font-medium">Top 5% in City</div>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Now</span>
                            <Users className="w-5 h-5 text-brand-400" />
                        </div>
                        <div>
                            <div className="text-3xl font-black text-white">{stats?.liveCount || 0}</div>
                            <div className="text-xs text-slate-400 font-medium">Vibers checked in</div>
                        </div>
                    </div>
                </div>

                {/* Busy Times Chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-brand-400" /> Vibe Timeline
                    </h3>
                    <div className="h-24 flex items-end gap-1">
                        {/* Simple histogram of hours 0-23 */}
                        {Array.from({ length: 24 }).map((_, i) => {
                            const height = stats?.busyTimes?.[i] || Math.random() * 20 + 5; // Fallback rand
                            const isCurrentHour = new Date().getHours() === i;
                            return (
                                <div key={i} className="flex-1 flex flex-col justify-end group relative">
                                    <div
                                        className={`w-full rounded-t-sm transition-all duration-500 ${isCurrentHour ? 'bg-brand-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 'bg-slate-800 group-hover:bg-slate-700'}`}
                                        style={{ height: `${Math.min(height * 3, 100)}%` }}
                                    />
                                    {isCurrentHour && (
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold bg-brand-600 px-1.5 py-0.5 rounded text-white whitespace-nowrap z-10">
                                            NOW
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-mono uppercase">
                        <span>6 AM</span>
                        <span>12 PM</span>
                        <span>6 PM</span>
                        <span>12 AM</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onDropVibe}
                        className="flex-1 py-3.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-brand-900/40"
                    >
                        <Plus className="w-5 h-5" /> Drop Vibe Check
                    </button>
                    <button onClick={handleDirections} className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition border border-slate-700">
                        <Navigation className="w-5 h-5" /> Get Directions
                    </button>
                </div>

                {/* Feed of Posts here */}
                <div>
                    <h3 className="text-lg font-bold text-white mb-4">Community Vibes</h3>
                    {placePosts.length > 0 ? (
                        <div className="space-y-4">
                            {placePosts.map(post => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    onUpdatePost={handleUpdatePost}
                                    onUserClick={onUserClick}
                                    isPlaceFollowed={isFollowed}
                                    onToggleFollow={onToggleFollow}
                                    currentUser={currentUser}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-slate-500 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
                            <p>No vibes recorded yet.</p>
                            <button onClick={onDropVibe} className="text-brand-400 font-bold mt-2 hover:underline">Be the first!</button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
