import { db, auth } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { AdminPrivileges, AdminRole } from '../types';

const ADMIN_COLLECTION = 'admin_privileges';
const SUPER_ADMIN_EMAIL = 'cagautam86@gmail.com';

// 1. Check if current user is admin
export const checkAdminStatus = async (uid: string): Promise<AdminPrivileges | null> => {
    if (!uid) return null;

    // Hardcoded Bootstrap for Super Admin
    if (auth.currentUser?.email === SUPER_ADMIN_EMAIL) {
        return {
            uid,
            email: SUPER_ADMIN_EMAIL,
            assignedBy: 'system',
            assignedAt: new Date().toISOString(),
            roles: ['SUPER_ADMIN']
        };
    }

    try {
        const docRef = doc(db, ADMIN_COLLECTION, uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as AdminPrivileges;
        }
    } catch (error) {
        console.error("Error checking admin status:", error);
    }
    return null;
};

// 2. Grant Admin Role (Super Admin Only)
export const grantAdminRole = async (targetIdentifier: string, roles: AdminRole[]) => {
    // Verify caller is super admin first
    const caller = auth.currentUser;
    if (!caller) throw new Error("Not authenticated");

    // Check if caller is super admin (DB check or hardcoded check)
    const callerAdmin = await checkAdminStatus(caller.uid);
    const isSuper = caller.email === SUPER_ADMIN_EMAIL || callerAdmin?.roles.includes('SUPER_ADMIN');

    if (!isSuper) {
        throw new Error("Insufficient permissions: Super Admin required.");
    }

    // Find target user UID from email OR handle OR UID
    const usersRef = collection(db, 'users');
    let q;

    // Check if it's a handle (starts with @)
    const isHandle = targetIdentifier.startsWith('@');
    const cleanIdentifier = targetIdentifier.replace('@', '');

    if (isHandle) {
        // Try strict match first
        q = query(usersRef, where('handle', '==', cleanIdentifier));
    } else if (targetIdentifier.includes('@')) {
        // It's an email
        q = query(usersRef, where('email', '==', targetIdentifier));
    } else {
        // Assume it's a UID directly
        const userDocRef = doc(db, 'users', targetIdentifier);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            // Found by UID
            const userData = userDocSnap.data() as import('../types').User;
            await setDoc(doc(db, ADMIN_COLLECTION, targetIdentifier), {
                uid: targetIdentifier,
                email: userData.email || 'no-email',
                assignedBy: caller.uid,
                assignedAt: new Date().toISOString(),
                roles
            });
            return { uid: targetIdentifier, roles } as AdminPrivileges;
        }
        // Fallback: It might be a handle without the @
        q = query(usersRef, where('handle', '==', targetIdentifier));
    }

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        // Retry with Heuristics: Lowercase, Titlecase, Uppercase
        if (isHandle || !targetIdentifier.includes('@')) {
            const clean = cleanIdentifier;
            const variations = [
                clean.toLowerCase(), // tyh
                clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase(), // Tyh
                clean.toUpperCase() // TYH
            ];

            for (const variant of variations) {
                if (variant === clean) continue; // Skip if same as original
                const variantQ = query(usersRef, where('handle', '==', variant));
                const variantSnap = await getDocs(variantQ);
                if (!variantSnap.empty) {
                    return await grantToUserDoc(variantSnap.docs[0], roles, caller.uid);
                }
            }
        }
        throw new Error(`User not found with this identifier: ${targetIdentifier}. Try searching by Email or User ID.`);
    }

    // Found strict match
    const targetUserDoc = querySnapshot.docs[0];
    return await grantToUserDoc(targetUserDoc, roles, caller.uid);
};

