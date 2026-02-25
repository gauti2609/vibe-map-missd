
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyABtIX9_vCAlG5t9OGNpaWujr-BqMbiaZg",
    authDomain: "vibemap-v0.firebaseapp.com",
    projectId: "vibemap-v0",
    storageBucket: "vibemap-v0.firebasestorage.app",
    messagingSenderId: "708774733086",
    appId: "1:708774733086:web:c1a310eecf74101cd1d50f",
};

// Initialize
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function verifyUsers() {
    console.log("Fetching users...");
    try {
        const snapshot = await getDocs(collection(db, 'users'));
        if (snapshot.empty) {
            console.log("No users found.");
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`User: ${doc.id} (${data.displayName || 'No Name'})`);
            console.log(`  - Followers: ${JSON.stringify(data.followers || [])}`);
            console.log(`  - Following: ${JSON.stringify(data.following || [])}`);
            console.log('-----------------------------------');
        });
    } catch (e) {
        console.error("Error fetching users:", e);
    }
}

verifyUsers();
