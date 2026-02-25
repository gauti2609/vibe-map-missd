import React, { useState } from 'react';
import { MapPin, MessageCircle, MoreHorizontal, CheckCircle, HelpCircle, X, Heart, Flame, PartyPopper, Users, Share2, Star, Flag, Link as LinkIcon, Camera, Send, Loader2, Ticket, AlertTriangle, Plus, Check, Shield, Ban, XCircle } from 'lucide-react';
import { Post, RSVPStatus, ReactionType, User } from '../types';
import { formatDate, formatTime, renderTextWithTags } from '../utils/formatters';
import { moderateContent } from '../services/gemini';

interface PostCardProps {
    post: Post;
    onUpdatePost: (updatedPost: Post) => void;
    onUserClick?: (user: User) => void;
    onPlaceClick?: (placeName: string) => void;
    isPlaceFollowed?: boolean;
    onToggleFollow?: () => void;
}

// Mock User Helper
const getMockUser = (id: string, index: number) => ({
    id,
    displayName: id === 'currentUser' ? 'You' : `Viber${index}`,
    avatarUrl: `https://picsum.photos/50/50?${index + 100}`,
    isConnected: index % 2 === 0
});

// Trust Score Badge Component
const TrustScoreBadge: React.FC<{ score?: number }> = ({ score }) => {
    const displayScore = score ?? 80;

    // Determine color and icon based on score
    let colorClass = "text-blue-400 bg-blue-500/10 border-blue-500/20";
    let Icon = Shield;
    let label = "Verified";

    if (displayScore >= 90) {
        // High Trust: Golden Star, Green Background
        colorClass = "text-yellow-400 bg-green-500/20 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.3)]";
        Icon = Star;
        label = "Vouched";
    } else if (displayScore < 70) {
        // Low Trust: Red Warning
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

export const PostCard: React.FC<PostCardProps> = ({ post, onUpdatePost, onUserClick, onPlaceClick, isPlaceFollowed, onToggleFollow }) => {
    if (!post || !post.user) {
        console.error("PostCard received invalid post data:", post);
        return null;
    }

    const [commentInput, setCommentInput] = useState('');
    const [loadingComment, setLoadingComment] = useState(false);
    const [isCommentsExpanded, setIsCommentsExpanded] = useState(false);

    // Local UI States for Modals
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false); // New Image Modal
    const [rsvpModalStatus, setRsvpModalStatus] = useState<RSVPStatus | null>(null);
    const [isRsvpListOpen, setIsRsvpListOpen] = useState(false);

    const isPastEvent = new Date(post.visitDate) < new Date();

    // Count only positive RSVPs (Will Join, Interested, Maybe)
    const validRsvpStatuses = [RSVPStatus.WILL_JOIN, RSVPStatus.INTERESTED, RSVPStatus.MAYBE];
    const rsvpCount = Object.values(post.rsvps).filter(status => validRsvpStatuses.includes(status)).length;
    const currentReaction = post.userReaction;

    const handleRSVP = (status: RSVPStatus) => {
        if (isPastEvent) return; // Prevent RSVP on past events

        const currentStatus = post.rsvps['currentUser'];
        const isRemoving = currentStatus === status;

        const newRsvps = { ...post.rsvps };
        if (isRemoving) {
            delete newRsvps['currentUser'];
        } else {
            newRsvps['currentUser'] = status;
        }

        onUpdatePost({ ...post, rsvps: newRsvps });

        if (!isRemoving && (status === RSVPStatus.WILL_JOIN || status === RSVPStatus.MAYBE)) {
            setRsvpModalStatus(status);
        }
    };

    const handleReaction = (type: ReactionType) => {
        const isRemoving = post.userReaction === type;
        const newReaction = isRemoving ? undefined : type;
        let newLikes = post.likes;

        if (post.userReaction && !isRemoving && post.userReaction !== type) {
            // switching
        } else if (isRemoving) {
            newLikes--;
        } else if (!post.userReaction) {
            newLikes++;
        }

        onUpdatePost({ ...post, likes: newLikes, userReaction: newReaction });
    };

    const handleBlockUser = () => {
        alert(`Blocked ${post.user.displayName}. Their Trust Score has been impacted.`);
        setIsMenuOpen(false);
    };

    const handleVouchUser = () => {
        alert(`You vouched for ${post.user.displayName}. Their Trust Score increased!`);
        setIsMenuOpen(false);
    };

    const submitComment = async () => {
        if (!commentInput) return;
        setLoadingComment(true);
        const moderation = await moderateContent(commentInput);
        if (!moderation.safe) {
            alert(`Comment blocked: ${moderation.reason}`);
            setLoadingComment(false);
            return;
        }

        const newComment = {
            id: Date.now().toString(),
            userId: 'currentUser',
            userName: 'Me',
            text: commentInput,
            timestamp: new Date().toISOString()
        };

        onUpdatePost({
            ...post,
            comments: [...post.comments, newComment]
        });
        setCommentInput('');
        setLoadingComment(false);
    };

    return (
        <>
            <div className="bg-brand-800/50 border border-brand-800/50 rounded-2xl p-5 shadow-xl backdrop-blur-sm mb-6 animate-fade-in relative">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3">
                        <img
                            src={post.user.avatarUrl}
                            alt=""
                            className="w-12 h-12 rounded-full border-2 border-brand-600 object-cover cursor-pointer"
                            onClick={() => onUserClick?.(post.user)}
                        />
                        <div>
                            <div className="flex items-center gap-2">
                                <h3
                                    className="font-bold text-lg cursor-pointer hover:text-brand-300 transition flex items-center gap-2"
                                    onClick={() => onUserClick?.(post.user)}
                                >
                                    {post.user.displayName}
                                    {/* Place Badge */}
                                    {post.user.isPlaceAccount && (
                                        <img
                                            src="/place_badge.png"
                                            alt="Verified Place"
                                            className="w-4 h-4 object-contain"
                                            title="Verified Vibe Place"
                                        />
                                    )}
                                </h3>

                                {/* Trust Score Badge (Users Only) */}
                                {!post.user.isPlaceAccount && (
                                    <TrustScoreBadge score={post.user.trustScore} />
                                )}

                                {/* Place Account Logic: Show Follow Button */}
                                {post.user.isPlaceAccount ? (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleFollow?.();
                                        }}
                                        className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider flex items-center gap-1 transition-all ${isPlaceFollowed
                                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                            : 'bg-brand-600 text-white hover:bg-brand-500 shadow-md shadow-brand-600/20'
                                            }`}
                                    >
                                        {isPlaceFollowed ? (
                                            <> <Check className="w-3 h-3" /> Following </>
                                        ) : (
                                            <> <Plus className="w-3 h-3" /> Follow </>
                                        )}
                                    </button>
                                ) : (
                                    // Regular User Logic - Restore Follow Button
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleFollow?.();
                                        }}
                                        className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider flex items-center gap-1 transition-all ${post.user.isConnected
                                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                            }`}
                                    >
                                        {post.user.isConnected ? (
                                            <> <Check className="w-3 h-3" /> Friend </>
                                        ) : (
                                            <> <Plus className="w-3 h-3" /> Follow </>
                                        )}
                                    </button>
                                )}
                            </div>
                            <div
                                className="flex items-center text-slate-400 text-sm mt-1 cursor-pointer hover:text-brand-300 transition"
                                onClick={() => onPlaceClick?.(post.location.name)}
                            >
                                <MapPin className="w-3 h-3 mr-1" />
                                {post.location.name}
                                <span className="mx-2">•</span>
                                <CalendarIcon post={post} />
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition"
                        >
                            <MoreHorizontal className="w-5 h-5" />
                        </button>

                        {isMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                                <div className="absolute right-0 mt-2 w-48 bg-brand-900 border border-brand-700 rounded-xl shadow-xl z-20 py-1 overflow-hidden animate-fade-in">
                                    <button
                                        onClick={handleVouchUser}
                                        className="w-full text-left px-4 py-3 text-sm text-green-400 hover:bg-brand-800 flex items-center gap-2 border-b border-brand-800"
                                    >
                                        <Star className="w-4 h-4" /> Vouch for User
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsReportModalOpen(true);
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-3 text-sm text-yellow-500 hover:bg-brand-800 flex items-center gap-2 border-b border-brand-800"
                                    >
                                        <Flag className="w-4 h-4" /> Report Post
                                    </button>
                                    <button
                                        onClick={handleBlockUser}
                                        className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-brand-800 flex items-center gap-2"
                                    >
                                        <Ban className="w-4 h-4" /> Block User
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Content */}
                <p className="text-slate-200 mb-4 pl-1 whitespace-pre-wrap">
                    {renderTextWithTags(post.description)}
                </p>

                {post.imageUrl && (
                    <div className="mb-4 rounded-xl overflow-hidden border border-slate-700/50 cursor-zoom-in" onClick={() => setIsImageModalOpen(true)}>
                        <img src={post.imageUrl} alt="Post attachment" className="w-full h-auto max-h-96 object-cover hover:scale-105 transition-transform duration-500" />
                    </div>
                )}

                {/* RSVP Section */}
                {!isPastEvent && (
                    <div className="bg-slate-900/50 rounded-xl p-3 mb-4 flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-400 uppercase font-bold tracking-widest pl-1">You in? 👀</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
                            {[RSVPStatus.WILL_JOIN, RSVPStatus.INTERESTED, RSVPStatus.MAYBE, RSVPStatus.NOT_THIS_TIME].map((status) => {
                                const isSelected = post.rsvps['currentUser'] === status;
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

                {/* If past event, maybe show a summary or nothing? User asked to remove 'Are you going' option */}
                {isPastEvent && rsvpCount > 0 && (
                    <div className="bg-slate-900/50 rounded-xl p-3 mb-4 flex items-center justify-between opacity-70">
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
                <div className="flex items-center gap-4 border-t border-slate-800/50 pt-3">
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
                        <span className="text-sm font-bold text-slate-300 ml-2 mr-1">{post.likes}</span>
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
                    <div className="mt-4 pt-4 border-t border-slate-800/50 animate-fade-in">
                        {post.comments.length > 0 ? (
                            <div className="space-y-3 mb-4">
                                {post.comments.map(comment => (
                                    <div key={comment.id} className="bg-slate-900/30 p-3 rounded-lg text-sm">
                                        <span className="font-bold text-brand-400 mr-2">{comment.userName}</span>
                                        <span className="text-slate-300">{comment.text}</span>
                                    </div>
                                ))}
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

            {/* --- Modals Portal-ish --- */}

            {/* Full Screen Image Modal */}
            {isImageModalOpen && post.imageUrl && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 bg-black/95 animate-fade-in" onClick={() => setIsImageModalOpen(false)}>
                    <button onClick={() => setIsImageModalOpen(false)} className="absolute top-4 right-4 text-white hover:text-brand-400 z-10 p-2 bg-black/20 rounded-full transition-colors"><X className="w-8 h-8" /></button>
                    <img
                        src={post.imageUrl}
                        alt="Full screen"
                        className="max-w-full max-h-screen object-contain"
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
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
                            <button className="w-full bg-slate-800 hover:bg-slate-700 p-3 rounded-xl flex items-center justify-between text-left transition group">
                                <span className="text-slate-200">Copy Link</span>
                                <LinkIcon className="w-5 h-5 text-slate-400 group-hover:text-white" />
                            </button>
                            <button className="w-full bg-slate-800 hover:bg-slate-700 p-3 rounded-xl flex items-center justify-between text-left transition group">
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
                                                <div key={uid} className="flex items-center gap-3">
                                                    <img src={getMockUser(uid, i).avatarUrl} className="w-8 h-8 rounded-full" alt="" />
                                                    <span className="text-sm text-slate-200">{getMockUser(uid, i).displayName}</span>
                                                </div>
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

// Simple Calendar sub-component to fix circular dependency if I put formatDate there? 
// Actually helper is simple.
// Redefining CalendarIcon here or could import form lucide but we need the text next to it.
const CalendarIcon = ({ post }: { post: Post }) => (
    <>
        <div className='flex items-center'>
            {/* Using span for icon to match original code structure if needed, or just text */}
            {formatDate(post.visitDate)} {formatTime(post.visitDate)}
        </div>
    </>
);