// Helper
const grantToUserDoc = async (userDoc: any, roles: AdminRole[], callerUid: string) => {
    const userData = userDoc.data();
    const adminDoc: AdminPrivileges = {
        uid: userDoc.id,
        email: userData.email || 'unknown',
        assignedBy: callerUid,
        assignedAt: new Date().toISOString(),
        roles
    };
    await setDoc(doc(db, ADMIN_COLLECTION, userDoc.id), adminDoc);
    return adminDoc;

};



// 3. Get All Admins (Super Admin Only)
export const getAdmins = async (): Promise<AdminPrivileges[]> => {
    // In a real app, this might need pagination or backend function if list is huge.
    // For now, client-side query is fine.
    try {
        const q = query(collection(db, ADMIN_COLLECTION));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => d.data() as AdminPrivileges);
    } catch (e) {
        console.error("Failed to fetch admins", e);
        return [];
    }
};

// 4. Revoke Admin (Super Admin Only)
export const revokeAdmin = async (targetUid: string) => {
    // Verify caller (Super Admin check typically needed securely on backend, 
    // here we rely on UI hiding + Rules if we had them strict)
    try {
        await setDoc(doc(db, ADMIN_COLLECTION, targetUid), { roles: [] }, { merge: true });
        // Or actually delete: await deleteDoc(doc(db, ADMIN_COLLECTION, targetUid));
        // We'll just empty roles for now to keep record or delete. Let's delete.
        // await deleteDoc(doc(db, ADMIN_COLLECTION, targetUid));
        // Actually, let's keep the doc but remove roles to 'soft revoke' or just manage roles.
        // For this MVP, let's just re-set roles to empty or specific subset.
    } catch (e) {
        console.error("Failed to revoke", e);
        throw e;
    }
};

// 5. Update Admin Roles
export const updateAdminRoles = async (targetUid: string, roles: AdminRole[]) => {
    const ref = doc(db, ADMIN_COLLECTION, targetUid);
    await updateDoc(ref, { roles });
};

// 6. Toggle Influencer Status (Influencer Manager Only)
export const toggleInfluencerStatus = async (targetUid: string, status: boolean) => {
    const ref = doc(db, 'users', targetUid);
    await updateDoc(ref, { isInfluencer: status });
};

// --- SAFETY & MODERATION ---

export interface SafetyReport {
    id: string;
    type: 'post' | 'comment' | 'user'; // type of target
    targetId: string;
    reason: string; // The flag category or user reason
    status: 'pending' | 'resolved' | 'dismissed';
    timestamp: number;
    reporterId: string;
    details?: any; // AI moderation details
}

export const getSafetyReports = async (): Promise<SafetyReport[]> => {
    try {
        const q = query(collection(db, 'reports'), where('status', '==', 'pending'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as SafetyReport));
    } catch (e) {
        console.error("Error fetching reports:", e);
        return [];
    }
};

export const resolveReport = async (reportId: string, action: 'dismiss' | 'ban_user' | 'delete_content') => {
    // In real app, perform the action (delete doc, ban user) then update report
    const reportRef = doc(db, 'reports', reportId);
    await updateDoc(reportRef, { status: 'reviewed', resolution: action, resolvedAt: new Date().toISOString() });
};

// --- OUTLET ONBOARDING ---

export interface OutletApplication {
    id: string;
    name: string;
    address: string;
    description: string; // "Bar & Grill"
    submitterEmail: string;
    timestamp: string;
    status: 'pending' | 'approved' | 'rejected';
    coordinates?: { lat: number; lng: number }; // Map location
}

export const getOutletApplications = async (): Promise<OutletApplication[]> => {
    try {
        const q = query(collection(db, 'outlet_applications')); // Fetch ALL applications
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as OutletApplication));
    } catch (e) {
        console.error("Error fetching applications:", e);
        return [];
    }
};

export const resolveApplication = async (appId: string, status: 'approved' | 'rejected') => {
    const appRef = doc(db, 'outlet_applications', appId);
    await updateDoc(appRef, { status });
    // If approved, trigger logic to create a Place/User account? (Skipped for MVP)
};
