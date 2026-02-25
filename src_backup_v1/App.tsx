import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Feed } from './components/Feed';
import { Search } from './components/Search';
import { Onboarding } from './components/Onboarding';
import { Profile } from './components/Profile';
import { Hotspots } from './components/Hotspots';
import { Influencers } from './components/Influencers';
import { Founders } from './components/Founders';
import { User, Post } from './types';
import { MOCK_POSTS } from './data';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set(['u2'])); // Initial follow example

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
    setCurrentPage(page);
  };

  const handlePlaceClick = (place: string) => {
    setSearchQuery(place);
    setCurrentPage('search');
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
      case 'search':
        return <Search
          initialQuery={searchQuery}
          followingIds={followingIds}
          onToggleFollow={handleToggleFollow}
        />;
      case 'profile':
        return <Profile user={user} onUpdateUser={handleUpdateUser} />;
      case 'hotspots':
        return <Hotspots />;
      case 'influencers':
        return <Influencers
          posts={MOCK_POSTS}
          followingIds={followingIds}
          onToggleFollow={handleToggleFollow}
        />;
      case 'founders':
        return <Founders />;
      case 'feed':
      default: return <Feed onPlaceClick={handlePlaceClick} />;
    }
  };

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={handleNavigate}
      onLogout={() => setUser(null)}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;