import { db } from '../firebase';
import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { MOCK_POSTS } from '../mockData';

export const seedDatabase = async () => {
    try {
        const batch = writeBatch(db);

        console.log("🌱 Starting Database Seed...");

        // 1. Seed Posts
        MOCK_POSTS.forEach(post => {
            const postRef = doc(collection(db, 'posts')); // Auto-ID
            // Convert Date string to timestamp or keep as ISO string depending on preference.
            // For now, keeping as string to match current types.
            batch.set(postRef, {
                ...post,
                seeded: true,
                createdAt: new Date().toISOString()
            });
        });



        await batch.commit();
        console.log("✅ Database Seeded Successfully!");
        alert("Database seeded! Check your Firestore console.");
    } catch (error) {
        console.error("❌ Error seeding database:", error);
        alert("Error seeding database. Check console.");
    }
};
