import React, { useState, useEffect } from 'react';
import { USERS } from './mockData'; // Import Mock Data
import { Layout } from './components/Layout';
import { Onboarding } from './components/Onboarding';
import { Feed } from './components/Feed';
import { Profile } from './components/Profile';
import { Search } from './components/Search';
import { Inbox } from './components/Inbox';
import { Chat } from './components/Chat';
import { SafetyInfo } from './components/SafetyInfo';
import { Hotspots } from './components/Hotspots';
import { Roots } from './components/OriginRoots'; // Fixed path
import { PlaceProfile } from './components/PlaceProfile'; // New Place Profile
import { Activity } from './components/Activity'; // New Activity Page
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot, collection, query, where, limit } from 'firebase/firestore';
import { updatePost, deletePost } from './services/postService';
import { User, TabType, Post, Notification } from './types';
import { Loader2 } from 'lucide-react';
import { useFeed } from './hooks/useFeed';
import { subscribeToNotifications, markAllAsRead, markAsRead, sendNotification, removeNotification } from './services/notificationService';
import { NotificationsModal } from './components/NotificationsModal';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<TabType>('feed');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [viewedUser, setViewedUser] = useState<User | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null);
  const [dropVibeInitialLocation, setDropVibeInitialLocation] = useState<string>(''); // For pre-filling
  const [activeChatRecipient, setActiveChatRecipient] = useState<User | null>(null);
  const [previousPage, setPreviousPage] = useState<TabType | null>(null);
  const [isDropVibeOpen, setIsDropVibeOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Use custom hook for feed data
  const { posts, setPosts } = useFeed();

  const handleUpdatePost = async (updatedPost: Partial<Post>) => {
    if (!updatedPost.id) return;

    // Optimistic Update
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } as Post : p));

    // Persist
    try {
      await updatePost(updatedPost.id, updatedPost);
    } catch (err) {
      console.error("Failed to update post:", err);
      // Revert if needed
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Delete this post?")) return;
    setPosts(prev => prev.filter(p => p.id !== postId));
    try {
      await deletePost(postId);
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  };

  useEffect(() => {
    let unsubscribeUser: () => void;

    const initAuth = async () => {
      try {
        // 1. Sign In Anonymously to get a valid real UID
        const userCredential = await signInAnonymously(auth);
        const uid = userCredential.user.uid;
        console.log("Auth: Signed in as", uid);

        // 2. Create a Generic New User Profile
        const initialUser: User = {
          id: uid,
          displayName: 'Guest Vibe',
          handle: `user_${uid.substring(0, 5).toLowerCase()}`,
          avatarUrl: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=150&q=80', // Generic profile
          isConnected: true,
          isInfluencer: false,
          followersCount: 0,
          following: [],
          followedPlaces: [],
          wishlist: [],
          frequentPlaces: [],
          bio: 'Ready to explore the vibe.',
          trustScore: 10
        };

        // 3. User Persistence Check
        const userRef = doc(db, 'users', uid);

        // Subscribe first to get real-time updates (and handle initial load)
        unsubscribeUser = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = { id: uid, ...docSnap.data() } as User;
            console.log("Firestore update received:", userData);
            setUser(userData);
          } else {
            console.log("Creating new user profile for", uid);
            // Create if doesn't exist
            setDoc(userRef, initialUser).catch(e => console.error("Create failed", e));
            // Set local state immediately while creating
            setUser(initialUser);
          }
          setIsLoading(false);
          setShowOnboarding(false);
        }, (error) => {
          console.error("Firestore sync error:", error);
          // Fallback
          setUser(initialUser);
          setIsLoading(false);
        });

      } catch (error) {
        console.error("Auth initialization failed:", error);
        // Fallback to pure mock (Generic Guest)
        setUser({
          id: 'guest_fallback',
          displayName: 'Guest Vibe',
          handle: 'guest_user',
          avatarUrl: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=150&q=80',
          isConnected: true,
          follows: [],
          followers: [],
          following: [],
          followedPlaces: [],
          wishlist: [],
          frequentPlaces: [],
          trustScore: 0
        } as User);
        setIsLoading(false);
      }
    };

    initAuth();

    return () => {
      if (unsubscribeUser) unsubscribeUser();
    };
  }, []);


  // Notifications Logic
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadMessageCount(0);
      return;
    }

    // 1. Subscribe to Notifications
    const unsubNotif = subscribeToNotifications(user.id, (notifs) => {
      setNotifications(notifs);
    });

    // 2. Subscribe to Unread Chat Counts
    // We try to just query limited recent conversations and sum them.
    const qConvs = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.id),
      limit(50) // Reasonable limit
    );

    const unsubConvs = onSnapshot(qConvs, (snap) => {
      let total = 0;
      snap.docs.forEach(doc => {
        const data = doc.data();
        const count = data.unreadCount?.[user.id] || 0;
        total += count;
      });
      setUnreadMessageCount(total);
    });

    return () => {
      unsubNotif();
      unsubConvs();
    };
  }, [user?.id]);

  // DEEP LINKING HANDLER
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const placeParam = params.get('place');
    if (placeParam) {
      setSelectedPlace(placeParam);
      setCurrentPage('place');
      // Optional: Clean URL
      // window.history.replaceState({}, '', '/'); 
    }
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setCurrentPage('feed');
  };

  const handleNavigate = (page: TabType) => {
    // If navigating to profile tab, show OWN profile
    if (page === 'profile') {
      setViewedUser(null);
    }
    setCurrentPage(page);
  };

  const handlePlaceClick = (placeName: string) => {
    setSelectedPlace(placeName);
    setCurrentPage('place');
  };

  const handleUserClick = (targetUser: User) => {
    // If clicking self, clear viewedUser so we use the real-time 'user' state
    if (user && targetUser.id === user.id) {
      setViewedUser(null);
    } else {
      setViewedUser(targetUser);
    }
    setCurrentPage('profile');
  };

  const handleMessage = (targetUser: User) => {
    setPreviousPage(currentPage);
    setActiveChatRecipient(targetUser);
    setCurrentPage('chat');
  };

  const handleToggleUserFollow = async (userId: string) => {
    if (!user) return;
    const currentFollowing = user.following || [];
    const isFollowing = currentFollowing.includes(userId);
    const newFollowing = isFollowing
      ? currentFollowing.filter(id => id !== userId)
      : [...currentFollowing, userId];

    // 1. Optimistic Update Local User
    const updatedUser = { ...user, following: newFollowing };
    handleUpdateUser(updatedUser);

    // 2. Update Firestore for Target User (Followers list)
    // We need to fetch target user first to allow toggle, or use arrayUnion/arrayRemove if we trust IDs.
    // arrayUnion/Remove is safer for concurrent updates.
    // Importing arrayUnion/arrayRemove from firebase/firestore
    const targetRef = doc(db, 'users', userId);

    try {
      if (isFollowing) {
        // Unfollow: atomic remove
        await updateDoc(targetRef, {
          followers: arrayRemove(user.id)
        });

        // Remove Notification
        removeNotification(
          userId, // Recipient
          user.id, // Sender
          'follow'
        );

      } else {
        // Follow: atomic add
        await updateDoc(targetRef, {
          followers: arrayUnion(user.id)
        });

        // Send Notification
        sendNotification(
          userId,
          user.id,
          'follow',
          `started following you`
        );
      }

      // If viewing this user, we still want to update local view state to reflect count change immediately
      if (viewedUser && viewedUser.id === userId) {
        // We can't know the exact new array without reading, but we can assume success for UI responsiveness
        // Or re-fetch. For now, optimistic local toggle is fine for the "Viewed User" state too.
        const currentFollowers = viewedUser.followers || [];
        const newFollowers = isFollowing
          ? currentFollowers.filter(id => id !== user.id)
          : [...currentFollowers, user.id];
        setViewedUser({ ...viewedUser, followers: newFollowers });
      }

    } catch (error: any) {
      console.error("Failed to update follow status:", error);
      alert(`Follow action failed: ${error.message}`);
      // Revert local optimistic update if needed? 
      // For now, we accept minor UI desync risk on error over complexity.
    }
  };

  const handleTogglePlaceFollow = (placeName: string) => {
    if (!user) return;
    const currentPlaces = user.followedPlaces || [];
    const newPlaces = currentPlaces.includes(placeName)
      ? currentPlaces.filter(p => p !== placeName)
      : [...currentPlaces, placeName];

    // Optimistic Update
    handleUpdateUser({ ...user, followedPlaces: newPlaces });
  };

  const handleDropVibe = (initialLocation?: string) => {
    if (initialLocation) {
      setDropVibeInitialLocation(initialLocation);
    } else {
      setDropVibeInitialLocation('');
    }
    setIsDropVibeOpen(true);
  };

  const handleUpdateUser = async (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    try {
      await setDoc(doc(db, 'users', user.id), updatedUser, { merge: true });
    } catch (e) {
      console.error("Failed to update user:", e);
    }
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'chat':
        if (activeChatRecipient) {
          return <Chat currentUser={user} recipient={activeChatRecipient} onBack={() => {
            if (previousPage && previousPage !== 'chat') {
              setCurrentPage(previousPage);
              setPreviousPage(null);
            } else {
              setActiveChatRecipient(null);
            }
          }} />;
        }
        return <Inbox
          currentUser={user}
          onSelectConversation={(target) => {
            // From Inbox, set 'chat' as prev page so we come back here
            setPreviousPage('chat');
            setActiveChatRecipient(target);
          }}
        />;
      case 'search':
        return <Search
          initialQuery={searchQuery}
          followingIds={new Set(user?.following || [])}
          onToggleFollow={handleToggleUserFollow}
          posts={posts}
          currentUser={user}
        />;
      case 'profile':
        const profileUser = viewedUser || user;

        // Filter posts for this user (using top-level posts)
        const userPosts = posts.filter(p => p.user.id === profileUser.id);

        return <Profile
          user={profileUser}
          currentUser={user}
          onUpdateUser={handleUpdateUser}
          posts={userPosts}
          onMessage={() => handleMessage(profileUser)}
          onNavigate={handleNavigate}
          onToggleFollow={() => handleToggleUserFollow(profileUser.id)}
          onUpdatePost={handleUpdatePost}
        />;
      case 'hotspots':
        return <Hotspots
          onPlaceClick={handlePlaceClick}
          onToggleFollow={handleTogglePlaceFollow}
          followedPlaces={user?.followedPlaces}
        />;
      case 'origin-roots':
        return <Roots onBack={async () => {
          if (user?.isNewUser) {
            try {
              await updateDoc(doc(db, 'users', user.id), { isNewUser: false });
            } catch (e) {
              console.error("Failed to clear new user flag", e);
            }
          }
          handleNavigate('feed');
        }} />;
      case 'place':
        return selectedPlace ? (
          <PlaceProfile
            placeName={selectedPlace}
            onBack={() => handleNavigate('feed')}
            onDropVibe={() => handleDropVibe(selectedPlace)}
            currentUser={user}
            onUserClick={handleUserClick}
            isFollowed={user?.followedPlaces?.includes(selectedPlace) || false}
            onToggleFollow={() => handleTogglePlaceFollow(selectedPlace)}
            onUpdateUser={handleUpdateUser}

          // PlaceProfile currently assumes mock or fetches its own.
          // Let's leave it for now.
          />
        ) : <Feed
          onPlaceClick={handlePlaceClick}
          onUserClick={handleUserClick}
          currentUser={user}
          followedPlaces={user?.followedPlaces || []}
          followingUsers={user?.following || []}
          onTogglePlaceFollow={handleTogglePlaceFollow}
          onToggleUserFollow={handleToggleUserFollow}
          posts={posts}
          onUpdatePost={handleUpdatePost}
          onDeletePost={handleDeletePost}
          initialTab={(!user?.following || user.following.length === 0) ? 'trend' : 'inner-circle'}
        />;
      case 'activity': // New case for Activity
        return <Activity onNavigate={handleNavigate} />;
      case 'safety':
        return <SafetyInfo onBack={() => handleNavigate('profile')} />;
      case 'feed':
      default:
        return <Feed
          onPlaceClick={handlePlaceClick}
          onUserClick={handleUserClick}
          currentUser={user}
          followedPlaces={user?.followedPlaces || []}
          followingUsers={user?.following || []}
          onTogglePlaceFollow={handleTogglePlaceFollow}
          onToggleUserFollow={handleToggleUserFollow}
          posts={posts}
          onUpdatePost={handleUpdatePost}
          onDeletePost={handleDeletePost}
          initialTab={(!user?.following || user.following.length === 0) ? 'trend' : 'inner-circle'}
        />;

    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-brand-500">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user && !showOnboarding) {
    return <Onboarding onComplete={(u) => setUser(u)} />;
  }

  if (showOnboarding) {
    return <Onboarding
      onComplete={(u) => {
        setUser(u);
        setShowOnboarding(false);
        setCurrentPage('origin-roots');
      }}
    />;
  }

  return (
    <div className="bg-slate-950 min-h-screen">
      <Layout
        user={user!}
        onLogout={handleLogout}
        onDropVibe={() => handleDropVibe()}
        isDropVibeOpen={isDropVibeOpen}
        setIsDropVibeOpen={setIsDropVibeOpen}
        onNavigate={handleNavigate}
        currentPage={currentPage}
        initialLocation={dropVibeInitialLocation}
        notifications={notifications}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        unreadMessageCount={unreadMessageCount}
      >
        {renderContent()}
        <NotificationsModal
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          notifications={notifications}
          onMarkAllRead={() => markAllAsRead(user?.id || '', notifications)}
          onNotificationClick={(n) => {
            markAsRead(n.id);
            setIsNotificationsOpen(false);
            if (n.type === 'comment' || n.type === 'like' || n.type === 'rsvp') {
              setCurrentPage('feed');
            } else if (n.type === 'follow') {
              setCurrentPage('profile');
            }
          }}
        />
      </Layout>
    </div>
  );
}

export default App;