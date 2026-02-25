import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Phone, Video, MoreVertical, Crown, Trash2, Users, UserPlus, X, MinusCircle, Plus } from 'lucide-react';
import { User, Conversation } from '../types';
import { useChat } from '../hooks/useChat';
import { deleteConversation, addParticipantToGroup, removeParticipantFromGroup } from '../services/chatService';
import { collection, query, where, documentId, getDocs, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

interface ChatProps {
    currentUser: User | null;
    recipient: User;
    onBack: () => void;
}

export const Chat: React.FC<ChatProps> = ({ currentUser, recipient, onBack }) => {
    const { messages, sendMessage, isLoading, isSending, sendError, loadMore, hasMore, conversationId } = useChat(currentUser, recipient);
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [senderProfiles, setSenderProfiles] = useState<{ [id: string]: User }>({});

    // Fetch sender profiles for Group Chat explanation
    useEffect(() => {
        const fetchSenders = async () => {
            if (recipient.handle !== 'group' || messages.length === 0) return;

            const uniqueSenders = Array.from(new Set(messages.map(m => m.senderId)))
                .filter(id => id !== currentUser?.id && !senderProfiles[id]);

            if (uniqueSenders.length === 0) return;

            try {
                // Fetch in chunks of 10
                for (let i = 0; i < uniqueSenders.length; i += 10) {
                    const chunk = uniqueSenders.slice(i, i + 10);
                    const q = query(collection(db, 'users'), where(documentId(), 'in', chunk));
                    const snap = await getDocs(q);
                    const newProfiles: any = {};
                    snap.forEach(doc => {
                        newProfiles[doc.id] = doc.data();
                    });
                    setSenderProfiles(prev => ({ ...prev, ...newProfiles }));
                }
            } catch (e) {
                console.error("Failed to fetch group senders", e);
            }
        };

        fetchSenders();
    }, [messages, recipient.handle, currentUser?.id]);

    // Auto-scroll to bottom only on NEW messages, not older ones
    useEffect(() => {
        // Simple logic: if at bottom or initial load, scroll.
        // For now, simple scroll to bottom on message change is acceptable for MVP,
        // though strictly we should check scroll position.
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]); // Only scroll if count changes? Or strictly latest.

    const handleSend = () => {
        if (!inputText.trim()) return;
        sendMessage(inputText);
        setInputText('');
    };

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Helper to format time
    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleDeleteChat = async () => {
        if (!currentUser || !conversationId) return;
        if (confirm("Are you sure you want to delete this conversation? It will be hidden until a new message is sent.")) {
            try {
                await deleteConversation(conversationId, currentUser.id);
            } catch (e) {
                alert("Failed to delete chat.");
            }
            onBack();
        }
    };

    const [isGroupDetailsOpen, setIsGroupDetailsOpen] = useState(false);
    const [groupData, setGroupData] = useState<Conversation | null>(null);
    const [groupMembers, setGroupMembers] = useState<User[]>([]);
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [friendSearchQuery, setFriendSearchQuery] = useState('');
    const [friendSearchResults, setFriendSearchResults] = useState<User[]>([]);

    // Tagging / Mentions State
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputText(val);

        // Simple detection: Last word starts with @
        // Ideally should check cursor position, but this is MVP
        const lastWord = val.split(/\s+/).pop();
        if (lastWord && lastWord.startsWith('@') && lastWord.length > 1) {
            setMentionQuery(lastWord.slice(1).toLowerCase());
        } else {
            setMentionQuery(null);
        }
    };

    const handleSelectMention = (handle: string) => {
        // Replace current text's last word with proper handle
        const words = inputText.split(/\s+/);
        words.pop();
        const newVal = words.join(' ') + (words.length > 0 ? ' ' : '') + `@${handle} `;
        setInputText(newVal);
        setMentionQuery(null);
    };

    const filteredMentions = mentionQuery
        ? groupMembers.filter(m =>
            m.handle?.toLowerCase().includes(mentionQuery) ||
            m.displayName.toLowerCase().includes(mentionQuery)
        ).slice(0, 5)
        : [];

    useEffect(() => {
        if (recipient.handle === 'group' && conversationId) {
            const unsub = onSnapshot(doc(db, 'conversations', conversationId), async (snap) => {
                if (snap.exists()) {
                    const data = { id: snap.id, ...snap.data() } as Conversation;
                    setGroupData(data);

                    // Fetch members (if needed for display)
                    if (data.participants?.length > 0) {
                        try {
                            // Chunk queries if > 10 (omitted for MVP)
                            const userQ = query(collection(db, 'users'), where(documentId(), 'in', data.participants.slice(0, 10)));
                            const userSnap = await getDocs(userQ);
                            const members = userSnap.docs.map(d => ({ id: d.id, ...d.data() } as User));
                            setGroupMembers(members);
                        } catch (e) {
                            console.error("Failed to fetch group members", e);
                        }
                    }
                }
            });
            return () => unsub();
        }
    }, [conversationId, recipient.handle]);

    // Friend Search for Adding Members
    useEffect(() => {
        const searchFriends = async () => {
            if (!friendSearchQuery.trim()) {
                setFriendSearchResults([]);
                return;
            }
            const q = friendSearchQuery.toLowerCase();
            const usersRef = collection(db, 'users');
            // Improved: could use endAt/startAt firestore query, but client filter is fine for MVP
            const snapshot = await getDocs(usersRef);
            const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));

            // Filter: Matches query AND not already in group
            const matched = allUsers.filter(u => {
                if (groupData?.participants.includes(u.id)) return false;
                return u.displayName.toLowerCase().includes(q) || u.handle?.toLowerCase().includes(q);
            }).slice(0, 5);
            setFriendSearchResults(matched);
        };
        const timer = setTimeout(searchFriends, 300);
        return () => clearTimeout(timer);
    }, [friendSearchQuery, groupData]);


    const handleAddMember = async (user: User) => {
        if (!currentUser || !conversationId) return;
        try {
            await addParticipantToGroup(conversationId, [user], currentUser);
            setIsAddMemberOpen(false);
            setFriendSearchQuery('');
        } catch (e) {
            alert("Failed to add member.");
        }
    };

    const handleRemoveMember = async (userId: string, userName: string) => {
        if (!currentUser || !conversationId) return;
        if (confirm(`Remove ${userName} from the group?`)) {
            try {
                await removeParticipantFromGroup(conversationId, userId, userName, currentUser);
            } catch (e) {
                alert("Failed to remove member.");
            }
        }
    };

    const isAdmin = groupData?.adminIds?.includes(currentUser?.id || '');

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] bg-slate-900 border border-brand-800 rounded-2xl overflow-hidden animate-fade-in relative">

            {/* Header */}
            <div className="bg-brand-900/90 backdrop-blur-md p-4 flex items-center justify-between border-b border-brand-800 absolute top-0 w-full z-20 shadow-lg">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="relative group cursor-pointer" onClick={() => recipient.handle === 'group' && setIsGroupDetailsOpen(true)}>
                        <img src={recipient.avatarUrl} alt="" className="w-10 h-10 rounded-full border-2 border-brand-600 object-cover" />
                    </div>
                    <div className="cursor-pointer" onClick={() => recipient.handle === 'group' && setIsGroupDetailsOpen(true)}>
                        <h3 className="font-bold text-white leading-tight">
                            {recipient.handle === 'group' ? (recipient.displayName || 'Group Chat') : `@${recipient.handle}`}
                        </h3>
                        {recipient.handle === 'group' && <span className="text-[10px] text-slate-400 block">Tap for info</span>}
                    </div>
                </div>
                <div className="flex gap-1 relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition"
                    >
                        <MoreVertical className="w-5 h-5" />
                    </button>

                    {isMenuOpen && (
                        <div className="absolute top-10 right-0 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden min-w-[160px] animate-fade-in">
                            {recipient.handle === 'group' && (
                                <button
                                    onClick={() => { setIsGroupDetailsOpen(true); setIsMenuOpen(false); }}
                                    className="w-full text-left px-4 py-3 text-slate-300 hover:bg-slate-800 text-sm font-bold flex items-center gap-2 transition border-b border-slate-800"
                                >
                                    <Users className="w-4 h-4" /> Group Info
                                </button>
                            )}
                            <button
                                onClick={handleDeleteChat}
                                className="w-full text-left px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 text-sm font-bold flex items-center gap-2 transition"
                            >
                                <Trash2 className="w-4 h-4" /> Delete Chat
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Group Details Modal */}
            {isGroupDetailsOpen && (
                <div className="absolute inset-0 z-50 bg-slate-900 animate-slide-in-right flex flex-col">
                    <div className="p-4 border-b border-brand-800 flex items-center gap-3 bg-brand-900/50">
                        <button onClick={() => setIsGroupDetailsOpen(false)} className="text-slate-400 hover:text-white">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <h3 className="font-bold text-lg text-white">Group Info</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {/* Header Info */}
                        <div className="flex flex-col items-center gap-2">
                            <img src={recipient.avatarUrl} className="w-20 h-20 rounded-full border-2 border-brand-500" alt="" />
                            <h2 className="text-xl font-bold text-white">{recipient.displayName}</h2>
                            <p className="text-slate-400 text-sm">{groupMembers.length} members</p>
                        </div>

                        {/* Members List */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-bold text-slate-500 tracking-widest">Members</h4>
                                {isAdmin && (
                                    <button
                                        onClick={() => setIsAddMemberOpen(true)}
                                        className="text-xs bg-brand-600 hover:bg-brand-500 text-white px-2 py-1 rounded-full flex items-center gap-1 transition"
                                    >
                                        <UserPlus className="w-3 h-3" /> Add
                                    </button>
                                )}
                            </div>

                            {isAddMemberOpen && (
                                <div className="mb-4 bg-slate-800 rounded-xl p-3 animate-fade-in">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-bold text-white">Add Members</span>
                                        <button onClick={() => setIsAddMemberOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search friends..."
                                        value={friendSearchQuery}
                                        onChange={e => setFriendSearchQuery(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-brand-500 mb-2"
                                    />
                                    <div className="space-y-1 max-h-40 overflow-y-auto">
                                        {friendSearchResults.map(user => (
                                            <button
                                                key={user.id}
                                                onClick={() => handleAddMember(user)}
                                                className="w-full flex items-center gap-2 p-2 hover:bg-slate-700/50 rounded-lg transition text-left"
                                            >
                                                <img src={user.avatarUrl} className="w-6 h-6 rounded-full" alt="" />
                                                <span className="text-sm text-slate-200 truncate flex-1">@{user.handle}</span>
                                                <Plus className="w-4 h-4 text-brand-400" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                {groupMembers.map(m => (
                                    <div key={m.id} className="flex items-center justify-between p-2 hover:bg-slate-800/50 rounded-xl transition">
                                        <div className="flex items-center gap-3">
                                            <img src={m.avatarUrl} className="w-10 h-10 rounded-full" alt="" />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-200">
                                                    @{m.handle}
                                                    {groupData?.adminIds?.includes(m.id) && <span className="text-[10px] text-brand-400 ml-2 bg-brand-900/50 px-1 py-0.5 rounded">Admin</span>}
                                                </span>
                                                <span className="text-xs text-slate-500">Member</span>
                                            </div>
                                        </div>
                                        {isAdmin && m.id !== currentUser?.id && (
                                            <button
                                                onClick={() => handleRemoveMember(m.id, `@${m.handle}`)}
                                                className="text-slate-500 hover:text-red-400 p-2 transition"
                                                title="Remove"
                                            >
                                                <MinusCircle className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto pt-24 pb-4 px-4 space-y-1 scrollbar-thin scrollbar-thumb-brand-800 scrollbar-track-slate-900">
                {isLoading && messages.length === 0 && <div className="text-center text-slate-500 text-sm py-4">Loading conversation...</div>}

                {hasMore && !isLoading && (
                    <div className="text-center py-2">
                        <button onClick={loadMore} className="text-xs text-brand-400 hover:text-brand-300">Load Older Messages</button>
                    </div>
                )}

                {messages.map((msg, index) => {
                    const isMe = msg.senderId === currentUser?.id;
                    const nextMsg = messages[index + 1];
                    const isLastFromUser = !nextMsg || nextMsg.senderId !== msg.senderId;

                    return (
                        <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} ${isLastFromUser ? 'mb-4' : 'mb-1'}`}>
                            {/* Avatar for recipient (only on last message of group) */}
                            {!isMe && (
                                <div className={`w-8 mr-2 flex-shrink-0 flex items-end ${!isLastFromUser && 'invisible'}`}>
                                    <img
                                        src={recipient.handle === 'group' ? (senderProfiles[msg.senderId]?.avatarUrl || 'https://ui-avatars.com/api/?name=?') : recipient.avatarUrl}
                                        className="w-8 h-8 rounded-full border border-slate-700"
                                        alt=""
                                        title={recipient.handle === 'group' ? (senderProfiles[msg.senderId]?.handle ? `@${senderProfiles[msg.senderId]?.handle}` : groupMembers.find(m => m.id === msg.senderId)?.handle ? `@${groupMembers.find(m => m.id === msg.senderId)?.handle}` : 'User') : recipient.handle ? `@${recipient.handle}` : 'User'}
                                    />
                                    {(recipient.handle === 'group' ? senderProfiles[msg.senderId]?.isInfluencer : recipient.isInfluencer) && (
                                        <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-[1px] border border-slate-900">
                                            <Crown className="w-2 h-2 text-black fill-current" />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Bubble Container */}
                            <div className="flex flex-col max-w-[70%]">
                                <div className={`px-4 py-2.5 shadow-sm text-sm break-words relative group ${isMe
                                    ? `bg-brand-600 text-white ${isLastFromUser ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl border-r-2 border-brand-600'}`
                                    : `bg-slate-800 text-slate-200 ${isLastFromUser ? 'rounded-2xl rounded-tl-sm' : 'rounded-2xl border-l-2 border-slate-800'}`
                                    }`}>

                                    <p className="leading-relaxed">{msg.text}</p>

                                    {/* Timestamp overlay on hover */}
                                    <span className="text-[9px] opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-5 right-0 text-slate-500 whitespace-nowrap px-1">
                                        {formatTime(msg.timestamp)}
                                    </span>
                                </div>
                                {!isMe && recipient.handle === 'group' && isLastFromUser && (
                                    <span className="text-[10px] text-slate-500 ml-1 mt-1">
                                        @{senderProfiles[msg.senderId]?.handle || groupMembers.find(m => m.id === msg.senderId)?.handle || 'User'}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-slate-900 border-t border-brand-800/50 backdrop-blur-sm z-10 relative">

                {/* Mention Popup */}
                {mentionQuery && filteredMentions.length > 0 && (
                    <div className="absolute bottom-full left-4 mb-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
                        <div className="p-2 bg-slate-900/50 text-[10px] text-slate-400 font-bold uppercase tracking-widest border-b border-slate-700/50">
                            Mention Member
                        </div>
                        {filteredMentions.map(user => (
                            <button
                                key={user.id}
                                onClick={() => handleSelectMention(user.handle || 'user')}
                                className="w-full text-left flex items-center gap-2 p-2 hover:bg-brand-900/50 transition"
                            >
                                <img src={user.avatarUrl} className="w-6 h-6 rounded-full" alt="" />
                                <div>
                                    <div className="text-xs font-bold text-slate-200">@{user.handle}</div>
                                    <div className="text-[10px] text-slate-500">Member</div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex gap-2 items-center bg-slate-950 border border-slate-800 rounded-full px-2 pl-4 py-2 focus-within:border-brand-600/50 shadow-inner transition hover:border-slate-700">
                    <input
                        type="text"
                        value={inputText}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSend();
                            // Could add arrow key navigation for mentions here
                        }}
                        placeholder={`Message ${recipient.handle === 'group' ? (recipient.displayName || 'Group') : `@${recipient.handle}`}...`}
                        className="flex-1 bg-transparent text-white placeholder-slate-600 focus:outline-none text-sm"
                        disabled={isSending}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputText.trim() || isSending}
                        className="bg-brand-600 text-white p-2 rounded-full hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-95 shadow-lg shadow-brand-600/20"
                    >
                        {isSending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                    </button>
                </div>
                {sendError && (
                    <div className="text-red-500 text-xs mt-2 text-center break-all px-4">
                        {sendError.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
                            part.match(/^https?:\/\//) ? (
                                <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline hover:text-red-400 font-bold">
                                    Create Index (Click Here)
                                </a>
                            ) : part
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
