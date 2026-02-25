import { useState, useEffect } from 'react';
import { Post } from '../types';

import { collection, query, orderBy, onSnapshot, Timestamp, limit } from 'firebase/firestore';
import { db } from '../firebase';

const IS_DEV = import.meta.env.DEV;

export const useFeed = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // if (IS_DEV) {
        //     // Dev Mode: Use Mock Data (Disabled to test Persistence)
        //     // setPosts(MOCK_POSTS);
        //     // setIsLoading(false);
        //     // return;
        // }

        // Prod Mode: Fetch from Firestore
        const q = query(collection(db, 'posts'), orderBy('visitDate', 'desc'), limit(50));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedPosts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Post[];
            setPosts(fetchedPosts);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching posts:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { posts, isLoading, setPosts };
};
