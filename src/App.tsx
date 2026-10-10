import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import { api } from './services/api';
import { Song, Playlist } from './types';

// Layout & Components
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { GlobalPlayer } from './components/GlobalPlayer';
import { UploadModal } from './components/UploadModal';
import { CreatePlaylistModal } from './components/CreatePlaylistModal';
import { InviteModal } from './components/InviteModal';

// Pages
import { LandingPage } from './pages/LandingPage';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { LibraryPage } from './pages/LibraryPage';
import { PlaylistPage } from './pages/PlaylistPage';
import { FriendsPage } from './pages/FriendsPage';
import { LikedSongsPage } from './pages/LikedSongsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuthModal } from './pages/AuthModal';

const AppContent: React.FC = () => {
  const { user, isOwner, isLoading: isAuthLoading, loginQuickOwner } = useAuth();

  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [activePlaylistId, setActivePlaylistId] = useState<string>('');

  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [inviteTokenParam, setInviteTokenParam] = useState('');

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [playlistToEdit, setPlaylistToEdit] = useState<Playlist | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Parse invite tokens or hashes on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get('invite');
    if (invite) {
      setInviteTokenParam(invite);
      setAuthMode('register');
      setIsAuthModalOpen(true);
    }
  }, []);

  // When user signs in, switch default tab to 'home'
  useEffect(() => {
    if (user && currentTab === 'landing') {
      setCurrentTab('home');
    } else if (!user && currentTab !== 'landing' && currentTab !== 'explore') {
      setCurrentTab('landing');
    }
  }, [user]);

  // Load songs & playlists
  const loadContent = async () => {
    if (!user) {
      // Guest preview mode: fetch public tracks and playlists
      try {
        const [songsRes, plRes] = await Promise.all([
          api.getSongs().catch(() => ({ songs: [] })),
          api.getPlaylists().catch(() => ({ playlists: [] })),
        ]);
        setSongs(songsRes.songs);
        setPlaylists(plRes.playlists);
      } catch {
        // Fallback
      }
      return;
    }

    try {
      setIsDataLoading(true);
      const [songsRes, plRes] = await Promise.all([
        api.getSongs(),
        api.getPlaylists(),
      ]);
      setSongs(songsRes.songs);
      setPlaylists(plRes.playlists);
    } catch (err) {
      console.warn('Failed to fetch data:', err);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, [user]);

  const handleNavigate = (tab: string, playlistId?: string) => {
    if (playlistId) {
      setActivePlaylistId(playlistId);
      setCurrentTab('playlist-view');
    } else {
      setCurrentTab(tab);
    }
  };

  const handleQuickOwnerDemo = async () => {
    try {
      await loginQuickOwner();
      await loadContent();
      setCurrentTab('home');
    } catch (err) {
      console.error('Owner demo error:', err);
    }
  };

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAddToPlaylist = async (playlistId: string, songId: string) => {
    try {
      await api.addTrackToPlaylist(playlistId, songId);
      await loadContent();
      alert('Track added to playlist!');
    } catch (err) {
      alert(`Could not add track: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="h-screen bg-[#0a0a0f] flex items-center justify-center text-xs text-purple-400 font-mono">
        INITIALIZING VAULT ENVIRONMENT...
      </div>
    );
  }

  // Render view
  const renderCurrentView = () => {
    switch (currentTab) {
      case 'landing':
        return (
          <LandingPage
            onStartListening={() => {
              if (user) setCurrentTab('home');
              else handleOpenAuth('login');
            }}
            onExplore={() => setCurrentTab('explore')}
            onQuickOwnerDemo={handleQuickOwnerDemo}
            recentSongs={songs}
            featuredPlaylists={playlists}
            onOpenPlaylist={(id) => handleNavigate('playlist-view', id)}
          />
        );

      case 'home':
        return (
          <HomePage
            playlists={playlists}
            songs={songs}
            onOpenPlaylist={(id) => handleNavigate('playlist-view', id)}
            onOpenUpload={() => setIsUploadModalOpen(true)}
            onOpenCreatePlaylist={() => {
              setPlaylistToEdit(null);
              setIsCreatePlaylistOpen(true);
            }}
            onNavigateExplore={() => setCurrentTab('explore')}
          />
        );

      case 'explore':
        return (
          <ExplorePage
            songs={songs}
            playlists={playlists}
            onOpenPlaylist={(id) => handleNavigate('playlist-view', id)}
            onAddToPlaylist={isOwner ? handleAddToPlaylist : undefined}
          />
        );

      case 'library':
        if (!isOwner) {
          return (
            <div className="p-16 text-center text-xs text-slate-400">
              Access restricted to Vault Administrator.
            </div>
          );
        }
        return (
          <LibraryPage
            songs={songs}
            playlists={playlists}
            onOpenUpload={() => setIsUploadModalOpen(true)}
            onRefresh={loadContent}
            onAddToPlaylist={handleAddToPlaylist}
          />
        );

      case 'playlist-view':
        return (
          <PlaylistPage
            playlistId={activePlaylistId}
            onEditPlaylist={(pl) => {
              setPlaylistToEdit(pl);
              setIsCreatePlaylistOpen(true);
            }}
            onDeleted={() => {
              loadContent();
              setCurrentTab(user ? 'home' : 'explore');
            }}
            allLibrarySongs={songs}
          />
        );

      case 'playlists':
        return (
          <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto pb-32">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
              <div>
                <h1 className="text-2xl font-extrabold text-white">Your Playlists</h1>
                <p className="text-xs text-slate-400 mt-1">Curated audio collections</p>
              </div>
              {isOwner && (
                <button
                  onClick={() => {
                    setPlaylistToEdit(null);
                    setIsCreatePlaylistOpen(true);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition-colors"
                >
                  Create Playlist
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {playlists.map((pl) => (
                <div
                  key={pl.id}
                  onClick={() => handleNavigate('playlist-view', pl.id)}
                  className="cursor-pointer"
                >
                  <img src={pl.artworkUrl} alt={pl.name} className="w-full aspect-square rounded-xl object-cover mb-2" />
                  <p className="text-sm font-bold text-white truncate">{pl.name}</p>
                  <p className="text-xs text-slate-400 truncate">{pl.trackIds.length} tracks</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'friends':
        if (!isOwner) {
          return (
            <div className="p-16 text-center text-xs text-slate-400">
              Access restricted to Vault Administrator.
            </div>
          );
        }
        return (
          <FriendsPage
            playlists={playlists}
            onOpenInvite={() => setIsInviteModalOpen(true)}
          />
        );

      case 'liked':
        return (
          <LikedSongsPage
            songs={songs}
            playlists={playlists}
            onAddToPlaylist={isOwner ? handleAddToPlaylist : undefined}
          />
        );

      case 'settings':
        return <SettingsPage />;

      default:
        return <LandingPage
          onStartListening={() => handleOpenAuth('login')}
          onExplore={() => setCurrentTab('explore')}
          recentSongs={songs}
          featuredPlaylists={playlists}
          onOpenPlaylist={(id) => handleNavigate('playlist-view', id)}
        />;
    }
  };

  return (
    <div className="h-screen bg-[#0a0a0f] text-slate-100 flex flex-col antialiased selection:bg-purple-600 selection:text-white overflow-hidden">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onNavigate={handleNavigate}
        onOpenAuth={handleOpenAuth}
        onQuickOwnerDemo={handleQuickOwnerDemo}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar (visible when logged in) */}
        {user && currentTab !== 'landing' && (
          <div className="hidden md:block">
            <Sidebar
              currentTab={currentTab}
              onNavigate={handleNavigate}
              playlists={playlists}
              onCreatePlaylist={() => {
                setPlaylistToEdit(null);
                setIsCreatePlaylistOpen(true);
              }}
            />
          </div>
        )}

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto">
          {renderCurrentView()}
        </main>
      </div>

      {/* Persistent Global Player dock */}
      <GlobalPlayer />

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        inviteToken={inviteTokenParam}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={async () => {
          setIsAuthModalOpen(false);
          await loadContent();
          setCurrentTab('home');
        }}
      />

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploaded={() => {
          loadContent();
        }}
      />

      <CreatePlaylistModal
        isOpen={isCreatePlaylistOpen}
        playlistToEdit={playlistToEdit}
        onClose={() => {
          setIsCreatePlaylistOpen(false);
          setPlaylistToEdit(null);
        }}
        onCreated={() => {
          loadContent();
        }}
      />

      <InviteModal
        isOpen={isInviteModalOpen}
        playlists={playlists}
        onClose={() => setIsInviteModalOpen(false)}
        onInviteCreated={() => {
          loadContent();
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <AppContent />
      </PlayerProvider>
    </AuthProvider>
  );
}
