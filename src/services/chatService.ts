import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Conversation, User } from '../types';

export const createGroupConversation = async (
    currentUser: User,
    participants: User[], // Excluding current user
    groupName: string,
    groupPhotoUrl?: string
): Promise<string> => {
    try {
        const participantIds = [currentUser.id, ...participants.map(u => u.id)].filter(Boolean); // Filter out any undefined ids

        const conversationData = {
            type: 'group',
            groupName: groupName,
            groupPhotoUrl: groupPhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(groupName)}&background=random`,
            participants: participantIds,
            adminIds: [currentUser.id],
            createdBy: currentUser.id,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastMessage: `@${currentUser.handle} created the group "${groupName}"`,
            lastMessageAt: new Date().toISOString(),
            unreadCount: participantIds.reduce((acc, id) => ({ ...acc, [id]: 1 }), {}), // Mark as unread for everyone initially so they see it
        };

        const convRef = await addDoc(collection(db, 'conversations'), conversationData);

        // Add initial system message to ROOT messages collection
        const messagesRef = collection(db, 'messages');
        await addDoc(messagesRef, {
            text: `@${currentUser.handle} created the group "${groupName}"`,
            senderId: 'system',
            system: true,
            createdAt: serverTimestamp(),
            conversationId: convRef.id
        });

        // Initialize metadata if needed for complex queries (though our Inbox query handles array-contains)

        return convRef.id;

    } catch (error) {
        console.error("Error creating group:", error);
        throw error;
    }
};

export const deleteConversation = async (conversationId: string, userId: string) => {
    try {
        const convRef = doc(db, 'conversations', conversationId);
        // "Soft delete" by hiding it for this user.
        await updateDoc(convRef, {
            hiddenFor: arrayUnion(userId)
        });
    } catch (error) {
        console.error("Error deleting conversation:", error);
        throw error;
    }
};

export const addParticipantToGroup = async (conversationId: string, newMembers: User[], adminUser: User) => {
    try {
        const convRef = doc(db, 'conversations', conversationId);
        const memberIds = newMembers.map(u => u.id);
        const memberNames = newMembers.map(u => `@${u.handle}`).join(', ');

        await updateDoc(convRef, {
            participants: arrayUnion(...memberIds),
            updatedAt: serverTimestamp()
        });

        // Add System Message
        const messagesRef = collection(db, 'messages');
        await addDoc(messagesRef, {
            text: `@${adminUser.handle} added ${memberNames}`,
            senderId: 'system',
            system: true,
            createdAt: serverTimestamp(),
            conversationId: conversationId
        });
    } catch (error) {
        console.error("Error adding participants:", error);
        throw error;
    }
};

export const removeParticipantFromGroup = async (conversationId: string, memberId: string, memberName: string, adminUser: User) => {
    try {
        const convRef = doc(db, 'conversations', conversationId);

        // Remove from participants AND adminIds (if present)
        // Firestore arrayRemove can handle multiple fields in one update
        await updateDoc(convRef, {
            participants: arrayRemove(memberId),
            adminIds: arrayRemove(memberId),
            updatedAt: serverTimestamp()
        });

        // Add System Message
        const messagesRef = collection(db, 'messages');
        await addDoc(messagesRef, {
            text: `@${adminUser.handle} removed ${memberName}`,
            senderId: 'system',
            system: true,
            createdAt: serverTimestamp(),
            conversationId: conversationId
        });
    } catch (error) {
        console.error("Error removing participant:", error);
        throw error;
    }
};
