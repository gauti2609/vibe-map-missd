import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Checks if a handle is already taken by another user.
 * Returns true if available, false if taken.
 */
export const checkHandleAvailability = async (handle: string): Promise<boolean> => {
    if (!handle) return false;

    // Normalize handle (lowercase, trim) for consistent checking
    const normalizedHandle = handle.toLowerCase().trim();

    // reserved handles
    if (['admin', 'support', 'vibe', 'vibemap'].includes(normalizedHandle)) return false;

    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('handle', '==', normalizedHandle)); // Assumes handles are stored exactly or logic handles case
        // Ideally, we store a 'handle_lower' field for case-insensitive uniqueness, 
        // but for now we'll assume the handle field is the source of truth.
        // If we want strict case-insensitivity, we'd need that extra field or client-side filtering (expensive).
        // Let's rely on the query for now.

        const snapshot = await getDocs(q);
        return snapshot.empty;
    } catch (error) {
        console.error("Error checking handle availability:", error);
        // Fail safe: assume taken if error to prevent potential collision errors later? 
        // Or assume available (risky)? Let's return false to be safe (prevent signup if DB down).
        return false;
    }
};
