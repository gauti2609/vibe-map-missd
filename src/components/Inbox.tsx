import React, { useState, useEffect } from 'react';
import { useInbox } from '../hooks/useInbox';
import { User, Conversation } from '../types';
import { MessageCircle, Search, X } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

interface InboxProps {
    currentUser: User | null;
    onSelectConversation: (recipient: User) => void;
}

import { createGroupConversation } from '../services/chatService';
import { Check, Plus, Users } from 'lucide-react';

export const Inbox: React.FC<InboxProps> = ({ currentUser, onSelectConversation }) => {

    const { conversations, isLoading, error } = useInbox(currentUser);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Group Creation State
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
    const [friendSearchQuery, setFriendSearchQuery] = useState('');
    const [friendSearchResults, setFriendSearchResults] = useState<User[]>([]);

    // Friend Search Logic for Group
    useEffect(() => {
        const searchFriends = async () => {
            if (!friendSearchQuery.trim()) {
                setFriendSearchResults([]);
                return;
            }
            const q = friendSearchQuery.toLowerCase();
            const usersRef = collection(db, 'users');
            const snapshot = await getDocs(usersRef);
            const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));

            // Filter: Must be Friend (Follower AND Following) OR just Following for now to be easier
            // Let's filter by: not self, and matches query
            const matched = allUsers.filter(u => {
                if (u.id === currentUser?.id) return false;
                return u.displayName.toLowerCase().includes(q) || u.handle?.toLowerCase().includes(q);
            }).slice(0, 5);

            setFriendSearchResults(matched);
        };
        const timer = setTimeout(searchFriends, 300);
        return () => clearTimeout(timer);
    }, [friendSearchQuery, currentUser]);

    const handleCreateGroup = async () => {
        if (!currentUser || !groupName.trim() || selectedMembers.length === 0) return;
        try {
            const groupId = await createGroupConversation(currentUser, selectedMembers, groupName);
            setIsCreatingGroup(false);
            setGroupName('');
            setSelectedMembers([]);
            // Clean up UI
        } catch (e: any) {
            console.error("Group Creation Error:", e);
            alert(`Failed to create group: ${e.message || 'Unknown error'}`);
        }
    };

    const toggleMemberSelection = (user: User) => {
        if (selectedMembers.find(m => m.id === user.id)) {
            setSelectedMembers(prev => prev.filter(m => m.id !== user.id));
        } else {
            setSelectedMembers(prev => [...prev, user]);
        }
    };

    // Search Logic
    useEffect(() => {
        const performSearch = async () => {
            const queryStr = searchQuery.trim().toLowerCase();
            if (!queryStr) {
                setSearchResults([]);
                return;
            }

            try {
                // Remove @ if present for search
                const cleanQuery = queryStr.startsWith('@') ? queryStr.substring(1) : queryStr;

                // 1. Fetch Users (Optimized: In real app, use Algolia/Typesense. Here: Client Filter)
                const usersRef = collection(db, 'users');
                const snapshot = await getDocs(usersRef);
                const allUsers = snapshot.docs.map(doc => doc.data() as User);

                // 2. Filter & Prioritize
                const matched = allUsers.filter(u => {
                    if (u.id === currentUser?.id) return false; // Exclude self
                    const handle = u.handle?.toLowerCase() || '';
                    const name = u.displayName.toLowerCase();
                    return handle.includes(cleanQuery) || name.includes(cleanQuery);
                });

                // 3. Sort by priority
                // Priority A: Already in an active conversation
                // Priority B: Following or Follower
                // Priority C: Others
                const existingChatUserIds = new Set(conversations.map(c => c.recipientUser.id));
                const followingIds = new Set(currentUser?.following || []);
                const followerIds = new Set(currentUser?.followers || []);

                const getScore = (u: User) => {
                    if (existingChatUserIds.has(u.id)) return 100;
                    if (followingIds.has(u.id) || followerIds.has(u.id)) return 50;
                    return 0;
                };

                matched.sort((a, b) => getScore(b) - getScore(a));

                setSearchResults(matched.slice(0, 5)); // Limit to top 5
            } catch (e) {
                console.error("Inbox Search Error:", e);
            }
        };

        const timer = setTimeout(performSearch, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, currentUser, conversations]);




    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        // If today, show time
        if (diff < 1000 * 60 * 60 * 24 && date.getDate() === now.getDate()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        // If yesterday
        if (diff < 1000 * 60 * 60 * 48 && date.getDate() === now.getDate() - 1) {
            return 'Yesterday';
        }
        // Else date
        return date.toLocaleDateString();
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] bg-slate-900 border border-brand-800 rounded-2xl overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="bg-brand-900/90 backdrop-blur-md p-4 border-b border-brand-800 z-10 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Messages</h2>
                <button
                    onClick={() => setIsCreatingGroup(true)}
                    className="text-xs bg-brand-800/50 hover:bg-brand-700 text-slate-300 px-3 py-1.5 rounded-full transition flex items-center gap-1 cursor-pointer hover:text-white"
                >
                    <span className="font-bold">+</span> Group
                </button>
            </div>

            {/* Search Bar */}
            <div className="px-4 py-2 bg-slate-900/50 backdrop-blur-sm border-b border-brand-800/50 sticky top-0 z-20">
                <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Search className="w-4 h-4 text-slate-500" />
                    </div>
                    <input
                        type="text"
                        placeholder="Use @ to search people..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setIsSearching(!!e.target.value);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-9 pr-8 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setIsSearching(false);
                            }}
                            className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-brand-800 scrollbar-track-slate-900">
                {isSearching ? (
                    // Search Results View
                    <div className="space-y-1">
                        {searchResults.length === 0 ? (
                            <div className="text-center text-slate-500 py-8 text-sm">No matches found.</div>
                        ) : (
                            searchResults.map(user => {
                                // Determine relationship label
                                const isChatting = conversations.some(c => c.recipientUser.id === user.id);
                                const isFollowing = currentUser?.following?.includes(user.id);
                                const isFollower = currentUser?.followers?.includes(user.id);

                                let statusTag = null;
                                if (isChatting) statusTag = <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Chatting</span>;
                                else if (isFollowing && isFollower) statusTag = <span className="text-[10px] bg-brand-900/50 text-brand-300 px-1.5 py-0.5 rounded">Friend</span>;
                                else if (isFollowing) statusTag = <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Following</span>;

                                return (
                                    <button
                                        key={user.id}
                                        onClick={() => {
                                            onSelectConversation(user);
                                            setSearchQuery('');
                                            setIsSearching(false);
                                        }}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-slate-800/50 rounded-xl transition group text-left"
                                    >
                                        <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-full border border-slate-700" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-slate-200 truncate group-hover:text-brand-300 transition">
                                                    {user.handle ? `@${user.handle}` : user.displayName}
                                                </h3>
                                                {statusTag}
                                            </div>
                                            <div className="text-xs text-slate-500 truncate">Viber</div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                ) : (
                    // Standard Inbox View
                    isLoading ? (
                        <div className="text-center text-slate-500 py-10">Loading messages...</div>
                    ) : error ? (
                        <div className="p-4 text-center">
                            <p className="text-red-400 text-xs mb-2">Inbox Sync Error</p>
                            <div className="text-red-500 text-xs break-all">
                                {error.message.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
                                    part.match(/^https?:\/\//) ? (
                                        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline hover:text-red-400 font-bold block mt-2 p-2 bg-red-500/10 rounded">
                                            Create Missing Inbox Index
                                        </a>
                                    ) : null
                                )}
                            </div>
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4 opacity-50">
                            <MessageCircle className="w-12 h-12" />
                            <p>No messages yet. Start vibing!</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {conversations.map(conv => {
                                const recipient = conv.recipientUser;
                                return (
                                    <button
                                        key={conv.id}
                                        onClick={() => onSelectConversation(recipient)}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-slate-800/50 rounded-xl transition group text-left"
                                    >
                                        <div className="relative">
                                            <img src={recipient.avatarUrl} alt="" className="w-12 h-12 rounded-full border border-slate-700 group-hover:border-brand-500/50 transition" />
                                            {/* Online indicator (mock) */}
                                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <h3 className="font-bold text-slate-200 truncate pr-2 group-hover:text-brand-300 transition">
                                                    {recipient.handle === 'group' ? recipient.displayName : (recipient.handle ? `@${recipient.handle}` : recipient.displayName)}
                                                </h3>
                                                <span className="text-[10px] text-slate-500 whitespace-nowrap">{formatTime(conv.lastMessageAt)}</span>
                                            </div>
                                            <p className={`text-sm text-slate-400 truncate group-hover:text-slate-300 flex items-center gap-1 ${conv.unreadCount > 0 ? 'font-bold text-slate-200' : ''}`}>
                                                {conv.lastMessage}
                                            </p>
                                        </div>
                                        {conv.unreadCount > 0 && (
                                            <div className="bg-brand-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg shadow-brand-500/20">
                                                {conv.unreadCount}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )
                )}
            </div>
            {/* Create Group Modal */}
            {isCreatingGroup && (
                <div className="absolute inset-0 bg-slate-900 z-50 flex flex-col animate-fade-in p-4">
                    <div className="flex items-center justify-between mb-6">
                        <button onClick={() => setIsCreatingGroup(false)} className="text-slate-400 hover:text-white">Cancel</button>
                        <h3 className="font-bold text-white">New Group</h3>
                        <button
                            onClick={handleCreateGroup}
                            disabled={!groupName.trim() || selectedMembers.length === 0}
                            className="text-brand-400 font-bold disabled:opacity-50"
                        >
                            Create
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Group Name */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 tracking-widest block mb-2">Group Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Weekend Vibes"
                                value={groupName}
                                onChange={e => setGroupName(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-brand-500"
                            />
                        </div>

                        {/* Valid Members Badge List */}
                        {selectedMembers.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {selectedMembers.map(m => (
                                    <span key={m.id} className="bg-brand-900 border border-brand-700 text-brand-200 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                        @{m.handle}
                                        <button onClick={() => toggleMemberSelection(m)}><X className="w-3 h-3" /></button>
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Search Members */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 tracking-widest block mb-2">Add Member</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Search people..."
                                    value={friendSearchQuery}
                                    onChange={e => setFriendSearchQuery(e.target.value)}
                                    className="w-full bg-slate-800 border-b border-slate-700 p-3 pl-10 text-white focus:outline-none"
                                />
                            </div>

                            <div className="mt-2 max-h-60 overflow-y-auto space-y-1">
                                {friendSearchResults.map(user => {
                                    const isSelected = selectedMembers.some(m => m.id === user.id);
                                    return (
                                        <div key={user.id} onClick={() => toggleMemberSelection(user)} className="flex items-center justify-between p-2 hover:bg-slate-800 rounded-lg cursor-pointer">
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <img src={user.avatarUrl} className="w-8 h-8 rounded-full" alt="" />
                                                <div className="min-w-0">
                                                    <div className="text-sm font-bold text-slate-200 truncate">
                                                        @{user.handle}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'bg-brand-500 border-brand-500' : 'border-slate-600'}`}>
                                                {isSelected && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};
