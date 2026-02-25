import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    doc,
    updateDoc,
    serverTimestamp,
    getDoc,
    writeBatch,
    getDocs,
    deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { Notification, NotificationType } from '../types';

const COLLECTION_NAME = 'notifications';

export const sendNotification = async (
    recipientId: string,
    senderId: string,
    type: NotificationType,
    message: string,
    targetId?: string
) => {
    try {
        if (recipientId === senderId) return; // Don't notify self

        // Optional: Check if duplicate notification exists (e.g. repeated likes)
        // For V0, we'll just append.

        // Get Sender Details for faster UI rendering
        const senderDoc = await getDoc(doc(db, 'users', senderId));
        const senderData = senderDoc.exists() ? senderDoc.data() : {};

        await addDoc(collection(db, COLLECTION_NAME), {
            recipientId,
            senderId,
            type,
            targetId: targetId || null,
            message,
            read: false,
            createdAt: new Date().toISOString(), // Use ISO string for client consistency
            senderName: senderData.handle ? `@${senderData.handle}` : (senderData.displayName || 'Someone'),
            senderAvatar: senderData.avatarUrl || ''
        });
    } catch (error) {
        console.error("Error sending notification:", error);
    }
};

export const subscribeToNotifications = (userId: string, callback: (notifications: Notification[]) => void) => {
    const q = query(
        collection(db, COLLECTION_NAME),
        where('recipientId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(20)
    );

    return onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Notification[];
        callback(notifications);
    });
};

export const markAsRead = async (notificationId: string) => {
    try {
        await updateDoc(doc(db, COLLECTION_NAME, notificationId), {
            read: true
        });
    } catch (error) {
        console.error("Error marking notification read:", error);
    }
};

export const markAllAsRead = async (userId: string, notifications: Notification[]) => {
    try {
        const batch = writeBatch(db);
        const unread = notifications.filter(n => !n.read);

        if (unread.length === 0) return;

        unread.forEach(n => {
            const ref = doc(db, COLLECTION_NAME, n.id);
            batch.update(ref, { read: true });
        });

        await batch.commit();
    } catch (error) {
        console.error("Error marking all read:", error);
    }
};

export const removeNotification = async (
    recipientId: string,
    senderId: string,
    type: NotificationType,
    targetId?: string
) => {
    try {
        // Find the notification to delete
        // We look for a notification with matching params that is NOT read? Or any?
        // Usually just the most recent one or all matches. 
        // For Likes/Follows, it's usually 1:1.

        let q = query(
            collection(db, COLLECTION_NAME),
            where('recipientId', '==', recipientId),
            where('senderId', '==', senderId),
            where('type', '==', type)
        );

        if (targetId) {
            q = query(q, where('targetId', '==', targetId));
        }

        let snapshot = await getDocs(q);

        // RACE CONDITION HANDLING:
        // If notification isn't found immediately (e.g. fast toggle), wait 1s and retry once.
        if (snapshot.empty) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            snapshot = await getDocs(q);
        }

        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
    } catch (error) {
        console.error("Error removing notification:", error);
    }
};
