import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import { api, getStoredToken } from './services/api';
import { Song, Playlist, User } from './types';

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
import { CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, isOwner, isLoading: isAuthLoading, loginQuickOwner } = useAuth();

  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [activePlaylistId, setActivePlaylistId] = useState<string>('');

  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  // User notifications toast
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [inviteTokenParam, setInviteTokenParam] = useState('');

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [playlistToEdit, setPlaylistToEdit] = useState<Playlist | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

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

  // When user signs in, switch default tab to 'home' safely without flickering
  useEffect(() => {
    if (user && currentTab === 'landing') {
      setCurrentTab('home');
    } else if (!user && !isAuthLoading && !getStoredToken() && currentTab !== 'landing' && currentTab !== 'explore') {
      setCurrentTab('landing');
    }
  }, [user, isAuthLoading, currentTab]);

  // Load songs & playlists with optional user override to bypass stale closures
  const loadContent = async (overrideUser?: User | null) => {
    const activeUser = overrideUser !== undefined ? overrideUser : user;
    const token = getStoredToken();
    const isAuthed = Boolean(activeUser || token);

    if (!isAuthed) {
      // Guest preview mode: fetch public tracks and playlists
      try {
        const [songsRes, plRes] = await Promise.all([
          api.getSongs().catch(() => ({ songs: [] })),
          api.getPlaylists().catch(() => ({ playlists: [] })),
        ]);
        setSongs(songsRes.songs || []);
        setPlaylists(plRes.playlists || []);
      } catch (err) {
        console.warn('Guest data load notice:', err);
      }
      return;
    }

    try {
      setIsDataLoading(true);
      const [songsRes, plRes] = await Promise.all([
        api.getSongs(),
        api.getPlaylists(),
      ]);
      setSongs(songsRes.songs || []);
      setPlaylists(plRes.playlists || []);
    } catch (err) {
      console.warn('Authenticated content load notice:', err);
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
    setDemoLoading(true);
    try {
      const authedUser = await loginQuickOwner();
      await loadContent(authedUser);
      setCurrentTab('home');
      showToast('Logged in as Demo Owner! Administrator dashboard unlocked.', 'success');
    } catch (err) {
      console.error('Owner demo error:', err);
      const msg = err instanceof Error ? err.message : 'Could not launch Owner Demo.';
      showToast(msg, 'error');
    } finally {
      setDemoLoading(false);
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
      showToast('Track added to playlist!', 'success');
    } catch (err) {
      showToast(`Could not add track: ${err instanceof Error ? err.message : String(err)}`, 'error');
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
            isDemoLoading={demoLoading}
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
                  className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition-colors cursor-pointer"
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
                  className="cursor-pointer group"
                >
                  <img src={pl.artworkUrl} alt={pl.name} className="w-full aspect-square rounded-xl object-cover mb-2 border border-white/5 group-hover:border-purple-500/30 transition-colors" />
                  <p className="text-sm font-bold text-white truncate group-hover:text-purple-300 transition-colors">{pl.name}</p>
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
        return (
          <LandingPage
            onStartListening={() => {
              if (user) setCurrentTab('home');
              else handleOpenAuth('login');
            }}
            onExplore={() => setCurrentTab('explore')}
            onQuickOwnerDemo={handleQuickOwnerDemo}
            isDemoLoading={demoLoading}
            recentSongs={songs}
            featuredPlaylists={playlists}
            onOpenPlaylist={(id) => handleNavigate('playlist-view', id)}
          />
        );
    }
  };

  return (
    <div className="h-screen bg-[#0a0a0f] text-slate-100 flex flex-col antialiased selection:bg-purple-600 selection:text-white overflow-hidden relative">
      {/* Toast Feedback */}
      {toast && (
        <div className="fixed top-16 right-6 z-50 animate-in slide-in-from-top duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-2xl border text-xs font-medium backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/30 shadow-emerald-950/40'
                : toast.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/30 shadow-rose-950/40'
                : 'bg-purple-950/90 text-purple-200 border-purple-500/30 shadow-purple-950/40'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-purple-400 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onNavigate={handleNavigate}
        onOpenAuth={handleOpenAuth}
        onQuickOwnerDemo={handleQuickOwnerDemo}
        isDemoLoading={demoLoading}
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
        onSuccess={async (authedUser) => {
          setIsAuthModalOpen(false);
          await loadContent(authedUser);
          setCurrentTab('home');
          showToast(`Welcome back, ${authedUser.displayName}!`, 'success');
        }}
      />

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploaded={() => {
          loadContent();
          showToast('Track uploaded successfully!', 'success');
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
          showToast('Playlist saved!', 'success');
        }}
      />

      <InviteModal
        isOpen={isInviteModalOpen}
        playlists={playlists}
        onClose={() => setIsInviteModalOpen(false)}
        onInviteCreated={() => {
          loadContent();
          showToast('Invite link generated!', 'success');
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
