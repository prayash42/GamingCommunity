import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import Layout from './components/Layout';
import Profile from './components/Profile';
import IdeasHub from './components/sections/IdeasHub';
import CommunityMedia from './components/sections/CommunityMedia';
import EventsSection from './components/sections/EventsSection';
import CollaborationZone from './components/sections/CollaborationZone';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeSection, setActiveSection] = useState('ideas');
  const [showProfile, setShowProfile] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (showProfile) {
    return <Profile onBack={() => setShowProfile(false)} />;
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'ideas':
        return <IdeasHub />;
      case 'media':
        return <CommunityMedia />;
      case 'events':
        return <EventsSection />;
      case 'collaboration':
        return <CollaborationZone />;
      default:
        return <IdeasHub />;
    }
  };

  return (
    <Layout
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      onProfileClick={() => setShowProfile(true)}
    >
      {renderSection()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
