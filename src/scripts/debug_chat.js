import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, orderBy } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyABtIX9_vCAlG5t9OGNpaWujr-BqMbiaZg",
    authDomain: "vibemap-v0.firebaseapp.com",
    projectId: "vibemap-v0",
    storageBucket: "vibemap-v0.firebasestorage.app",
    messagingSenderId: "708774733086",
    appId: "1:708774733086:web:c1a310eecf74101cd1d50f",
    measurementId: "G-FRGPMYGK1K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugChat() {
    console.log("🔍 Starting Chat Debug...");

    // 1. Find Users
    const handles = ['fuzzylogic', 'fuzzylogic1'];
    console.log(`fetching users for handles: ${handles.join(', ')}`);

    const userQ = query(collection(db, 'users'), where('handle', 'in', handles));
    const userSnaps = await getDocs(userQ);

    if (userSnaps.empty) {
        console.error("❌ No users found with these handles!");
        return;
    }

    const users = userSnaps.docs.map(d => ({ id: d.id, ...d.data() }));
    console.log("✅ Users found:", users.map(u => `${u.handle} (${u.id})`));

    if (users.length < 2) {
        console.error("❌ Need 2 users to check conversation. Found only:", users.length);
        return;
    }

    const u1 = users.find(u => u.handle === 'fuzzylogic');
    const u2 = users.find(u => u.handle === 'fuzzylogic1');

    if (!u1 || !u2) {
        console.error("❌ Could not identify specific users.");
        return;
    }

    // 2. Compute Conversation ID
    const conversationId = [u1.id, u2.id].sort().join('_');
    console.log(`🆔 Computed Conversation ID: ${conversationId}`);

    // 3. Check Messages
    console.log(`📨 Fetching messages for conversationId...`);
    // Try simple query first (no sort) to avoid index error masking results
    const msgQ = query(collection(db, 'messages'), where('conversationId', '==', conversationId));
    const msgSnaps = await getDocs(msgQ);

    console.log(`📊 Total Messages Found: ${msgSnaps.size}`);

    if (msgSnaps.size > 0) {
        const msgs = msgSnaps.docs.map(d => d.data());
        console.log("--- Messages ---");
        msgs.forEach(m => {
            const sender = m.senderId === u1.id ? u1.handle : (m.senderId === u2.id ? u2.handle : 'UNKNOWN');
            const time = m.createdAt?.toDate ? m.createdAt.toDate().toISOString() : m.timestamp;
            console.log(`[${time}] ${sender}: ${m.text}`);
        });
    } else {
        console.log("⚠️ No messages found in Firestore for this ID.");
    }

    process.exit(0);
}

debugChat().catch(e => {
    console.error("Fatal Error:", e);
    process.exit(1);
});
