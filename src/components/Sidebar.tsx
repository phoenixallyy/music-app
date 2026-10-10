import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Playlist } from '../types';
import { Home, Compass, Library, Plus, Heart, Users, Settings, Music, Disc3, ShieldCheck } from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onNavigate: (tab: string, playlistId?: string) => void;
  playlists: Playlist[];
  onCreatePlaylist: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onNavigate,
  playlists,
  onCreatePlaylist,
}) => {
  const { user, isOwner } = useAuth();

  return (
    <aside className="w-64 h-full flex flex-col bg-[#0b0b12] border-r border-white/[0.06] select-none shrink-0">
      {/* Brand */}
      <div className="p-6 pb-5 flex items-center justify-between border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-violet-400 flex items-center justify-center shadow-lg shadow-purple-600/30">
            <Disc3 className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
              VibeVault
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">Private Music Space</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="px-3 py-4 space-y-1">
        <button
          onClick={() => onNavigate('home')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            currentTab === 'home'
              ? 'bg-purple-600/15 text-purple-300 font-semibold border border-purple-500/20'
              : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          onClick={() => onNavigate('explore')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            currentTab === 'explore'
              ? 'bg-purple-600/15 text-purple-300 font-semibold border border-purple-500/20'
              : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Explore</span>
        </button>

        <button
          onClick={() => onNavigate('liked')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            currentTab === 'liked'
              ? 'bg-purple-600/15 text-purple-300 font-semibold border border-purple-500/20'
              : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
          }`}
        >
          <Heart className="w-4 h-4 text-rose-400" />
          <span>Liked Songs</span>
        </button>
      </div>

      {/* Owner Administrative Section */}
      {isOwner && (
        <div className="px-3 pt-2 pb-3 border-t border-white/[0.04]">
          <div className="px-3 pb-2 flex items-center justify-between text-[11px] font-semibold text-purple-400/80 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Vault Controls
            </span>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => onNavigate('library')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'library'
                  ? 'bg-purple-600/15 text-purple-300 font-semibold border border-purple-500/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
              }`}
            >
              <Library className="w-4 h-4" />
              <span>Music Library</span>
            </button>

            <button
              onClick={() => onNavigate('friends')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'friends'
                  ? 'bg-purple-600/15 text-purple-300 font-semibold border border-purple-500/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Friends & Sharing</span>
            </button>
          </div>
        </div>
      )}

      {/* Playlists section */}
      <div className="flex-1 flex flex-col min-h-0 px-3 pt-2 border-t border-white/[0.04]">
        <div className="px-3 py-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Playlists
          </span>
          {isOwner && (
            <button
              onClick={onCreatePlaylist}
              title="Create playlist"
              className="p-1 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-md transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-0.5 pr-1 py-1">
          {playlists.length === 0 ? (
            <div className="px-3 py-4 text-xs text-slate-400 italic">No playlists yet</div>
          ) : (
            playlists.map((pl) => (
              <button
                key={pl.id}
                onClick={() => onNavigate('playlist-view', pl.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium truncate flex items-center gap-2.5 transition-colors ${
                  currentTab === 'playlist-view' && window.location.hash.includes(pl.id)
                    ? 'text-purple-300 bg-white/[0.06]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                }`}
              >
                <Music className="w-3.5 h-3.5 shrink-0 opacity-60" />
                <span className="truncate">{pl.name}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Bottom Footer User Info */}
      <div className="p-3 border-t border-white/[0.06] bg-black/20">
        <button
          onClick={() => onNavigate('settings')}
          className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/[0.04] transition-colors text-left"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {user?.displayName?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.displayName}</p>
            <p className="text-[10px] text-slate-400 capitalize">{user?.role || 'Guest'}</p>
          </div>
          <Settings className="w-4 h-4 text-slate-400 shrink-0" />
        </button>
      </div>
    </aside>
  );
};
