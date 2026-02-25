import { User } from '../types';

export const calculateTrustScore = (user: User): number => {
    let score = 0;

    // 1. Google Verification (Implicit if they have a UID and PhotoURL usually, but let's assume all logged-in users are verified for V0)
    // In a real app, we'd check `user.emailVerified` from Firebase Auth object, but for now we trust the existence of the user profile.
    if (user.id) score += 50;

    // 2. Profile Completeness
    if (user.bio && user.bio.length > 10) score += 20;
    if (user.avatarUrl && !user.avatarUrl.includes('ui-avatars')) score += 10; // Bonus for real photo (mock check)

    // 3. Social Proof (Mock logic for now, using hardcoded props or defaults)
    if (user.isConnected) score += 10;
    if (user.isInfluencer) score += 20;

    return Math.min(score, 100); // Cap at 100
};
