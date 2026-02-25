import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { MapPin, MessageCircle, MoreHorizontal, CheckCircle, HelpCircle, X, Heart, Flame, PartyPopper, Users, Share2, Star, Flag, Link as LinkIcon, Camera, Send, Loader2, Ticket, AlertTriangle, Plus, Check, Shield, Ban, XCircle, Trash2, Edit, Crown } from 'lucide-react';
import { Post, RSVPStatus, ReactionType, User } from '../types';
import { formatDate, formatTime, renderTextWithTags, getSmartAddress } from '../utils/formatters';
import { moderateContent } from '../services/gemini';
import { FollowButton } from './FollowButton';
import { handleError, ERROR_CODES } from '../utils/errorHandler';
import { sendNotification, removeNotification } from '../services/notificationService';

interface PostCardProps {
    post: Post;
    onUpdatePost: (updatedPost: Partial<Post>) => void;
    onDeletePost?: (postId: string) => void;
    onUserClick?: (user: User) => void;
    onPlaceClick?: (placeName: string) => void;
    isPlaceFollowed?: boolean;
    onToggleFollow?: () => void;
    onRequestEdit?: (post: Post) => void;
    isUserFollowed?: boolean;
    onToggleUserFollow?: () => void;
    currentUser?: User | null;
}

