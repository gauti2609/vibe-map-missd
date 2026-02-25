import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Feed } from './components/Feed';
import { Search } from './components/Search';
import { Onboarding } from './components/Onboarding';
import { Profile } from './components/Profile';
import { Hotspots } from './components/Hotspots';
import { Roots } from './components/OriginRoots';
import { Chat } from './components/Chat';
import { Activity } from './components/Activity';
import { SafetyInfo } from './components/SafetyInfo';
import { User, Post } from './types';
import { MOCK_POSTS } from './data';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set(['u2'])); // Initial follow example
  const [viewedUser, setViewedUser] = useState<User | null>(null);
  const [activeChatRecipient, setActiveChatRecipient] = useState<User | null>(null);
  const [isDropVibeOpen, setIsDropVibeOpen] = useState(false);

  // Handle Authentication flow
  if (!user) {
    return (
      <Onboarding
        onComplete={(displayName) => {
          setUser({
            id: 'current-user',
            displayName,
            avatarUrl: `https://ui-avatars.com/api/?name=${displayName}&background=7c3aed&color=fff`,
            isConnected: true
          });
        }}
      />
    );
  }

  const handleUpdateUser = (updates: Partial<User>) => {
    setUser((prev) => prev ? { ...prev, ...updates } : null);
  };

  const handleNavigate = (page: string) => {
    // Clear search query if navigating away from search or manually resetting
    if (page !== 'search') {
      setSearchQuery('');
    }
    // If navigating to profile tab, show OWN profile
    if (page === 'profile') {
      setViewedUser(null);
    }
    setCurrentPage(page);
  };

  const handlePlaceClick = (place: string) => {
    setSearchQuery(place);
    setCurrentPage('search');
  };

  const handleUserClick = (targetUser: User) => {
    setViewedUser(targetUser);
    setCurrentPage('profile');
  };

  const handleMessage = (targetUser: User) => {
    setActiveChatRecipient(targetUser);
    setCurrentPage('chat');
  };

  const handleToggleFollow = (id: string) => {
    setFollowingIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'chat':
      case 'chat':
        // Default to a mock user for the global chat button demo if no recipient selected
        const chatValues = activeChatRecipient || { id: 'u2', displayName: 'Viber2', avatarUrl: 'https://picsum.photos/50/50?2', isConnected: true };
        return <Chat currentUser={user} recipient={chatValues} onBack={() => handleNavigate('feed')} />;
      case 'search':
        return <Search
          initialQuery={searchQuery}
          followingIds={followingIds}
          onToggleFollow={handleToggleFollow}
        />;
      case 'profile':
        const profileUser = viewedUser || user;
        // Filter posts for this user
        const userPosts = MOCK_POSTS.filter(p => p.user.id === profileUser.id);

        return <Profile
          user={profileUser}
          currentUser={user}
          onUpdateUser={handleUpdateUser}
          posts={userPosts}
          onMessage={() => handleMessage(profileUser)}
          onNavigate={handleNavigate}
        />;
      case 'hotspots':
        return <Hotspots />;
      case 'origin-roots':
        return <Roots />;
      case 'activity': // New case for Activity
        return <Activity onNavigate={handleNavigate} />;
      case 'safety':
        return <SafetyInfo onBack={() => handleNavigate('activity')} />;
      case 'feed':
      default: return <Feed onPlaceClick={handlePlaceClick} onUserClick={handleUserClick} />;
    }
  };

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={handleNavigate}
      onLogout={() => setUser(null)}
      onDropVibe={() => setIsDropVibeOpen(true)}
      isDropVibeOpen={isDropVibeOpen}
      setIsDropVibeOpen={setIsDropVibeOpen}
      user={user}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;