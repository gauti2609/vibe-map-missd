
import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { createPost } from '../services/postService';

export const DebugTester = () => {
    const [status, setStatus] = useState('Idle');

    const runTest = async () => {
        setStatus('Running...');
        try {
            console.log("DebugTester: Starting Write...");
            if (!auth.currentUser) {
                setStatus('Error: Not Logged In');
                return;
            }

            const newPost = await createPost({
                content: "Debug Test Post",
                caption: "Testing Debugger",
                location: { name: "Debug Land", address: "123 Bug St", shortLocation: "Debug" },
                visitDate: new Date().toISOString(),
                description: "Debug Description",
                user: {
                    id: auth.currentUser.uid, // Use current user's ID
                    displayName: auth.currentUser.displayName || 'Debug User',
                    avatarUrl: auth.currentUser.photoURL || "https://via.placeholder.com/150",
                    isConnected: true,
                    handle: "debug_bot" // Placeholder handle
                },
                rsvps: {},
                comments: [],
                likes: 0
            });
            console.log("DebugTester: Success!", newPost.id);
            setStatus('Success: ' + newPost.id);
        } catch (e: any) {
            console.error("DebugTester: Failed", e);
            setStatus('Failed: ' + e.message);
        }
    };

    return (
        <div className="fixed bottom-10 left-10 z-[100] bg-red-600 text-white p-4 rounded-xl shadow-2xl border-2 border-white">
            <h3 className="font-bold mb-2">🔥 Firestore Debugger</h3>
            <div className="mb-2 text-xs font-mono bg-black/50 p-1 rounded min-w-[200px]">
                {status}
            </div>
            <button
                onClick={runTest}
                className="bg-white text-red-600 font-bold px-4 py-2 rounded hover:bg-gray-200 w-full"
            >
                Test Write
            </button>
        </div>
    );
};
