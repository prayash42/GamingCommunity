import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Lightbulb, Newspaper, Trophy, Users, Search, Bell, LogOut, Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
  onProfileClick?: () => void;
}

export default function Layout({ children, activeSection, onSectionChange, onProfileClick }: LayoutProps) {
  const { profile, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
    { id: 'ideas', label: 'Idea Hub', icon: Lightbulb },
    { id: 'media', label: 'Community Media', icon: Newspaper },
    { id: 'events', label: 'Events', icon: Trophy },
    { id: 'collaboration', label: 'Collaboration', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex h-screen overflow-hidden">
        <aside
          className={`${
            isSidebarOpen ? 'w-64' : 'w-20'
          } bg-gray-800 border-r border-gray-700 transition-all duration-300 flex flex-col`}
        >
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            {isSidebarOpen && (
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
                Gaming
              </h1>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSectionChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg shadow-blue-500/30'
                      : 'hover:bg-gray-700'
                  }`}
                  title={item.label}
                >
                  <Icon size={20} className={isActive ? 'text-white' : 'text-gray-400'} />
                  {isSidebarOpen && (
                    <span className={isActive ? 'text-white font-medium' : 'text-gray-300'}>
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-700">
            <button
              onClick={signOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-600/20 hover:text-red-400 transition-all"
              title="Sign Out"
            >
              <LogOut size={20} />
              {isSidebarOpen && <span>Sign Out</span>}
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 max-w-xl">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search games, creators, events..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-gray-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 ml-6">
                <button className="relative p-2 rounded-lg hover:bg-gray-700 transition-colors">
                  <Bell size={20} className="text-gray-400" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
                </button>

                <button
                  onClick={onProfileClick}
                  className="flex items-center gap-3 pl-4 border-l border-gray-700 hover:opacity-75 transition-opacity cursor-pointer"
                >
                  <img
                    src={profile?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                    alt="Profile"
                    className="w-8 h-8 rounded-full ring-2 ring-blue-500/50"
                  />
                  <div className="text-sm text-left">
                    <p className="font-medium">{profile?.username || 'User'}</p>
                    {profile?.badges && profile.badges.length > 0 && (
                      <p className="text-xs text-gray-400">{profile.badges[0]}</p>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
