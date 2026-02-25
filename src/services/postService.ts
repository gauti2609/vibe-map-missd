import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    increment,
    arrayUnion,
    arrayRemove,
    getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { Post, Comment } from '../types';
import { moderateContent } from './moderationService';

export const toggleLike = async (postId: string, userId: string): Promise<boolean> => {
    try {
        const postRef = doc(db, 'posts', postId);
        const postSnap = await getDoc(postRef);

        if (!postSnap.exists()) return false;

        const likes = postSnap.data().likes || [];
        const isLiked = likes.includes(userId);

        if (isLiked) {
            await updateDoc(postRef, {
                likes: arrayRemove(userId)
            });
            return false;
        } else {
            await updateDoc(postRef, {
                likes: arrayUnion(userId)
            });
            return true;
        }
    } catch (error) {
        console.error("Error toggling like:", error);
        throw error;
    }
};

export const addComment = async (postId: string, comment: Omit<Comment, 'id' | 'timestamp'>): Promise<Comment> => {
    try {
        // AI Moderation Check
        const moderationResult = await moderateContent(comment.text);

        if (moderationResult.flagged) {
            await addDoc(collection(db, 'reports'), {
                type: 'comment',
                targetId: postId, // Link to post for context, ideally we'd have a comment ID if we were storing subcollections
                reason: `AI Auto-Flag: ${moderationResult.category}`,
                status: 'pending',
                timestamp: Date.now(),
                reporterId: 'system_ai',
                details: { ...moderationResult, text: comment.text }
            });
            // Proceed or Block? For consistency with posts, let's proceed but flag. 
            // Or maybe block comments? Comments are lower stakes but high volume. 
            // Let's Just Proceed for now to avoid breaking flow, but admin will see it.
        }

        const postRef = doc(db, 'posts', postId);
        const newComment = {
            ...comment,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString()
        };

        await updateDoc(postRef, {
            comments: arrayUnion(newComment)
        });

        return newComment;
    } catch (error) {
        console.error("Error adding comment:", error);
        throw error;
    }
};

export const deletePost = async (postId: string) => {
    try {
        await deleteDoc(doc(db, 'posts', postId));
        return true;
    } catch (error) {
        console.error("Error deleting post:", error);
        throw error;
    }
};


export const createPost = async (postData: any) => {
    try {
        // AI Moderation Check
        const textToCheck = postData.content || postData.caption || postData.description || '';
        const moderationResult = await moderateContent(textToCheck);

        if (moderationResult.flagged) {
            await addDoc(collection(db, 'reports'), {
                type: 'post',
                targetId: 'PENDING_ID',
                reason: `AI Auto-Flag: ${moderationResult.category}`,
                status: 'pending',
                timestamp: Date.now(),
                reporterId: 'system_ai',
                details: moderationResult
            });
        }

        const docRef = await addDoc(collection(db, 'posts'), {
            ...postData,
            likes: [],
            comments: [], // Initialize as empty array
            shares: 0,
            timestamp: serverTimestamp(),
            aiModeration: moderationResult
        });

        return { id: docRef.id, ...postData, aiModeration: moderationResult };
    } catch (error) {
        console.error("Error creating post:", error);
        throw error;
    }
};

export const updatePost = async (postId: string, postData: Partial<Post>) => {
    try {
        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, postData);
        return true;
    } catch (error) {
        console.error("Error updating post:", error);
        throw error;
    }
};