// Trust Score Badge Component
const TrustScoreBadge: React.FC<{ score?: number }> = ({ score }) => {
    const displayScore = score ?? 80;

    let colorClass = "text-blue-400 bg-blue-500/10 border-blue-500/20";
    let Icon = Shield;
    let label = "Verified";

    if (displayScore >= 90) {
        colorClass = "text-yellow-400 bg-green-500/20 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.3)]";
        Icon = Star;
        label = "Vouched";
    } else if (displayScore < 70) {
        colorClass = "text-red-500 bg-red-500/10 border-red-500/50";
        Icon = AlertTriangle;
        label = "Flagged";
    }

    return (
        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all ${colorClass}`} title={`Trust Score: ${displayScore}/100 (${label})`}>
            <Icon className="w-3 h-3 fill-current opacity-80" />
            <span>{displayScore}</span>
        </div>
    );
};

// Internal Component for RSVP Avatar
const RsvpUserAvatar: React.FC<{ userId: string }> = ({ userId }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        const fetchUser = async () => {
            if (userId === 'anonymous') {
                setLoading(false);
                return;
            }
            try {
                const snap = await getDoc(doc(db, 'users', userId));
                if (snap.exists()) {
                    setUser({ id: snap.id, ...snap.data() } as User);
                }
            } catch (e) {
                console.error("Failed to fetch RSVP user", e);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [userId]);

    if (loading) return <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />;

    const displayName = user?.displayName || 'Unknown User';
    const avatarUrl = user?.avatarUrl || `https://ui-avatars.com/api/?name=${displayName.charAt(0)}`;

    return (
        <div className="flex items-center gap-3">
            <img src={avatarUrl} className="w-8 h-8 rounded-full object-cover" alt={displayName} />
            <span className="text-sm text-slate-200">@{user?.handle || 'user'}</span>
        </div>
    );
};

export const PostCard: React.FC<PostCardProps> = ({ post, onUpdatePost, onDeletePost, onUserClick, onPlaceClick, isPlaceFollowed, onToggleFollow, isUserFollowed, onToggleUserFollow, onRequestEdit, currentUser }) => {
    if (!post || !post.user) {
        console.error("PostCard received invalid post data:", post);
        return null;
    }

    const [commentInput, setCommentInput] = useState('');
    const [loadingComment, setLoadingComment] = useState(false);
    const [isCommentsExpanded, setIsCommentsExpanded] = useState(false);

    // Local UI States for Modals
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editCommentText, setEditCommentText] = useState('');
    const isOwner = auth.currentUser?.uid === post.user.id;

    // Local UI States for Modals
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [rsvpModalStatus, setRsvpModalStatus] = useState<RSVPStatus | null>(null);
    const [isRsvpListOpen, setIsRsvpListOpen] = useState(false);

    const isPastEvent = new Date(post.visitDate) < new Date();

    // Count only positive RSVPs (Will Join, Interested, Maybe)
    const validRsvpStatuses = [RSVPStatus.WILL_JOIN, RSVPStatus.INTERESTED, RSVPStatus.MAYBE];
    const rsvps = post.rsvps || {}; // Safe access
    const rsvpCount = Object.values(rsvps).filter(status => validRsvpStatuses.includes(status)).length;
    const currentReaction = post.userReaction;

    const handleEditComment = (commentId: string, currentText: string) => {
        setEditingCommentId(commentId);
        setEditCommentText(currentText);
    };

    const handleSaveCommentEdit = async (commentId: string) => {
        if (!editCommentText.trim()) return;

        try {
            const moderation = await moderateContent(editCommentText);
            if (!moderation.safe) {
                handleError('Edit Comment', new Error(moderation.reason), ERROR_CODES.DATA_INVALID_TYPE);
                return;
            }

            const updatedComments = post.comments.map(c =>
                c.id === commentId ? { ...c, text: editCommentText } : c
            );
            onUpdatePost({ id: post.id, comments: updatedComments });
            setEditingCommentId(null);
            setEditCommentText('');
        } catch (e) {
            handleError('Save Comment', e, ERROR_CODES.NET_FIRESTORE_WRITE);
        }
    };

    // UI Effect to handle 'undo' notification clicks
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const undoToken = urlParams.get('undo');
        if (undoToken) {
            const [action, postId, commentId] = undoToken.split(':');
            if (action === 'undo-comment-delete' && postId === post.id) {
                handleUndoDeleteComment(commentId);
                // Clean up URL
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.delete('undo');
                window.history.replaceState({}, document.title, newUrl.toString());
            }
        }
    }, [post.id]);

    // UI Effect to handle 'undo' notification clicks
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const undoToken = urlParams.get('undo');
        if (undoToken) {
            const [action, postId, commentId] = undoToken.split(':');
            if (action === 'undo-comment-delete' && postId === post.id) {
                handleUndoDeleteComment(commentId);
                // Clean up URL
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.delete('undo');
                window.history.replaceState({}, document.title, newUrl.toString());
            }
        }
    }, [post.id]);



    const handleRSVP = (status: RSVPStatus) => {
        if (isPastEvent) return; // Prevent RSVP on past events
        const cleanUid = auth.currentUser?.uid || 'anonymous'; // Use real UID

        const rsvps = post.rsvps || {};
        const currentStatus = rsvps[cleanUid];
        const isRemoving = currentStatus === status;

        const newRsvps = { ...rsvps };
        if (isRemoving) {
            delete newRsvps[cleanUid];
        } else {
            newRsvps[cleanUid] = status;
        }

        onUpdatePost({ id: post.id, rsvps: newRsvps });

        if (!isRemoving) {
            if (status === RSVPStatus.WILL_JOIN || status === RSVPStatus.MAYBE) {
                setRsvpModalStatus(status);
            }
            // Send Notification
            sendNotification(
                post.user.id,
                cleanUid,
                'rsvp',
                `is ${status} for your drop at ${post.location.name}`,
                post.id
            );
        } else {
            // Remove Notification
            removeNotification(
                post.user.id,
                cleanUid,
                'rsvp',
                post.id
            );
        }
    };

    const handleReaction = (type: ReactionType) => {
        const uid = auth.currentUser?.uid;
        if (!uid) {
            alert("Please sign in to react.");
            return;
        }

        const reactions = { ...(post.reactions || {}) };
        const isRemoving = reactions[uid] === type || (!post.reactions && post.userReaction === type); // Check map first, then legacy

        if (isRemoving) {
            delete reactions[uid];
        } else {
            reactions[uid] = type;
        }

        const newLikes = Object.keys(reactions).length;

        // explicitly allowing null for newReaction to signal removal
        onUpdatePost({ id: post.id, likes: newLikes, reactions, userReaction: isRemoving ? undefined : type });

        if (!isRemoving) {
            sendNotification(
                post.user.id,
                uid,
                'like',
                `reacted ${type === 'heart' ? '❤️' : type === 'fire' ? '🔥' : '🎉'} to your vibe`,
                post.id
            );
        } else {
            // Remove Notification
            removeNotification(
                post.user.id,
                uid,
                'like',
                post.id
            );
        }
    };

    const handleBlockUser = () => {
        alert(`Blocked @${post.user.handle}. Their Trust Score has been impacted.`);
        setIsMenuOpen(false);
    };

    const handleVouchUser = () => {
        alert(`You vouched for @${post.user.handle}. Their Trust Score increased!`);
        setIsMenuOpen(false);
    };

    const handleUndoDeleteComment = (commentId: string) => {
        const updatedComments = post.comments.map(c =>
            c.id === commentId ? { ...c, deleted: false } : c
        );
        onUpdatePost({ id: post.id, comments: updatedComments });
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!window.confirm("Delete this comment?")) return;

        // Soft delete
        const updatedComments = post.comments.map(c =>
            c.id === commentId ? { ...c, deleted: true } : c
        );
        onUpdatePost({ id: post.id, comments: updatedComments });

        // Remove original 'comment' notification if it exists (cleanup)
        const commentToDelete = post.comments.find(c => c.id === commentId);
        if (commentToDelete && post.user.id !== commentToDelete.userId) {
            removeNotification(
                post.user.id,
                commentToDelete.userId,
                'comment',
                post.id
            );
        }

        // Send undo notification to SELF
        sendNotification(
            auth.currentUser?.uid || 'anonymous',
            auth.currentUser?.uid || 'anonymous',
            'system',
            `Comment deleted. Tap to undo.`,
            `undo-comment-delete:${post.id}:${commentId}`
        );
    };




    const submitComment = async () => {
        if (!commentInput) return;
        setLoadingComment(true);
        const moderation = await moderateContent(commentInput);
        if (!moderation.safe) {
            handleError('Post Comment', new Error(moderation.reason), ERROR_CODES.DATA_INVALID_TYPE);
            setLoadingComment(false);
            return;
        }

        const uid = auth.currentUser?.uid || 'anonymous';
        const newComment = {
            id: Date.now().toString(),
            userId: uid,
            userName: currentUser?.handle ? `@${currentUser.handle}` : 'Anonymous',
            text: commentInput,
            timestamp: new Date().toISOString(),
            isInfluencer: currentUser?.isInfluencer || false
        };

        const updatedComments = [...post.comments, newComment];
        onUpdatePost({ id: post.id, comments: updatedComments });

        // Send Notification
        sendNotification(
            post.user.id,
            uid,
            'comment',
            `commented: "${commentInput.substring(0, 30)}${commentInput.length > 30 ? '...' : ''}"`,
            post.id
        );

        setCommentInput('');
        setLoadingComment(false);
    };

    return (
        <>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl mb-6 relative">
                {/* Header Section */}
                <div className="p-4 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                        <img
                            src={post.user.avatarUrl}
                            alt={post.user.displayName}
                            className="w-10 h-10 rounded-full border border-slate-700 object-cover cursor-pointer"
                            onClick={() => onUserClick?.(post.user)}
                        />
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-white font-bold text-sm cursor-pointer hover:underline" onClick={() => onUserClick?.(post.user)}>
                                    @{post.user.handle || 'user'}
                                </span>
                                {/* User Follow Button */}
                                {onToggleUserFollow && isUserFollowed !== undefined && !isOwner && (
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <FollowButton
                                            isFollowing={isUserFollowed}
                                            onToggle={(e) => {
                                                e.stopPropagation();
                                                onToggleUserFollow();
                                            }}
                                            size="sm"
                                        />
                                    </div>
                                )}
                                <TrustScoreBadge score={post.user.trustScore} />
                                {post.user.isInfluencer && <Crown className="w-3 h-3 text-amber-500 fill-amber-500 ml-1" />}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                                {new Date(post.visitDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {formatTime(post.visitDate)}
                            </div>
                        </div>
                    </div>

                    {/* More Options Menu */}
                    <div className="relative">
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>

                        {isMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 z-50 min-w-[150px] animate-fade-in">
                                {isOwner && (
                                    <>
                                        <button
                                            onClick={() => { onRequestEdit?.(post); setIsMenuOpen(false); }}
                                            className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-lg text-sm flex items-center gap-2 transition"
                                        >
                                            <Edit className="w-4 h-4" /> Edit Post
                                        </button>
                                        <button
                                            onClick={() => { onDeletePost?.(post.id); setIsMenuOpen(false); }}
                                            className="w-full text-left px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg text-sm flex items-center gap-2 transition"
                                        >
                                            <Trash2 className="w-4 h-4" /> Delete
                                        </button>
                                        <div className="h-px bg-slate-800 my-1" />
                                    </>
                                )}
                                <button onClick={() => { setIsShareModalOpen(true); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-lg text-sm flex items-center gap-2 transition">
                                    <Share2 className="w-4 h-4" /> Share
                                </button>
                                <button onClick={() => { setIsReportModalOpen(true); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-lg text-sm flex items-center gap-2 transition">
                                    <Flag className="w-4 h-4" /> Report
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Section (Supports Edit Mode) */}
                <div className="px-4 pb-2">
                    {/* Location Badge (Only for Regular Posts) */}
                    {post.type !== 'poll' && (
                        <div className="flex items-center gap-1 mb-3">
                            <div
                                onClick={() => onPlaceClick?.(post.location.address && post.location.address !== 'Unknown' ? `${post.location.name}, ${post.location.address}` : post.location.name)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-900/50 border border-brand-500/30 rounded-full text-brand-200 text-xs font-medium cursor-pointer hover:bg-brand-900 transition"
                            >
                                <MapPin className="w-3 h-3" />
                                {post.location.name}

                                {/* Follow Place Button */}
                                {onToggleFollow && isPlaceFollowed !== undefined && (
                                    <div className="ml-1" onClick={(e) => e.stopPropagation()}>
                                        <FollowButton
                                            isFollowing={isPlaceFollowed}
                                            onToggle={(e) => {
                                                e.stopPropagation();
                                                onToggleFollow();
                                            }}
                                            size="sm"
                                        />
                                    </div>
                                )}

                                {post.location.shortLocation ? `, ${post.location.shortLocation}` : getSmartAddress(post.location.address)}
                            </div>
                        </div>
                    )}


                    {/* Regular Description OR Poll Display */}
                    {(() => {
                        if (post.type === 'poll' && post.pollData) {
                            const { pollData } = post;
                            const totalVotes = pollData.totalVotes || 0;
                            const userVoteId = auth.currentUser?.uid ? pollData.voters?.[auth.currentUser.uid] : null;

                            const handleVote = (optionId: string) => {
                                if (userVoteId || !auth.currentUser) return; // Already voted or not logged in

                                const newVoters = { ...(pollData.voters || {}), [auth.currentUser.uid]: optionId };
                                const newOptions = pollData.options.map(o =>
                                    o.id === optionId ? { ...o, voteCount: (o.voteCount || 0) + 1 } : o
                                );

                                onUpdatePost({
                                    id: post.id,
                                    pollData: {
                                        ...pollData,
                                        options: newOptions,
                                        voters: newVoters,
                                        totalVotes: totalVotes + 1
                                    }
                                });
                            };

                            return (
                                <div className="mt-2 mb-4">
                                    <h3 className="text-lg font-bold text-white mb-3">{pollData.question}</h3>
                                    <div className="space-y-2">
                                        {pollData.options.map(opt => {
                                            const percent = totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0;
                                            const isSelected = userVoteId === opt.id;

                                            return (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => handleVote(opt.id)}
                                                    disabled={!!userVoteId}
                                                    className={`relative w-full text-left p-3 rounded-xl overflow-hidden border transition-all ${isSelected ? 'border-brand-500' : 'border-slate-700 hover:border-slate-500'}`}
                                                >
                                                    {/* Progress Bar Background */}
                                                    {userVoteId && (
                                                        <div
                                                            className={`absolute inset-y-0 left-0 bg-brand-900/50 transition-all duration-1000`}
                                                            style={{ width: `${percent}%` }}
                                                        />
                                                    )}

                                                    <div className="relative z-10 flex justify-between items-center">
                                                        <span className={`font-medium ${isSelected ? 'text-brand-300' : 'text-slate-200'}`}>{opt.text}</span>
                                                        {userVoteId && (
                                                            <span className="text-xs font-bold text-slate-400">{percent}%</span>
                                                        )}
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                    <div className="mt-2 text-xs text-slate-500 font-medium">
                                        {totalVotes} votes • {new Date(pollData.expiresAt) < new Date() ? 'Ended' : 'Ends soon'}
                                    </div>
                                </div>
                            );

                        } else {
                            // REGULAR POST
                            const vibeMatch = post.description.match(/^\[(.*?)\]\s*(.*)/s);
                            const vibeTag = vibeMatch ? vibeMatch[1] : null;
                            const cleanDesc = vibeMatch ? vibeMatch[2] : post.description;

                            return (
                                <>
                                    {vibeTag && (
                                        <div className="mb-2">
                                            <span className="inline-block bg-brand-500/20 text-brand-300 text-xs font-bold px-2 py-1 rounded-md border border-brand-500/30">
                                                {vibeTag}
                                            </span>
                                        </div>
                                    )}
                                    <p className="text-slate-200 whitespace-pre-wrap text-sm leading-relaxed">
                                        {renderTextWithTags(cleanDesc)}
                                    </p>
                                </>
                            );
                        }
                    })()}
                </div>


                {post.imageUrl && (
                    <div className="mb-4 rounded-xl overflow-hidden border border-slate-700/50 cursor-zoom-in" onClick={() => setIsImageModalOpen(true)}>
                        <img src={post.imageUrl} alt="Post attachment" className="w-full h-auto max-h-96 object-cover hover:scale-105 transition-transform duration-500" />
                    </div>
                )}

                {/* RSVP Section (Only for Regular Posts) */}
                {!isPastEvent && post.type !== 'poll' && (
                    <div className="bg-slate-900/50 rounded-xl p-3 mb-4 flex flex-col gap-3 mx-4">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-400 uppercase font-bold tracking-widest pl-1">You in? 👀</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
                            {[RSVPStatus.WILL_JOIN, RSVPStatus.INTERESTED, RSVPStatus.MAYBE, RSVPStatus.NOT_THIS_TIME].map((status) => {
                                const cleanUid = auth.currentUser?.uid || 'anonymous';
                                const isSelected = post.rsvps && post.rsvps[cleanUid] === status;
                                let icon = <CheckCircle className="w-4 h-4" />;
                                if (status === RSVPStatus.MAYBE) icon = <HelpCircle className="w-4 h-4" />;
                                if (status === RSVPStatus.NOT_THIS_TIME) icon = <XCircle className="w-4 h-4" />;
                                if (status === RSVPStatus.INTERESTED) icon = <Star className="w-4 h-4" />;

                                // Calculate count for this specific status
                                const statusCount = Object.values(post.rsvps).filter(s => s === status).length;

                                return (
                                    <button
                                        key={status}
                                        onClick={() => handleRSVP(status)}
                                        className={`px-3 py-2 rounded-lg text-[10px] sm:text-xs font-medium flex items-center justify-between gap-1.5 transition-all flex-1 whitespace-nowrap ${isSelected
                                            ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                            }`}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            {status === RSVPStatus.WILL_JOIN && <>Locked in 🔒</>}
                                            {status === RSVPStatus.INTERESTED && <>Low-key curious ⭐</>}
                                            {status === RSVPStatus.MAYBE && <>Vibes TBD 🤔</>}
                                            {status === RSVPStatus.NOT_THIS_TIME && <>Out this time ✋</>}
                                        </div>
                                        <span className={`text-[10px] font-bold ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                                            {statusCount}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Past Event Summary */}
                {isPastEvent && rsvpCount > 0 && (
                    <div className="bg-slate-900/50 rounded-xl p-3 mb-4 flex items-center justify-between opacity-70 mx-4">
                        <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">Event Ended</span>
                        <button
                            onClick={() => setIsRsvpListOpen(true)}
                            className="text-xs text-slate-400 font-medium flex items-center gap-1"
                        >
                            <Users className="w-3 h-3" /> {rsvpCount} attended
                        </button>
                    </div>
                )}

                {/* Actions Bar */}
                <div className="flex items-center gap-4 border-t border-slate-800/50 pt-3 px-4 pb-4">
                    <div className="flex items-center bg-slate-800/50 rounded-full px-2 py-1">
                        <button
                            onClick={() => handleReaction('heart')}
                            className={`p-1.5 rounded-full transition-transform active:scale-90 hover:bg-slate-700 ${currentReaction === 'heart' ? 'text-pink-500' : 'text-slate-400'}`}
                        >
                            <Heart className={`w-5 h-5 ${currentReaction === 'heart' ? 'fill-current' : ''}`} />
                        </button>
                        <button
                            onClick={() => handleReaction('fire')}
                            className={`p-1.5 rounded-full transition-transform active:scale-90 hover:bg-slate-700 ${currentReaction === 'fire' ? 'text-orange-500' : 'text-slate-400'}`}
                        >
                            <Flame className={`w-5 h-5 ${currentReaction === 'fire' ? 'fill-current' : ''}`} />
                        </button>
                        <button
                            onClick={() => handleReaction('party')}
                            className={`p-1.5 rounded-full transition-transform active:scale-90 hover:bg-slate-700 ${currentReaction === 'party' ? 'text-yellow-500' : 'text-slate-400'}`}
                        >
                            <PartyPopper className={`w-5 h-5 ${currentReaction === 'party' ? 'fill-current' : ''}`} />
                        </button>
                        <span className="text-sm font-bold text-slate-300 ml-2 mr-1">{Math.max(0, post.likes)}</span>
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                        <button
                            onClick={() => setIsCommentsExpanded(!isCommentsExpanded)}
                            className="flex items-center gap-2 text-sm text-slate-400 hover:text-brand-400 transition-colors"
                        >
                            <MessageCircle className="w-5 h-5" />
                            <span className="hidden sm:inline">{post.comments.length} Comments</span>
                            <span className="sm:hidden">{post.comments.length}</span>
                        </button>
                        <button
                            onClick={() => setIsShareModalOpen(true)}
                            className="flex items-center gap-2 text-sm text-slate-400 hover:text-brand-400 transition-colors"
                        >
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Expandable Comments Section */}
                {isCommentsExpanded && (
                    <div className="mt-0 pt-4 border-t border-slate-800/50 animate-fade-in px-4 pb-4">
                        {post.comments.length > 0 ? (
                            <div className="space-y-3 mb-4">

                                {post.comments.filter(c => !c.deleted).map(comment => {
                                    const isCommentOwner = auth.currentUser?.uid === comment.userId; // Assuming userId stores auth uid for 'Me' mock or real
                                    // NOTE: Existing mock uses 'currentUser' string throughout.
                                    // Real user id is checked against auth.currentUser.uid

                                    // Ensure we handle the hybrid mock/real state gracefully
                                    const canManage = isCommentOwner || isOwner; // Comment owner or Post owner

                                    return (
                                        <div key={comment.id} className="bg-slate-900/30 p-3 rounded-lg text-sm group relative">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <span className="font-bold text-brand-400 mr-2 flex items-center gap-1">
                                                        {comment.userName}
                                                        {comment.isInfluencer && <Crown className="w-3 h-3 text-amber-500 fill-amber-500" />}
                                                    </span>
                                                    {editingCommentId === comment.id ? (
                                                        <div className="mt-1">
                                                            <input
                                                                value={editCommentText}
                                                                onChange={(e) => setEditCommentText(e.target.value)}
                                                                className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-white focus:border-brand-500 mb-1"
                                                                autoFocus
                                                            />
                                                            <div className="flex gap-2 text-xs">
                                                                <button onClick={() => handleSaveCommentEdit(comment.id)} className="text-brand-400 font-bold hover:underline">Save</button>
                                                                <button onClick={() => setEditingCommentId(null)} className="text-slate-500 hover:text-white">Cancel</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-300">{comment.text}</span>
                                                    )}
                                                </div>

                                                {canManage && !editingCommentId && (
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                                        <button onClick={() => handleEditComment(comment.id, comment.text)} className="text-slate-500 hover:text-brand-400">
                                                            <Edit className="w-3 h-3" />
                                                        </button>
                                                        <button onClick={() => handleDeleteComment(comment.id)} className="text-slate-500 hover:text-red-400">
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-slate-500 text-sm mb-4 italic">No comments yet. Be the first!</p>
                        )}

                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Add a comment..."
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brand-600 text-white"
                            />
                            <button
                                onClick={submitComment}
                                disabled={loadingComment}
                                className="bg-brand-600 hover:bg-brand-700 p-2 rounded-lg text-white disabled:opacity-50 min-w-[40px] flex items-center justify-center"
                            >
                                {loadingComment ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* --- Modals --- */}

            {/* Full Screen Image Modal */}
            {isImageModalOpen && post.imageUrl && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 bg-black/95 animate-fade-in" onClick={() => setIsImageModalOpen(false)}>
                    <button onClick={() => setIsImageModalOpen(false)} className="absolute top-4 right-4 text-white hover:text-brand-400 z-10 p-2 bg-black/20 rounded-full transition-colors"><X className="w-8 h-8" /></button>
                    <img
                        src={post.imageUrl}
                        alt="Full screen"
                        className="max-w-full max-h-screen object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            {/* Report Modal */}
            {isReportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-brand-900 border border-brand-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative text-center">
                        <button onClick={() => setIsReportModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">Report Post?</h3>
                        <p className="text-slate-400 mb-6 text-sm">
                            Are you sure you want to report this post? Our AI moderation team will review it for guidelines violations.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setIsReportModalOpen(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 py-2.5 rounded-xl font-medium text-slate-300 transition">Cancel</button>
                            <button onClick={() => { alert('Reported'); setIsReportModalOpen(false); }} className="flex-1 bg-red-600 hover:bg-red-700 py-2.5 rounded-xl font-medium text-white transition">Report</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Share Modal */}
            {isShareModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-brand-900 border border-brand-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
                        <button onClick={() => setIsShareModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Share2 className="w-5 h-5 text-brand-400" /> Share Post</h3>
                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    const link = window.location.href;
                                    navigator.clipboard.writeText(link);
                                    alert('Link copied to clipboard!');
                                    setIsShareModalOpen(false);
                                }}
                                className="w-full bg-slate-800 hover:bg-slate-700 p-3 rounded-xl flex items-center justify-between text-left transition group"
                            >
                                <span className="text-slate-200">Copy Link</span>
                                <LinkIcon className="w-5 h-5 text-slate-400 group-hover:text-white" />
                            </button>
                            <button
                                onClick={() => {
                                    const text = `Check out this vibe by @${post.user.handle}: ${post.description}`;
                                    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                                    window.open(url, '_blank');
                                    setIsShareModalOpen(false);
                                }}
                                className="w-full bg-slate-800 hover:bg-slate-700 p-3 rounded-xl flex items-center justify-between text-left transition group"
                            >
                                <span className="text-slate-200">Share via WhatsApp</span>
                                <MessageCircle className="w-5 h-5 text-green-500" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* RSVP Modal */}
            {rsvpModalStatus && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-brand-900 border border-brand-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
                        <button onClick={() => setRsvpModalStatus(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                        <h3 className="text-xl font-bold mb-2">Book a Spot?</h3>
                        <p className="text-slate-300 mb-6">
                            You're marked as <span className="font-bold text-white">"{rsvpModalStatus}"</span>.
                            Reserve a table now to secure your vibe?
                        </p>
                        <div className="space-y-3">
                            <button onClick={() => { alert('Redirecting to booking...'); setRsvpModalStatus(null); }} className="w-full bg-brand-600 hover:bg-brand-500 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2">
                                <Ticket className="w-4 h-4" /> Book Table
                            </button>
                            <button onClick={() => setRsvpModalStatus(null)} className="w-full bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-bold text-white">
                                No, thanks
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View RSVP List Modal */}
            {isRsvpListOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-brand-900 border border-brand-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                        <button onClick={() => setIsRsvpListOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-brand-400" /> Who's Going</h3>
                        <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                            {Object.entries(post.rsvps).length === 0 && <p className="text-slate-400 italic">No RSVPs yet.</p>}
                            {[RSVPStatus.WILL_JOIN, RSVPStatus.INTERESTED, RSVPStatus.MAYBE].map(status => {
                                const users = Object.entries(post.rsvps).filter(([_, s]) => s === status);
                                if (!users.length) return null;
                                return (
                                    <div key={status}>
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-800 pb-1">{status}</h4>
                                        <div className="space-y-2">
                                            {users.map(([uid, _], i) => (
                                                <RsvpUserAvatar key={uid} userId={uid} />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};


