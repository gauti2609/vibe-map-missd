import { useState, useEffect } from 'react';
import { Conversation, User } from '../types';
import { auth, db } from '../firebase';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    getDoc,
    getDocs,
    documentId,
    doc
} from 'firebase/firestore';

export interface EnrichedConversation extends Omit<Conversation, 'unreadCount'> {
    recipientUser: User;
    unreadCount: number;
}



export const useInbox = (currentUser: User | null) => {
    const [conversations, setConversations] = useState<EnrichedConversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!currentUser) {
            setConversations([]);
            setIsLoading(false);
            return;
        }

        const q = query(
            collection(db, 'conversations'),
            where('participants', 'array-contains', currentUser.id),
            orderBy('updatedAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            // 1. Resolve Recipients (Optimized Batch Fetch)
            const recipientIds = new Set<string>();
            const rawConversations = snapshot.docs.map(doc => {
                const data = doc.data() as Conversation;

                // Client-side filter for "Soft Deleted" conversations
                if ((data as any).hiddenFor?.includes(currentUser.id)) {
                    return null;
                }

                // Add sorting fix here too: using validated timestamp
                const lastMessageAt = (data as any).lastMessageAt?.toDate?.()?.toISOString() ||
                    (data as any).updatedAt?.toDate?.()?.toISOString() ||
                    new Date().toISOString();

                const otherId = data.participants.find(id => id !== currentUser.id);
                if (otherId) recipientIds.add(otherId);

                return {
                    id: doc.id,
                    ...data,
                    lastMessageAt
                };
            }).filter(Boolean); // Remove nulls

            const uniqueIds = Array.from(recipientIds);
            const userMap = new Map<string, User>();

            // Firestore 'in' limit is 30. Chunk if needed (omitted for MVP < 30 friends assumption)
            if (uniqueIds.length > 0) {
                try {
                    // Fetch in batches of 10 to be safe
                    for (let i = 0; i < uniqueIds.length; i += 10) {
                        const chunk = uniqueIds.slice(i, i + 10);
                        const userQ = query(collection(db, 'users'), where(documentId(), 'in', chunk));
                        const userSnaps = await getDocs(userQ);
                        userSnaps.forEach(doc => {
                            userMap.set(doc.id, { id: doc.id, ...doc.data() } as User);
                        });
                    }
                } catch (e) {
                    console.error("Failed to batch fetch inbox users:", e);
                }
            }

            const enriched = rawConversations.map(conv => {
                let recipientUser: User;

                if (conv.type === 'group') {
                    // For groups, create a pseudo-user object for display
                    recipientUser = {
                        id: conv.id,
                        displayName: conv.groupName || 'Unnamed Group',
                        avatarUrl: conv.groupPhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.groupName || 'Group')}`,
                        isConnected: true,
                        handle: 'group'
                    };
                } else {
                    // Direct Message Logic
                    const otherId = conv.participants.find(id => id !== currentUser.id);
                    recipientUser = {
                        id: otherId || 'unknown',
                        displayName: 'Unknown User',
                        avatarUrl: `https://ui-avatars.com/api/?name=Unknown`,
                        isConnected: false
                    };

                    if (otherId && userMap.has(otherId)) {
                        recipientUser = userMap.get(otherId)!;
                    }
                }

                const unreadCount = conv.unreadCount?.[currentUser.id] ?? 0;

                return { ...conv, recipientUser, unreadCount };
            }) as EnrichedConversation[];

            setConversations(enriched);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching inbox:", error);
            setError(error); // Set error state
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser?.id]);

    return { conversations, isLoading, error };
};
