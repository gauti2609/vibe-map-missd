import { useState, useEffect, useRef } from 'react';
import { Message, User } from '../types';
import { db } from '../firebase'; // Removed auth from imports as it's not used directly
import {
    collection,
    addDoc,
    setDoc,
    doc,
    query,
    where,
    orderBy,
    onSnapshot,
    Timestamp,
    limit,
    increment,
    getDocs,
    limitToLast,
    startAfter,
    updateDoc,
    documentId,
    DocumentData,
    deleteField,
    getDoc
} from 'firebase/firestore';

export const useChat = (currentUser: User | null, recipient: User) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);
    const [lastMessageDoc, setLastMessageDoc] = useState<DocumentData | null>(null);
    const [hasMore, setHasMore] = useState(true);

    // Generate a consistent conversation ID
    // If recipient is a group (handle='group'), the ID is the conversation ID itself.
    const conversationId = currentUser
        ? (recipient.handle === 'group' ? recipient.id : [currentUser.id, recipient.id].sort().join('_'))
        : null;

    // Load initial messages
    useEffect(() => {
        if (!currentUser || !conversationId) return;
        setIsLoading(true);

        const q = query(
            collection(db, 'messages'),
            where('conversationId', '==', conversationId),
            orderBy('createdAt', 'desc'),
            limit(20)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            console.log(`[useChat] Snapshot update for ${conversationId}. Docs: ${snapshot.docs.length}, Metadata:`, snapshot.metadata);

            // Results are Newest First. Reverse to show Oldest -> Newest.
            const rawDocs = snapshot.docs;
            const msgs = rawDocs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString()
            })).reverse() as Message[]; // Reverse here

            setMessages(msgs);
            setIsLoading(false);
            if (rawDocs.length > 0) {
                // For pagination with 'desc' order, the "last" doc in the list is the OLDEST.
                // It is the cursor for the NEXT fetch (older messages).
                setLastMessageDoc(rawDocs[rawDocs.length - 1]);
            }
        }, (error) => {
            console.error(`[useChat] Snapshot ERROR for ${conversationId}:`, error);
            setSendError(`Sync Error: ${error.message}`);
            setIsLoading(false);
        });

        // Mark as read on open
        markAsRead();

        return () => unsubscribe();
    }, [currentUser?.id, recipient.id, conversationId]);

    const markAsRead = async () => {
        if (conversationId && currentUser) {
            const convRef = doc(db, 'conversations', conversationId);
            const unreadCountKey = `unreadCount.${currentUser.id}`;
            try {
                await setDoc(convRef, {
                    [unreadCountKey]: 0
                }, { merge: true });
            } catch (e) {
                console.error("Failed to mark as read", e);
            }
        }
    };

    const loadMore = async () => {
        if (!lastMessageDoc || !conversationId || isLoading) return;

        const q = query(
            collection(db, 'messages'),
            where('conversationId', '==', conversationId),
            orderBy('createdAt', 'asc'), // Keep same order
            limitToLast(20), // Get 20 before...
            // Firestore limitToLast + endBefore/startAfter logic is complex with 'asc'.
            // Alternative: Order by desc, startAfter lastDoc, then reverse.
        );
        // Correct approach for "Load Prior":
        // Query: conversationId, orderBy createdAt DESC, startAfter(oldestDoc), limit(20)
        // Then reverse results and prepend.

        const olderQuery = query(
            collection(db, 'messages'),
            where('conversationId', '==', conversationId),
            orderBy('createdAt', 'desc'),
            startAfter(lastMessageDoc),
            limit(20)
        );

        const snapshot = await getDocs(olderQuery);
        if (snapshot.empty) {
            setHasMore(false);
            return;
        }

        const olderMsgs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString()
        })) as Message[];

        setMessages(prev => [...olderMsgs.reverse(), ...prev]);
        setLastMessageDoc(snapshot.docs[snapshot.docs.length - 1]);
    };

    const sendMessage = async (text: string) => {
        if (!currentUser || !text.trim() || isSending) return;
        setIsSending(true);
        setSendError(null);

        const newMessageData = {
            text,
            senderId: currentUser.id,
            receiverId: recipient.id,
            conversationId,
            createdAt: Timestamp.now(),
            // timestamp: new Date().toISOString() // Redundant, removed
        };

        try {
            // 1. Add Message
            await addDoc(collection(db, 'messages'), newMessageData);

            // 2. Update Conversation Metadata
            if (conversationId) {
                const convRef = doc(db, 'conversations', conversationId);

                // For Groups, we need to update unread counts for ALL participants except sender
                // We need to know participants. For DM it is just [me, recipient].
                // For Group, we should ideally fetch the doc, or assume we can blindly update a map if we knew IDs.
                // Best effort: Get the doc first.
                const convSnap = await getDoc(convRef);

                if (convSnap.exists()) {
                    const convData = convSnap.data();
                    const participants = convData.participants || [currentUser.id, recipient.id];

                    // Build update object
                    const updateData: any = {
                        lastMessage: text,
                        lastMessageAt: Timestamp.now(),
                        updatedAt: Timestamp.now(),
                        hiddenFor: deleteField() // Completely remove the hiddenFor field
                    };

                    // Increment unread for others
                    participants.forEach((uid: string) => {
                        if (uid !== currentUser.id) {
                            updateData[`unreadCount.${uid}`] = increment(1);
                        }
                    });

                    // If DM, ensure participants field is set (legacy fix)
                    if (recipient.handle !== 'group') {
                        updateData.participants = [currentUser.id, recipient.id];
                    }

                    await updateDoc(convRef, updateData);
                }
            }
        } catch (error) {
            console.error("Error sending message:", error);
            setSendError("Failed to send. Please try again.");
        } finally {
            setIsSending(false);
        }
    };

    return { messages, sendMessage, isLoading, isSending, sendError, loadMore, hasMore, conversationId };
};
